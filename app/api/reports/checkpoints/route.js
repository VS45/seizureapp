// app/api/reports/checkpoints/route.js
import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import Seizure from "@/models/Seizure";
import dbConnect from "@/lib/db";
import Checkpoint from "@/models/Checkpoint";

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

    // Get all checkpoints first
    const checkpoints = await Checkpoint.find({}).lean();
    const checkpointMap = new Map(checkpoints.map(cp => [cp._id.toString(), cp]));

    const checkpointReport = await Seizure.aggregate([
      { $match: query },
      { $match: { checkpoint: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$checkpoint",
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
              offenceDateTime: "$offenceDateTime",
              office: "$office",
              commodities: "$commodities"
            }
          }
        }
      },
      {
        $project: {
          checkpointId: "$_id",
          checkpointName: { 
            $let: {
              vars: { checkpoint: { $arrayElemAt: [checkpoints.filter(cp => cp._id.toString() === "$_id"), 0] } },
              in: "$$checkpoint.name"
            }
          },
          totalSeizures: 1,
          totalQuantity: 1,
          numberOfOffices: { $size: "$offices" },
          numberOfGoodsTypes: { $size: "$goodsTypes" },
          seizures: 1,
          _id: 0
        }
      },
      { $sort: { totalSeizures: -1 } }
    ]);

    return NextResponse.json({
      success: true,
      report: checkpointReport,
      filters: { startDate, endDate }
    });
  } catch (error) {
    console.error("Failed to generate checkpoint report:", error);
    return NextResponse.json(
      { error: "Failed to generate report", details: error.message },
      { status: 500 }
    );
  }
}