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
  const [recommendation, setRecommendation] = useState('');
  const [files, setFiles] = useState([]);
  const [dpv, setDpv] = useState('');
  const [status, setStatus] = useState('');
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [gazetteNo, setGazetteNo] = useState(''); // New state for gazette number

  // Available operations based on user role
  const adminOperations = ['Destruction', 'Auction', 'Gazette', 'Handover','Litigation','Donations'];
  const legalOperations = ['Gazette','Litigation'];
  const valuationOperations = ['Valuation'];
  const validatorOperations = ['Validation'];
  
  const availableOperations = user?.role === 'admin' 
    ? adminOperations 
    : user?.role === 'legal' 
      ? legalOperations 
      : user?.role === 'valuation'
        ? valuationOperations
        : user?.role === 'validator'
          ? validatorOperations
          : [];

  // Check if user can set DPV
  const canSetDpv = user?.role === 'admin' || user?.role === 'valuation';

  // Check if user can validate (validator role)
  const canValidate = user?.role === 'validator';

  // Check if user can add recommendations (admin and legal roles)
  const canAddRecommendation = user?.role === 'admin' || user?.role === 'legal';

  // Check if gazetting is allowed (seizure date > 30 days)
  const canGazette = () => {
    if (operation !== 'Gazette') return true;
    
    if (!seizure?.offenceDateTime) return false;
    
    const seizureDate = new Date(seizure.offenceDateTime);
    const today = new Date();
    const diffTime = Math.abs(today - seizureDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 30;
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
      
      // If user doesn't have permission, show error
      if (!['admin', 'legal', 'valuation', 'initiator', 'validator'].includes(userData.user.role)) {
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
      console.log(seizureId)
      const response = await fetch(`/api/seizures/${seizureId}`);
      if (!response.ok) throw new Error('Failed to fetch seizure');
      
      const data = await response.json();
      setSeizure(data);
      setOperation(data.operation || '');
      setStatus(data.status || 'pending');
      setDpv(data.dpv || '');
      setRecommendation(data.recommendation || '');
      setGazetteNo(data.gazetteNo || ''); // Initialize gazetteNo from seizure data
      setLoading(false);
    } catch (error) {
      setError('Error loading seizure data');
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validate file size (10MB max) and types
    const validFiles = selectedFiles.filter(file => {
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
      const isValidType = [
        'image/jpeg', 
        'image/png', 
        'image/gif', 
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ].includes(file.type);
      
      return isValidSize && isValidType;
    });
    
    if (validFiles.length !== selectedFiles.length) {
      alert('Some files were invalid. Only images (JPEG, PNG, GIF, WEBP), PDF, and DOC files up to 10MB are allowed.');
    }
    
    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
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

    // Validate DPV if it's provided
    if (dpv && (isNaN(dpv) || parseFloat(dpv) <= 0)) {
      setError('Please enter a valid Duty Paid Value (DPV)');
      setSubmitting(false);
      return;
    }

    // Validate gazetting condition
    if (operation === 'Gazette' && !canGazette()) {
      setError('Gazetting is only allowed for seizures older than 30 days');
      setSubmitting(false);
      return;
    }

    // Validate gazette number if Gazette operation is selected
    if (operation === 'Gazette' && !gazetteNo.trim()) {
      setError('Please enter a gazette number for the Gazette operation');
      setSubmitting(false);
      return;
    }

    // Validator must provide a comment when declining
    if (canValidate && status === 'declined' && !comment.trim()) {
      setError('Please provide a comment explaining why the seizure is being declined');
      setSubmitting(false);
      return;
    }

    try {
      // First upload files if any
      let uploadedFiles = [];
      if (files.length > 0) {
        setIsUploadingFiles(true);
        const formData = new FormData();
        files.forEach(file => {
          formData.append('images', file);
        });

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload files');
        }

        const uploadData = await uploadResponse.json();
        uploadedFiles = uploadData.urls || [];
        setIsUploadingFiles(false);
      }

      // Prepare update data
      const updateData = {
        operation,
        comment: comment.trim(),
        images: uploadedFiles, // Array of new file URLs
      };

      // Add DPV if provided and user has permission
      if (canSetDpv && dpv) {
        updateData.dpv = parseFloat(dpv);
      }

      // Add recommendation if provided and user has permission
      if (canAddRecommendation && recommendation.trim()) {
        updateData.recommendation = recommendation.trim();
      }

      // Add gazette number if Gazette operation is selected
      if (operation === 'Gazette' && gazetteNo.trim()) {
        updateData.gazetteNo = gazetteNo.trim();
      }

      // Add status if user has permission to update it
      if ((user?.role === 'admin' || user?.role === 'initiator' || user?.role === 'validator') && status) {
        updateData.status = status;
      }

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
            recommendation: recommendation.trim() || undefined,
            filesAdded: uploadedFiles.length,
            dpv: dpv ? parseFloat(dpv) : undefined,
            gazetteNo: operation === 'Gazette' ? gazetteNo.trim() : undefined,
            status: status !== seizure.status ? status : undefined
          }
        }),
      });

      setTimeout(() => {
        router.push(`/admin/seizures/${seizureId}`);
      }, 1500);
    } catch (error) {
      setError(error.message || 'Error updating operation');
      setIsUploadingFiles(false);
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

  if (!availableOperations.length && !(user?.role === 'admin' || user?.role === 'initiator' || user?.role === 'validator') && !canSetDpv) {
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
            <p className="text-green-100 text-sm">Logged in as: {user?.name} ({user?.role})</p>
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
              {seizure.recommendation && (
                <div className="md:col-span-2">
                  <span className="font-medium text-gray-600">Previous Recommendation:</span> 
                  <span className="ml-2 text-blue-800">{seizure.recommendation}</span>
                </div>
              )}
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

            {availableOperations.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Operation
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableOperations.map((op) => (
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
                      {op === 'Gazette' && !canGazette() && (
                        <div className="mt-2 text-xs text-red-600">
                          Gazette only allowed for seizures older than 30 days
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gazette Number Field - Only show when Gazette operation is selected */}
            {operation === 'Gazette' && (
              <div className="mb-6">
                <label htmlFor="gazetteNo" className="block text-sm font-medium text-gray-700 mb-2">
                  Gazette Number *
                </label>
                <input
                  type="text"
                  id="gazetteNo"
                  value={gazetteNo}
                  onChange={(e) => setGazetteNo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter the gazette number"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Enter the official gazette number for this seizure</p>
              </div>
            )}

            {/* DPV Field for Admin and Valuation Users */}
            {canSetDpv && (
              <div className="mb-6">
                <label htmlFor="dpv" className="block text-sm font-medium text-gray-700 mb-2">
                  Duty Paid Value (DPV)
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
                    className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">NGN</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">Enter the duty paid value in Nigerian Naira (optional)</p>
              </div>
            )}

            {/* Recommendation Field for Admin and Legal Users */}
            {canAddRecommendation && (
              <div className="mb-6">
                <label htmlFor="recommendation" className="block text-sm font-medium text-gray-700 mb-2">
                  Recommendation (Optional)
                </label>
                <textarea
                  id="recommendation"
                  rows={3}
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Add your professional recommendation for this seizure..."
                />
                <p className="text-sm text-gray-500 mt-1">Provide recommendations for next steps or special considerations</p>
              </div>
            )}

            {/* Status Update for Admin, Initiator and Validator */}
            {(user?.role === 'admin' || user?.role === 'initiator' || user?.role === 'validator') && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Update Status
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio h-4 w-4 text-green-600"
                      name="status"
                      value="pending"
                      checked={status === 'pending'}
                      onChange={(e) => setStatus(e.target.value)}
                    />
                    <span className="ml-2 text-gray-700">Pending</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio h-4 w-4 text-green-600"
                      name="status"
                      value="active"
                      checked={status === 'active'}
                      onChange={(e) => setStatus(e.target.value)}
                    />
                    <span className="ml-2 text-gray-700">Active</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio h-4 w-4 text-red-600"
                      name="status"
                      value="declined"
                      checked={status === 'declined'}
                      onChange={(e) => setStatus(e.target.value)}
                    />
                    <span className="ml-2 text-gray-700">Declined</span>
                  </label>
                </div>
                {user?.role === 'validator' && status === 'declined' && (
                  <p className="text-sm text-red-600 mt-2">
                    Please provide a comment explaining why the seizure is being declined
                  </p>
                )}
              </div>
            )}

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
                placeholder="Please explain the reason for this operation change..."
                required
              />
              <p className="text-sm text-gray-500 mt-1">Comments are required for operation changes</p>
            </div>

            {/* File Upload Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Supporting Documents (Optional)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <label className="flex flex-col items-center justify-center cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <div className="flex flex-col items-center justify-center py-4">
                    <svg
                      className="w-8 h-8 mb-3 text-gray-500"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 20 16"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                      />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      Images, PDF, DOC (MAX. 10MB each)
                    </p>
                  </div>
                </label>

                {isUploadingFiles && (
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                )}

                {files.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm font-medium text-gray-700">Files to be added:</p>
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                These files will be added to the existing documents for this seizure.
              </p>
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
                disabled={submitting || !comment.trim() || isUploadingFiles || (dpv && isNaN(dpv)) || (operation === 'Gazette' && !canGazette()) || (operation === 'Gazette' && !gazetteNo.trim())}
                className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                  submitting || !comment.trim() || isUploadingFiles || (dpv && isNaN(dpv)) || (operation === 'Gazette' && !canGazette()) || (operation === 'Gazette' && !gazetteNo.trim())
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