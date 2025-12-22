'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/auth-client';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';

export default function CreateOfficerPage() {
  const { user } = useUser();
  const router = useRouter();
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

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [officesRes, patrolsRes] = await Promise.all([
        fetch('/api/offices'),
        fetch('/api/patrols')
      ]);

      if (officesRes.ok) {
        const officesData = await officesRes.json();
        setOffices(officesData.offices);
      }

      if (patrolsRes.ok) {
        const patrolsData = await patrolsRes.json();
        setPatrols(patrolsData.patrols);
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg"
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
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {loading ? 'Creating...' : 'Create Officer'}
          </button>
        </div>
      </motion.form>
    </div>
  );
}