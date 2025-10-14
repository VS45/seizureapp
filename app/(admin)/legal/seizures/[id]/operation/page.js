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
  const [gazetteNo, setGazetteNo] = useState('');
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPendingAlert, setShowPendingAlert] = useState(false);

  // Only legal operations available
  const legalOperations = ['Gazette', 'Litigation'];
  
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
      
      // If user doesn't have legal permission, show error
      if (userData.user.role !== 'legal') {
        setError('You do not have permission to update operations. Legal role required.');
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
      setRecommendation(data.recommendation || '');
      setGazetteNo(data.gazetteNo || '');
      
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

  const handleFileChange = (e) => {
    // Check status before allowing file operations
    if (!checkSeizureStatus()) return;
    
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
    // Check status before allowing file operations
    if (!checkSeizureStatus()) return;
    
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleOperationSelect = (op) => {
    // Check status before allowing operation selection
    if (!checkSeizureStatus()) return;
    setOperation(op);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check status before allowing submission
    if (!checkSeizureStatus()) return;
    
    setSubmitting(true);
    setError('');
    setSuccess('');

    // Validate comment
    if (!comment.trim()) {
      setError('Please add a comment explaining the operation change');
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

      // Add recommendation if provided
      if (recommendation.trim()) {
        updateData.recommendation = recommendation.trim();
      }

      // Add gazette number if Gazette operation is selected
      if (operation === 'Gazette' && gazetteNo.trim()) {
        updateData.gazetteNo = gazetteNo.trim();
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
            gazetteNo: operation === 'Gazette' ? gazetteNo.trim() : undefined,
          }
        }),
      });

      setTimeout(() => {
        router.push(`/legal/seizures/${seizureId}`);
      }, 1500);
    } catch (error) {
      setError(error.message || 'Error updating operation');
      setIsUploadingFiles(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseAlert = () => {
    setShowPendingAlert(false);
    router.push('/legal/seizures'); // Redirect back to seizures list
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

  if (user?.role !== 'legal') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to update operations. Legal role required.</p>
          <button
            onClick={() => router.push('/legal/seizures')}
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
              You cannot perform any legal operations until a validator validates and activates this seizure.
            </p>
            <p className="mt-3 text-sm text-gray-600">
              Please contact a validator to review and activate this seizure before proceeding with legal operations.
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
            <h1 className="text-2xl font-bold text-white">Update Seizure Operation</h1>
            <p className="text-green-100 mt-1">Reference ID: {seizure.referenceID}</p>
            <p className="text-green-100 text-sm">Logged in as: {user?.name} (Legal)</p>
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
                  seizure.operation === 'Gazette' ? 'bg-purple-100 text-purple-800' :
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

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Legal Operation
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {legalOperations.map((op) => (
                  <div
                    key={op}
                    className={`relative rounded-lg border p-4 cursor-pointer transition-all ${
                      operation === op
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                    onClick={() => handleOperationSelect(op)}
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

            {/* Recommendation Field */}
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
                placeholder="Add your legal recommendation for this seizure..."
              />
              <p className="text-sm text-gray-500 mt-1">Provide legal recommendations for next steps or special considerations</p>
            </div>

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
                placeholder="Please explain the reason for this legal operation change..."
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
                disabled={submitting || !comment.trim() || isUploadingFiles || (operation === 'Gazette' && !canGazette()) || (operation === 'Gazette' && !gazetteNo.trim())}
                className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                  submitting || !comment.trim() || isUploadingFiles || (operation === 'Gazette' && !canGazette()) || (operation === 'Gazette' && !gazetteNo.trim())
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