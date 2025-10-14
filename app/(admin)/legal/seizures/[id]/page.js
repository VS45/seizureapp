// app/seizures/[id]/page.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  FiArrowLeft, 
  FiEdit, 
  FiSettings, 
  FiCalendar, 
  FiBox, 
  FiEye, 
  FiTruck,
  FiUser,
  FiNavigation,
  FiAlertCircle,
  FiImage,
  FiFileText,
  FiAward,
  FiFile
} from 'react-icons/fi';

export default function SeizureDetails() {
  const router = useRouter();
  const params = useParams();
  const seizureId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [seizure, setSeizure] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchSeizure();
  }, []);

  const fetchSeizure = async () => {
    try {
      const response = await fetch(`/api/seizures/${seizureId}`);
      if (!response.ok) throw new Error('Failed to fetch seizure');
      
      const data = await response.json();
      setSeizure(data);
      setLoading(false);
    } catch (error) {
      setError('Error loading seizure data');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOperationBadgeClass = (operation) => {
    switch (operation) {
      case 'destruction': return 'bg-red-100 text-red-800';
      case 'Auction': return 'bg-blue-100 text-blue-800';
      case 'Gazette': return 'bg-purple-100 text-purple-800';
      case 'Handover': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !seizure) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Error loading seizure</h3>
          <p className="mt-1 text-sm text-gray-500">{error || 'Seizure not found'}</p>
          <div className="mt-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <FiArrowLeft className="mr-2" /> Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center mb-4 sm:mb-0">
            <button
              onClick={() => router.back()}
              className="flex items-center text-green-600 hover:text-green-800 mr-4"
            >
              <FiArrowLeft className="mr-1" /> Back
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Seizure Details</h1>
          </div>
          <div className="flex space-x-3">
            <Link
              href={`/legal/seizures/${seizureId}/operation`}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <FiSettings className="mr-2" /> Update Seizure
            </Link>
          </div>
        </div>

        {/* Reference Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="bg-green-600 px-6 py-4">
            <h2 className="text-xl font-bold text-white">Reference: {seizure.referenceID}</h2>
            <p className="text-green-100">{seizure.office} ({seizure.officeCode}) • Serial No: {seizure.seizureSerialNo}</p>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(seizure.status)}`}>
                {seizure.status || 'pending'}
              </div>
            </div>
            <div className="flex items-center">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getOperationBadgeClass(seizure.operation)}`}>
                {seizure.operation || 'Not set'}
              </div>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <FiCalendar className="mr-2" />
              Created: {formatDate(seizure.createdAt)}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <FiUser className="mr-2" />
              By: {seizure.createdByName}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {['overview', 'commodities', 'route', 'detection', 'persons', 'images', 'documents', 'recommendation', 'dpv', 'comments'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Case Reference */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                    <FiAlertCircle className="mr-2" /> Case Reference
                  </h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Country of Seizure</dt>
                      <dd className="text-sm text-gray-900">{seizure.countryOfSeizure || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Offence Location</dt>
                      <dd className="text-sm text-gray-900">{seizure.offenceLocation || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Location Type</dt>
                      <dd className="text-sm text-gray-900">{seizure.offenceLocationType || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Offence Date & Time</dt>
                      <dd className="text-sm text-gray-900">{formatDate(seizure.offenceDateTime)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Service</dt>
                      <dd className="text-sm text-gray-900">{seizure.service || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Direction</dt>
                      <dd className="text-sm text-gray-900">{seizure.direction || 'N/A'}</dd>
                    </div>
                    {seizure.offenceDescription && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Description</dt>
                        <dd className="text-sm text-gray-900">{seizure.offenceDescription}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Commodity Overview */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                    <FiBox className="mr-2" /> Commodities Summary
                  </h3>
                  {seizure.commodities && seizure.commodities.length > 0 ? (
                    <div className="space-y-3">
                      {seizure.commodities.map((commodity, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <h4 className="font-medium text-gray-800">{commodity.goodsType || 'Unknown Goods'}</h4>
                          <p className="text-sm text-gray-600">
                            {commodity.quantity} {commodity.unit}
                            {commodity.containerNumber && ` • Container: ${commodity.containerNumber}`}
                            {commodity.itemDescription && ` • ${commodity.itemDescription}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No commodities recorded</p>
                  )}

                  {/* IPR Information */}
                  {(seizure.isIPR || seizure.rightHolder || seizure.isCounterfeit) && (
                    <div className="mt-6">
                      <h4 className="text-md font-medium text-gray-800 mb-2">IPR Information</h4>
                      <dl className="space-y-1">
                        {seizure.isIPR && (
                          <div className="flex items-center">
                            <dt className="text-sm font-medium text-gray-500 mr-2">IPR Case:</dt>
                            <dd className="text-sm text-gray-900">Yes</dd>
                          </div>
                        )}
                        {seizure.rightHolder && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Right Holder</dt>
                            <dd className="text-sm text-gray-900">{seizure.rightHolder}</dd>
                          </div>
                        )}
                        {seizure.isCounterfeit && (
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Counterfeit Type</dt>
                            <dd className="text-sm text-gray-900">{seizure.isCounterfeit}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}

                  {/* Medicine & IPR Categories */}
                  {(seizure.selectedMedicines && seizure.selectedMedicines.length > 0) && (
                    <div className="mt-6">
                      <h4 className="text-md font-medium text-gray-800 mb-2">Medicine Categories</h4>
                      <div className="space-y-2">
                        {seizure.selectedMedicines.map((medicine, index) => (
                          <div key={index} className="text-sm text-gray-900">
                            {medicine.type} - {medicine.subtypeType}: {medicine.subtypes?.join(', ')}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(seizure.selectedIPRs && seizure.selectedIPRs.length > 0) && (
                    <div className="mt-4">
                      <h4 className="text-md font-medium text-gray-800 mb-2">IPR Categories</h4>
                      <div className="space-y-2">
                        {seizure.selectedIPRs.map((ipr, index) => (
                          <div key={index} className="text-sm text-gray-900">
                            {ipr.type}: {ipr.subtypes?.join(', ')}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Commodities Tab */}
          {activeTab === 'commodities' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Commodity Details</h3>
              {seizure.commodities && seizure.commodities.length > 0 ? (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Goods Type</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Quantity</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Unit</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Container Number</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Item Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {seizure.commodities.map((commodity, index) => (
                        <tr key={index}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                            {commodity.goodsType}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{commodity.quantity}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{commodity.unit}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {commodity.containerNumber || 'N/A'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {commodity.itemDescription || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No commodities recorded</p>
              )}

              {/* Additional Commodity Information */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {seizure.concealment && (
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-2">Concealment Method</h4>
                    <p className="text-sm text-gray-900">{seizure.concealment}</p>
                  </div>
                )}

                {seizure.illicitTrade && seizure.illicitTrade.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-2">Illicit Trade Types</h4>
                    <div className="flex flex-wrap gap-2">
                      {seizure.illicitTrade.map((type, index) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Route Tab */}
          {activeTab === 'route' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <FiNavigation className="mr-2" /> Route Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Departure */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-800 mb-3">Departure</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Country</dt>
                      <dd className="text-sm text-gray-900">{seizure.departureCountry || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">State</dt>
                      <dd className="text-sm text-gray-900">{seizure.departureState || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Location</dt>
                      <dd className="text-sm text-gray-900">{seizure.departureLocation || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Port Code</dt>
                      <dd className="text-sm text-gray-900">{seizure.departurePortCode || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Transport</dt>
                      <dd className="text-sm text-gray-900">{seizure.departureTransport || 'N/A'}</dd>
                    </div>
                  </dl>
                </div>

                {/* Destination */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-800 mb-3">Destination</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Country</dt>
                      <dd className="text-sm text-gray-900">{seizure.destinationCountry || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">State</dt>
                      <dd className="text-sm text-gray-900">{seizure.destinationState || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Location</dt>
                      <dd className="text-sm text-gray-900">{seizure.destinationLocation || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Port Code</dt>
                      <dd className="text-sm text-gray-900">{seizure.destinationPortCode || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Transport</dt>
                      <dd className="text-sm text-gray-900">{seizure.destinationTransport || 'N/A'}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Conveyance */}
              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                  <FiTruck className="mr-2" /> Conveyance
                </h4>
                <p className="text-sm text-gray-900">{seizure.conveyanceType || 'N/A'}</p>
              </div>
            </div>
          )}

          {/* Detection Tab */}
          {activeTab === 'detection' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <FiEye className="mr-2" /> Detection Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-2">Detection Method</h4>
                  <p className="text-sm text-gray-900">{seizure.detectionMethod || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-2">Technical Aid</h4>
                  <p className="text-sm text-gray-900">{seizure.technicalAid || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-2">Checkpoint</h4>
                  <p className="text-sm text-gray-900">{seizure.checkpoint || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-2">Warehouse</h4>
                  <p className="text-sm text-gray-900">{seizure.warehouse || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Persons Tab */}
          {activeTab === 'persons' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <FiUser className="mr-2" /> Persons Information
              </h3>
              {seizure.persons && seizure.persons.length > 0 ? (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Name</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Role</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Gender</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Age</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Nationality</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {seizure.persons.map((person, index) => (
                        <tr key={index}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                            {person.name || 'N/A'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{person.role || 'N/A'}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{person.gender || 'N/A'}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{person.age || 'N/A'}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{person.nationality || 'N/A'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No persons recorded</p>
              )}
            </div>
          )}

          {/* Images Tab */}
          {activeTab === 'images' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <FiImage className="mr-2" /> Images
              </h3>
              {seizure.images && seizure.images.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {seizure.images.map((image, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                      <img 
                        src={image.url} 
                        alt={`Seizure evidence ${index + 1}`}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-3">
                        <p className="text-sm font-medium text-gray-900 truncate">{image.filename || `Image ${index + 1}`}</p>
                        {image.size && (
                          <p className="text-xs text-gray-500">{(image.size / 1024 / 1024).toFixed(2)} MB</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No images uploaded</p>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <FiFile className="mr-2" /> Documents
              </h3>
              {seizure.documents && seizure.documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {seizure.documents.map((document, index) => {
                    const isImage = document.type?.startsWith('image/') || 
                                   document.url?.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/i);
                    
                    const getPreviewContent = () => {
                      if (isImage) {
                        return (
                          <img 
                            src={document.url} 
                            alt={`Seizure evidence ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        );
                      }
                      
                      // Document preview with appropriate icon
                      const fileExtension = document.url?.split('.').pop()?.toUpperCase() || 'DOC';
                      return (
                        <div className="flex flex-col items-center justify-center h-full p-4">
                          <div className="text-4xl mb-2">
                            {document.type === 'application/pdf' ? '📄' : 
                             document.type?.includes('word') ? '📝' : '📎'}
                          </div>
                          <span className="text-lg font-bold text-gray-700">.{fileExtension}</span>
                          <p className="text-sm text-gray-500 mt-1 text-center">
                            Click to view document
                          </p>
                        </div>
                      );
                    };

                    return (
                      <a 
                        key={index}
                        href={document.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow hover:border-blue-300"
                      >
                        <div className="w-full h-48 bg-gray-50">
                          {getPreviewContent()}
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {document.filename || `Document ${index + 1}`}
                          </p>
                          {document.size && (
                            <p className="text-xs text-gray-500">
                              {(document.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          )}
                        </div>
                      </a>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No documents uploaded</p>
              )}
            </div>
          )}

          {/* Recommendation Tab */}
          {activeTab === 'recommendation' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <FiFileText className="mr-2" /> Recommendation
              </h3>
              {seizure.recommendation ? (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{seizure.recommendation}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No recommendation provided</p>
              )}
            </div>
          )}

          {/* DPV Tab */}
          {activeTab === 'dpv' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <FiAward className="mr-2" /> DPV & Gazette Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-2">DPV Value</h4>
                  <p className="text-lg font-semibold text-gray-900">
                    {seizure.dpv ? `$${seizure.dpv.toLocaleString()}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-2">Gazette Number</h4>
                  <p className="text-lg font-semibold text-gray-900">
                    {seizure.gazetteNo || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Comments & Activity</h3>
              {seizure.comments && seizure.comments.length > 0 ? (
                <div className="space-y-4">
                  {seizure.comments.map((comment, index) => (
                    <div key={index} className="border-l-4 border-green-500 pl-4 py-2">
                      <p className="text-sm text-gray-900">{comment.text}</p>
                      <div className="mt-1 flex items-center text-xs text-gray-500">
                        <span>By {comment.updatedBy || 'System'}</span>
                        <span className="mx-2">•</span>
                        <span>{comment.role}</span>
                        <span className="mx-2">•</span>
                        <span>{formatDate(comment.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No comments recorded</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}