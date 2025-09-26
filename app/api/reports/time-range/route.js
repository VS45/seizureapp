// app/api/reports/time-range/route.js
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
    const interval = searchParams.get('interval') || 'month'; // day, week, month, year
    const officeCode = searchParams.get('officeCode');

    let query = {};
    if (user.role !== "admin") {
      query.officeCode = user.officeCode;
    }
    if (officeCode) {
      query.officeCode = officeCode;
    }

    let groupFormat;
    switch (interval) {
      case 'day':
        groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$offenceDateTime" } };
        break;
      case 'week':
        groupFormat = { $dateToString: { format: "%Y-%U", date: "$offenceDateTime" } };
        break;
      case 'year':
        groupFormat = { $dateToString: { format: "%Y", date: "$offenceDateTime" } };
        break;
      default: // month
        groupFormat = { $dateToString: { format: "%Y-%m", date: "$offenceDateTime" } };
    }

    const timeReport = await Seizure.aggregate([
      { $match: query },
      {
        $group: {
          _id: groupFormat,
          totalSeizures: { $sum: 1 },
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
          offices: { $addToSet: "$office" },
          goodsTypes: { $addToSet: "$commodities.goodsType" },
          seizures: {
            $push: {
              referenceID: "$referenceID",
              office: "$office",
              commodities: "$commodities",
              detectionMethod: "$detectionMethod"
            }
          }
        }
      },
      {
        $project: {
          timePeriod: "$_id",
          totalSeizures: 1,
          totalQuantity: 1,
          numberOfOffices: { $size: "$offices" },
          numberOfGoodsTypes: { $size: "$goodsTypes" },
          seizures: 1,
          _id: 0
        }
      },
      { $sort: { timePeriod: 1 } }
    ]);

    return NextResponse.json({
      success: true,
      report: timeReport,
      interval,
      filters: { officeCode }
    });
  } catch (error) {
    console.error("Failed to generate time range report:", error);
    return NextResponse.json(
      { error: "Failed to generate report", details: error.message },
      { status: 500 }
    );
  }
}