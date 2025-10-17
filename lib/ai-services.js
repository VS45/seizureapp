import { getAIJSONResponse, isOpenAIAvailable } from './openai';

export async function predictSeizureRisk(seizureData) {
  const prompt = `
    Analyze this seizure data and provide risk assessment.
    Return JSON with riskScore, riskLevel, priorityLevel, keyRiskFactors.
  `;

  const result = await getAIJSONResponse(prompt, seizureData);
  
  // Ensure we always have valid risk data
  if (result.fallback) {
    console.log('Using fallback risk assessment');
  }
  
  return result;
}

export async function detectAnomalies(seizureData) {
  const prompt = `
    Detect anomalies in this seizure data.
    Return JSON with isAnomalous, anomalyScore, detectedAnomalies.
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
    Return JSON array of recommendations with category, action, priority, timeline, responsibleParty.
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
    Return JSON with hasAlerts and alerts array.
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
    Convert this natural language query to MongoDB search criteria: "${naturalLanguageQuery}"
    Return JSON with searchCriteria and explanation.
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
    Provide insights, trends, and recommendations.
    Return comprehensive JSON analytics report.
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
  // Implement your existing basic analytics here
  const totalSeizures = await Seizure.countDocuments(query);
  const highRiskCount = await Seizure.countDocuments({ ...query, riskScore: { $gt: 70 } });
  const avgRiskScore = await Seizure.aggregate([
    { $match: query },
    { $group: { _id: null, avgRisk: { $avg: "$riskScore" } } }
  ]);
  
  const basicAnalytics = {
    summary: {
      totalSeizures,
      highRiskCases: highRiskCount,
      averageRiskScore: avgRiskScore[0]?.avgRisk || 0,
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
    generatedAt: new Date(),
    isBasic: true,
    fallback: true
  };

  return basicAnalytics;
}