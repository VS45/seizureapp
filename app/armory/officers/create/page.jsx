'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, UserPlus, Shield } from 'lucide-react';

export default function CreateOfficerPage() {
  const router = useRouter();
  
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [offices, setOffices] = useState([]);
  const [patrols, setPatrols] = useState([]);
  const [formData, setFormData] = useState({
    serviceNo: '',
    rank: '',
    name: '',
    email: '',
    phone: '',
    office: '',
    patrolTeam: '',
    status: 'active'
  });

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        router.push('/login');
        return;
      }

      const userData = await response.json();
      setUser(userData.user);

      // Check if user has permission to create officers
      const allowedRoles = ['admin', 'armourer'];
      if (!allowedRoles.includes(userData.user.role)) {
        setError('You do not have permission to create officers. Only administrators and armourers can access this page.');
        setAuthLoading(false);

        setTimeout(() => {
          router.push('/unauthorized');
        }, 2000);
        return;
      }

      setAuthLoading(false);
    } catch (error) {
      console.error('Error fetching user:', error);
      setError('Authentication error. Please login again.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  };

  const fetchInitialData = async () => {
    try {
      const [officesRes, patrolsRes] = await Promise.all([
        fetch('/api/offices'),
        fetch('/api/patrols')
      ]);

      if (officesRes.ok) {
        const officesData = await officesRes.json();
        setOffices(officesData.offices || []);
      }

      if (patrolsRes.ok) {
        const patrolsData = await patrolsRes.json();
        setPatrols(patrolsData.patrols || []);
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (user && ['admin', 'armourer'].includes(user.role)) {
      fetchInitialData();
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Double-check user has permission to create officers
    if (user && !['admin', 'armourer'].includes(user.role)) {
      alert('You do not have permission to create officers.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/officers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        router.push('/officers');
      } else {
        const error = await response.json();
        alert(`Failed to create officer: ${error.error}`);
      }
    } catch (error) {
      console.error('Create officer failed:', error);
      alert('Failed to create officer');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Show authentication loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  // Show error state for unauthorized users
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-bold">Access Denied</p>
            <p className="mt-2">{error}</p>
            <p className="mt-2 text-sm">Redirecting...</p>
          </div>
        </div>
      </div>
    );
  }

  // Only render content if user is authenticated and authorized
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded max-w-md">
            <p>Loading user data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header with User Role Info */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Officer</h1>
              <p className="text-gray-600 mt-2">
                Register a new officer in the system
              </p>
            </div>
          </div>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
            user.role === 'admin' ? 'bg-red-100 text-red-800 border-red-200' :
            'bg-blue-100 text-blue-800 border-blue-200'
          }`}>
            <Shield className="w-3 h-3 mr-1" />
            {user.role.toUpperCase()}
          </div>
        </div>
        
        {/* User Info */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Creating officer as:</span> {user.name} 
            {user.unit && <span> ({user.unit})</span>}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {user.role === 'admin' 
              ? 'You have full administrative access to create and manage officers.' 
              : 'You have armourer access to create officers.'}
          </p>
        </div>
      </div>

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-white rounded-lg border p-6 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Service Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Number *
            </label>
            <input
              type="text"
              name="serviceNo"
              value={formData.serviceNo}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., SN12345"
            />
          </div>

          {/* Rank */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rank *
            </label>
            <select
              name="rank"
              value={formData.rank}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Rank</option>
              <option value="Constable">Constable</option>
              <option value="Corporal">Corporal</option>
              <option value="Sergeant">Sergeant</option>
              <option value="Inspector">Inspector</option>
              <option value="Chief Inspector">Chief Inspector</option>
              <option value="Superintendent">Superintendent</option>
              <option value="Chief Superintendent">Chief Superintendent</option>
            </select>
          </div>

          {/* Full Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter officer's full name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="officer@example.com"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="+1234567890"
            />
          </div>

          {/* Office */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Office *
            </label>
            <select
              name="office"
              value={formData.office}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Office</option>
              {offices.map((office) => (
                <option key={office._id} value={office._id}>
                  {office.name} ({office.code})
                </option>
              ))}
            </select>
          </div>

          {/* Patrol Team */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patrol Team *
            </label>
            <select
              name="patrolTeam"
              value={formData.patrolTeam}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Patrol Team</option>
              {patrols.map((patrol) => (
                <option key={patrol._id} value={patrol._id}>
                  {patrol.name} ({patrol.code})
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {loading ? 'Creating...' : 'Create Officer'}
          </button>
        </div>
      </motion.form>
    </div>
  );
}