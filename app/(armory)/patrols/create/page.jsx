'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/auth-client';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Users } from 'lucide-react';

export default function CreatePatrolPage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [offices, setOffices] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    office: '',
    members: []
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [officesRes, officersRes] = await Promise.all([
        fetch('/api/offices'),
        fetch('/api/officers')
      ]);

      if (officesRes.ok) {
        const officesData = await officesRes.json();
        setOffices(officesData.offices);
      }

      if (officersRes.ok) {
        const officersData = await officersRes.json();
        setOfficers(officersData.officers);
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (user?.role !== 'admin') {
      alert('Only administrators can create patrol teams');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/patrols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        router.push('/patrols');
      } else {
        const error = await response.json();
        alert(`Failed to create patrol team: ${error.error}`);
      }
    } catch (error) {
      console.error('Create patrol failed:', error);
      alert('Failed to create patrol team');
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

  const handleMemberChange = (officerId, isChecked) => {
    setFormData(prev => ({
      ...prev,
      members: isChecked 
        ? [...prev.members, officerId]
        : prev.members.filter(id => id !== officerId)
    }));
  };

  // Filter officers by selected office
  const filteredOfficers = officers.filter(officer => 
    !formData.office || officer.office?._id === formData.office
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Patrol Team</h1>
          <p className="text-gray-600 mt-2">
            Set up a new patrol team and assign officers
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
          {/* Patrol Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patrol Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Alpha Team, Bravo Squad"
            />
          </div>

          {/* Patrol Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patrol Code *
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., PAT-001, BRAVO-01"
            />
          </div>

          {/* Office */}
          <div className="md:col-span-2">
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
        </div>

        {/* Members Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Team Members
          </label>
          {formData.office ? (
            <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
              {filteredOfficers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No officers available in this office
                </div>
              ) : (
                filteredOfficers.map((officer) => (
                  <label
                    key={officer._id}
                    className="flex items-center p-4 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.members.includes(officer._id)}
                      onChange={(e) => handleMemberChange(officer._id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">
                        {officer.rank} {officer.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {officer.serviceNo} • {officer.patrolTeam?.name || 'No patrol team'}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 border rounded-lg">
              Please select an office to see available officers
            </div>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Selected {formData.members.length} officer(s)
          </p>
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
            disabled={loading || user?.role !== 'admin'}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Users className="w-4 h-4 mr-2" />
            {loading ? 'Creating...' : 'Create Patrol Team'}
          </button>
        </div>

        {user?.role !== 'admin' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-700">
              Only administrators can create patrol teams
            </p>
          </div>
        )}
      </motion.form>
    </div>
  );
}