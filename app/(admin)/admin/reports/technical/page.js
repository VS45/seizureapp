'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

export default function ReportsDashboard() {
  const router = useRouter();
  const [activeReport, setActiveReport] = useState('demeter-xi');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    officeCode: ''
  });

  const renderReportContent = () => {
    switch (activeReport) {
      case 'demeter-xi':
        return <DemeterXIReport filters={filters} />;
      case 'operation-stop-vi':
        return <OperationStopVIReport filters={filters} />;
      default:
        return <DemeterXIReport filters={filters} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Special Operations Reports Dashboard</h1>
          
          {/* Report Type Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Operation Report</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                { id: 'demeter-xi', label: 'DEMETER XI - Environmental Protection' },
                { id: 'operation-stop-vi', label: 'OPERATION STOP VI - IP & Pharma Protection' }
              ].map((report) => (
                <button
                  key={report.id}
                  onClick={() => setActiveReport(report.id)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeReport === report.id
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {report.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <DatePicker
                  selected={filters.startDate}
                  onChange={(date) => setFilters({ ...filters, startDate: date })}
                  selectsStart
                  startDate={filters.startDate}
                  endDate={filters.endDate}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholderText="Select start date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <DatePicker
                  selected={filters.endDate}
                  onChange={(date) => setFilters({ ...filters, endDate: date })}
                  selectsEnd
                  startDate={filters.startDate}
                  endDate={filters.endDate}
                  minDate={filters.startDate}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholderText="Select end date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Office Code</label>
                <input
                  type="text"
                  value={filters.officeCode}
                  onChange={(e) => setFilters({ ...filters, officeCode: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Enter office code"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setFilters({ startDate: null, endDate: null, officeCode: '' })}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Report Content */}
          <div className="bg-white rounded-lg">
            {renderReportContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

// DEMETER XI Report Component
function DemeterXIReport({ filters }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchDemeterXIReport();
  }, [filters]);

  const fetchDemeterXIReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters.officeCode) params.append('officeCode', filters.officeCode);

      const response = await fetch(`/api/reports/special-operation?${params}`);
      const result = await response.json();
      
      if (result.success) {
        // Filter for DEMETER XI goods types
        const demeterGoodsTypes = ['hazardous waste', 'Ozone Depleting substances', 'Chemicals', 'Used Items'];
        const filteredData = processSeizureData(result.seizures, demeterGoodsTypes);
        setData(filteredData.byGoodsType);
        setSummary(filteredData.summary);
      }
    } catch (error) {
      console.error('Error fetching DEMETER XI report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ReportSkeleton />;
  if (!data.length) return <div className="text-center py-8">No data available for DEMETER XI operation</div>;

  // Prepare chart data
  const goodsTypeData = data.map(item => ({
    name: item.goodsType,
    seizures: item.totalSeizures,
    quantity: item.totalQuantity,
    riskLevel: getRiskLevel(item.goodsType)
  }));

  const riskAssessmentData = data.map(item => ({
    name: item.goodsType,
    risk: calculateRiskScore(item)
  }));

  const officeDistributionData = data.flatMap(item => 
    item.byOffice.map(office => ({
      name: office.officeName,
      goodsType: item.goodsType,
      seizures: office.seizures
    }))
  ).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-red-800">DEMETER XI</h2>
            <p className="text-red-600 mt-2 text-lg">Environmental Protection & Hazardous Materials Interdiction Operation</p>
          </div>
          <div className="bg-red-100 px-4 py-2 rounded-full">
            <span className="text-red-800 font-bold">ACTIVE OPERATION</span>
          </div>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Total Seizures" value={summary?.totalSeizures || 0} />
        <MetricCard title="Hazardous Items" value={summary?.totalQuantity || 0} />
        <MetricCard title="High Risk Cases" value={data.filter(item => calculateRiskScore(item) > 7).length} />
        <MetricCard title="Active Offices" value={summary?.numberOfOffices || 0} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goods Type Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium mb-4 text-gray-800">Seizures by Hazard Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={goodsTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="seizures" fill="#dc2626" name="Number of Seizures" />
              <Bar dataKey="quantity" fill="#f59e0b" name="Quantity Seized" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Assessment Chart */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium mb-4 text-gray-800">Environmental Risk Assessment</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={riskAssessmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Bar dataKey="risk" fill="#ef4444" name="Risk Score (1-10)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Office Distribution */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Office Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={officeDistributionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="seizures" fill="#8884d8" name="Seizures" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Table */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-xl font-bold text-gray-800 mb-4">DEMETER XI - Detailed Seizure Data</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-3 text-left">Goods Type</th>
                <th className="px-4 py-3 text-right">Seizures</th>
                <th className="px-4 py-3 text-right">Total Quantity</th>
                <th className="px-4 py-3 text-right">Avg per Seizure</th>
                <th className="px-4 py-3 text-right">Risk Level</th>
                <th className="px-4 py-3 text-right">Top Offices</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${getRiskColor(item.goodsType)}`}></div>
                      {item.goodsType}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{item.totalSeizures}</td>
                  <td className="px-4 py-3 text-right">{item.totalQuantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{Math.round(item.totalQuantity / item.totalSeizures)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskLevelClass(calculateRiskScore(item))}`}>
                      {getRiskLevel(calculateRiskScore(item))}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    {item.byOffice?.slice(0, 2).map(office => office.officeName).join(', ') || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// OPERATION STOP VI Report Component
function OperationStopVIReport({ filters }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchOperationStopVIReport();
  }, [filters]);

  const fetchOperationStopVIReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters.officeCode) params.append('officeCode', filters.officeCode);

      const response = await fetch(`/api/reports/special-operation?${params}`);
      const result = await response.json();
      
      if (result.success) {
        // Filter for OPERATION STOP VI goods types
        const stopVIGoodsTypes = ['Medicine & Pharmaceuticals', 'Intellectual Property Rights'];
        const filteredData = processSeizureData(result.seizures, stopVIGoodsTypes);
        setData(filteredData.byGoodsType);
        setSummary(filteredData.summary);
      }
    } catch (error) {
      console.error('Error fetching OPERATION STOP VI report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ReportSkeleton />;
  if (!data.length) return <div className="text-center py-8">No data available for OPERATION STOP VI</div>;

  // Prepare chart data
  const categoryData = data.map(item => ({
    name: item.goodsType,
    seizures: item.totalSeizures,
    quantity: item.totalQuantity,
    counterfeits: item.counterfeitRate || 0
  }));

  const iprBreakdownData = data.find(item => item.goodsType === 'Intellectual Property Rights')?.subtypes || [];
  const medicineBreakdownData = data.find(item => item.goodsType === 'Medicine & Pharmaceuticals')?.subtypes || [];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-blue-800">OPERATION STOP VI</h2>
            <p className="text-blue-600 mt-2 text-lg">Intellectual Property Rights & Pharmaceutical Products Protection Operation</p>
          </div>
          <div className="bg-blue-100 px-4 py-2 rounded-full">
            <span className="text-blue-800 font-bold">ACTIVE OPERATION</span>
          </div>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Total Seizures" value={summary?.totalSeizures || 0} />
        <MetricCard title="Items Seized" value={summary?.totalQuantity || 0} />
        <MetricCard title="Counterfeit Rate" value={`${Math.round(data.reduce((sum, item) => sum + (item.counterfeitRate || 0), 0) / Math.max(data.length, 1))}%`} />
        <MetricCard title="Active Offices" value={summary?.numberOfOffices || 0} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Comparison */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium mb-4 text-gray-800">Seizures by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="seizures" fill="#3b82f6" name="Number of Seizures" />
              <Bar dataKey="quantity" fill="#10b981" name="Quantity Seized" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Counterfeit Analysis */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium mb-4 text-gray-800">Counterfeit Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="counterfeits" fill="#ef4444" name="Counterfeit Rate %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* IPR Subtypes */}
        {iprBreakdownData.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-medium mb-4 text-gray-800">IPR Violations by Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={iprBreakdownData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subtype" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" name="Violations" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Medicine Subtypes */}
        {medicineBreakdownData.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-lg font-medium mb-4 text-gray-800">Pharmaceutical Seizures by Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={medicineBreakdownData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subtype" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#ec4899" name="Seizures" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Detailed Table */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <h3 className="text-xl font-bold text-gray-800 mb-4">OPERATION STOP VI - Detailed Intelligence Report</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-right">Seizures</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3 text-right">Counterfeit Rate</th>
                <th className="px-4 py-3 text-right">IPR/Medicine Types</th>
                <th className="px-4 py-3 text-right">Top Offices</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        item.goodsType === 'Medicine & Pharmaceuticals' ? 'bg-red-500' : 'bg-purple-500'
                      }`}></div>
                      {item.goodsType}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{item.totalSeizures}</td>
                  <td className="px-4 py-3 text-right">{item.totalQuantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      (item.counterfeitRate || 0) > 70 ? 'bg-red-100 text-red-800' : 
                      (item.counterfeitRate || 0) > 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {item.counterfeitRate || 0}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    {item.subtypes?.slice(0, 3).map(st => st.subtype).join(', ') || 'N/A'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    {item.byOffice?.slice(0, 2).map(office => office.officeName).join(', ') || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function MetricCard({ title, value }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow border text-center hover:shadow-md transition-shadow">
      <h4 className="text-sm font-medium text-gray-600 mb-1">{title}</h4>
      <p className="text-2xl font-bold text-green-600">{value}</p>
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="grid grid-cols-4 gap-4">
        <div className="h-20 bg-gray-200 rounded"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="h-64 bg-gray-200 rounded"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
      <div className="h-96 bg-gray-200 rounded"></div>
    </div>
  );
}

// Data processing functions
function processSeizureData(seizures, targetGoodsTypes) {
  const goodsTypeMap = new Map();
  const officesSet = new Set();
  let totalSeizures = 0;
  let totalQuantity = 0;

  seizures.forEach(seizure => {
    seizure.commodities.forEach(commodity => {
      if (targetGoodsTypes.includes(commodity.goodsType)) {
        totalSeizures++;
        totalQuantity += commodity.quantity;
        officesSet.add(seizure.officeCode);

        // Update goods type data
        if (!goodsTypeMap.has(commodity.goodsType)) {
          goodsTypeMap.set(commodity.goodsType, {
            goodsType: commodity.goodsType,
            totalSeizures: 0,
            totalQuantity: 0,
            byOffice: new Map(),
            subtypes: new Map(),
            counterfeitCount: 0
          });
        }

        const goodsData = goodsTypeMap.get(commodity.goodsType);
        goodsData.totalSeizures++;
        goodsData.totalQuantity += commodity.quantity;

        // Track counterfeit items
        if (seizure.isCounterfeit === 'Yes' || seizure.isIPR) {
          goodsData.counterfeitCount++;
        }

        // Update office data
        if (!goodsData.byOffice.has(seizure.officeCode)) {
          goodsData.byOffice.set(seizure.officeCode, {
            officeName: seizure.office,
            officeCode: seizure.officeCode,
            seizures: 0
          });
        }
        goodsData.byOffice.get(seizure.officeCode).seizures++;

        // Track IPR and Medicine subtypes
        if (commodity.goodsType === 'Intellectual Property Rights' && seizure.selectedIPRs) {
          seizure.selectedIPRs.forEach(ipr => {
            const key = ipr.type;
            if (!goodsData.subtypes.has(key)) {
              goodsData.subtypes.set(key, { subtype: key, count: 0 });
            }
            goodsData.subtypes.get(key).count++;
          });
        }

        if (commodity.goodsType === 'Medicine & Pharmaceuticals' && seizure.selectedMedicines) {
          seizure.selectedMedicines.forEach(med => {
            const key = med.type;
            if (!goodsData.subtypes.has(key)) {
              goodsData.subtypes.set(key, { subtype: key, count: 0 });
            }
            goodsData.subtypes.get(key).count++;
          });
        }
      }
    });
  });

  // Convert maps to arrays and calculate percentages
  const byGoodsType = Array.from(goodsTypeMap.values()).map(item => ({
    ...item,
    byOffice: Array.from(item.byOffice.values()).sort((a, b) => b.seizures - a.seizures),
    subtypes: Array.from(item.subtypes.values()).sort((a, b) => b.count - a.count),
    counterfeitRate: Math.round((item.counterfeitCount / item.totalSeizures) * 100) || 0
  }));

  return {
    byGoodsType: byGoodsType.sort((a, b) => b.totalSeizures - a.totalSeizures),
    summary: {
      totalSeizures,
      totalQuantity,
      numberOfOffices: officesSet.size
    }
  };
}

// Helper functions for the reports
function getRiskLevel(goodsType) {
  const riskLevels = {
    'hazardous waste': 'Very High',
    'Ozone Depleting substances': 'High',
    'Chemicals': 'High',
    'Used Items': 'Medium',
    'Medicine & Pharmaceuticals': 'Very High',
    'Intellectual Property Rights': 'Medium'
  };
  return riskLevels[goodsType] || 'Low';
}

function getRiskColor(goodsType) {
  const colors = {
    'hazardous waste': 'bg-red-500',
    'Ozone Depleting substances': 'bg-orange-500',
    'Chemicals': 'bg-yellow-500',
    'Used Items': 'bg-blue-500',
    'Medicine & Pharmaceuticals': 'bg-red-500',
    'Intellectual Property Rights': 'bg-purple-500'
  };
  return colors[goodsType] || 'bg-gray-500';
}

function calculateRiskScore(item) {
  const baseScores = {
    'hazardous waste': 9,
    'Ozone Depleting substances': 8,
    'Chemicals': 7,
    'Used Items': 5,
    'Medicine & Pharmaceuticals': 9,
    'Intellectual Property Rights': 6
  };
  
  let score = baseScores[item.goodsType] || 3;
  
  // Adjust based on quantity
  if (item.totalQuantity > 1000) score += 2;
  else if (item.totalQuantity > 100) score += 1;
  
  return Math.min(score, 10);
}

function getRiskLevelClass(score) {
  if (score >= 8) return 'bg-red-100 text-red-800';
  if (score >= 6) return 'bg-orange-100 text-orange-800';
  if (score >= 4) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
}