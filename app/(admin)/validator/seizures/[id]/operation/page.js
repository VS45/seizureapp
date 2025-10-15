// app/seizures/[id]/operation/page.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function UpdateOperation() {
  const router = useRouter();
  const params = useParams();
  const seizureId = params.id;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [seizure, setSeizure] = useState(null);
  const [status, setStatus] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) throw new Error('Failed to fetch user data');
      
      const userData = await response.json();
      console.log(userData.user)
      setUser(userData.user);
      
      // If user doesn't have validator permission, show error
      if (userData.user.role !== 'validator') {
        setError('You do not have permission to validate seizures. Validator role required.');
        setLoading(false);
        return;
      }
      
      fetchSeizure();
    } catch (error) {
      console.error('Error fetching user:', error);
      setError('Authentication error. Please login again.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  };

  const fetchSeizure = async () => {
    try {
      console.log(seizureId)
      const response = await fetch(`/api/seizures/${seizureId}`);
      if (!response.ok) throw new Error('Failed to fetch seizure');
      
      const data = await response.json();
      setSeizure(data);
      setStatus(data.status || 'pending');
      setLoading(false);
    } catch (error) {
      setError('Error loading seizure data');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    // Validate comment - always required for validators
    if (!comment.trim()) {
      setError('Please provide comments explaining your validation decision');
      setSubmitting(false);
      return;
    }

    // Extra validation for declined status
    if (status === 'declined' && comment.trim().length < 10) {
      setError('Please provide detailed comments explaining why the seizure is being declined (minimum 10 characters)');
      setSubmitting(false);
      return;
    }

    try {
      // Prepare update data - only status and comment for validators
      const updateData = {
        status: status,
        comment: comment.trim(),
      };

      // Update seizure status
      const response = await fetch(`/api/seizures/${seizureId}/operation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update seizure status');
      }

      setSuccess(`Seizure ${status} successfully`);
      
      // Log validation activity
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: `Updated seizure status to ${status} for ${seizure.referenceID}`,
          details: {
            seizureId: seizure._id,
            referenceID: seizure.referenceID,
            previousStatus: seizure.status,
            newStatus: status,
            comment: comment.trim(),
            validatedBy: user?.name,
            validatorRole: user?.role
          }
        }),
      });

      setTimeout(() => {
        router.push(`/validator/seizures/${seizureId}`);
      }, 1500);
    } catch (error) {
      setError(error.message || 'Error updating seizure status');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!seizure) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Seizure not found</div>
      </div>
    );
  }

  if (user?.role !== 'validator') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to validate seizures. Validator role required.</p>
          <button
            onClick={() => router.push('/seizures')}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Back to Seizures
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-green-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Validate Seizure</h1>
            <p className="text-green-100 mt-1">Reference ID: {seizure.referenceID}</p>
            <p className="text-green-100 text-sm">Logged in as: {user?.name} (Validator)</p>
          </div>

          {/* Current Info */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Seizure Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Office:</span> {seizure.office}
              </div>
              <div>
                <span className="font-medium text-gray-600">Goods Type:</span> {seizure.commodities[0]?.goodsType}
              </div>
              <div>
                <span className="font-medium text-gray-600">Quantity:</span> {seizure.commodities[0]?.quantity} {seizure.commodities[0]?.unit}
              </div>
              <div>
                <span className="font-medium text-gray-600">Seizure Date:</span> 
                {seizure.seizureDate ? new Date(seizure.seizureDate).toLocaleDateString() : 'Not set'}
              </div>
              <div>
                <span className="font-medium text-gray-600">Current Operation:</span> 
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  seizure.operation === 'destruction' ? 'bg-red-100 text-red-800' :
                  seizure.operation === 'Auction' ? 'bg-blue-100 text-blue-800' :
                  seizure.operation === 'Gazette' ? 'bg-purple-100 text-purple-800' :
                  seizure.operation === 'Handover' ? 'bg-yellow-100 text-yellow-800' :
                  seizure.operation === 'Litigation' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {seizure.operation || 'Not set'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Current Status:</span> 
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  seizure.status === 'active' ? 'bg-green-100 text-green-800' :
                  seizure.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  seizure.status === 'declined' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {seizure.status || 'pending'}
                </span>
              </div>
              {seizure.dpv && (
                <div>
                  <span className="font-medium text-gray-600">Duty Paid Value:</span> 
                  <span className="ml-2 text-green-800 font-medium">₦{parseFloat(seizure.dpv).toLocaleString()}</span>
                </div>
              )}
              {seizure.gazetteNo && (
                <div>
                  <span className="font-medium text-gray-600">Gazette Number:</span> 
                  <span className="ml-2 text-purple-800 font-medium">{seizure.gazetteNo}</span>
                </div>
              )}
            </div>
          </div>

          {/* Validation Form */}
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                {success}
              </div>
            )}

            {/* Status Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Set Validation Status *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Pending Option */}
                <div
                  className={`relative rounded-lg border p-4 cursor-pointer transition-all ${
                    status === 'pending'
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-300 hover:border-yellow-400'
                  }`}
                  onClick={() => setStatus('pending')}
                >
                  <div className="flex items-center">
                    <div className={`h-4 w-4 rounded-full border-2 ${
                      status === 'pending' 
                        ? 'border-yellow-500 bg-yellow-500' 
                        : 'border-gray-400'
                    }`}></div>
                    <span className="ml-3 font-medium text-gray-700">Pending</span>
                  </div>
                  {status === 'pending' && (
                    <div className="absolute top-2 right-2">
                      <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <p className="mt-2 text-xs text-gray-600">Keep seizure under review</p>
                </div>

                {/* Active Option */}
                <div
                  className={`relative rounded-lg border p-4 cursor-pointer transition-all ${
                    status === 'active'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                  onClick={() => setStatus('active')}
                >
                  <div className="flex items-center">
                    <div className={`h-4 w-4 rounded-full border-2 ${
                      status === 'active' 
                        ? 'border-green-500 bg-green-500' 
                        : 'border-gray-400'
                    }`}></div>
                    <span className="ml-3 font-medium text-gray-700">Active</span>
                  </div>
                  {status === 'active' && (
                    <div className="absolute top-2 right-2">
                      <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <p className="mt-2 text-xs text-gray-600">Approve and activate seizure</p>
                </div>

                {/* Declined Option */}
                <div
                  className={`relative rounded-lg border p-4 cursor-pointer transition-all ${
                    status === 'declined'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 hover:border-red-400'
                  }`}
                  onClick={() => setStatus('declined')}
                >
                  <div className="flex items-center">
                    <div className={`h-4 w-4 rounded-full border-2 ${
                      status === 'declined' 
                        ? 'border-red-500 bg-red-500' 
                        : 'border-gray-400'
                    }`}></div>
                    <span className="ml-3 font-medium text-gray-700">Declined</span>
                  </div>
                  {status === 'declined' && (
                    <div className="absolute top-2 right-2">
                      <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <p className="mt-2 text-xs text-gray-600">Reject and decline seizure</p>
                </div>
              </div>
            </div>

            {/* Comments Field */}
            <div className="mb-6">
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Validation Comments *
                {status === 'declined' && (
                  <span className="text-red-600 ml-1">(Detailed explanation required)</span>
                )}
              </label>
              <textarea
                id="comment"
                rows={5}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder={
                  status === 'active' 
                    ? "Please provide comments on why this seizure is being approved and activated..." 
                    : status === 'declined'
                    ? "Please provide detailed comments explaining why this seizure is being declined, including any issues found or reasons for rejection..."
                    : "Please provide comments on the current status and any additional information required..."
                }
                required
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>Comments are required for all validation decisions</span>
                {status === 'declined' && comment.length < 10 && (
                  <span className="text-red-600">
                    Minimum 10 characters required for declined seizures
                  </span>
                )}
              </div>
            </div>

            {/* Validator Guidelines */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Validator Responsibilities</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>Active:</strong> Approve seizure when all documentation is complete and compliant</li>
                      <li><strong>Pending:</strong> Request additional information or keep under review</li>
                      <li><strong>Declined:</strong> Reject seizure with detailed explanation of non-compliance</li>
                      <li>Always provide clear, professional comments supporting your decision</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !comment.trim() || (status === 'declined' && comment.trim().length < 10)}
                className={`px-6 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                  submitting || !comment.trim() || (status === 'declined' && comment.trim().length < 10)
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {submitting ? 'Validating...' : `Set as ${status || 'Status'}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}