'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/lib/auth-client';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  PieChart, 
  Calendar, 
  Download, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Warehouse,
  Users,
  Shield
} from 'lucide-react';

export default function ReportsPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [reportsData, setReportsData] = useState({
    inventory: null,
    issuance: null,
    renewals: null
  });

  useEffect(() => {
    fetchAllReports();
  }, []);

  const fetchAllReports = async () => {
    setLoading(true);
    try {
      const [inventoryRes, issuanceRes, renewalsRes] = await Promise.all([
        fetch('/api/reports/inventory'),
        fetch('/api/reports/issuance?period=30d&groupBy=squad'),
        fetch('/api/reports/renewals')
      ]);

      const inventoryData = inventoryRes.ok ? await inventoryRes.json() : null;
      const issuanceData = issuanceRes.ok ? await issuanceRes.json() : null;
      const renewalsData = renewalsRes.ok ? await renewalsRes.json() : null;

      setReportsData({
        inventory: inventoryData,
        issuance: issuanceData,
        renewals: renewalsData
      });
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async (type) => {
    try {
      let endpoint = '';
      let filename = '';

      switch (type) {
        case 'renewals':
          endpoint = '/api/reports/renewals?format=csv';
          filename = 'renewals-report.csv';
          break;
        case 'inventory':
          // You might want to create a separate CSV endpoint for inventory
          endpoint = '/api/reports/inventory';
          filename = 'inventory-report.csv';
          break;
        case 'issuance':
          endpoint = '/api/reports/issuance?format=csv';
          filename = 'issuance-report.csv';
          break;
      }

      const response = await fetch(endpoint);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-lg">Loading reports...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive insights into armory operations and inventory management
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchAllReports}
            className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'inventory', label: 'Inventory', icon: Warehouse },
              { id: 'issuance', label: 'Issuance', icon: Users },
              { id: 'renewals', label: 'Renewals', icon: Calendar }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <OverviewTab data={reportsData} />
          )}

          {activeTab === 'inventory' && (
            <InventoryTab 
              data={reportsData.inventory} 
              onExport={() => exportToCSV('inventory')}
            />
          )}

          {activeTab === 'issuance' && (
            <IssuanceTab 
              data={reportsData.issuance} 
              onExport={() => exportToCSV('issuance')}
            />
          )}

          {activeTab === 'renewals' && (
            <RenewalsTab 
              data={reportsData.renewals} 
              onExport={() => exportToCSV('renewals')}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ data }) {
  const { inventory, issuance, renewals } = data;

  const stats = [
    {
      label: 'Total Armories',
      value: inventory?.summary?.totalArmories || 0,
      icon: Warehouse,
      color: 'blue'
    },
    {
      label: 'Active Distributions',
      value: issuance?.totalDistributions || 0,
      icon: Users,
      color: 'green'
    },
    {
      label: 'Pending Renewals',
      value: renewals?.stats?.pending || 0,
      icon: Clock,
      color: 'yellow'
    },
    {
      label: 'Overdue Renewals',
      value: renewals?.stats?.overdue || 0,
      icon: AlertTriangle,
      color: 'red'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'bg-blue-50 text-blue-600',
            green: 'bg-green-50 text-green-600',
            yellow: 'bg-yellow-50 text-yellow-600',
            red: 'bg-red-50 text-red-600'
          };

          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-6 rounded-lg border shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Status */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Status</h3>
          {inventory?.conditionStats && (
            <div className="space-y-3">
              {Object.entries(inventory.conditionStats).map(([condition, count]) => (
                <div key={condition} className="flex justify-between items-center">
                  <span className="capitalize text-gray-600">{condition.replace('_', ' ')}</span>
                  <span className="font-semibold">{count} items</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Renewal Alerts */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Renewal Alerts</h3>
          {renewals?.stats && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-green-600">
                <span>On Track</span>
                <span>{renewals.stats.total - renewals.stats.overdue - renewals.stats.due}</span>
              </div>
              <div className="flex justify-between items-center text-yellow-600">
                <span>Due Soon</span>
                <span>{renewals.stats.due}</span>
              </div>
              <div className="flex justify-between items-center text-red-600">
                <span>Overdue</span>
                <span>{renewals.stats.overdue}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="font-semibold">{issuance?.totalDistributions || 0}</div>
            <div className="text-gray-600">Issuances (30 days)</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="font-semibold">{inventory?.summary?.utilizationRate || 0}%</div>
            <div className="text-gray-600">Weapon Utilization</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <Shield className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <div className="font-semibold">{inventory?.lowStockItems?.length || 0}</div>
            <div className="text-gray-600">Low Stock Items</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Inventory Tab Component
function InventoryTab({ data, onExport }) {
  if (!data) {
    return (
      <div className="text-center py-8 text-gray-500">
        No inventory data available
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header with Export */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Inventory Analytics</h2>
        <button
          onClick={onExport}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Weapons</h3>
          <div className="text-2xl font-bold text-blue-900">
            {data.summary.totalAvailableWeapons} / {data.summary.totalWeapons}
          </div>
          <p className="text-blue-700 text-sm">Available / Total</p>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-900 mb-2">Ammunition</h3>
          <div className="text-2xl font-bold text-green-900">
            {data.summary.totalAvailableAmmunition} / {data.summary.totalAmmunition}
          </div>
          <p className="text-green-700 text-sm">Available / Total</p>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <h3 className="font-semibold text-purple-900 mb-2">Equipment</h3>
          <div className="text-2xl font-bold text-purple-900">
            {data.summary.totalAvailableEquipment} / {data.summary.totalEquipment}
          </div>
          <p className="text-purple-700 text-sm">Available / Total</p>
        </div>
      </div>

      {/* Condition Status */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment Condition</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(data.conditionStats).map(([condition, count]) => (
            <div key={condition} className="text-center p-4 border rounded-lg">
              <div className={`text-2xl font-bold ${
                condition === 'serviceable' ? 'text-green-600' :
                condition === 'unserviceable' ? 'text-red-600' :
                'text-yellow-600'
              }`}>
                {count}
              </div>
              <div className="text-gray-600 capitalize mt-1">
                {condition.replace('_', ' ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Low Stock Alerts */}
      {data.lowStockItems.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <h3 className="text-lg font-semibold text-yellow-900">Low Stock Alerts</h3>
          </div>
          <div className="space-y-3">
            {data.lowStockItems.slice(0, 5).map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-white rounded border">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-600">
                    {item.serialNumber} • {item.armory}
                  </div>
                </div>
                <div className="text-red-600 font-semibold">
                  {item.available} / {item.total}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unit-wise Distribution */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory by Unit</h3>
        <div className="space-y-4">
          {Object.entries(data.byUnit).map(([unit, stats]) => (
            <div key={unit} className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">{unit}</span>
              <div className="text-right">
                <div className="font-semibold">{stats.weapons} weapons</div>
                <div className="text-sm text-gray-600">{stats.armories} armories</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Issuance Tab Component
function IssuanceTab({ data, onExport }) {
  if (!data) {
    return (
      <div className="text-center py-8 text-gray-500">
        No issuance data available
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header with Export */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Issuance Analytics</h2>
        <button
          onClick={onExport}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border text-center">
          <div className="text-2xl font-bold text-blue-600">{data.totalDistributions}</div>
          <div className="text-gray-600">Total Distributions</div>
        </div>
        <div className="bg-white p-6 rounded-lg border text-center">
          <div className="text-2xl font-bold text-green-600">
            {data.issuanceStats?.reduce((sum, item) => sum + (item.totalWeapons || 0), 0) || 0}
          </div>
          <div className="text-gray-600">Weapons Issued</div>
        </div>
        <div className="bg-white p-6 rounded-lg border text-center">
          <div className="text-2xl font-bold text-purple-600">
            {data.issuanceStats?.reduce((sum, item) => sum + (item.totalAmmunition || 0), 0) || 0}
          </div>
          <div className="text-gray-600">Ammunition Issued</div>
        </div>
        <div className="bg-white p-6 rounded-lg border text-center">
          <div className="text-2xl font-bold text-orange-600">{data.period}</div>
          <div className="text-gray-600">Reporting Period</div>
        </div>
      </div>

      {/* Top Squads */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Squads by Issuance</h3>
        <div className="space-y-3">
          {data.issuanceStats?.slice(0, 10).map((squad, index) => (
            <div key={squad._id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">{index + 1}</span>
                </div>
                <div>
                  <div className="font-medium">{squad._id || 'Unknown Squad'}</div>
                  <div className="text-sm text-gray-600">
                    {squad.totalWeapons || 0} weapons • {squad.totalAmmunition || 0} ammo
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{squad.count} issues</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Trend */}
      {data.monthlyTrend && data.monthlyTrend.length > 0 && (
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trend</h3>
          <div className="space-y-3">
            {data.monthlyTrend.map((month, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">
                  {new Date(2000, month._id.month - 1).toLocaleString('default', { month: 'long' })} {month._id.year}
                </span>
                <div className="text-right">
                  <div className="font-semibold">{month.count} distributions</div>
                  <div className="text-sm text-gray-600">{month.totalItems} total items</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// Renewals Tab Component
function RenewalsTab({ data, onExport }) {
  if (!data) {
    return (
      <div className="text-center py-8 text-gray-500">
        No renewal data available
      </div>
    );
  }

  const getStatusColor = (status, daysUntilDue) => {
    if (status === 'overdue' || daysUntilDue < 0) return 'text-red-600 bg-red-50 border-red-200';
    if (daysUntilDue <= 7) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getStatusText = (status, daysUntilDue) => {
    if (status === 'overdue' || daysUntilDue < 0) return 'Overdue';
    if (daysUntilDue <= 7) return 'Due Soon';
    return 'On Track';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header with Export */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Renewal Management</h2>
        <button
          onClick={onExport}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Renewal Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border text-center">
          <div className="text-2xl font-bold text-gray-900">{data.stats.total}</div>
          <div className="text-gray-600">Total Renewals</div>
        </div>
        <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center">
          <div className="text-2xl font-bold text-green-600">
            {data.stats.total - data.stats.overdue - data.stats.due}
          </div>
          <div className="text-green-700">On Track</div>
        </div>
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200 text-center">
          <div className="text-2xl font-bold text-yellow-600">{data.stats.due}</div>
          <div className="text-yellow-700">Due Soon</div>
        </div>
        <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-center">
          <div className="text-2xl font-bold text-red-600">{data.stats.overdue}</div>
          <div className="text-red-700">Overdue</div>
        </div>
      </div>

      {/* Renewals List */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Active Renewals</h3>
        </div>
        <div className="divide-y">
          {data.renewals.slice(0, 20).map((renewal, index) => (
            <div key={renewal._id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-semibold text-gray-900">
                      {renewal.officer?.name} ({renewal.officer?.rank})
                    </h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(renewal.renewalStatus, renewal.daysUntilDue)}`}>
                      {getStatusText(renewal.renewalStatus, renewal.daysUntilDue)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Distribution: {renewal.distributionNo} • Squad: {renewal.squadName}</p>
                    <p>Armory: {renewal.armory?.armoryName} • Due: {new Date(renewal.renewalDue).toLocaleDateString()}</p>
                    {renewal.daysUntilDue !== undefined && (
                      <p className={renewal.daysUntilDue < 0 ? 'text-red-600' : renewal.daysUntilDue <= 7 ? 'text-yellow-600' : 'text-green-600'}>
                        {Math.abs(renewal.daysUntilDue)} days {renewal.daysUntilDue < 0 ? 'overdue' : 'remaining'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    Issued: {new Date(renewal.dateIssued).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Squad-wise Distribution */}
      {data.stats.bySquad && Object.keys(data.stats.bySquad).length > 0 && (
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Renewals by Squad</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(data.stats.bySquad).map(([squad, count]) => (
              <div key={squad} className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-gray-600">{squad}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}