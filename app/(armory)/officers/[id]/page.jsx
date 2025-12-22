'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/lib/auth-client';
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
  const { user } = useUser();
  const router = useRouter();
  const [officer, setOfficer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    fetchOfficer();
  }, [id]);

  const fetchOfficer = async () => {
    try {
      const response = await fetch(`/api/officers/${id}`);
      if (response.ok) {
        const data = await response.json();
        setOfficer(data);
      }
    } catch (error) {
      console.error('Failed to fetch officer:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading officer details...</div>
      </div>
    );
  }

  if (!officer) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-gray-900">Officer not found</h1>
        <button
          onClick={() => router.push('/officers')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Back to Officers
        </button>
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
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {officer.officer.rank} {officer.officer.name}
            </h1>
            <p className="text-gray-600 mt-2">
              Service No: {officer.officer.serviceNo} • {officer.officer.patrolTeam?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {(user?.role === 'admin' || user?.role === 'armourer') && (
            <button
              onClick={() => router.push(`/officers/${id}/edit`)}
              className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border text-center">
          <User className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{officer.officer.rank}</div>
          <div className="text-gray-600">Rank</div>
        </div>
        <div className="bg-white p-6 rounded-lg border text-center">
          <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{officer.officer.patrolTeam?.name}</div>
          <div className="text-gray-600">Patrol Team</div>
        </div>
        <div className="bg-white p-6 rounded-lg border text-center">
          <Package className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{officer.currentPossessions?.length || 0}</div>
          <div className="text-gray-600">Current Items</div>
        </div>
        <div className="bg-white p-6 rounded-lg border text-center">
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
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm capitalize ${
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
          {activeTab === 'profile' && <ProfileTab officer={officer.officer} />}
          {activeTab === 'current' && <CurrentEquipmentTab possessions={officer.currentPossessions} />}
          {activeTab === 'history' && <HistoryTab distributions={officer.possessionHistory} />}
        </div>
      </div>
    </div>
  );
}

// Tab Components
function ProfileTab({ officer }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Service Number:</span>
            <span className="font-medium">{officer.serviceNo}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Rank:</span>
            <span className="font-medium">{officer.rank}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Full Name:</span>
            <span className="font-medium">{officer.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium flex items-center">
              <Mail className="w-4 h-4 mr-1" />
              {officer.email}
            </span>
          </div>
          {officer.phone && (
            <div className="flex justify-between">
              <span className="text-gray-600">Phone:</span>
              <span className="font-medium flex items-center">
                <Phone className="w-4 h-4 mr-1" />
                {officer.phone}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Assignment Details</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Office:</span>
            <span className="font-medium">{officer.office?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Patrol Team:</span>
            <span className="font-medium">{officer.patrolTeam?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Unit:</span>
            <span className="font-medium">{officer.office?.unit}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
              officer.status === 'active' ? 'bg-green-100 text-green-800' :
              officer.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
              'bg-red-100 text-red-800'
            }`}>
              {officer.status}
            </span>
          </div>
          <div className="flex justify-between">
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
      <div className="text-center py-8 text-gray-500">
        No current equipment issued
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Currently Issued Equipment</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Item Type</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Description</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Distribution No</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date Issued</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Quantity</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Renewal Due</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {possessions.map((possession, index) => (
              <tr key={index}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 capitalize">
                  {possession.itemType}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {possession.itemSnapshot?.weaponType || 
                   possession.itemSnapshot?.caliber || 
                   possession.itemSnapshot?.name}
                  {possession.itemSnapshot?.serialNumber && ` (SN: ${possession.itemSnapshot.serialNumber})`}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{possession.distributionNo}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(possession.dateIssued).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {possession.quantityIssued - possession.quantityReturned} of {possession.quantityIssued}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {possession.renewalDue ? new Date(possession.renewalDue).toLocaleDateString() : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HistoryTab({ distributions }) {
  if (!distributions || distributions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No possession history
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Possession History</h3>
      <div className="space-y-4">
        {distributions.map((distribution) => (
          <div key={distribution._id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">{distribution.distributionNo}</h4>
                <p className="text-sm text-gray-600">
                  {distribution.armory?.armoryName} • {new Date(distribution.dateIssued).toLocaleDateString()}
                </p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                distribution.status === 'issued' ? 'bg-blue-100 text-blue-800' :
                distribution.status === 'returned' ? 'bg-green-100 text-green-800' :
                distribution.status === 'partial_return' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {distribution.status.replace('_', ' ')}
              </span>
            </div>
            
            {/* Issued Items */}
            <div className="space-y-2">
              {distribution.weaponsIssued.map((weapon, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>Weapon: {weapon.itemSnapshot.weaponType} (SN: {weapon.itemSnapshot.serialNumber})</span>
                  <span>{weapon.quantity} issued, {weapon.returnedQuantity} returned</span>
                </div>
              ))}
              {distribution.ammunitionIssued.map((ammo, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>Ammo: {ammo.itemSnapshot.caliber} ({ammo.itemSnapshot.type})</span>
                  <span>{ammo.quantity} {ammo.itemSnapshot.unit} issued, {ammo.returnedQuantity} returned</span>
                </div>
              ))}
              {distribution.equipmentIssued.map((equip, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>Equipment: {equip.itemSnapshot.name} ({equip.itemSnapshot.type})</span>
                  <span>{equip.quantity} issued, {equip.returnedQuantity} returned</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}