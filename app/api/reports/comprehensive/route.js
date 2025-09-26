// app/api/reports/comprehensive/route.js
import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import Seizure from "@/models/Seizure";
import dbConnect from "@/lib/db";

export async function GET(request) {
  try {
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const officeCode = searchParams.get('officeCode');

    let query = {};
    if (user.role !== "admin") {
      query.officeCode = user.officeCode;
    }
    if (officeCode) {
      query.officeCode = officeCode;
    }
    if (startDate && endDate) {
      query.offenceDateTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const comprehensiveReport = await Seizure.aggregate([
      { $match: query },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalSeizures: { $sum: 1 },
                totalCommodities: { $sum: { $size: "$commodities" } },
                totalQuantity: {
                  $sum: {
                    $sum: {
                      $map: {
                        input: "$commodities",
                        as: "commodity",
                        in: { $toDouble: "$$commodity.quantity" }
                      }
                    }
                  }
                },
                averageSeizuresPerDay: { $avg: 1 },
                offices: { $addToSet: "$office" },
                uniqueGoodsTypes: { $addToSet: "$commodities.goodsType" }
              }
            }
          ],
          byOffice: [
            {
              $group: {
                _id: "$officeCode",
                officeName: { $first: "$office" },
                seizures: { $sum: 1 },
                quantity: {
                  $sum: {
                    $sum: {
                      $map: {
                        input: "$commodities",
                        as: "commodity",
                        in: { $toDouble: "$$commodity.quantity" }
                      }
                    }
                  }
                }
              }
            },
            { $sort: { seizures: -1 } }
          ],
          byGoodsType: [
            { $unwind: "$commodities" },
            {
              $group: {
                _id: "$commodities.goodsType",
                seizures: { $sum: 1 },
                quantity: { $sum: { $toDouble: "$commodities.quantity" } }
              }
            },
            { $sort: { seizures: -1 } }
          ],
          byDetectionMethod: [
            {
              $group: {
                _id: "$detectionMethod",
                seizures: { $sum: 1 }
              }
            },
            { $sort: { seizures: -1 } }
          ],
          timeline: [
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m", date: "$offenceDateTime" } },
                seizures: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ]);

    const summary = comprehensiveReport[0].summary[0] || {};
    const report = {
      summary: {
        totalSeizures: summary.totalSeizures || 0,
        totalCommodities: summary.totalCommodities || 0,
        totalQuantity: summary.totalQuantity || 0,
        numberOfOffices: summary.offices ? summary.offices.length : 0,
        numberOfGoodsTypes: summary.uniqueGoodsTypes ? summary.uniqueGoodsTypes.length : 0
      },
      byOffice: comprehensiveReport[0].byOffice,
      byGoodsType: comprehensiveReport[0].byGoodsType,
      byDetectionMethod: comprehensiveReport[0].byDetectionMethod,
      timeline: comprehensiveReport[0].timeline,
      filters: { startDate, endDate, officeCode }
    };

    return NextResponse.json({
      success: true,
      report
    });
  } catch (error) {
    console.error("Failed to generate comprehensive report:", error);
    return NextResponse.json(
      { error: "Failed to generate report", details: error.message },
      { status: 500 }
    );
  }
}