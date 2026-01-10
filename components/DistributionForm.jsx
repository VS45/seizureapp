'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Package, Search, Plus, Minus } from 'lucide-react';

export default function DistributionForm({ distribution, onSubmit, isEditing = false }) {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [armories, setArmories] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [selectedArmory, setSelectedArmory] = useState(null);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  
  const [formData, setFormData] = useState({
    armoryId: '',
    officerId: '',
    squadName: '',
    weapons: [],
    ammunition: [],
    equipment: [],
    remarks: ''
  });

  // Initialize form with distribution data if editing
  useEffect(() => {
    if (isEditing && distribution) {
      setFormData({
        armoryId: distribution.armory?._id || distribution.armoryId || '',
        officerId: distribution.officer?._id || distribution.officerId || '',
        squadName: distribution.squadName || '',
        weapons: distribution.weapons || [],
        ammunition: distribution.ammunition || [],
        equipment: distribution.equipment || [],
        remarks: distribution.remarks || ''
      });
      
      // If we have armory and officer data, set them directly
      if (distribution.armory) {
        setSelectedArmory(distribution.armory);
        setStep(3); // Skip to items selection
      }
      if (distribution.officer) {
        setSelectedOfficer(distribution.officer);
      }
    }
  }, [isEditing, distribution]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [armoriesRes, officersRes] = await Promise.all([
        fetch('/api/armories'),
        fetch('/api/officers')
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
      const response = await fetch(`/api/armories/${armoryId}`);
      if (response.ok) {
        const armory = await response.json();
        setSelectedArmory(armory);
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
    if (!selectedArmory?.weapons) return;

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
        weapons: [...prev.weapons, { 
          weaponId, 
          quantity,
          weaponType: weapon.weaponType,
          serialNumber: weapon.serialNumber,
          condition: weapon.condition
        }]
      }));
    }
  };

  const updateWeaponQuantity = (weaponId, newQuantity) => {
    if (!selectedArmory?.weapons) return;

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

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateDistribution()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission failed:', error);
      alert('Failed to submit distribution');
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
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Distribution' : 'Create Distribution'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEditing 
              ? 'Update weapon and equipment distribution details'
              : 'Create a new distribution to issue weapons and equipment to officers'
            }
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

        <form onSubmit={handleFormSubmit}>
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
                    type="button"
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
                    type="button"
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
                type="button"
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
                {!selectedArmory?.weapons || selectedArmory.weapons.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No weapons available</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedArmory.weapons.filter(w => w.availableQuantity > 0).map((weapon) => (
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
                              type="button"
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
                              type="button"
                              onClick={() => addWeaponToDistribution(weapon._id, 1)}
                              className="w-8 h-8 rounded border flex items-center justify-center hover:bg-gray-50"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <button
                            type="button"
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
                      const weapon = selectedArmory?.weapons?.find(w => w._id === weaponItem.weaponId);
                      return (
                        <div key={weaponItem.weaponId} className="flex justify-between items-center">
                          <span>
                            {weapon?.weaponType} (SN: {weapon?.serialNumber}) × {weaponItem.quantity}
                          </span>
                          <button
                            type="button"
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

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  ← Back to Officers
                </button>
                <button
                  type="submit"
                  disabled={loading || formData.weapons.length === 0 || !formData.squadName}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{isEditing ? 'Updating...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{isEditing ? 'Update Distribution' : 'Create Distribution'}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </form>
      </div>
    </div>
  );
}