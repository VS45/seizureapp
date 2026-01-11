// app/reports/page.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function ReportsDashboard() {
  const router = useRouter();
  const [activeReport, setActiveReport] = useState('summary');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    officeCode: ''
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  const renderReportContent = () => {
    switch (activeReport) {
      case 'goods-type':
        return <GoodsTypeReport filters={filters} />;
      case 'office':
        return <OfficeReport filters={filters} />;
      case 'time-range':
        return <TimeRangeReport filters={filters} />;
      case 'checkpoints':
        return <CheckpointsReport filters={filters} />;
      case 'comprehensive':
        return <ComprehensiveReport filters={filters} />;
      default:
        return <SummaryReport filters={filters} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Seizure Reports Dashboard</h1>
          
          {/* Report Type Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { id: 'summary', label: 'Summary' },
                { id: 'goods-type', label: 'Goods Type' },
                { id: 'office', label: 'Office' },
                { id: 'time-range', label: 'Time Range' },
                { id: 'checkpoints', label: 'Checkpoints' },
                { id: 'comprehensive', label: 'Comprehensive' }
              ].map((report) => (
                <button
                  key={report.id}
                  onClick={() => setActiveReport(report.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
            <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
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

// Report Components
function SummaryReport({ filters }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummaryReport();
  }, [filters]);

  const fetchSummaryReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters.officeCode) params.append('officeCode', filters.officeCode);

      const response = await fetch(`/api/reports/comprehensive?${params}`);
      const result = await response.json();
      setData(result.report);
    } catch (error) {
      console.error('Error fetching summary report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ReportSkeleton />;
  if (!data) return <div className="text-center py-8">No data available</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Summary Report</h2>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Total Seizures" value={data.summary.totalSeizures} />
        <MetricCard title="Total Commodities" value={data.summary.totalCommodities} />
        <MetricCard title="Total Quantity" value={data.summary.totalQuantity} />
        <MetricCard title="Number of Offices" value={data.summary.numberOfOffices} />
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Top Offices</h3>
          <div className="space-y-2">
            {data.byOffice.slice(0, 5).map((office, index) => (
              <div key={office._id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium">{office.officeName}</span>
                <span className="text-green-600 font-bold">{office.seizures}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Top Goods Types</h3>
          <div className="space-y-2">
            {data.byGoodsType.slice(0, 5).map((goods, index) => (
              <div key={goods._id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium">{goods._id}</span>
                <span className="text-green-600 font-bold">{goods.seizures}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GoodsTypeReport({ filters }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGoodsTypeReport();
  }, [filters]);

  const fetchGoodsTypeReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters.officeCode) params.append('officeCode', filters.officeCode);

      const response = await fetch(`/api/reports/goods-type?${params}`);
      const result = await response.json();
      setData(result.report || []);
    } catch (error) {
      console.error('Error fetching goods type report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ReportSkeleton />;
  if (!data.length) return <div className="text-center py-8">No data available</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Goods Type Report</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">Goods Type</th>
              <th className="px-4 py-2 text-right">Seizures</th>
              <th className="px-4 py-2 text-right">Total Quantity</th>
              <th className="px-4 py-2 text-right">Avg Quantity</th>
              <th className="px-4 py-2 text-right">Offices</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2 font-medium">{item.goodsType}</td>
                <td className="px-4 py-2 text-right">{item.totalSeizures}</td>
                <td className="px-4 py-2 text-right">{item.totalQuantity}</td>
                <td className="px-4 py-2 text-right">{item.averageQuantity}</td>
                <td className="px-4 py-2 text-right">{item.numberOfOffices}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OfficeReport({ filters }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOfficeReport();
  }, [filters]);

  const fetchOfficeReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());

      const response = await fetch(`/api/reports/office?${params}`);
      const result = await response.json();
      setData(result.report || []);
    } catch (error) {
      console.error('Error fetching office report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ReportSkeleton />;
  if (!data.length) return <div className="text-center py-8">No data available</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Office Performance Report</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((office, index) => (
          <div key={office._id} className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">{office.officeName}</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Code:</span> {office.officeCode}</p>
              <p><span className="font-medium">Seizures:</span> {office.totalSeizures}</p>
              <p><span className="font-medium">Commodities:</span> {office.totalCommodities}</p>
              <p><span className="font-medium">Total Quantity:</span> {office.totalQuantity}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimeRangeReport({ filters }) {
  const [data, setData] = useState([]);
  const [interval, setInterval] = useState('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeRangeReport();
  }, [filters, interval]);

  const fetchTimeRangeReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ interval });
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters.officeCode) params.append('officeCode', filters.officeCode);

      const response = await fetch(`/api/reports/time-range?${params}`);
      const result = await response.json();
      setData(result.report || []);
    } catch (error) {
      console.error('Error fetching time range report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ReportSkeleton />;
  if (!data.length) return <div className="text-center py-8">No data available</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Time Range Report</h2>
        <select
          value={interval}
          onChange={(e) => setInterval(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="day">Daily</option>
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
          <option value="year">Yearly</option>
        </select>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Time Period</th>
                <th className="px-4 py-2 text-right">Seizures</th>
                <th className="px-4 py-2 text-right">Total Quantity</th>
                <th className="px-4 py-2 text-right">Offices</th>
                <th className="px-4 py-2 text-right">Goods Types</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{item.timePeriod}</td>
                  <td className="px-4 py-2 text-right">{item.totalSeizures}</td>
                  <td className="px-4 py-2 text-right">{item.totalQuantity}</td>
                  <td className="px-4 py-2 text-right">{item.numberOfOffices}</td>
                  <td className="px-4 py-2 text-right">{item.numberOfGoodsTypes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CheckpointsReport({ filters }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCheckpointsReport();
  }, [filters]);

  const fetchCheckpointsReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());

      const response = await fetch(`/api/reports/checkpoints?${params}`);
      const result = await response.json();
      setData(result.report || []);
    } catch (error) {
      console.error('Error fetching checkpoints report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ReportSkeleton />;
  if (!data.length) return <div className="text-center py-8">No data available</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Checkpoints Report</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((checkpoint, index) => (
          <div key={checkpoint.checkpointId} className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-2">{checkpoint.checkpointName}</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Seizures:</span> {checkpoint.totalSeizures}</p>
              <p><span className="font-medium">Total Quantity:</span> {checkpoint.totalQuantity}</p>
              <p><span className="font-medium">Offices:</span> {checkpoint.numberOfOffices}</p>
              <p><span className="font-medium">Goods Types:</span> {checkpoint.numberOfGoodsTypes}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ComprehensiveReport({ filters }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComprehensiveReport();
  }, [filters]);

  const fetchComprehensiveReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
      if (filters.officeCode) params.append('officeCode', filters.officeCode);

      const response = await fetch(`/api/reports/comprehensive?${params}`);
      const result = await response.json();
      setData(result.report);
    } catch (error) {
      console.error('Error fetching comprehensive report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ReportSkeleton />;
  if (!data) return <div className="text-center py-8">No data available</div>;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">Comprehensive Report</h2>
      
      {/* Summary Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-medium mb-4">Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard title="Total Seizures" value={data.summary.totalSeizures} />
          <MetricCard title="Total Commodities" value={data.summary.totalCommodities} />
          <MetricCard title="Total Quantity" value={data.summary.totalQuantity} />
          <MetricCard title="Number of Offices" value={data.summary.numberOfOffices} />
        </div>
      </div>

      {/* Detailed Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Office */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">By Office</h3>
          <div className="space-y-2">
            {data.byOffice.map((office, index) => (
              <div key={office._id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium">{office.officeName}</span>
                <span className="text-green-600 font-bold">{office.seizures}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Goods Type */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">By Goods Type</h3>
          <div className="space-y-2">
            {data.byGoodsType.map((goods, index) => (
              <div key={goods._id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium">{goods._id}</span>
                <span className="text-green-600 font-bold">{goods.seizures}</span>
              </div>
            ))}
          </div>
        </div>

        {/* By Detection Method */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">By Detection Method</h3>
          <div className="space-y-2">
            {data.byDetectionMethod.map((method, index) => (
              <div key={method._id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium">{method._id || 'Unknown'}</span>
                <span className="text-green-600 font-bold">{method.seizures}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Timeline</h3>
          <div className="space-y-2">
            {data.timeline.map((period, index) => (
              <div key={period._id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="font-medium">{period._id}</span>
                <span className="text-green-600 font-bold">{period.seizures}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function MetricCard({ title, value }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow text-center">
      <h4 className="text-sm font-medium text-gray-600 mb-1">{title}</h4>
      <p className="text-2xl font-bold text-green-600">{value}</p>
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="grid grid-cols-4 gap-4">
        <div className="h-20 bg-gray-200 rounded"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  );
}