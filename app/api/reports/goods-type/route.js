// app/api/reports/goods-type/route.js
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

    // Build query based on user role and filters
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

    const goodsTypeReport = await Seizure.aggregate([
      { $match: query },
      { $unwind: "$commodities" },
      {
        $group: {
          _id: "$commodities.goodsType",
          totalSeizures: { $sum: 1 },
          totalQuantity: { $sum: { $toDouble: "$commodities.quantity" } },
          averageQuantity: { $avg: { $toDouble: "$commodities.quantity" } },
          offices: { $addToSet: "$office" },
          seizureDetails: {
            $push: {
              referenceID: "$referenceID",
              offenceDateTime: "$offenceDateTime",
              quantity: "$commodities.quantity",
              unit: "$commodities.unit",
              office: "$office"
            }
          }
        }
      },
      {
        $project: {
          goodsType: "$_id",
          totalSeizures: 1,
          totalQuantity: 1,
          averageQuantity: { $round: ["$averageQuantity", 2] },
          numberOfOffices: { $size: "$offices" },
          seizureDetails: 1,
          _id: 0
        }
      },
      { $sort: { totalSeizures: -1 } }
    ]);

    return NextResponse.json({
      success: true,
      report: goodsTypeReport,
      filters: {
        startDate,
        endDate,
        officeCode
      }
    });
  } catch (error) {
    console.error("Failed to generate goods type report:", error);
    return NextResponse.json(
      { error: "Failed to generate report", details: error.message },
      { status: 500 }
    );
  }
}