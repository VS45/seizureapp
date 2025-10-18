import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import Seizure from "@/models/Seizure";
import dbConnect from "@/lib/db";

export async function GET(request) {
  try {
    // Authenticate user
    const { user } = await authenticate(request);

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    // Connect to database  
    await dbConnect();

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const officeCode = searchParams.get("officeCode");

    // Build query based on filters
    let query = {};

    // Date range filter
    if (startDate && endDate) {
      query.offenceDateTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Office code filter
    if (officeCode) {
      query.officeCode = officeCode;
    }

    // Get seizures with all necessary fields for reporting
    const seizures = await Seizure.find(query)
      .select('office officeCode commodities isCounterfeit isIPR selectedIPRs selectedMedicines offenceDateTime')
      .sort({ offenceDateTime: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      seizures,
      total: seizures.length
    });
  } catch (error) {
    console.error("Failed to fetch seizures for special operation:", error);
    return NextResponse.json(
      { error: "Failed to fetch seizures", details: error.message },
      { status: 500 }
    );
  }
}