//app/api/seizures/reports/route.js

import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import Seizure from "@/models/Seizure";
import dbConnect from "@/lib/db";
import Office from "@/models/office";
import { 
  predictSeizureRisk, 
  detectAnomalies, 
  generateRecommendations,
  generateRealTimeAnalytics,
  checkForAlerts 
} from "@/lib/ai-services";

//Get AI Predictions and Insights
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
    
    // AI-enhanced filters
    const riskLevel = searchParams.get("riskLevel");
    const hasAlerts = searchParams.get("hasAlerts");
    const priority = searchParams.get("priority");
    const aiSearch = searchParams.get("aiSearch"); // Natural language search

    // Build base query
    let query = {};

    // AI-powered filtering
    if (riskLevel) {
      query["aiInsights.riskAssessment.riskLevel"] = riskLevel;
    }
    
    if (hasAlerts === "true") {
      query["aiInsights.alerts.hasAlerts"] = true;
    }
    
    if (priority) {
      query["aiInsights.riskAssessment.priorityLevel"] = priority;
    }

    // Natural language search using AI
    if (aiSearch) {
      const searchResults = await performAISearch(aiSearch);
      query['_id'] = { $in: searchResults.matchingIds };
    }

    // Get seizures with pagination and AI insights
    const seizures = await Seizure.find(query)
      .sort({ 
        riskScore: -1, // Sort by risk score (highest first)
        createdAt: -1 
      })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get AI-powered analytics for the current result set
    const analytics = await generateRealTimeAnalytics(query);

    // Get total count for pagination
    const total = await Seizure.countDocuments(query);

    return NextResponse.json({
      success: true,
      seizures,
      aiAnalytics: analytics,
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
    
    // Date Formatting:
    const shortYear = year.toString().slice(-2);
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = monthNames[offenceDateTime.getMonth()];
    const day = String(offenceDateTime.getDate()).padStart(2, '0');
    const referenceID = `NCS/${office.code}/${year}/SZ/${seizureSerialNo}/ Of ${day}${month}${shortYear}`;

    // Format images correctly
    const formattedImages = formData.images.map((image) => ({
      url: image,
      filename: image.split("/").pop(),
      size: 0,
    }));

    // Format offence location correctly
    const offenceLocation = formData.countryOfSeizureState
      ? `${formData.countryOfSeizureState}, ${formData.countryOfSeizureCountry}`
      : formData.countryOfSeizureCountry;

    // Create seizure data object
    const seizureData = {
      // ... (your existing seizure data)
      referenceID,
      office: office.name,
      officeCode: office.code,
      seizureSerialNo,
      countryOfSeizure: formData.countryOfSeizureCountry,
      offenceLocation,
      offenceLocationType: formData.offenceLocationType,
      offenceDateTime: offenceDateTime,
      offenceDescription: formData.offenceDescription,
      service: formData.service,
      direction: formData.direction,
      isIPR: formData.isIPR,
      isCounterfeit: formData.isCounterfeit,
      rightHolder: formData.rightHolder,
      concealment: formData.concealment,
      illicitTrade: formData.illicitTrade || [],
      commodities: formData.commodities || [],
      selectedMedicines: formData.selectedMedicines || [],
      selectedIPRs: formData.selectedIPRs || [],
      detectionMethod: formData.detectionMethod,
      technicalAid: formData.technicalAid,
      checkpoint: formData.checkpoint,
      warehouse: formData.warehouse,
      conveyanceType: formData.conveyanceType,
      conveyanceNumber: formData.conveyanceNumber,
      departureCountry: formData.departureCountry,
      departureState: formData.departureState,
      departureLocation: formData.departureLocation,
      departurePortCode: formData.departurePortCode,
      departureTin: formData.departureTin || '',
      departureTransport: formData.departureTransport,
      destinationCountry: formData.destinationCountry,
      destinationState: formData.destinationState,
      destinationLocation: formData.destinationLocation,
      destinationPortCode: formData.destinationPortCode,
      destinationTin: formData.destinationTin || '',
      destinationTransport: formData.destinationTransport,
      persons: formData.persons || [],
      createdBy: user._id,
      createdByName: user.name,
      images: formattedImages || [],
    };

    console.log("Seizure Data: ", seizureData);

    // 🎯 AI ENHANCEMENTS START HERE

    // 1. Real-time Risk Prediction
    const riskAssessment = await predictSeizureRisk(seizureData);
    
    // 2. Anomaly Detection
    const anomalyDetection = await detectAnomalies(seizureData);
    
    // 3. Generate AI Recommendations
    const aiRecommendations = await generateRecommendations(seizureData);
    
    // 4. Alert System Check
    const alertAnalysis = await checkForAlerts(seizureData);

    // Add AI insights to seizure data
    const enhancedSeizureData = {
      ...seizureData,
      aiInsights: {
        riskAssessment,
        anomalyDetection,
        recommendations: aiRecommendations,
        alerts: alertAnalysis,
        analyzedAt: new Date()
      },
      // Add risk score for easy filtering
      riskScore: riskAssessment.riskScore,
      priorityLevel: riskAssessment.priorityLevel
    };

    // Create new seizure record with AI insights
    const newSeizure = new Seizure(enhancedSeizureData);
    await newSeizure.save();

    // 🚨 Trigger real-time alerts if high risk
    if (riskAssessment.riskScore > 70) {
      await triggerHighRiskAlert(newSeizure, riskAssessment);
    }

    return NextResponse.json(
      {
        success: true,
        seizure: newSeizure,
        aiInsights: {
          riskScore: riskAssessment.riskScore,
          priority: riskAssessment.priorityLevel,
          keyRecommendations: aiRecommendations.slice(0, 3), // Send top 3 to frontend
          hasAlerts: alertAnalysis.alerts.length > 0
        },
        message: "Seizure report submitted successfully with AI analysis",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to submit seizure:", error);
    
    // Even if AI fails, still save the basic seizure data
    if (seizureData && !newSeizure) {
      const basicSeizure = new Seizure(seizureData);
      await basicSeizure.save();
      
      return NextResponse.json(
        {
          success: true,
          seizure: basicSeizure,
          aiInsights: { error: "AI analysis failed but data saved" },
          message: "Seizure saved (AI analysis skipped)",
        },
        { status: 201 }
      );
    }
    
    return NextResponse.json(
      {
        error: "Failed to submit seizure report",
        details: error.message,
      },
      { status: 500 }
    );
  }
}