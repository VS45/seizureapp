import { getAIJSONResponse, isOpenAIAvailable } from './openai';
import Seizure from "@/models/Seizure";
export async function predictSeizureRisk(seizureData) {
  const prompt = `
    Analyze this seizure data and provide risk assessment.
    Return ONLY valid JSON with this exact structure:
    {
      "riskScore": number,
      "riskLevel": "low" | "medium" | "high",
      "priorityLevel": "low" | "medium" | "high" | "critical",
      "keyRiskFactors": string[]
    }
    
    Data to analyze: ${JSON.stringify(seizureData)}
  `;

  const result = await getAIJSONResponse(prompt, seizureData);
  
  if (result.fallback) {
    console.log('Using fallback risk assessment');
  }
  
  return result;
}

export async function detectAnomalies(seizureData) {
  const prompt = `
    Detect anomalies in this seizure data.
    Return ONLY valid JSON with this exact structure:
    {
      "isAnomalous": boolean,
      "anomalyScore": number,
      "detectedAnomalies": string[]
    }
    
    Data: ${JSON.stringify(seizureData)}
  `;

  const result = await getAIJSONResponse(prompt, seizureData);
  
  if (result.fallback) {
    console.log('Using fallback anomaly detection');
  }
  
  return result;
}

export async function generateRecommendations(seizureData) {
  const prompt = `
    Provide recommendations for this seizure.
    Return ONLY valid JSON array with this structure:
    [
      {
        "category": string,
        "action": string,
        "priority": "low" | "medium" | "high",
        "timeline": "immediate" | "short-term" | "long-term",
        "responsibleParty": string
      }
    ]
    
    Data: ${JSON.stringify(seizureData)}
  `;

  const result = await getAIJSONResponse(prompt, seizureData);
  
  // Ensure we always return an array
  if (result.fallback && result.recommendations) {
    return result.recommendations;
  }
  
  return Array.isArray(result) ? result : (result.recommendations || []);
}

export async function checkForAlerts(seizureData) {
  const prompt = `
    Check this seizure for alert triggers.
    Return ONLY valid JSON with this exact structure:
    {
      "hasAlerts": boolean,
      "alerts": string[]
    }
    
    Data: ${JSON.stringify(seizureData)}
  `;

  const result = await getAIJSONResponse(prompt, seizureData);
  
  if (result.fallback) {
    return {
      hasAlerts: false,
      alerts: [],
      fallback: true
    };
  }
  
  return result;
}

// Enhanced search with fallback
export async function performAISearch(naturalLanguageQuery) {
  if (!isOpenAIAvailable()) {
    // Simple keyword-based fallback search
    const keywords = naturalLanguageQuery.toLowerCase().split(' ');
    return {
      searchCriteria: {
        $or: [
          { referenceID: { $regex: naturalLanguageQuery, $options: 'i' } },
          { 'commodities.goodsType': { $regex: keywords[0], $options: 'i' } },
          { conveyanceNumber: { $regex: naturalLanguageQuery, $options: 'i' } },
          { offenceLocation: { $regex: naturalLanguageQuery, $options: 'i' } }
        ]
      },
      matchingIds: [],
      searchExplanation: "Using keyword search (AI unavailable)",
      fallback: true
    };
  }

  const prompt = `
    Convert this natural language query to MongoDB search criteria.
    Return ONLY valid JSON with this exact structure:
    {
      "searchCriteria": object,
      "explanation": string
    }
    
    Query: "${naturalLanguageQuery}"
  `;

  try {
    return await getAIJSONResponse(prompt);
  } catch (error) {
    // Fallback to simple search
    return {
      searchCriteria: {
        $or: [
          { referenceID: { $regex: naturalLanguageQuery, $options: 'i' } },
          { 'commodities.goodsType': { $regex: naturalLanguageQuery, $options: 'i' } }
        ]
      },
      matchingIds: [],
      searchExplanation: "Fallback search due to error",
      fallback: true
    };
  }
}

// Enhanced analytics with fallback
export async function generateRealTimeAnalytics(query = {}, reportType = 'overview') {
  if (!isOpenAIAvailable()) {
    return await generateBasicAnalytics(query, reportType);
  }

  const prompt = `
    Generate ${reportType} analytics for seizure data.
    Return ONLY valid JSON with comprehensive analytics report including:
    - summary: object with key metrics
    - executiveSummary: string
    - recommendations: array of objects
    - trends: array
    - generatedAt: string (ISO date)
    
    Query parameters: ${JSON.stringify(query)}
    Report type: ${reportType}
  `;

  try {
    const result = await getAIJSONResponse(prompt, { query, reportType });
    
    // Ensure basic structure
    if (result.fallback) {
      return await generateBasicAnalytics(query, reportType);
    }
    
    return result;
  } catch (error) {
    console.warn('AI analytics failed, using basic analytics');
    return await generateBasicAnalytics(query, reportType);
  }
}

// Robust basic analytics fallback
export async function generateBasicAnalytics(query = {}, reportType = 'overview') {
  try {
    // Check if Seizure model is available
    if (!Seizure || typeof Seizure.countDocuments !== 'function') {
      throw new Error('Seizure model not available');
    }

    const totalSeizures = await Seizure.countDocuments(query);
    const highRiskCount = await Seizure.countDocuments({ ...query, riskScore: { $gt: 70 } });
    
    const avgRiskScoreResult = await Seizure.aggregate([
      { $match: query },
      { $group: { _id: null, avgRisk: { $avg: "$riskScore" } } }
    ]);
    
    const basicAnalytics = {
      summary: {
        totalSeizures,
        highRiskCases: highRiskCount,
        averageRiskScore: avgRiskScoreResult[0]?.avgRisk || 0,
        highRiskPercentage: totalSeizures > 0 ? (highRiskCount / totalSeizures) * 100 : 0
      },
      executiveSummary: "Basic analytics report - AI insights temporarily unavailable",
      recommendations: [
        {
          category: "System",
          action: "AI service is currently unavailable. Basic analytics are being displayed.",
          priority: "low",
          timeline: "immediate",
          responsibleParty: "System Administrator"
        }
      ],
      trends: [],
      generatedAt: new Date().toISOString(),
      isBasic: true,
      fallback: true
    };

    return basicAnalytics;
  } catch (error) {
    console.error('Error in generateBasicAnalytics:', error);
    
    // Ultimate fallback - return minimal analytics without database
    return {
      summary: {
        totalSeizures: 0,
        highRiskCases: 0,
        averageRiskScore: 0,
        highRiskPercentage: 0
      },
      executiveSummary: "Basic analytics unavailable. Database connection issue.",
      recommendations: [
        {
          category: "System",
          action: "Check database connection and Seizure model configuration",
          priority: "high",
          timeline: "immediate",
          responsibleParty: "System Administrator"
        }
      ],
      trends: [],
      generatedAt: new Date().toISOString(),
      isBasic: true,
      fallback: true,
      error: error.message
    };
  }
}