'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/lib/auth-client';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Package, Search, Plus, Minus } from 'lucide-react';

export default function CreateDistributionPage() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedArmoryId = searchParams.get('armoryId');

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

  useEffect(() => {
    fetchInitialData();
    if (preSelectedArmoryId) {
      handleArmorySelect(preSelectedArmoryId);
    }
  }, [preSelectedArmoryId]);

  const fetchInitialData = async () => {
    try {
      const [armoriesRes, officersRes] = await Promise.all([
        fetch('/api/armories'),
        fetch('/api/officers')
      ]);

      if (armoriesRes.ok) {
        const armoriesData = await armoriesRes.json();
        setArmories(armoriesData.armories);
      }

      if (officersRes.ok) {
        const officersData = await officersRes.json();
        setOfficers(officersData.officers);
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
    }
  };

  const handleArmorySelect = async (armoryId) => {
    try {
      const response = await fetch(`/api/armories/${armoryId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedArmory(data.armory);
        setFormData(prev => ({ ...prev, armoryId }));
        setStep(2);
      }
    } catch (error) {
      console.error('Failed to fetch armory details:', error);
    }
  };

  const handleOfficerSelect = (officerId) => {
    const officer = officers.find(o => o._id === officerId);
    setSelectedOfficer(officer);
    setFormData(prev => ({ ...prev, officerId }));
    setStep(3);
  };

  const addWeaponToDistribution = (weaponId, quantity = 1) => {
    const weapon = selectedArmory.weapons.find(w => w._id === weaponId);
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
    const weapon = selectedArmory.weapons.find(w => w._id === weaponId);
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
    if (!validateDistribution()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/distributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const distribution = await response.json();
        alert('Distribution created successfully!');
        router.push(`/distributions/${distribution._id}`);
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Issue Weapons & Equipment</h1>
          <p className="text-gray-600 mt-2">
            Create a new distribution to issue weapons and equipment to officers
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div key={stepNumber} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${step >= stepNumber 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {stepNumber}
              </div>
              {stepNumber < 4 && (
                <div className={`
                  w-24 h-1 mx-2
                  ${step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'}
                `} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select Armory */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-semibold">Select Armory</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {armories.map((armory) => (
                <button
                  key={armory._id}
                  onClick={() => handleArmorySelect(armory._id)}
                  className="p-4 border rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <h3 className="font-semibold text-gray-900">{armory.armoryName}</h3>
                  <p className="text-sm text-gray-600">{armory.armoryCode}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {armory.weapons?.length || 0} weapons • {armory.location}
                  </p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2: Select Officer */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-semibold">Select Officer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {officers.map((officer) => (
                <button
                  key={officer._id}
                  onClick={() => handleOfficerSelect(officer._id)}
                  className="p-4 border rounded-lg text-left hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <h3 className="font-semibold text-gray-900">
                    {officer.rank} {officer.name}
                  </h3>
                  <p className="text-sm text-gray-600">{officer.serviceNo}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {officer.patrolTeam?.name} • {officer.office?.name}
                  </p>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← Back to Armories
            </button>
          </motion.div>
        )}

        {/* Step 3: Select Items */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-semibold">Select Weapons & Equipment</h2>
              <p className="text-gray-600">
                Armory: {selectedArmory?.armoryName} • Officer: {selectedOfficer?.name}
              </p>
            </div>

            {/* Squad Name */}
            <div>
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
              <h3 className="text-lg font-medium">Available Weapons</h3>
              {selectedArmory.weapons?.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No weapons available</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedArmory.weapons?.filter(w => w.availableQuantity > 0).map((weapon) => (
                    <div key={weapon._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{weapon.weaponType}</h4>
                          <p className="text-sm text-gray-600">SN: {weapon.serialNumber}</p>
                          <p className="text-sm text-gray-500">Condition: {weapon.condition}</p>
                        </div>
                        <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                          {weapon.availableQuantity} available
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateWeaponQuantity(
                              weapon._id, 
                              (formData.weapons.find(w => w.weaponId === weapon._id)?.quantity || 0) - 1
                            )}
                            className="w-8 h-8 rounded border flex items-center justify-center hover:bg-gray-50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center">
                            {formData.weapons.find(w => w.weaponId === weapon._id)?.quantity || 0}
                          </span>
                          <button
                            onClick={() => addWeaponToDistribution(weapon._id, 1)}
                            className="w-8 h-8 rounded border flex items-center justify-center hover:bg-gray-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => addWeaponToDistribution(weapon._id, 1)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
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
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Selected Items</h3>
                <div className="space-y-2">
                  {formData.weapons.map((weaponItem) => {
                    const weapon = selectedArmory.weapons.find(w => w._id === weaponItem.weaponId);
                    return (
                      <div key={weaponItem.weaponId} className="flex justify-between items-center">
                        <span>
                          {weapon?.weaponType} (SN: {weapon?.serialNumber}) × {weaponItem.quantity}
                        </span>
                        <button
                          onClick={() => removeWeaponFromDistribution(weaponItem.weaponId)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="font-medium text-blue-900">
                    Total Items: {calculateTotalItems()}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                ← Back to Officers
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={formData.weapons.length === 0 || !formData.squadName}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Review
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Review & Confirm */}
        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <h2 className="text-xl font-semibold">Review & Confirm</h2>
            
            {/* Distribution Summary */}
            <div className="bg-white border rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Armory Details</h3>
                                <p><strong>Name:</strong> {selectedArmory?.armoryName}</p>
                  <p><strong>Code:</strong> {selectedArmory?.armoryCode}</p>
                  <p><strong>Location:</strong> {selectedArmory?.location}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Officer Details</h3>
                  <p><strong>Name:</strong> {selectedOfficer?.rank} {selectedOfficer?.name}</p>
                  <p><strong>Service No:</strong> {selectedOfficer?.serviceNo}</p>
                  <p><strong>Patrol Team:</strong> {selectedOfficer?.patrolTeam?.name}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-2">Squad Information</h3>
                <p><strong>Squad Name:</strong> {formData.squadName}</p>
              </div>

              {/* Selected Items */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Items to be Issued</h3>
                {formData.weapons.length === 0 ? (
                  <p className="text-gray-500">No items selected</p>
                ) : (
                  <div className="border rounded-lg">
                    <div className="grid grid-cols-12 gap-4 p-3 bg-gray-50 border-b font-medium text-sm text-gray-700">
                      <div className="col-span-5">Weapon</div>
                      <div className="col-span-3">Serial Number</div>
                      <div className="col-span-2">Condition</div>
                      <div className="col-span-2 text-right">Quantity</div>
                    </div>
                    {formData.weapons.map((weaponItem) => {
                      const weapon = selectedArmory.weapons.find(w => w._id === weaponItem.weaponId);
                      return (
                        <div key={weaponItem.weaponId} className="grid grid-cols-12 gap-4 p-3 border-b last:border-b-0">
                          <div className="col-span-5 font-medium">{weapon?.weaponType}</div>
                          <div className="col-span-3 text-gray-600">{weapon?.serialNumber}</div>
                          <div className="col-span-2">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              weapon?.condition === 'Excellent' ? 'bg-green-100 text-green-800' :
                              weapon?.condition === 'Good' ? 'bg-blue-100 text-blue-800' :
                              weapon?.condition === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
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
                    <div className="p-3 bg-gray-50 border-t">
                      <div className="flex justify-between items-center font-semibold">
                        <span>Total Items:</span>
                        <span>{calculateTotalItems()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks (Optional)
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any additional notes or remarks about this distribution..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                ← Back to Items
              </button>
              <div className="space-x-3">
                <button
                  onClick={() => router.back()}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitDistribution}
                  disabled={loading || !validateDistribution()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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