'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Package, Search, Plus, Minus, Shield } from 'lucide-react';

export default function CreateDistributionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedArmoryId = searchParams.get('armoryId');

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [armories, setArmories] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [selectedArmory, setSelectedArmory] = useState(null);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  
  const [formData, setFormData] = useState({
    armoryId: preSelectedArmoryId || '',
    officerId: '',
    squadName: '',
    weapons: [],
    ammunition: [],
    equipment: [],
    remarks: ''
  });

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        router.push('/login');
        return;
      }

      const userData = await response.json();
      setUser(userData.user);

      // Check if user has permission to create distributions
      const allowedRoles = ['admin', 'armourer'];
      if (!allowedRoles.includes(userData.user.role)) {
        setError('You do not have permission to create distributions. Only administrators and armourers can issue weapons.');
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

  const fetchInitialData = async () => {
    try {
      const [armoriesRes, officersRes] = await Promise.all([
        fetch('/api/armory/armories'),
        fetch('/api/armory/officers')
      ]);

      if (armoriesRes.ok) {
        const armoriesData = await armoriesRes.json();
        setArmories(armoriesData.armories || []);
      }

      if (officersRes.ok) {
        const officersData = await officersRes.json();
        setOfficers(officersData.officers || []);
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    }
  };

  const handleArmorySelect = async (armoryId) => {
    try {
      const response = await fetch(`/api/armory/armories/${armoryId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedArmory(data.armory);
        setFormData(prev => ({ ...prev, armoryId }));
        setStep(2);
      }
    } catch (error) {
      console.error('Failed to fetch armory details:', error);
      alert('Failed to load armory details. Please try again.');
    }
  };

  const handleOfficerSelect = (officerId) => {
    const officer = officers.find(o => o._id === officerId);
    setSelectedOfficer(officer);
    setFormData(prev => ({ ...prev, officerId }));
    setStep(3);
  };

  const addWeaponToDistribution = (weaponId, quantity = 1) => {
    if (!user || !['admin', 'armourer'].includes(user.role)) {
      alert('You do not have permission to add weapons.');
      return;
    }

    const weapon = selectedArmory?.weapons?.find(w => w._id === weaponId);
    if (!weapon) return;

    const existingIndex = formData.weapons.findIndex(w => w.weaponId === weaponId);
    
    if (existingIndex >= 0) {
      const newWeapons = [...formData.weapons];
      const newQuantity = newWeapons[existingIndex].quantity + quantity;
      
      if (newQuantity > weapon.availableQuantity) {
        alert(`Cannot add more than ${weapon.availableQuantity} of ${weapon.weaponType}`);
        return;
      }
      
      newWeapons[existingIndex].quantity = newQuantity;
      setFormData(prev => ({ ...prev, weapons: newWeapons }));
    } else {
      if (quantity > weapon.availableQuantity) {
        alert(`Cannot add more than ${weapon.availableQuantity} of ${weapon.weaponType}`);
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        weapons: [...prev.weapons, { weaponId, quantity }]
      }));
    }
  };

  const updateWeaponQuantity = (weaponId, newQuantity) => {
    if (!user || !['admin', 'armourer'].includes(user.role)) {
      alert('You do not have permission to modify weapons.');
      return;
    }

    const weapon = selectedArmory?.weapons?.find(w => w._id === weaponId);
    if (!weapon || newQuantity < 0) return;

    if (newQuantity > weapon.availableQuantity) {
      alert(`Cannot add more than ${weapon.availableQuantity} of ${weapon.weaponType}`);
      return;
    }

    const newWeapons = formData.weapons.map(w =>
      w.weaponId === weaponId ? { ...w, quantity: newQuantity } : w
    ).filter(w => w.quantity > 0);

    setFormData(prev => ({ ...prev, weapons: newWeapons }));
  };

  const removeWeaponFromDistribution = (weaponId) => {
    setFormData(prev => ({
      ...prev,
      weapons: prev.weapons.filter(w => w.weaponId !== weaponId)
    }));
  };

  const calculateTotalItems = () => {
    return formData.weapons.reduce((total, weapon) => total + weapon.quantity, 0);
  };

  const validateDistribution = () => {
    if (!formData.armoryId || !formData.officerId || !formData.squadName) {
      alert('Please fill in all required fields');
      return false;
    }

    if (formData.weapons.length === 0) {
      alert('Please select at least one weapon to issue');
      return false;
    }

    return true;
  };

  const submitDistribution = async () => {
    if (!user || !['admin', 'armourer'].includes(user.role)) {
      alert('You do not have permission to create distributions.');
      return;
    }

    if (!validateDistribution()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/armory/distributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          issuedBy: user._id // Add the current user as the issuer
        })
      });

      if (response.ok) {
        const distribution = await response.json();
        alert('Distribution created successfully!');
        router.push(`/armory/distributions/${distribution._id}`);
      } else {
        const error = await response.json();
        alert(`Failed to create distribution: ${error.error}`);
      }
    } catch (error) {
      console.error('Distribution creation failed:', error);
      alert('Failed to create distribution');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (user && ['admin', 'armourer'].includes(user.role)) {
      fetchInitialData();
      if (preSelectedArmoryId) {
        handleArmorySelect(preSelectedArmoryId);
      }
    }
  }, [user, preSelectedArmoryId]);

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
              <h1 className="text-3xl font-bold text-gray-900">Issue Weapons & Equipment</h1>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                user.role === 'admin' ? 'bg-red-100 text-red-800 border-red-200' :
                'bg-blue-100 text-blue-800 border-blue-200'
              }`}>
                <Shield className="w-3 h-3 mr-1" />
                {user.role.toUpperCase()}
              </div>
            </div>
            <p className="text-gray-600 mt-2">
              Create a new distribution to issue weapons and equipment to officers
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Issuing as: {user.name} {user.unit && `(${user.unit})`}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-lg border p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2
                  ${step >= stepNumber 
                    ? 'border-blue-600 bg-blue-600 text-white' 
                    : 'border-gray-300 bg-white text-gray-600'
                  } transition-colors duration-300
                `}>
                  {stepNumber}
                </div>
                {stepNumber < 4 && (
                  <div className={`
                    w-24 h-1 mx-2 transition-colors duration-300
                    ${step > stepNumber ? 'bg-blue-600' : 'bg-gray-300'}
                  `} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-600 px-2">
            <span className={step >= 1 ? 'font-medium text-blue-600' : ''}>Select Armory</span>
            <span className={step >= 2 ? 'font-medium text-blue-600' : ''}>Select Officer</span>
            <span className={step >= 3 ? 'font-medium text-blue-600' : ''}>Select Items</span>
            <span className={step >= 4 ? 'font-medium text-blue-600' : ''}>Review & Confirm</span>
          </div>
        </div>

        {/* Step 1: Select Armory */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-semibold text-gray-900">Select Armory</h2>
            <p className="text-gray-600">Choose an armory to issue weapons from.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {armories.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Armories Available</h3>
                  <p className="text-gray-500 mb-4">No armories found in the system.</p>
                  <button
                    onClick={() => router.push('/armory/armories/create')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Armory
                  </button>
                </div>
              ) : (
                armories.map((armory) => (
                  <button
                    key={armory._id}
                    onClick={() => handleArmorySelect(armory._id)}
                    className="p-4 border rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">{armory.armoryName}</h3>
                        <p className="text-sm text-gray-600">{armory.armoryCode}</p>
                      </div>
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Package className="w-4 h-4 text-gray-600" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">{armory.location}</p>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {armory.weapons?.length || 0} weapons
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}

        {/* Step 2: Select Officer */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Select Officer</h2>
              <p className="text-gray-600">Choose an officer to issue weapons to.</p>
              <div className="mt-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                <strong>Selected Armory:</strong> {selectedArmory?.armoryName} ({selectedArmory?.location})
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {officers.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Officers Available</h3>
                  <p className="text-gray-500 mb-4">No officers found in the system.</p>
                  <button
                    onClick={() => router.push('/armory/officers/create')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Officer
                  </button>
                </div>
              ) : (
                officers.map((officer) => (
                  <button
                    key={officer._id}
                    onClick={() => handleOfficerSelect(officer._id)}
                    className="p-4 border rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                          {officer.rank} {officer.name}
                        </h3>
                        <p className="text-sm text-gray-600">{officer.serviceNo}</p>
                      </div>
                      <div className={`p-2 rounded-lg ${
                        officer.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Shield className="w-4 h-4 text-gray-600" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">
                      {officer.patrolTeam?.name} • {officer.office?.name}
                    </p>
                    <div className="mt-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        officer.status === 'active' 
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {officer.status}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="flex justify-between pt-4 border-t">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Armories
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Select Items */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Select Weapons & Equipment</h2>
                  <p className="text-gray-600">
                    Armory: <span className="font-medium">{selectedArmory?.armoryName}</span> • 
                    Officer: <span className="font-medium">{selectedOfficer?.rank} {selectedOfficer?.name}</span>
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {selectedArmory?.weapons?.filter(w => w.availableQuantity > 0).length || 0} weapons available
                </div>
              </div>

              {/* Squad Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Squad Name *
                </label>
                <input
                  type="text"
                  value={formData.squadName}
                  onChange={(e) => setFormData(prev => ({ ...prev, squadName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter squad name"
                  required
                />
              </div>

              {/* Available Weapons */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Available Weapons</h3>
                {!selectedArmory?.weapons || selectedArmory.weapons.length === 0 ? (
                  <div className="text-center py-8 border rounded-lg">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No Weapons Available</h4>
                    <p className="text-gray-500">This armory doesn't have any weapons.</p>
                  </div>
                ) : selectedArmory.weapons.filter(w => w.availableQuantity > 0).length === 0 ? (
                  <div className="text-center py-8 border rounded-lg">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">All Weapons Issued</h4>
                    <p className="text-gray-500">All weapons in this armory are currently issued.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedArmory.weapons.filter(w => w.availableQuantity > 0).map((weapon) => (
                      <div key={weapon._id} className="border rounded-lg p-4 hover:border-blue-500 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{weapon.weaponType}</h4>
                            <p className="text-sm text-gray-600">SN: {weapon.serialNumber}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                weapon.condition === 'Excellent' ? 'bg-green-100 text-green-800 border border-green-200' :
                                weapon.condition === 'Good' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                weapon.condition === 'Fair' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                'bg-red-100 text-red-800 border border-red-200'
                              }`}>
                                {weapon.condition}
                              </span>
                              {weapon.lastMaintenance && (
                                <span className="text-xs text-gray-500">
                                  Last Maintenance: {new Date(weapon.lastMaintenance).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-lg font-medium">
                            {weapon.availableQuantity} available
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => updateWeaponQuantity(
                                weapon._id, 
                                (formData.weapons.find(w => w.weaponId === weapon._id)?.quantity || 0) - 1
                              )}
                              className="w-8 h-8 rounded border flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              disabled={!formData.weapons.find(w => w.weaponId === weapon._id)?.quantity}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center font-medium text-gray-900">
                              {formData.weapons.find(w => w.weaponId === weapon._id)?.quantity || 0}
                            </span>
                            <button
                              onClick={() => addWeaponToDistribution(weapon._id, 1)}
                              className="w-8 h-8 rounded border flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => addWeaponToDistribution(weapon._id, 1)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Items Summary */}
              {formData.weapons.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6"
                >
                  <h3 className="font-medium text-blue-900 mb-3 flex items-center">
                    <Package className="w-4 h-4 mr-2" />
                    Selected Items ({calculateTotalItems()})
                  </h3>
                  <div className="space-y-2">
                    {formData.weapons.map((weaponItem) => {
                      const weapon = selectedArmory.weapons.find(w => w._id === weaponItem.weaponId);
                      return (
                        <div key={weaponItem.weaponId} className="flex justify-between items-center bg-white p-3 rounded-lg">
                          <div>
                            <span className="font-medium">{weapon?.weaponType}</span>
                            <span className="text-sm text-gray-600 ml-2">(SN: {weapon?.serialNumber})</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="font-medium">× {weaponItem.quantity}</span>
                            <button
                              onClick={() => removeWeaponFromDistribution(weaponItem.weaponId)}
                              className="text-red-600 hover:text-red-800 text-sm px-2 py-1 hover:bg-red-50 rounded transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              <div className="flex justify-between pt-6 border-t">
                <button
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Officers
                </button>
                <button
                  onClick={() => setStep(4)}
                  disabled={formData.weapons.length === 0 || !formData.squadName}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  Continue to Review
                  <ArrowLeft className="w-4 h-4 mr-1 transform rotate-180" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Review & Confirm */}
        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-semibold text-gray-900">Review & Confirm Distribution</h2>
            
            {/* Distribution Summary */}
            <div className="bg-white border rounded-lg p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900 flex items-center">
                    <Package className="w-4 h-4 mr-2" />
                    Armory Details
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{selectedArmory?.armoryName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Code:</span>
                      <span className="font-medium">{selectedArmory?.armoryCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{selectedArmory?.location}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900 flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Officer Details
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{selectedOfficer?.rank} {selectedOfficer?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Service No:</span>
                      <span className="font-medium">{selectedOfficer?.serviceNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Patrol Team:</span>
                      <span className="font-medium">{selectedOfficer?.patrolTeam?.name || 'Not assigned'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Squad Information</h3>
                <div className="flex justify-between">
                  <span className="text-gray-600">Squad Name:</span>
                  <span className="font-medium">{formData.squadName}</span>
                </div>
              </div>

              {/* Selected Items */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Items to be Issued ({calculateTotalItems()} items)</h3>
                {formData.weapons.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No items selected</p>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 border-b font-medium text-sm text-gray-700">
                      <div className="col-span-5">Weapon</div>
                      <div className="col-span-3">Serial Number</div>
                      <div className="col-span-2">Condition</div>
                      <div className="col-span-2 text-right">Quantity</div>
                    </div>
                    {formData.weapons.map((weaponItem) => {
                      const weapon = selectedArmory.weapons.find(w => w._id === weaponItem.weaponId);
                      return (
                        <div key={weaponItem.weaponId} className="grid grid-cols-12 gap-4 p-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors">
                          <div className="col-span-5 font-medium">{weapon?.weaponType}</div>
                          <div className="col-span-3 text-gray-600">{weapon?.serialNumber}</div>
                          <div className="col-span-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              weapon?.condition === 'Excellent' ? 'bg-green-100 text-green-800 border border-green-200' :
                              weapon?.condition === 'Good' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                              weapon?.condition === 'Fair' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                              'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {weapon?.condition}
                            </span>
                          </div>
                          <div className="col-span-2 text-right font-semibold">
                            {weaponItem.quantity}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Remarks */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Remarks (Optional)
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any additional notes or remarks about this distribution..."
                />
                <p className="text-xs text-gray-500">
                  Note: This distribution will be issued by {user.name} ({user.role})
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Items
              </button>
              <div className="space-x-3">
                <button
                  onClick={() => router.back()}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitDistribution}
                  disabled={loading || !validateDistribution()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Create Distribution</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}