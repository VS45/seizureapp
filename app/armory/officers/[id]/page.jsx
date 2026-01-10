'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Edit, 
  User, 
  Mail, 
  Phone, 
  Shield,
  Calendar,
  FileText,
  Package
} from 'lucide-react';

export default function OfficerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState('');
  const [officer, setOfficer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        router.push('/login');
        return;
      }

      const userData = await response.json();
      setUser(userData.user);

      // Check if user has permission to view officer details
      const allowedRoles = ['admin', 'armourer', 'officer'];
      if (!allowedRoles.includes(userData.user.role)) {
        setError('You do not have permission to view officer details.');
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

  const fetchOfficer = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/officers/${id}`);
      if (response.ok) {
        const data = await response.json();
        setOfficer(data);
      } else {
        console.error('Failed to fetch officer');
      }
    } catch (error) {
      console.error('Failed to fetch officer:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (user && ['admin', 'armourer', 'officer'].includes(user.role)) {
      fetchOfficer();
    }
  }, [user, id]);

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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading officer details...</div>
        </div>
      </div>
    );
  }

  if (!officer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/officers')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center justify-between w-full">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Officer not found</h1>
              <p className="text-gray-600 mt-2">The requested officer could not be found.</p>
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
        
        <div className="bg-white rounded-lg border p-6 text-center">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Officer Not Found</h3>
          <p className="text-gray-500 mb-4">
            The officer you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/officers')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Officers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/officers')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">
                {officer.officer.rank} {officer.officer.name}
              </h1>
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
              Service No: {officer.officer.serviceNo} • {officer.officer.patrolTeam?.name}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Viewing as: {user.name} {user.unit && `(${user.unit})`}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* Only show edit button for admin and armourer */}
          {['admin', 'armourer'].includes(user.role) && (
            <button
              onClick={() => router.push(`/officers/${id}/edit`)}
              className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Officer
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border text-center hover:shadow-sm transition-shadow">
          <User className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{officer.officer.rank}</div>
          <div className="text-gray-600">Rank</div>
        </div>
        <div className="bg-white p-6 rounded-lg border text-center hover:shadow-sm transition-shadow">
          <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{officer.officer.patrolTeam?.name || 'Not assigned'}</div>
          <div className="text-gray-600">Patrol Team</div>
        </div>
        <div className="bg-white p-6 rounded-lg border text-center hover:shadow-sm transition-shadow">
          <Package className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{officer.currentPossessions?.length || 0}</div>
          <div className="text-gray-600">Current Items</div>
        </div>
        <div className="bg-white p-6 rounded-lg border text-center hover:shadow-sm transition-shadow">
          <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
            officer.officer.status === 'active' ? 'bg-green-100 text-green-600' :
            officer.officer.status === 'inactive' ? 'bg-gray-100 text-gray-600' :
            'bg-red-100 text-red-600'
          }`}>
            <Calendar className="w-4 h-4" />
          </div>
          <div className="text-sm font-medium capitalize">{officer.officer.status}</div>
          <div className="text-gray-600">Status</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {['profile', 'current', 'history'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'profile' && <User className="w-4 h-4 mr-2" />}
                {tab === 'current' && <Package className="w-4 h-4 mr-2" />}
                {tab === 'history' && <FileText className="w-4 h-4 mr-2" />}
                {tab === 'profile' ? 'Profile' : tab === 'current' ? 'Current Equipment' : 'Possession History'}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && <ProfileTab officer={officer.officer} user={user} />}
          {activeTab === 'current' && <CurrentEquipmentTab possessions={officer.currentPossessions} />}
          {activeTab === 'history' && <HistoryTab distributions={officer.possessionHistory} user={user} />}
        </div>
      </div>
    </div>
  );
}

// Tab Components
function ProfileTab({ officer, user }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Service Number:</span>
            <span className="font-medium">{officer.serviceNo}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Rank:</span>
            <span className="font-medium">{officer.rank}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Full Name:</span>
            <span className="font-medium">{officer.name}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium flex items-center">
              <Mail className="w-4 h-4 mr-2 text-gray-400" />
              {officer.email}
            </span>
          </div>
          {officer.phone && (
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Phone:</span>
              <span className="font-medium flex items-center">
                <Phone className="w-4 h-4 mr-2 text-gray-400" />
                {officer.phone}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Assignment Details</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Office:</span>
            <span className="font-medium">{officer.office?.name || 'Not assigned'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Patrol Team:</span>
            <span className="font-medium">{officer.patrolTeam?.name || 'Not assigned'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Unit:</span>
            <span className="font-medium">{officer.office?.unit || 'Not specified'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Status:</span>
            <span className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${
              officer.status === 'active' ? 'bg-green-100 text-green-800 border border-green-200' :
              officer.status === 'inactive' ? 'bg-gray-100 text-gray-800 border border-gray-200' :
              'bg-red-100 text-red-800 border border-red-200'
            }`}>
              {officer.status}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-600">Member Since:</span>
            <span className="font-medium">
              {new Date(officer.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CurrentEquipmentTab({ possessions }) {
  if (!possessions || possessions.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Current Equipment</h3>
        <p className="text-gray-500">
          No equipment has been issued to this officer.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Currently Issued Equipment</h3>
        <span className="text-sm text-gray-500">{possessions.length} items</span>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distribution No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Issued</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Renewal Due</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {possessions.map((possession, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
                    {possession.itemType}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {possession.itemSnapshot?.weaponType || 
                   possession.itemSnapshot?.caliber || 
                   possession.itemSnapshot?.name}
                  {possession.itemSnapshot?.serialNumber && (
                    <span className="text-gray-500 ml-2">(SN: {possession.itemSnapshot.serialNumber})</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 font-medium">{possession.distributionNo}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(possession.dateIssued).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 mr-2">
                      {possession.quantityIssued - possession.quantityReturned} of {possession.quantityIssued}
                    </span>
                    {possession.quantityIssued - possession.quantityReturned === possession.quantityIssued ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Full
                      </span>
                    ) : possession.quantityReturned > 0 ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Partial Return
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {possession.renewalDue ? (
                    <div className={`px-2 py-1 text-xs font-medium rounded-full inline-block ${
                      new Date(possession.renewalDue) < new Date() 
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {new Date(possession.renewalDue).toLocaleDateString()}
                    </div>
                  ) : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HistoryTab({ distributions, user }) {
  if (!distributions || distributions.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Possession History</h3>
        <p className="text-gray-500">
          This officer has no distribution history.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Possession History</h3>
        <span className="text-sm text-gray-500">{distributions.length} distributions</span>
      </div>
      <div className="space-y-4">
        {distributions.map((distribution) => (
          <motion.div 
            key={distribution._id} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border rounded-lg p-6 hover:shadow-sm transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-semibold text-gray-900">{distribution.distributionNo}</h4>
                <p className="text-sm text-gray-600">
                  {distribution.armory?.armoryName} • {new Date(distribution.dateIssued).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Issued by: {distribution.issuedBy?.name || 'System'}
                </p>
              </div>
              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                distribution.status === 'issued' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                distribution.status === 'returned' ? 'bg-green-100 text-green-800 border border-green-200' :
                distribution.status === 'partial_return' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                'bg-gray-100 text-gray-800 border border-gray-200'
              }`}>
                {distribution.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            
            {/* Issued Items */}
            <div className="space-y-3">
              {distribution.weaponsIssued.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Weapons:</h5>
                  <div className="space-y-2">
                    {distribution.weaponsIssued.map((weapon, index) => (
                      <div key={index} className="flex justify-between text-sm bg-gray-50 p-3 rounded">
                        <span className="font-medium">{weapon.itemSnapshot.weaponType} (SN: {weapon.itemSnapshot.serialNumber})</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          weapon.quantity === weapon.returnedQuantity ? 'bg-green-100 text-green-800' :
                          weapon.returnedQuantity > 0 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {weapon.returnedQuantity} of {weapon.quantity} returned
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {distribution.ammunitionIssued.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Ammunition:</h5>
                  <div className="space-y-2">
                    {distribution.ammunitionIssued.map((ammo, index) => (
                      <div key={index} className="flex justify-between text-sm bg-gray-50 p-3 rounded">
                        <span>{ammo.itemSnapshot.caliber} ({ammo.itemSnapshot.type})</span>
                        <span className="font-medium">
                          {ammo.returnedQuantity} of {ammo.quantity} {ammo.itemSnapshot.unit} returned
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {distribution.equipmentIssued.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Equipment:</h5>
                  <div className="space-y-2">
                    {distribution.equipmentIssued.map((equip, index) => (
                      <div key={index} className="flex justify-between text-sm bg-gray-50 p-3 rounded">
                        <span>{equip.itemSnapshot.name} ({equip.itemSnapshot.type})</span>
                        <span className="font-medium">
                          {equip.returnedQuantity} of {equip.quantity} returned
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Only show notes for admin and armourer */}
            {['admin', 'armourer'].includes(user?.role) && distribution.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Notes:</span> {distribution.notes}
                </p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}