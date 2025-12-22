'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/lib/auth-client';
import { ArmoryTable } from '@/components/tables/ArmoryTable';
import { SearchBar } from '@/components/ui/SearchBar';
import { FilterMenu } from '@/components/ui/FilterMenu';
import { motion } from 'framer-motion';
import { Plus, Warehouse } from 'lucide-react';

export default function ArmoriesPage() {
  const { user } = useUser();
  const [armories, setArmories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchArmories();
  }, []);

  const fetchArmories = async () => {
    try {
      const response = await fetch('/api/armories');
      if (response.ok) {
        const data = await response.json();
        setArmories(data.armories);
      }
    } catch (error) {
      console.error('Failed to fetch armories:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArmories = armories.filter(armory => {
    const matchesSearch = armory.armoryName.toLowerCase().includes(search.toLowerCase()) ||
                         armory.armoryCode.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || armory.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading armories...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Armories</h1>
          <p className="text-gray-600 mt-2">
            Manage weapon and equipment inventory across all locations
          </p>
        </div>
        {user?.role !== 'officer' && (
          <Link
            href="/armories/create"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Armory
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <Warehouse className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{armories.length}</p>
              <p className="text-sm text-gray-600">Total Armories</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-green-600 text-sm font-bold">A</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {armories.filter(a => a.status === 'active').length}
              </p>
              <p className="text-sm text-gray-600">Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search armories..."
            />
          </div>
          <FilterMenu
            label="Status"
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'maintenance', label: 'Maintenance' },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border">
        <ArmoryTable armories={filteredArmories} />
      </div>
    </motion.div>
  );
}