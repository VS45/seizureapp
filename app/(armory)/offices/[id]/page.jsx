'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@/lib/auth-client';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Building, Calendar } from 'lucide-react';

export default function OfficeDetailPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const officeId = params.id;

  const [office, setOffice] = useState(null);
  const [loading, setLoading] = useState(true);

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
        setOffice(data.office);
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!office) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Office Not Found</h2>
        <p className="text-gray-600 mb-6">The office you're looking for doesn't exist.</p>
        <button
          onClick={() => router.push('/offices')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Back to Offices
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{office.name}</h1>
            <p className="text-gray-600 mt-2">
              Office Code: {office.code}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push(`/offices/${officeId}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Office</span>
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
              Active
            </span>
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-1" />
              Created on {formatDate(office.createdAt)}
            </div>
          </div>
          {office.updatedAt !== office.createdAt && (
            <div className="text-sm text-gray-500">
              Last updated: {formatDate(office.updatedAt)}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Office Information */}
          <div className="bg-white border rounded-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Office Information</h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Office Name</label>
                  <p className="text-gray-900 font-semibold text-lg">{office.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Office Code</label>
                  <p className="text-gray-900 font-mono bg-gray-100 px-3 py-2 rounded-lg inline-block">
                    {office.code}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timestamps */}
          <div className="bg-white border rounded-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Timeline</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Created</label>
                  <div className="flex items-center space-x-2 text-gray-900">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(office.createdAt)}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                  <div className="flex items-center space-x-2 text-gray-900">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(office.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border rounded-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/offices/${officeId}/edit`)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Office Details</span>
                </button>
                <button
                  onClick={() => router.push('/patrols?office=' + officeId)}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2"
                >
                  <Building className="w-4 h-4" />
                  <span>View Patrol Teams</span>
                </button>
                <button
                  onClick={() => router.push('/offices')}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Offices</span>
                </button>
              </div>
            </div>
          </div>

          {/* Office ID */}
          <div className="bg-white border rounded-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">System Information</h2>
            </div>
            <div className="p-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Office ID</label>
                <p className="text-gray-900 font-mono text-sm bg-gray-100 px-3 py-2 rounded-lg break-all">
                  {office._id}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}