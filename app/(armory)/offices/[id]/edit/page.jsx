'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@/lib/auth-client';
import { ArrowLeft, Save, Building, Calendar } from 'lucide-react';

export default function EditOfficePage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const officeId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: ''
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && officeId) {
      fetchOffice();
    }
  }, [user, officeId]);

  const fetchOffice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/offices/${officeId}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          name: data.office.name || '',
          code: data.office.code || ''
        });
      } else {
        console.error('Failed to fetch office');
        router.push('/offices');
      }
    } catch (error) {
      console.error('Error fetching office:', error);
      router.push('/offices');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.code) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/offices/${officeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Office updated successfully!');
        router.push(`/offices/${officeId}`);
      } else {
        const error = await response.json();
        alert(`Failed to update office: ${error.error}`);
      }
    } catch (error) {
      console.error('Office update failed:', error);
      alert('Failed to update office');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Edit Office</h1>
          <p className="text-gray-600 mt-2">
            Update office information
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg border p-6 space-y-6">
          {/* Office Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Office Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Office Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter office name"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Unique name for the office
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Office Code *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., PS-001"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Unique code identifier
                </p>
              </div>
            </div>
          </div>

          {/* Office Preview */}
          <div className="bg-gray-50 rounded-lg p-4 border">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Office Preview</h3>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  {formData.name || 'Office Name'}
                </h4>
                <p className="text-sm text-gray-600">
                  Code: {formData.code || 'OFFICE-CODE'}
                </p>
              </div>
            </div>
            <div className="mt-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                Active
              </span>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-gray-50 rounded-lg p-4 border">
            <h3 className="text-lg font-medium text-gray-900 mb-3">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Office ID</label>
                <p className="text-gray-900 font-mono text-xs bg-white px-2 py-1 rounded border">
                  {officeId}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                <div className="flex items-center space-x-2 text-gray-900">
                  <Calendar className="w-4 h-4" />
                  <span>Just now</span>
                </div>
              </div>
            </div>
          </div>

          {/* Validation Rules */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-lg font-medium text-blue-900 mb-2">Validation Rules</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Office name must be unique across all offices</li>
              <li>• Office code must be unique across all offices</li>
              <li>• Both fields are required</li>
              <li>• Changes will be reflected immediately</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.push(`/offices/${officeId}`)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !formData.name || !formData.code}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}