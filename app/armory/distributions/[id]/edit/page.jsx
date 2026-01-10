'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DistributionForm from '@/components/DistributionForm';
import { ArrowLeft, Shield } from 'lucide-react';

export default function EditDistributionPage() {
  const router = useRouter();
  const params = useParams();
  const distributionId = params.id;

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState('');
  const [distribution, setDistribution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        router.push('/login');
        return;
      }

      const userData = await response.json();
      setUser(userData.user);

      // Check if user has permission to edit distributions
      const allowedRoles = ['admin', 'armourer'];
      if (!allowedRoles.includes(userData.user.role)) {
        setError('You do not have permission to edit distributions. Only administrators and armourers can modify distributions.');
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

  const fetchDistribution = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/armory/distributions/${distributionId}`);
      if (response.ok) {
        const data = await response.json();
        setDistribution(data);
      } else {
        console.error('Failed to fetch distribution');
        router.push('/armory/distributions');
      }
    } catch (error) {
      console.error('Error fetching distribution:', error);
      router.push('/armory/distributions');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDistribution = async (formData) => {
    if (!user || !['admin', 'armourer'].includes(user.role)) {
      alert('You do not have permission to update distributions.');
      return;
    }

    // Don't allow editing returned distributions
    if (distribution?.status === 'returned') {
      alert('Cannot edit a distribution that has already been returned.');
      return;
    }

    try {
      setUpdateLoading(true);
      const response = await fetch(`/api/armory/distributions/${distributionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          updatedBy: user._id // Track who made the update
        })
      });

      if (response.ok) {
        const updatedData = await response.json();
        alert('Distribution updated successfully!');
        router.push(`/armory/distributions/${distributionId}`);
      } else {
        const error = await response.json();
        alert(`Failed to update distribution: ${error.error}`);
      }
    } catch (error) {
      console.error('Distribution update failed:', error);
      alert('Failed to update distribution');
    } finally {
      setUpdateLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (user && distributionId) {
      fetchDistribution();
    }
  }, [user, distributionId]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading distribution details...</p>
        </div>
      </div>
    );
  }

  if (!distribution) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 p-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/distributions')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center justify-between w-full">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Distribution Not Found</h1>
              <p className="text-gray-600 mt-2">The distribution you're looking for doesn't exist.</p>
            </div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
              user.role === 'admin' ? 'bg-red-100 text-red-800 border-red-200' :
              'bg-blue-100 text-blue-800 border-blue-200'
            }`}>
              <Shield className="w-3 h-3 mr-1" />
              {user.role.toUpperCase()}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Distribution Not Found</h2>
          <p className="text-gray-600 mb-6">
            The distribution you're trying to edit doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/armory/distributions')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Distributions
          </button>
        </div>
      </div>
    );
  }

  // Check if distribution can be edited (not returned)
  if (distribution.status === 'returned') {
    return (
      <div className="max-w-6xl mx-auto space-y-6 p-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push(`/armory/distributions/${distributionId}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center justify-between w-full">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cannot Edit Distribution</h1>
              <p className="text-gray-600 mt-2">Distribution #{distribution._id?.slice(-8).toUpperCase() || distributionId.slice(-8).toUpperCase()}</p>
            </div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
              user.role === 'admin' ? 'bg-red-100 text-red-800 border-red-200' :
              'bg-blue-100 text-blue-800 border-blue-200'
            }`}>
              <Shield className="w-3 h-3 mr-1" />
              {user.role.toUpperCase()}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-12 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Distribution Already Returned</h2>
          <p className="text-gray-600 mb-4">
            This distribution has been marked as returned on {distribution.returnDate ? new Date(distribution.returnDate).toLocaleDateString() : 'an unknown date'}.
          </p>
          <p className="text-gray-500 mb-6">
            Returned distributions cannot be edited. You can only view the details.
          </p>
          <button
            onClick={() => router.push(`/armory/distributions/${distributionId}`)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Distribution Details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push(`/armory/distributions/${distributionId}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">Edit Distribution</h1>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                user.role === 'admin' ? 'bg-red-100 text-red-800 border-red-200' :
                'bg-blue-100 text-blue-800 border-blue-200'
              }`}>
                <Shield className="w-3 h-3 mr-1" />
                {user.role.toUpperCase()}
              </div>
            </div>
            <p className="text-gray-600 mt-2">
              Distribution #{distribution._id?.slice(-8).toUpperCase() || distributionId.slice(-8).toUpperCase()}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Editing as: {user.name} {user.unit && `(${user.unit})`}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-1 text-xs rounded-full ${
                distribution.status === 'issued' ? 'bg-green-100 text-green-800' :
                distribution.status === 'overdue' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {distribution.status.replace('_', ' ').toUpperCase()}
              </span>
              <span className="text-xs text-gray-500">
                Issued on {new Date(distribution.dateIssued || distribution.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <p className="text-sm text-blue-800">
              <strong>Editing Distribution:</strong> You are editing distribution for {distribution.squadName}. 
              Changes will be tracked and logged.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              <strong>Current Status:</strong> {distribution.status.replace('_', ' ')} • 
              <strong> Last Updated:</strong> {new Date(distribution.updatedAt || distribution.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Distribution Form */}
      <div className="bg-white rounded-lg border">
        <DistributionForm
          distribution={distribution}
          onSubmit={handleUpdateDistribution}
          isEditing={true}
          isLoading={updateLoading}
        />
      </div>

      {/* Footer Actions */}
      <div className="flex justify-between">
        <button
          onClick={() => router.push(`/distributions/${distributionId}`)}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Cancel Editing
        </button>
        <div className="text-sm text-gray-500">
          Note: All changes are logged and can be audited.
        </div>
      </div>
    </div>
  );
}