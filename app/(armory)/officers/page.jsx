'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/auth-client';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Edit, Trash2, User, Shield, Mail, Phone, MapPin } from 'lucide-react';

export default function OfficersPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRank, setFilterRank] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/unauthorized');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchOfficers();
    }
  }, [user]);

  const fetchOfficers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/officers');
      if (response.ok) {
        const data = await response.json();
        setOfficers(data.officers || []);
      } else {
        console.error('Failed to fetch officers');
      }
    } catch (error) {
      console.error('Error fetching officers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOfficer = async (officerId) => {
    try {
      const response = await fetch(`/api/officers/${officerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setOfficers(officers.filter(officer => officer._id !== officerId));
        setDeleteConfirm(null);
      } else {
        const error = await response.json();
        alert(`Failed to delete officer: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting officer:', error);
      alert('Failed to delete officer');
    }
  };

  // Filter officers based on search and filters
  const filteredOfficers = officers.filter(officer => {
    const matchesSearch = 
      officer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      officer.serviceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      officer.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRank = !filterRank || officer.rank === filterRank;
    const matchesTeam = !filterTeam || officer.patrolTeam?.name === filterTeam;

    return matchesSearch && matchesRank && matchesTeam;
  });

  // Get unique values for filters
  const ranks = [...new Set(officers.map(officer => officer.rank).filter(Boolean))];
  const teams = [...new Set(officers.map(officer => officer.patrolTeam?.name).filter(Boolean))];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null; // Will redirect due to useEffect
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Officers Management</h1>
          <p className="text-gray-600 mt-2">
            Manage police officers and their information
          </p>
        </div>
        <button
          onClick={() => router.push('/officers/create')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Officer</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search officers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Rank Filter */}
          <select
            value={filterRank}
            onChange={(e) => setFilterRank(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Ranks</option>
            {ranks.map(rank => (
              <option key={rank} value={rank}>{rank}</option>
            ))}
          </select>

          {/* Team Filter */}
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Teams</option>
            {teams.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterRank('');
              setFilterTeam('');
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Clear Filters</span>
          </button>
        </div>
      </div>

      {/* Officers Grid */}
      <div className="bg-white rounded-lg border">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredOfficers.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No officers found</h3>
            <p className="text-gray-500 mb-4">
              {officers.length === 0 ? 'No officers have been added yet.' : 'No officers match your search criteria.'}
            </p>
            <button
              onClick={() => router.push('/officers/create')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Add First Officer
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredOfficers.map((officer, index) => (
              <motion.div
                key={officer._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                {/* Officer Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {officer.rank} {officer.name}
                      </h3>
                      <p className="text-sm text-gray-600">{officer.serviceNo}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/officers/${officer._id}/edit`)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(officer._id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Officer Details */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{officer.email}</span>
                  </div>
                  
                  {officer.phone && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{officer.phone}</span>
                    </div>
                  )}

                  {officer.patrolTeam && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{officer.patrolTeam.name}</span>
                    </div>
                  )}

                  {officer.office && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{officer.office.name}</span>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="mt-4 pt-4 border-t">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    officer.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {officer.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Officer
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this officer? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteOfficer(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Officer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}