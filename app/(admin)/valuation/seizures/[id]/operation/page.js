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
  const [dpv, setDpv] = useState('');
  const [comment, setComment] = useState('');
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPendingAlert, setShowPendingAlert] = useState(false);

  // Check if seizure status is pending and show alert
  const checkSeizureStatus = () => {
    if (seizure?.status === 'pending') {
      setShowPendingAlert(true);
      return false;
    }
    return true;
  };

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
      
      // If user doesn't have valuation permission, show error
      if (userData.user.role !== 'valuation') {
        setError('You do not have permission to update operations. Valuation role required.');
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
      setDpv(data.dpv || '');
      
      // Check if status is pending and show alert
      if (data.status === 'pending') {
        setShowPendingAlert(true);
      }
      
      setLoading(false);
    } catch (error) {
      setError('Error loading seizure data');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check status before allowing submission
    if (!checkSeizureStatus()) return;
    
    setSubmitting(true);
    setError('');
    setSuccess('');

    // Validate DPV
    if (!dpv || isNaN(dpv) || parseFloat(dpv) <= 0) {
      setError('Please enter a valid Duty Paid Value (DPV) greater than 0');
      setSubmitting(false);
      return;
    }

    // Validate comment
    if (!comment.trim()) {
      setError('Please add a comment explaining the DPV valuation');
      setSubmitting(false);
      return;
    }

    try {
      // Prepare update data - only DPV and comment for valuation officers
      const updateData = {
        dpv: parseFloat(dpv),
        comment: comment.trim(),
      };

      // Update seizure with DPV value
      const response = await fetch(`/api/seizures/${seizureId}/operation`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update DPV value');
      }

      setSuccess('DPV value updated successfully');
      
      // Log activity
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: `Updated DPV value for seizure ${seizure.referenceID}`,
          details: {
            seizureId: seizure._id,
            referenceID: seizure.referenceID,
            previousDPV: seizure.dpv,
            newDPV: parseFloat(dpv),
            comment: comment.trim(),
          }
        }),
      });

      setTimeout(() => {
        router.push(`/valuation/seizures/${seizureId}`);
      }, 1500);
    } catch (error) {
      setError(error.message || 'Error updating DPV value');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseAlert = () => {
    setShowPendingAlert(false);
    router.push('/seizures'); // Redirect back to seizures list
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

  if (user?.role !== 'valuation') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to update operations. Valuation role required.</p>
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

  // Pending Status Alert Modal
  if (showPendingAlert) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="mt-4 text-center">
            <h3 className="text-lg font-semibold text-gray-900">Seizure Status Pending</h3>
            <p className="mt-2 text-sm text-gray-600">
              This seizure has a <span className="font-semibold text-yellow-600">pending status</span>. 
              You cannot perform any valuation operations until a validator validates and activates this seizure.
            </p>
            <p className="mt-3 text-sm text-gray-600">
              Please contact a validator to review and activate this seizure before proceeding with DPV valuation.
            </p>
            <div className="mt-6">
              <button
                onClick={handleCloseAlert}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Back to Seizures List
              </button>
            </div>
          </div>
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
            <h1 className="text-2xl font-bold text-white">Set Duty Paid Value (DPV)</h1>
            <p className="text-green-100 mt-1">Reference ID: {seizure.referenceID}</p>
            <p className="text-green-100 text-sm">Logged in as: {user?.name} (Valuation Officer)</p>
            <div className="mt-2 flex items-center bg-green-700 px-3 py-1 rounded-full text-xs text-green-100">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Seizure Status: Active
            </div>
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
                <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {seizure.status || 'active'}
                </span>
              </div>
              {seizure.dpv && (
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-600">Current DPV:</span> 
                  <span className="ml-2 text-green-800 font-medium text-lg">₦{parseFloat(seizure.dpv).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Valuation Form */}
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

            {/* DPV Field */}
            <div className="mb-6">
              <label htmlFor="dpv" className="block text-sm font-medium text-gray-700 mb-2">
                Duty Paid Value (DPV) *
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">₦</span>
                </div>
                <input
                  type="number"
                  id="dpv"
                  value={dpv}
                  onChange={(e) => setDpv(e.target.value)}
                  className="block w-full pl-7 pr-12 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-lg font-medium"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">NGN</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Enter the duty paid value in Nigerian Naira. This value is required for valuation purposes.
              </p>
              {dpv && !isNaN(dpv) && parseFloat(dpv) > 0 && (
                <p className="text-sm text-green-600 mt-1 font-medium">
                  Formatted Value: ₦{parseFloat(dpv).toLocaleString()}
                </p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Valuation Comments *
              </label>
              <textarea
                id="comment"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Please provide details about how you calculated the DPV value, including any factors considered, market rates, or valuation methodology used..."
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Comments are required to explain your DPV valuation methodology and calculations.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Valuation Officer Responsibilities</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Accurately calculate the Duty Paid Value based on current market rates</li>
                      <li>Consider all relevant factors including commodity type, quantity, and quality</li>
                      <li>Document your valuation methodology and calculations in the comments</li>
                      <li>Ensure the DPV value reflects the true market value of the seized goods</li>
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
                disabled={submitting || !comment.trim() || !dpv || isNaN(dpv) || parseFloat(dpv) <= 0}
                className={`px-6 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                  submitting || !comment.trim() || !dpv || isNaN(dpv) || parseFloat(dpv) <= 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {submitting ? 'Updating DPV...' : 'Update DPV Value'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}