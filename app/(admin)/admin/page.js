'use client'
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [checkpoints, setCheckpoints] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [seizures, setSeizures] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [checkpointsResponse, warehousesResponse, seizuresResponse] = await Promise.all([
          fetch('/api/checkpoints'),
          fetch('/api/warehouses'),
          fetch('/api/seizures')
        ]);

        if (checkpointsResponse.ok) {
          const checkpointsData = await checkpointsResponse.json();
          setCheckpoints(checkpointsData.checkpoints || []);
        }

        if (warehousesResponse.ok) {
          const warehousesData = await warehousesResponse.json();
          setWarehouses(warehousesData.warehouses || []);
        }

        if (seizuresResponse.ok) {
          const seizuresData = await seizuresResponse.json();
          setSeizures(seizuresData.seizures || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter seizures where operation is 'Not set'
  const recentSeizures = seizures.filter(seizure => seizure.operation === 'Not set');

  const stats = [
    { 
      name: 'Total Checkpoints', 
      value: loading ? '...' : checkpoints.length.toString(), 
      href: '/admin/checkpoints', 
      icon: '📍', 
      color: 'bg-blue-500' 
    },
    { 
      name: 'Total Warehouses', 
      value: loading ? '...' : warehouses.length.toString(), 
      href: '/admin/warehouses', 
      icon: '🏭', 
      color: 'bg-green-500' 
    },
    { 
      name: 'Recent Seizures', 
      value: loading ? '...' : recentSeizures.length.toString(), 
      href: '/seizures', 
      icon: '📋', 
      color: 'bg-purple-500' 
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-200"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className={`flex-shrink-0 p-3 rounded-md ${stat.color}`}>
                  <span className="text-white text-xl">{stat.icon}</span>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd className="text-lg font-semibold text-gray-900">{stat.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Quick Actions</h3>
        </div>
        <div className="p-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/admin/checkpoints"
            className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors duration-200"
          >
            📍 Create New Checkpoint
          </Link>
          <Link
            href="/admin/warehouses"
            className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
          >
            🏭 Create New Warehouse
          </Link>
        </div>
      </div>
    </div>
  );
}