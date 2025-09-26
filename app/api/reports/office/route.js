// app/api/reports/office/route.js
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

    let query = {};
    if (user.role !== "admin") {
      query.officeCode = user.officeCode;
    }
    if (startDate && endDate) {
      query.offenceDateTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const officeReport = await Seizure.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$officeCode",
          officeName: { $first: "$office" },
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
          goodsTypes: { $addToSet: "$commodities.goodsType" },
          seizureDetails: {
            $push: {
              referenceID: "$referenceID",
              offenceDateTime: "$offenceDateTime",
              commodities: "$commodities",
              detectionMethod: "$detectionMethod"
            }
          }
        }
      },
      {
        $project: {
          officeCode: "$_id",
          officeName: 1,
          totalSeizures: 1,
          totalCommodities: 1,
          totalQuantity: 1,
          uniqueGoodsTypes: { $size: "$goodsTypes" },
          seizureDetails: 1,
          _id: 0
        }
      },
      { $sort: { totalSeizures: -1 } }
    ]);

    return NextResponse.json({
      success: true,
      report: officeReport,
      filters: { startDate, endDate }
    });
  } catch (error) {
    console.error("Failed to generate office report:", error);
    return NextResponse.json(
      { error: "Failed to generate report", details: error.message },
      { status: 500 }
    );
  }
}