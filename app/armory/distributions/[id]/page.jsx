'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Printer, Download, Calendar, User, Package, MapPin, FileText, Shield } from 'lucide-react';

export default function DistributionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const distributionId = params.id;

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState('');
  const [distribution, setDistribution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [returnLoading, setReturnLoading] = useState(false);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        router.push('/login');
        return;
      }

      const userData = await response.json();
      setUser(userData.user);

      // Check if user has permission to view distributions
      const allowedRoles = ['admin', 'armourer', 'officer'];
      if (!allowedRoles.includes(userData.user.role)) {
        setError('You do not have permission to view distribution details.');
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
        setDistribution(data.distribution || data);
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

  const handleReturnDistribution = async () => {
    if (!user || !['admin', 'armourer'].includes(user.role)) {
      alert('You do not have permission to return distributions. Only administrators and armourers can mark distributions as returned.');
      return;
    }

    if (!confirm('Are you sure you want to mark this distribution as returned? This will update inventory counts.')) {
      return;
    }

    try {
      setReturnLoading(true);
      const response = await fetch(`/api/armory/distributions/${distributionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'returned',
          returnDate: new Date().toISOString(),
          returnedBy: user._id // Track who returned it
        })
      });

      if (response.ok) {
        await fetchDistribution(); // Refresh data
        alert('Distribution marked as returned successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to return distribution: ${error.error}`);
      }
    } catch (error) {
      console.error('Error returning distribution:', error);
      alert('Failed to return distribution');
    } finally {
      setReturnLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      issued: 'bg-green-100 text-green-800 border-green-200',
      returned: 'bg-blue-100 text-blue-800 border-blue-200',
      overdue: 'bg-red-100 text-red-800 border-red-200',
      partial_return: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    const statusLabels = {
      issued: 'Currently Issued',
      returned: 'Fully Returned',
      overdue: 'Overdue for Return',
      partial_return: 'Partially Returned',
      cancelled: 'Cancelled'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusStyles[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Safe calculation functions
  const calculateTotalItems = (distribution) => {
    if (!distribution) return 0;
    
    const sumArray = (arr) => 
      Array.isArray(arr) ? arr.reduce((total, item) => total + (item?.quantity || 0), 0) : 0;
    
    return sumArray(distribution.weaponsIssued) + 
           sumArray(distribution.ammunitionIssued) + 
           sumArray(distribution.equipmentIssued);
  };

  const calculateReturnedItems = (distribution) => {
    if (!distribution) return 0;
    
    const sumArray = (arr) => 
      Array.isArray(arr) ? arr.reduce((total, item) => total + (item?.returnedQuantity || 0), 0) : 0;
    
    return sumArray(distribution.weaponsIssued) + 
           sumArray(distribution.ammunitionIssued) + 
           sumArray(distribution.equipmentIssued);
  };

  // Safe data access helper
  const getSafeDistribution = (dist) => {
    if (!dist) return null;
    
    return {
      _id: dist._id || 'unknown',
      squadName: dist.squadName || 'Unnamed Squad',
      status: dist.status || 'issued',
      remarks: dist.remarks || '',
      createdAt: dist.createdAt || new Date().toISOString(),
      updatedAt: dist.updatedAt || dist.createdAt || new Date().toISOString(),
      dateIssued: dist.dateIssued || dist.createdAt,
      renewalDue: dist.renewalDue,
      renewalStatus: dist.renewalStatus || 'pending',
      weaponsIssued: Array.isArray(dist.weaponsIssued) ? dist.weaponsIssued : [],
      ammunitionIssued: Array.isArray(dist.ammunitionIssued) ? dist.ammunitionIssued : [],
      equipmentIssued: Array.isArray(dist.equipmentIssued) ? dist.equipmentIssued : [],
      officer: dist.officer || { name: 'Unknown Officer', rank: 'N/A', serviceNo: 'N/A' },
      armory: dist.armory || { armoryName: 'Unknown Armory', armoryCode: 'N/A', location: 'Not specified' },
      issuedBy: dist.issuedBy || { name: 'System' },
      createdBy: dist.createdBy || { name: 'System' },
      returnedBy: dist.returnedBy,
      returnDate: dist.returnDate,
      ...dist
    };
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

  // Use safe distribution data
  const safeDistribution = getSafeDistribution(distribution);

  if (!safeDistribution) {
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
              user.role === 'armourer' ? 'bg-blue-100 text-blue-800 border-blue-200' :
              'bg-green-100 text-green-800 border-green-200'
            }`}>
              <Shield className="w-3 h-3 mr-1" />
              {user.role.toUpperCase()}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Distribution Not Found</h2>
          <p className="text-gray-600 mb-6">
            The distribution you're looking for doesn't exist or has been removed.
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

  const totalItems = calculateTotalItems(safeDistribution);
  const returnedItems = calculateReturnedItems(safeDistribution);

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{safeDistribution.squadName}</h1>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                user.role === 'admin' ? 'bg-red-100 text-red-800 border-red-200' :
                user.role === 'armourer' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                'bg-green-100 text-green-800 border-green-200'
              }`}>
                <Shield className="w-3 h-3 mr-1" />
                {user.role.toUpperCase()}
              </div>
            </div>
            <p className="text-gray-600 mt-2">
              Distribution #{safeDistribution._id.slice(-8).toUpperCase()}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Viewing as: {user.name} {user.unit && `(${user.unit})`}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* Only show return button for admin and armourer */}
          {safeDistribution.status === 'issued' && ['admin', 'armourer'].includes(user.role) && (
            <button
              onClick={handleReturnDistribution}
              disabled={returnLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {returnLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Package className="w-4 h-4" />
              )}
              <span>Mark Returned</span>
            </button>
          )}
          
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
          
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          
          {/* Only show edit button for admin and armourer */}
          {['admin', 'armourer'].includes(user.role) && (
            <button
              onClick={() => router.push(`/armory/distributions/${distributionId}/edit`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {getStatusBadge(safeDistribution.status)}
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-1" />
              Issued on {formatDate(safeDistribution.dateIssued)}
            </div>
            {safeDistribution.renewalDue && (
              <div className={`flex items-center text-sm ${
                new Date(safeDistribution.renewalDue) < new Date() 
                  ? 'text-red-600 bg-red-50 px-3 py-1 rounded-lg'
                  : 'text-gray-600'
              }`}>
                <Calendar className="w-4 h-4 mr-1" />
                Renewal due: {formatDate(safeDistribution.renewalDue)}
                {new Date(safeDistribution.renewalDue) < new Date() && ' (Overdue)'}
              </div>
            )}
          </div>
          {safeDistribution.updatedAt !== safeDistribution.createdAt && (
            <div className="text-sm text-gray-500">
              Last updated: {formatDate(safeDistribution.updatedAt)}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issued Items */}
          <div className="bg-white border rounded-lg">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Issued Items</h2>
                <div className="text-sm text-gray-600">
                  Total: {totalItems} items • Returned: {returnedItems} items
                  {totalItems > 0 && (
                    <div className="mt-1">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-green-600 h-1.5 rounded-full" 
                          style={{ width: `${(returnedItems / totalItems) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {/* Weapons */}
                {safeDistribution.weaponsIssued.map((item, index) => (
                  <motion.div
                    key={item._id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {item.itemSnapshot?.weaponType || 'Weapon'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Serial: {item.itemSnapshot?.serialNumber || 'N/A'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">
                            Condition: {item.conditionAtIssue || 'Not specified'}
                          </span>
                          {item.itemSnapshot?.lastMaintenance && (
                            <span className="text-xs text-gray-500">
                              • Last Maintenance: {new Date(item.itemSnapshot.lastMaintenance).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        × {item.quantity}
                      </div>
                      <div className="text-sm">
                        {item.returnedQuantity > 0 ? (
                          <div className={`px-2 py-1 rounded-full text-xs ${item.returnedQuantity < item.quantity ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                            {item.returnedQuantity} returned
                          </div>
                        ) : (
                          <div className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                            Issued
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Ammunition */}
                {safeDistribution.ammunitionIssued.map((item, index) => (
                  <motion.div
                    key={item._id || `ammo-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (safeDistribution.weaponsIssued.length + index) * 0.1 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {item.itemSnapshot?.caliber || 'Ammunition'} - {item.itemSnapshot?.type || 'Type'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Lot: {item.itemSnapshot?.lotNumber || 'N/A'}
                        </p>
                        <div className="text-xs text-gray-500 mt-1">
                          Unit: {item.itemSnapshot?.unit || 'rounds'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        × {item.quantity}
                      </div>
                      {item.returnedQuantity > 0 && (
                        <div className={`px-2 py-1 rounded-full text-xs ${item.returnedQuantity < item.quantity ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                          {item.returnedQuantity} returned
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Equipment */}
                {safeDistribution.equipmentIssued.map((item, index) => (
                  <motion.div
                    key={item._id || `equip-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (safeDistribution.weaponsIssued.length + safeDistribution.ammunitionIssued.length + index) * 0.1 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {item.itemSnapshot?.name || 'Equipment'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Type: {item.itemSnapshot?.type || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Condition: {item.conditionAtIssue || 'Not specified'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        × {item.quantity}
                      </div>
                      {item.returnedQuantity > 0 && (
                        <div className={`px-2 py-1 rounded-full text-xs ${item.returnedQuantity < item.quantity ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                          {item.returnedQuantity} returned
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {totalItems === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No items issued in this distribution</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Remarks */}
          {safeDistribution.remarks && (
            <div className="bg-white border rounded-lg">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">Remarks</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-700 whitespace-pre-wrap">{safeDistribution.remarks}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Distribution Information */}
          <div className="bg-white border rounded-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Distribution Info</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Distribution ID</label>
                <p className="text-gray-900 font-mono">{safeDistribution._id.slice(-8).toUpperCase()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Distribution No</label>
                <p className="text-gray-900">{safeDistribution.distributionNo || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Issued By</label>
                <p className="text-gray-900">{safeDistribution.issuedBy?.name || 'System'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created By</label>
                <p className="text-gray-900">{safeDistribution.createdBy?.name || 'System'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Issue Date</label>
                <p className="text-gray-900">{formatDate(safeDistribution.dateIssued)}</p>
              </div>
              {safeDistribution.returnDate && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Return Date</label>
                  <p className="text-gray-900">{formatDate(safeDistribution.returnDate)}</p>
                </div>
              )}
              {safeDistribution.returnedBy && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Returned By</label>
                  <p className="text-gray-900">{safeDistribution.returnedBy?.name || 'System'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Officer Information */}
          <div className="bg-white border rounded-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Officer</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {safeDistribution.officer?.rank} {safeDistribution.officer?.name}
                  </h3>
                  <p className="text-sm text-gray-600">{safeDistribution.officer?.serviceNo}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Unit:</span>
                  <span className="text-gray-900">{safeDistribution.officer?.unit || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Patrol Team:</span>
                  <span className="text-gray-900">{safeDistribution.officer?.patrolTeam?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Office:</span>
                  <span className="text-gray-900">{safeDistribution.officer?.office?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    safeDistribution.officer?.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : safeDistribution.officer?.status === 'inactive'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {safeDistribution.officer?.status || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Armory Information */}
          <div className="bg-white border rounded-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Armory</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {safeDistribution.armory?.armoryName}
                  </h3>
                  <p className="text-sm text-gray-600">{safeDistribution.armory?.armoryCode}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Location:</span>
                  <span className="text-gray-900">{safeDistribution.armory?.location || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Unit:</span>
                  <span className="text-gray-900">{safeDistribution.armory?.unit || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Type:</span>
                  <span className="text-gray-900 capitalize">{safeDistribution.armory?.armoryType || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    safeDistribution.armory?.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : safeDistribution.armory?.status === 'inactive'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {safeDistribution.armory?.status || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}