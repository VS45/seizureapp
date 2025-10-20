import OpenAI from 'openai';

// Initialize OpenAI client with better error handling
let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} catch (error) {
  console.warn('OpenAI initialization failed, using fallback mode');
  openai = null;
}

// Check if OpenAI is available
export function isOpenAIAvailable() {
  return openai && process.env.OPENAI_API_KEY;
}

/**
 * Main function to get AI responses with robust fallbacks
 */
export async function getAIResponse(prompt, contextData = null, options = {}) {
  // If OpenAI is not available, use fallback immediately
  if (!isOpenAIAvailable()) {
    console.log('OpenAI not available, using fallback response');
    return await getFallbackAIResponse(prompt, contextData, options);
  }

  try {
    // Prepare system message with context
    let systemMessage = `You are an intelligent assistant for a customs and border protection seizure management system.`;

    if (contextData) {
      systemMessage += `\n\nCONTEXT DATA:\n${JSON.stringify(contextData, null, 2)}`;
    }

    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: prompt }
    ];

    const completion = await openai.chat.completions.create({
      model: options.model || 'gpt-3.5-turbo',
      messages: messages,
      max_tokens: options.max_tokens || 800,
      temperature: options.temperature || 0.3,
    });

    return completion.choices[0].message.content;

  } catch (error) {
    console.warn('OpenAI API failed, using fallback:', error.message);
    return await getFallbackAIResponse(prompt, contextData, options);
  }
}

/**
 * Robust fallback system when OpenAI is unavailable
 */
async function getFallbackAIResponse(prompt, contextData, options) {
  // Simple rule-based responses for common queries
  const fallbackResponses = {
    'risk': {
      low: { riskScore: 25, riskLevel: "low", priorityLevel: "low", keyRiskFactors: ["Standard commodity", "Routine detection"] },
      medium: { riskScore: 55, riskLevel: "medium", priorityLevel: "medium", keyRiskFactors: ["Moderate value", "Common concealment"] },
      high: { riskScore: 78, riskLevel: "high", priorityLevel: "high", keyRiskFactors: ["High-value goods", "Complex concealment", "Known route"] },
      critical: { riskScore: 92, riskLevel: "critical", priorityLevel: "high", keyRiskFactors: ["Prohibited items", "Sophisticated operation", "Multiple risk factors"] }
    },
    'anomaly': {
      normal: { isAnomalous: false, anomalyScore: 15, detectedAnomalies: [], patternDeviations: [] },
      suspicious: { isAnomalous: true, anomalyScore: 65, detectedAnomalies: ["Unusual quantity pattern", "Atypical timing"], patternDeviations: ["Quantity deviation"] }
    }
  };

  // Analyze prompt to determine response type
  const promptLower = prompt.toLowerCase();
  
  if (promptLower.includes('risk') || promptLower.includes('assess')) {
    const riskLevel = determineRiskLevel(contextData);
    return JSON.stringify(fallbackResponses.risk[riskLevel]);
  }
  
  if (promptLower.includes('anomal') || promptLower.includes('pattern')) {
    const anomalyLevel = determineAnomalyLevel(contextData);
    return JSON.stringify(fallbackResponses.anomaly[anomalyLevel]);
  }
  
  if (promptLower.includes('recommend') || promptLower.includes('suggest')) {
    return JSON.stringify({
      recommendations: generateFallbackRecommendations(contextData)
    });
  }

  // Default fallback response
  return JSON.stringify({
    message: "AI analysis temporarily unavailable. Using rule-based assessment.",
    fallback: true,
    timestamp: new Date().toISOString()
  });
}

/**
 * Simple risk level determination based on seizure data
 */
function determineRiskLevel(seizureData) {
  if (!seizureData) return 'medium';
  
  let riskScore = 0;
  
  // Commodity-based risk
  const highRiskGoods = ['drugs', 'weapons', 'explosives', 'pharmaceuticals', 'electronics'];
  const mediumRiskGoods = ['textiles', 'automotive', 'cosmetics', 'food'];
  
  seizureData.commodities?.forEach(commodity => {
    if (highRiskGoods.some(risk => commodity.goodsType?.toLowerCase().includes(risk))) {
      riskScore += 30;
    } else if (mediumRiskGoods.some(risk => commodity.goodsType?.toLowerCase().includes(risk))) {
      riskScore += 15;
    }
  });
  
  // Quantity-based risk
  const totalQuantity = seizureData.commodities?.reduce((sum, c) => sum + (c.quantity || 0), 0);
  if (totalQuantity > 1000) riskScore += 20;
  else if (totalQuantity > 100) riskScore += 10;
  
  // IPR/Counterfeit risk
  if (seizureData.isIPR) riskScore += 25;
  if (seizureData.isCounterfeit === 'Yes') riskScore += 20;
  
  if (riskScore >= 60) return 'critical';
  if (riskScore >= 40) return 'high';
  if (riskScore >= 20) return 'medium';
  return 'low';
}

function determineAnomalyLevel(seizureData) {
  // Simple anomaly detection based on quantity and patterns
  const totalQuantity = seizureData.commodities?.reduce((sum, c) => sum + (c.quantity || 0), 0);
  
  if (totalQuantity > 5000) return 'suspicious';
  if (seizureData.commodities?.length > 5) return 'suspicious';
  
  return 'normal';
}

function generateFallbackRecommendations(seizureData) {
  const baseRecommendations = [
    {
      category: "Documentation",
      action: "Ensure all seizure documentation is complete and photographs are properly stored",
      priority: "medium",
      timeline: "immediate",
      responsibleParty: "Field Officer"
    },
    {
      category: "Evidence",
      action: "Secure and catalog all evidence according to standard procedures",
      priority: "high",
      timeline: "immediate",
      responsibleParty: "Evidence Officer"
    }
  ];

  const riskLevel = determineRiskLevel(seizureData);
  
  if (riskLevel === 'high' || riskLevel === 'critical') {
    baseRecommendations.push({
      category: "Supervision",
      action: "Notify supervisor for high-risk case review",
      priority: "high",
      timeline: "immediate",
      responsibleParty: "Team Lead"
    });
  }

  if (seizureData.isIPR) {
    baseRecommendations.push({
      category: "Legal",
      action: "Coordinate with legal department for IPR violation procedures",
      priority: "medium",
      timeline: "short-term",
      responsibleParty: "Legal Officer"
    });
  }

  return baseRecommendations;
}

/**
 * Specialized function for JSON responses with fallback
 */
// lib/openai.js - More robust JSON parsing
export async function getAIJSONResponse(prompt, contextData = null) {
  let response;
  try {
    response = await getAIResponse(prompt, contextData);
    
    if (!response) {
      throw new Error('Empty response from AI');
    }

    // Clean the response
    let cleanedResponse = response.trim();
    
    // Remove markdown code blocks
    cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*/i, '');
    cleanedResponse = cleanedResponse.replace(/```$/i, '');
    cleanedResponse = cleanedResponse.trim();
    
    // Handle cases where AI might add explanatory text before/after JSON
    // Try to extract JSON object or array
    const jsonObjectMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    const jsonArrayMatch = cleanedResponse.match(/\[[\s\S]*\]/);
    
    let jsonString = cleanedResponse;
    
    if (jsonObjectMatch) {
      jsonString = jsonObjectMatch[0];
    } else if (jsonArrayMatch) {
      jsonString = jsonArrayMatch[0];
    }
    
    // Final cleanup - remove any trailing commas that might break parsing
    jsonString = jsonString.replace(/,\s*([}\]])/g, '$1');
    
    console.log('Attempting to parse:', jsonString.substring(0, 200) + '...');
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    console.log('Raw response:', response?.substring(0, 500));
    
    // Enhanced fallback with better error information
    return {
      fallback: true,
      error: error.message,
      rawResponse: response?.substring(0, 1000), // Limit length for logs
      timestamp: new Date().toISOString()
    };
  }
}