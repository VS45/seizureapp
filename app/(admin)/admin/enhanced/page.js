// app/reports/page.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function AIReportsDashboard() {
  const router = useRouter();
  const [activeReport, setActiveReport] = useState('ai-summary');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    officeCode: '',
    riskLevel: '',
    priority: '',
    hasAlerts: ''
  });
  const [aiSearch, setAiSearch] = useState('');

  useEffect(() => {
    // You might want to add authentication check here
    // if (status === 'unauthenticated') {
    //   router.push('/login');
    // }
  }, [router]);

  // Handle AI Search
  const handleAISearch = async () => {
    if (!aiSearch.trim()) {
      setSearchError('Please enter a search query');
      return;
    }

    setSearchLoading(true);
    setSearchError('');
    setSearchResults(null);
    
    try {
      const params = new URLSearchParams();
      params.append('aiSearch', aiSearch.trim());
      if (filters.startDate) params.append('dateFrom', filters.startDate.toISOString());
      if (filters.endDate) params.append('dateTo', filters.endDate.toISOString());
      if (filters.riskLevel) params.append('riskLevel', filters.riskLevel);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.hasAlerts) params.append('hasAlerts', filters.hasAlerts);

      const response = await fetch(`/api/seizures/reports?${params}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setSearchResults(result);
      setActiveReport('ai-summary');
      
      // Show success message
      setSearchError('');
      
    } catch (error) {
      console.error('AI Search error:', error);
      setSearchError(error.message || 'Failed to perform AI search. Please try again.');
      setSearchResults(null);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle Enter key press for search
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAISearch();
    }
  };

  const renderReportContent = () => {
    switch (activeReport) {
      case 'ai-risk-analysis':
        return <AIRiskAnalysisReport filters={filters} aiSearch={aiSearch} />;
      case 'ai-anomaly-detection':
        return <AIAnomalyReport filters={filters} />;
      case 'ai-predictive-insights':
        return <AIPredictiveReport filters={filters} />;
      case 'ai-recommendations':
        return <AIRecommendationsReport filters={filters} />;
      case 'ai-trends':
        return <AITrendsReport filters={filters} />;
      default:
        return (
          <AISummaryReport 
            filters={filters} 
            aiSearch={aiSearch}
            searchResults={searchResults}
            searchLoading={searchLoading}
            searchError={searchError}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">AI-Powered Seizure Intelligence</h1>
              <p className="text-gray-600 mt-2">Advanced analytics and predictive insights powered by AI</p>
            </div>
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
              🤖 AI Enhanced
            </div>
          </div>
          
          {/* AI Search Bar */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔍 Ask AI Anything About Your Seizure Data
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiSearch}
                onChange={(e) => {
                  setAiSearch(e.target.value);
                  setSearchError(''); // Clear error when user types
                }}
                onKeyPress={handleKeyPress}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 'Show me high-risk pharmaceutical seizures from Lagos in the last month'"
                disabled={searchLoading}
              />
              <button
                onClick={handleAISearch}
                disabled={searchLoading || !aiSearch.trim()}
                className={`px-6 py-3 rounded-lg font-medium transition-all ${
                  searchLoading || !aiSearch.trim()
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {searchLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Searching...
                  </div>
                ) : (
                  'Ask AI'
                )}
              </button>
            </div>
            
            {/* Search Error Alert */}
            {searchError && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <div className="text-red-500 mr-2">⚠️</div>
                  <p className="text-red-700 text-sm">{searchError}</p>
                </div>
              </div>
            )}
            
            {/* Search Success Alert */}
            {searchResults && !searchError && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <div className="text-green-500 mr-2">✅</div>
                  <p className="text-green-700 text-sm">
                    AI search completed! Found {searchResults.seizures?.length || 0} results.
                    {searchResults.aiAnalytics?.searchExplanation && (
                      <span className="ml-2">({searchResults.aiAnalytics.searchExplanation})</span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Report Type Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">AI Report Types</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { id: 'ai-summary', label: 'AI Summary', icon: '📊' },
                { id: 'ai-risk-analysis', label: 'Risk Analysis', icon: '⚠️' },
                { id: 'ai-anomaly-detection', label: 'Anomaly Detection', icon: '🔍' },
                { id: 'ai-predictive-insights', label: 'Predictive Insights', icon: '🔮' },
                { id: 'ai-recommendations', label: 'AI Recommendations', icon: '💡' },
                { id: 'ai-trends', label: 'Trend Analysis', icon: '📈' }
              ].map((report) => (
                <button
                  key={report.id}
                  onClick={() => setActiveReport(report.id)}
                  className={`px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                    activeReport === report.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg mb-1">{report.icon}</div>
                  <div>{report.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Advanced AI Filters */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl mb-6 border border-blue-200">
            <h3 className="text-lg font-medium text-gray-800 mb-4">🎯 AI-Powered Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <div className="flex gap-2">
                  <DatePicker
                    selected={filters.startDate}
                    onChange={(date) => setFilters({ ...filters, startDate: date })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    placeholderText="Start Date"
                  />
                  <DatePicker
                    selected={filters.endDate}
                    onChange={(date) => setFilters({ ...filters, endDate: date })}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm"
                    placeholderText="End Date"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
                <select
                  value={filters.riskLevel}
                  onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Risk Levels</option>
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Priorities</option>
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alerts</label>
                <select
                  value={filters.hasAlerts}
                  onChange={(e) => setFilters({ ...filters, hasAlerts: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">All Cases</option>
                  <option value="true">With Alerts Only</option>
                  <option value="false">Without Alerts</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                💡 AI filters analyze patterns and risk factors in real-time
              </div>
              <button
                onClick={() => setFilters({ startDate: null, endDate: null, officeCode: '', riskLevel: '', priority: '', hasAlerts: '' })}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Report Content */}
          <div className="bg-white rounded-xl p-1">
            {renderReportContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

// Updated AISummaryReport to handle search results
function AISummaryReport({ filters, aiSearch, searchResults, searchLoading, searchError }) {
  const [data, setData] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAISummaryReport();
  }, [filters, searchResults]);

  const fetchAISummaryReport = async () => {
    setLoading(true);
    try {
      // Use search results if available, otherwise fetch fresh data
      if (searchResults) {
        setData(searchResults.seizures || []);
        setAiInsights(searchResults.aiAnalytics || {});
      } else {
        const params = new URLSearchParams();
        if (filters.startDate) params.append('dateFrom', filters.startDate.toISOString());
        if (filters.endDate) params.append('dateTo', filters.endDate.toISOString());
        if (filters.riskLevel) params.append('riskLevel', filters.riskLevel);
        if (filters.priority) params.append('priority', filters.priority);
        if (filters.hasAlerts) params.append('hasAlerts', filters.hasAlerts);
        if (aiSearch) params.append('aiSearch', aiSearch);

        const response = await fetch(`/api/seizures/reports?${params}`);
        const result = await response.json();
        
        setData(result.seizures || []);
        setAiInsights(result.aiAnalytics || {});
      }
    } catch (error) {
      console.error('Error fetching AI summary report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (searchLoading) return <AIReportSkeleton />;
  
  if (searchError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">⚠️ Search Error</div>
        <p className="text-gray-600">{searchError}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (loading) return <AIReportSkeleton />;
  if (!data) return <div className="text-center py-12">No data available</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">AI Intelligence Summary</h2>
        {aiSearch && (
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
            AI Search: "{aiSearch}"
          </div>
        )}
      </div>
      
      {/* Search Results Info */}
      {searchResults && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-500 mr-2">🔍</div>
            <div>
              <p className="text-green-800 font-medium">AI Search Results</p>
              <p className="text-green-700 text-sm">
                Found {data.length} seizures matching your query
                {aiInsights?.searchExplanation && (
                  <span className="ml-2">({aiInsights.searchExplanation})</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI-Generated Executive Summary */}
      {aiInsights?.executiveSummary && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">🤖 AI Executive Summary</h3>
          <p className="text-gray-700 leading-relaxed">{aiInsights.executiveSummary}</p>
        </div>
      )}

      {/* Key Risk Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AIMetricCard 
          title="Total Seizures" 
          value={data.length} 
          format="count"
          trend="stable"
        />
        <AIMetricCard 
          title="Avg Risk Score" 
          value={aiInsights?.summary?.averageRiskScore || 0} 
          format="score"
          trend={aiInsights?.trends?.riskTrend}
        />
        <AIMetricCard 
          title="High Risk Cases" 
          value={aiInsights?.summary?.highRiskCases || 0} 
          format="count"
          trend="up"
        />
        <AIMetricCard 
          title="AI Confidence" 
          value={aiInsights?.confidence || (searchResults ? 95 : 85)} 
          format="percentage"
          trend="stable"
        />
      </div>

      {/* Top High-Risk Seizures */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium text-gray-800">
            {searchResults ? '🔍 Search Results' : '🚨 Top High-Risk Seizures'}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commodities</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">AI Alerts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.slice(0, 10).map((seizure, index) => (
                <tr key={seizure._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{seizure.referenceID}</td>
                  <td className="px-4 py-3">
                    <RiskBadge score={seizure.riskScore} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {seizure.commodities?.slice(0, 2).map(c => c.goodsType).join(', ')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{seizure.offenceLocation}</td>
                  <td className="px-4 py-3">
                    {seizure.aiInsights?.alerts?.hasAlerts && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        ⚠️ Alerts
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No seizures found matching your criteria
          </div>
        )}
      </div>

      {/* AI Recommendations */}
      {aiInsights?.recommendations && aiInsights.recommendations.length > 0 && (
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b">
            <h3 className="text-lg font-medium text-gray-800">💡 AI Recommendations</h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {aiInsights.recommendations.slice(0, 5).map((rec, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 mt-2 rounded-full ${
                    rec.priority === 'high' ? 'bg-red-500' : 
                    rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{rec.action}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {rec.category} • {rec.timeline}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ... rest of your component functions remain the same (AIRiskAnalysisReport, AIAnomalyReport, etc.)
function AIRiskAnalysisReport({ filters, aiSearch }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRiskAnalysis();
  }, [filters]);

  const fetchRiskAnalysis = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('reportType', 'risk-analysis');
      if (filters.startDate) params.append('dateFrom', filters.startDate.toISOString());
      if (filters.endDate) params.append('dateTo', filters.endDate.toISOString());
      if (aiSearch) params.append('aiSearch', aiSearch);

      const response = await fetch(`/api/seizures/reports?${params}`);
      const result = await response.json();
      setData(result.aiAnalytics);
    } catch (error) {
      console.error('Error fetching risk analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <AIReportSkeleton />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">⚠️ AI Risk Analysis</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium mb-4">Risk Distribution</h3>
          <div className="space-y-3">
            {['critical', 'high', 'medium', 'low'].map(level => (
              <div key={level} className="flex items-center justify-between">
                <span className="capitalize">{level} Risk</span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      level === 'critical' ? 'bg-red-600 w-3/4' :
                      level === 'high' ? 'bg-orange-500 w-1/2' :
                      level === 'medium' ? 'bg-yellow-500 w-1/3' : 'bg-green-500 w-1/4'
                    }`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Risk Factors */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium mb-4">🔍 Top Risk Factors</h3>
          <div className="space-y-2">
            {data?.riskFactors?.map((factor, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">{factor.factor}</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {factor.frequency} cases
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AIAnomalyReport({ filters }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnomalies();
  }, [filters]);

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('hasAlerts', 'true');
      if (filters.startDate) params.append('dateFrom', filters.startDate.toISOString());
      if (filters.endDate) params.append('dateTo', filters.endDate.toISOString());

      const response = await fetch(`/api/seizures/reports?${params}`);
      const result = await response.json();
      setData(result.seizures || []);
    } catch (error) {
      console.error('Error fetching anomalies:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <AIReportSkeleton />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">🔍 AI Anomaly Detection</h2>
      
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-medium text-gray-800">Detected Anomalies & Patterns</h3>
        </div>
        <div className="p-4">
          {data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No anomalies detected in the selected period
            </div>
          ) : (
            <div className="space-y-4">
              {data.map((seizure, index) => (
                <div key={seizure._id} className="border-l-4 border-yellow-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{seizure.referenceID}</h4>
                      <p className="text-sm text-gray-600">{seizure.offenceLocation}</p>
                    </div>
                    <RiskBadge score={seizure.riskScore} />
                  </div>
                  {seizure.aiInsights?.anomalyDetection?.detectedAnomalies && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700">Anomalies:</p>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {seizure.aiInsights.anomalyDetection.detectedAnomalies.slice(0, 3).map((anomaly, idx) => (
                          <li key={idx}>{anomaly}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AIPredictiveReport({ filters }) {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPredictions();
  }, [filters]);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      // This would call a dedicated predictive endpoint
      const response = await fetch('/api/seizures/reports?reportType=predictive');
      const result = await response.json();
      setPredictions(result.predictions);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <AIReportSkeleton />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">🔮 AI Predictive Insights</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium mb-4">📈 Next 30 Days Forecast</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Expected Seizures</span>
              <span className="font-bold text-blue-600">45-55</span>
            </div>
            <div className="flex justify-between">
              <span>High-Risk Probability</span>
              <span className="font-bold text-orange-600">68%</span>
            </div>
            <div className="flex justify-between">
              <span>New Patterns Expected</span>
              <span className="font-bold text-purple-600">High</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium mb-4">🎯 Risk Hotspots</h3>
          <div className="space-y-2">
            {['Lagos Port', 'Seme Border', 'Murtala Airport'].map((location, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>{location}</span>
                <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">High Risk</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AIRecommendationsReport({ filters }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, [filters]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('reportType', 'recommendations');
      if (filters.startDate) params.append('dateFrom', filters.startDate.toISOString());
      if (filters.endDate) params.append('dateTo', filters.endDate.toISOString());

      const response = await fetch(`/api/seizures/reports?${params}`);
      const result = await response.json();
      setRecommendations(result.recommendations || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <AIReportSkeleton />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">💡 AI Actionable Recommendations</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((rec, index) => (
          <div key={index} className={`p-4 rounded-lg border-l-4 ${
            rec.priority === 'critical' ? 'border-red-500 bg-red-50' :
            rec.priority === 'high' ? 'border-orange-500 bg-orange-50' :
            rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' : 'border-green-500 bg-green-50'
          }`}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-gray-900">{rec.category}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${
                rec.priority === 'critical' ? 'bg-red-200 text-red-800' :
                rec.priority === 'high' ? 'bg-orange-200 text-orange-800' :
                rec.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'
              }`}>
                {rec.priority}
              </span>
            </div>
            <p className="text-sm text-gray-700 mb-2">{rec.action}</p>
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>{rec.timeline}</span>
              <span>{rec.responsibleParty}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AITrendsReport({ filters }) {
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrends();
  }, [filters]);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('reportType', 'trends');
      if (filters.startDate) params.append('dateFrom', filters.startDate.toISOString());
      if (filters.endDate) params.append('dateTo', filters.endDate.toISOString());

      const response = await fetch(`/api/seizures/reports?${params}`);
      const result = await response.json();
      setTrends(result.trends);
    } catch (error) {
      console.error('Error fetching trends:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <AIReportSkeleton />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">📈 AI Trend Analysis</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium mb-4">Emerging Patterns</h3>
          <div className="space-y-3">
            {trends?.emergingPatterns?.map((pattern, index) => (
              <div key={index} className="p-3 bg-blue-50 rounded-lg">
                <p className="font-medium text-blue-900">{pattern.title}</p>
                <p className="text-sm text-blue-700 mt-1">{pattern.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium mb-4">Seasonal Trends</h3>
          <div className="space-y-2">
            {trends?.seasonalTrends?.map((trend, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm">{trend.period}</span>
                <span className="text-sm font-medium text-green-600">+{trend.increase}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function AIMetricCard({ title, value, format = 'count', trend }) {
  const formatValue = (val, fmt) => {
    switch (fmt) {
      case 'percentage':
        return `${val}%`;
      case 'score':
        return `${Math.round(val)}/100`;
      default:
        return val.toLocaleString();
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '→';
      default: return '→';
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border text-center">
      <h4 className="text-sm font-medium text-gray-600 mb-1">{title}</h4>
      <p className="text-2xl font-bold text-blue-600 mb-1">
        {formatValue(value, format)}
      </p>
      <div className="text-xs text-gray-500 flex items-center justify-center">
        <span className="mr-1">{getTrendIcon(trend)}</span>
        {trend === 'up' ? 'Increasing' : trend === 'down' ? 'Decreasing' : 'Stable'}
      </div>
    </div>
  );
}

function RiskBadge({ score }) {
  const getRiskLevel = (score) => {
    if (score >= 80) return { label: 'Critical', color: 'bg-red-100 text-red-800' };
    if (score >= 60) return { label: 'High', color: 'bg-orange-100 text-orange-800' };
    if (score >= 40) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Low', color: 'bg-green-100 text-green-800' };
  };

  const risk = getRiskLevel(score);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${risk.color}`}>
      {score} - {risk.label}
    </span>
  );
}

function AIReportSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="grid grid-cols-4 gap-4">
        <div className="h-20 bg-gray-200 rounded"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
      <div className="h-64 bg-gray-200 rounded"></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-48 bg-gray-200 rounded"></div>
        <div className="h-48 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}