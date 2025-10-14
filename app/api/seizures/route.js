import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import Seizure from "@/models/Seizure";
import dbConnect from "@/lib/db";
import Office from "@/models/office";

export async function POST(request) {
  try {
    // Authenticate user and get office info
    const { user } = await authenticate(request);
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Connect to database
    await dbConnect();

    // Get form data from request
    const formData = await request.json();
    console.log("Form Data Loading: ", formData);

    // Get current year from offenceDateTime
    const offenceDateTime = new Date(formData.offenceDateTime);
    const year = offenceDateTime.getFullYear();
    const office = await Office.findById(user.office);

    // Get count of existing seizures for this office and year to generate serial number
    const count = await Seizure.countDocuments({
      officeCode: office.code,
      offenceDateTime: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1),
      },
    });
    const seizureSerialNo = count + 1;
    //Date Formatting:
    const shortYear = year.toString().slice(-2);
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[offenceDateTime.getMonth()];
    const day = String(offenceDateTime.getDate()).padStart(2, '0');
    const referenceID = `NCS/${office.code}/${year}/SZ/${seizureSerialNo}/ Of ${day}${month}${shortYear}`;
    // Generate referenceID using office details and year
    // const referenceID = `NCS/${office.code}/${year}/SZ/${seizureSerialNo} Of ${offenceDateTime}`;

    // Format images correctly
    const formattedImages = formData.images.map((image) => ({
      url: image,
      filename: image.split("/").pop(),
      size: 0, // You can get actual size if needed
    }));

    // Format offence location correctly
    const offenceLocation = formData.countryOfSeizureState
      ? `${formData.countryOfSeizureState}, ${formData.countryOfSeizureCountry}`
      : formData.countryOfSeizureCountry;

    // Create seizure data object with proper field mapping
    const seizureData = {
      // Reference Information
      referenceID,
      office: office.name,
      officeCode: office.code,
      seizureSerialNo,

      // Case Reference - FIXED: Use the correct field names from form data
      countryOfSeizure: formData.countryOfSeizureCountry, // Use countryOfSeizureCountry instead of empty countryOfSeizure
      offenceLocation: offenceLocation, // Build from countryOfSeizureState and countryOfSeizureCountry
      offenceLocationType: formData.offenceLocationType,
      offenceDateTime: offenceDateTime,
      offenceDescription: formData.offenceDescription,
      service: formData.service,
      direction: formData.direction,

      // Commodity Details (applied to all commodities)
      isIPR: formData.isIPR,
      isCounterfeit: formData.isCounterfeit,
      rightHolder: formData.rightHolder,
      concealment: formData.concealment,
      illicitTrade: formData.illicitTrade || [],

      // Individual commodities
      commodities: formData.commodities || [],

      // Medicine and IPR details
      selectedMedicines: formData.selectedMedicines || [],
      selectedIPRs: formData.selectedIPRs || [],

      // Detection
      detectionMethod: formData.detectionMethod,
      technicalAid: formData.technicalAid,
      checkpoint: formData.checkpoint,
      warehouse: formData.warehouse,

      // Conveyance
      conveyanceType: formData.conveyanceType,
      conveyanceNumber: formData.conveyanceNumber,
      // Route - Departure
      departureCountry: formData.departureCountry,
      departureState: formData.departureState,
      departureLocation: formData.departureLocation,
      departurePortCode: formData.departurePortCode,
      departureTin: formData.departureTin || '',
      departureTransport: formData.departureTransport,

      // Route - Destination
      destinationCountry: formData.destinationCountry,
      destinationState: formData.destinationState,
      destinationLocation: formData.destinationLocation,
      destinationPortCode: formData.destinationPortCode,
      destinationTin: formData.destinationTin || '',
      destinationTransport: formData.destinationTransport,

      // Person
      // Individual commodities
      persons: formData.persons || [],

      createdBy: user._id,
      createdByName: user.name,

      // Pictures
      images: formattedImages || [],
    };

    console.log("Seizure Data: ", seizureData);

    // Create new seizure record
    const newSeizure = new Seizure(seizureData);
    await newSeizure.save();

    return NextResponse.json(
      {
        success: true,
        seizure: newSeizure,
        message: "Seizure report submitted successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to submit seizure:", error);
    return NextResponse.json(
      {
        error: "Failed to submit seizure report",
        details: error.message,
      },
      { status: 500 }
    );
  }
}


// ... (keep the existing GET handler unchanged)

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
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    // Build query based on user role and office
    const office = await Office.findById(user.office);


    // Get seizures with pagination
    const seizures = await Seizure.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const total = await Seizure.countDocuments();

    return NextResponse.json({
      success: true,
      seizures,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch seizures:", error);
    return NextResponse.json(
      { error: "Failed to fetch seizures", details: error.message },
      { status: 500 }
    );
  }
}