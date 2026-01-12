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
  const [operation, setOperation] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // DC Enforcement users can only perform Destruction or Handover
  const dcenforcementOperations = ['Destruction', 'Handover'];

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) throw new Error('Failed to fetch user data');
      
      const userData = await response.json();
      setUser(userData.user);
      
      // If user doesn't have permission, show error
      if (userData.user.role !== 'dcenforcement') {
        setError('You do not have permission to update operations');
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
      const response = await fetch(`/api/seizures/${seizureId}`);
      if (!response.ok) throw new Error('Failed to fetch seizure');
      
      const data = await response.json();
      setSeizure(data);
      setOperation(data.operation || '');
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

    // Validate comment
    if (!comment.trim()) {
      setError('Please add a comment explaining the operation change');
      setSubmitting(false);
      return;
    }

    // Validate operation selection
    if (!operation || !dcenforcementOperations.includes(operation)) {
      setError('Please select a valid operation (Destruction or Handover)');
      setSubmitting(false);
      return;
    }

    try {
      // Prepare update data - ONLY operation and comment
      const updateData = {
        operation,
        comment: comment.trim(),
        status: 'active', // DC enforcement operations mark as active
        updatedBy: user?.role // Track who performed the operation
      };

      // Update operation with new data
      const response = await fetch(`/api/seizures/${seizureId}/operation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update operation');
      }

      setSuccess('Operation updated successfully');
      
      // Log activity
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: `Updated operation to ${operation} for seizure ${seizure.referenceID}`,
          details: {
            seizureId: seizure._id,
            referenceID: seizure.referenceID,
            previousOperation: seizure.operation,
            newOperation: operation,
            comment: comment.trim(),
            performedBy: user?.role,
            performedByName: user?.name
          }
        }),
      });

      setTimeout(() => {
        router.push(`/seizures/${seizureId}`);
      }, 1500);
    } catch (error) {
      setError(error.message || 'Error updating operation');
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

  if (user?.role !== 'dcenforcement') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to update operations.</p>
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
            <h1 className="text-2xl font-bold text-white">Update Seizure Operation</h1>
            <p className="text-green-100 mt-1">Reference ID: {seizure.referenceID}</p>
            <p className="text-green-100 text-sm">Logged in as: {user?.name} (DC Enforcement)</p>
            <p className="text-green-100 text-sm mt-1">
              Permissions: Can only perform Destruction or Handover operations
            </p>
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
                  seizure.operation === 'Destruction' ? 'bg-red-100 text-red-800' :
                  seizure.operation === 'Handover' ? 'bg-yellow-100 text-yellow-800' :
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
            </div>
          </div>

          {/* Update Form */}
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

            {/* Operation Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Operation *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dcenforcementOperations.map((op) => (
                  <div
                    key={op}
                    className={`relative rounded-lg border p-4 cursor-pointer transition-all ${
                      operation === op
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                    onClick={() => setOperation(op)}
                  >
                    <div className="flex items-center">
                      <div className={`h-4 w-4 rounded-full border-2 ${
                        operation === op 
                          ? 'border-green-500 bg-green-500' 
                          : 'border-gray-400'
                      }`}></div>
                      <span className="ml-3 font-medium text-gray-700">{op}</span>
                    </div>
                    {operation === op && (
                      <div className="absolute top-2 right-2">
                        <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Comment Field */}
            <div className="mb-6">
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Comments *
              </label>
              <textarea
                id="comment"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder={`Please explain the reason for ${operation || 'this operation'}...`}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                {operation === 'Destruction' 
                  ? 'Describe the destruction process, location, witnesses, etc.'
                  : operation === 'Handover'
                  ? 'Describe the handover process, recipient details, handover location, etc.'
                  : 'Comments are required for operation changes'}
              </p>
            </div>

            {/* Simple action buttons */}
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
                disabled={submitting || !comment.trim() || !operation}
                className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                  submitting || !comment.trim() || !operation
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {submitting ? 'Updating...' : 'Update Operation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}