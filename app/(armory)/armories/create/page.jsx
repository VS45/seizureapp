'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/auth-client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Shield, 
  Package, 
  Wrench,  // Changed from Tool to Wrench
  ChevronDown,
  ChevronUp,
  Building,
  MapPin,
  Users,
  Key,
  MessageSquare
} from 'lucide-react';

export default function CreateArmoryPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState({
    weapons: true,
    ammunition: true,
    equipment: true,
    access: true
  });
  const [formData, setFormData] = useState({
    armoryName: '',
    armoryCode: '',
    office: '',
    location: '',
    unit: '',
    status: 'active',
    weapons: [],
    ammunition: [],
    equipment: [],
    accessCodes: '',
    comments: ''
  });

  // Initialize with empty items
  useEffect(() => {
    if (!authLoading && user) {
      // Generate reference ID
      const referenceID = `ARM-${Date.now()}`;
      setFormData(prev => ({ ...prev, referenceID }));
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  const toggleSection = (section) => {
    setSectionsOpen(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Weapon Management
  const addWeapon = () => {
    const newWeapon = {
      weaponType: '',
      serialNumber: '',
      model: '',
      caliber: '',
      condition: 'serviceable',
      status: 'available',
      quantity: 1,
      availableQuantity: 1,
      location: '',
      notes: '',
      lastMaintenance: '',
      nextMaintenance: ''
    };
    setFormData(prev => ({
      ...prev,
      weapons: [...prev.weapons, newWeapon]
    }));
  };

  const updateWeapon = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      weapons: prev.weapons.map((weapon, i) => 
        i === index ? { ...weapon, [field]: value } : weapon
      )
    }));
  };

  const removeWeapon = (index) => {
    setFormData(prev => ({
      ...prev,
      weapons: prev.weapons.filter((_, i) => i !== index)
    }));
  };

  // Ammunition Management
  const addAmmunition = () => {
    const newAmmo = {
      caliber: '',
      type: '',
      lotNumber: '',
      quantity: 0,
      availableQuantity: 0,
      unit: 'rounds',
      expiryDate: '',
      condition: 'good',
      location: '',
      notes: ''
    };
    setFormData(prev => ({
      ...prev,
      ammunition: [...prev.ammunition, newAmmo]
    }));
  };

  const updateAmmunition = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      ammunition: prev.ammunition.map((ammo, i) => 
        i === index ? { ...ammo, [field]: value } : ammo
      )
    }));
  };

  const removeAmmunition = (index) => {
    setFormData(prev => ({
      ...prev,
      ammunition: prev.ammunition.filter((_, i) => i !== index)
    }));
  };

  // Equipment Management
  const addEquipment = () => {
    const newEquipment = {
      name: '',
      type: '',
      serialNumber: '',
      quantity: 1,
      availableQuantity: 1,
      condition: 'serviceable',
      status: 'available',
      location: '',
      notes: ''
    };
    setFormData(prev => ({
      ...prev,
      equipment: [...prev.equipment, newEquipment]
    }));
  };

  const updateEquipment = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.map((equip, i) => 
        i === index ? { ...equip, [field]: value } : equip
      )
    }));
  };

  const removeEquipment = (index) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.filter((_, i) => i !== index)
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.armoryName || !formData.armoryCode) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Prepare data for submission
      const submissionData = {
        ...formData,
        referenceID: formData.referenceID || `ARM-${Date.now()}`,
        accessCodes: formData.accessCodes 
          ? formData.accessCodes.split(',').map(code => code.trim()).filter(code => code)
          : [],
        comments: formData.comments ? [{
          text: formData.comments,
          createdBy: user.id,
          createdAt: new Date().toISOString()
        }] : [],
        createdBy: user.id
      };

      const response = await fetch('/api/armories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });

      if (response.ok) {
        const result = await response.json();
        alert('Armory created successfully!');
        router.push(`/armories/${result.armory._id}`);
      } else {
        const error = await response.json();
        alert(`Failed to create armory: ${error.error}`);
      }
    } catch (error) {
      console.error('Armory creation failed:', error);
      alert('Failed to create armory');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Armory</h1>
          <p className="text-gray-600 mt-2">
            Set up a complete armory with weapons, ammunition, and equipment
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Armory Name *
                </label>
                <input
                  type="text"
                  name="armoryName"
                  value={formData.armoryName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter armory name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Armory Code *
                </label>
                <input
                  type="text"
                  name="armoryCode"
                  value={formData.armoryCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., ARM-001"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference ID
                </label>
                <input
                  type="text"
                  value={formData.referenceID || `ARM-${Date.now()}`}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-generated unique identifier</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Office
                </label>
                <input
                  type="text"
                  name="office"
                  value={formData.office}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Associated office"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Building, room, or specific location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit
                </label>
                <input
                  type="text"
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Unit designation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Under Maintenance</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Weapons Section */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <button
                type="button"
                onClick={() => toggleSection('weapons')}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-green-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Weapons Inventory</h2>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                    {formData.weapons.length} items
                  </span>
                </div>
                {sectionsOpen.weapons ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            <AnimatePresence>
              {sectionsOpen.weapons && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-6 space-y-4"
                >
                  {formData.weapons.map((weapon, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Weapon #{index + 1}</h3>
                        <button
                          type="button"
                          onClick={() => removeWeapon(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Weapon Type *</label>
                          <input
                            type="text"
                            value={weapon.weaponType}
                            onChange={(e) => updateWeapon(index, 'weaponType', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="e.g., Rifle, Pistol"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number *</label>
                          <input
                            type="text"
                            value={weapon.serialNumber}
                            onChange={(e) => updateWeapon(index, 'serialNumber', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="Unique serial number"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                          <input
                            type="text"
                            value={weapon.model}
                            onChange={(e) => updateWeapon(index, 'model', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="Model name/number"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Caliber</label>
                          <input
                            type="text"
                            value={weapon.caliber}
                            onChange={(e) => updateWeapon(index, 'caliber', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="e.g., 5.56mm, 9mm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                          <select
                            value={weapon.condition}
                            onChange={(e) => updateWeapon(index, 'condition', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          >
                            <option value="serviceable">Serviceable</option>
                            <option value="unserviceable">Unserviceable</option>
                            <option value="maintenance">Needs Maintenance</option>
                            <option value="repair">Under Repair</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <select
                            value={weapon.status}
                            onChange={(e) => updateWeapon(index, 'status', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          >
                            <option value="available">Available</option>
                            <option value="issued">Issued</option>
                            <option value="maintenance">In Maintenance</option>
                            <option value="reserved">Reserved</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                          <input
                            type="number"
                            value={weapon.quantity}
                            onChange={(e) => updateWeapon(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            min="1"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Available Quantity</label>
                          <input
                            type="number"
                            value={weapon.availableQuantity}
                            onChange={(e) => updateWeapon(index, 'availableQuantity', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            min="0"
                            max={weapon.quantity}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                          <input
                            type="text"
                            value={weapon.location}
                            onChange={(e) => updateWeapon(index, 'location', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="Specific location in armory"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <textarea
                            value={weapon.notes}
                            onChange={(e) => updateWeapon(index, 'notes', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="Additional notes or remarks"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  <button
                    type="button"
                    onClick={addWeapon}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-5 h-5 text-green-600" />
                    <span className="text-green-600 font-medium">Add Weapon</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Ammunition Section */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <button
                type="button"
                onClick={() => toggleSection('ammunition')}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center space-x-3">
                  <Package className="w-5 h-5 text-green-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Ammunition Inventory</h2>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                    {formData.ammunition.length} items
                  </span>
                </div>
                {sectionsOpen.ammunition ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            <AnimatePresence>
              {sectionsOpen.ammunition && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-6 space-y-4"
                >
                  {formData.ammunition.map((ammo, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Ammunition #{index + 1}</h3>
                        <button
                          type="button"
                          onClick={() => removeAmmunition(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Caliber *</label>
                          <input
                            type="text"
                            value={ammo.caliber}
                            onChange={(e) => updateAmmunition(index, 'caliber', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="e.g., 5.56mm, 9mm"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                          <input
                            type="text"
                            value={ammo.type}
                            onChange={(e) => updateAmmunition(index, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="e.g., Ball, Tracer, Hollow Point"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Lot Number</label>
                          <input
                            type="text"
                            value={ammo.lotNumber}
                            onChange={(e) => updateAmmunition(index, 'lotNumber', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="Manufacturer lot number"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                          <input
                            type="number"
                            value={ammo.quantity}
                            onChange={(e) => updateAmmunition(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            min="0"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Available Quantity</label>
                          <input
                            type="number"
                            value={ammo.availableQuantity}
                            onChange={(e) => updateAmmunition(index, 'availableQuantity', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            min="0"
                            max={ammo.quantity}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                          <select
                            value={ammo.unit}
                            onChange={(e) => updateAmmunition(index, 'unit', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          >
                            <option value="rounds">Rounds</option>
                            <option value="boxes">Boxes</option>
                            <option value="cases">Cases</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                          <input
                            type="date"
                            value={ammo.expiryDate}
                            onChange={(e) => updateAmmunition(index, 'expiryDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                          <select
                            value={ammo.condition}
                            onChange={(e) => updateAmmunition(index, 'condition', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          >
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                            <option value="poor">Poor</option>
                            <option value="expired">Expired</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                          <input
                            type="text"
                            value={ammo.location}
                            onChange={(e) => updateAmmunition(index, 'location', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="Storage location"
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <textarea
                            value={ammo.notes}
                            onChange={(e) => updateAmmunition(index, 'notes', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="Additional notes or remarks"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  <button
                    type="button"
                    onClick={addAmmunition}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-5 h-5 text-green-600" />
                    <span className="text-green-600 font-medium">Add Ammunition</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Equipment Section */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <button
                type="button"
                onClick={() => toggleSection('equipment')}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center space-x-3">
                  <Wrench className="w-5 h-5 text-green-600" /> {/* Changed from Tool to Wrench */}
                  <h2 className="text-xl font-semibold text-gray-900">Equipment Inventory</h2>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                    {formData.equipment.length} items
                  </span>
                </div>
                {sectionsOpen.equipment ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            <AnimatePresence>
              {sectionsOpen.equipment && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-6 space-y-4"
                >
                  {formData.equipment.map((equip, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Equipment #{index + 1}</h3>
                        <button
                          type="button"
                          onClick={() => removeEquipment(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                          <input
                            type="text"
                            value={equip.name}
                            onChange={(e) => updateEquipment(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="e.g., Helmet, Vest, Radio"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                          <input
                            type="text"
                            value={equip.type}
                            onChange={(e) => updateEquipment(index, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="e.g., Protective Gear, Communication"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                          <input
                            type="text"
                            value={equip.serialNumber}
                            onChange={(e) => updateEquipment(index, 'serialNumber', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="Unique serial number"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                          <input
                            type="number"
                            value={equip.quantity}
                            onChange={(e) => updateEquipment(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            min="1"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Available Quantity</label>
                          <input
                            type="number"
                            value={equip.availableQuantity}
                            onChange={(e) => updateEquipment(index, 'availableQuantity', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            min="0"
                            max={equip.quantity}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                          <select
                            value={equip.condition}
                            onChange={(e) => updateEquipment(index, 'condition', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          >
                            <option value="serviceable">Serviceable</option>
                            <option value="unserviceable">Unserviceable</option>
                            <option value="maintenance">Needs Maintenance</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <select
                            value={equip.status}
                            onChange={(e) => updateEquipment(index, 'status', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          >
                            <option value="available">Available</option>
                            <option value="issued">Issued</option>
                            <option value="maintenance">In Maintenance</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                          <input
                            type="text"
                            value={equip.location}
                            onChange={(e) => updateEquipment(index, 'location', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="Storage location"
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <textarea
                            value={equip.notes}
                            onChange={(e) => updateEquipment(index, 'notes', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="Additional notes or remarks"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  <button
                    type="button"
                    onClick={addEquipment}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-5 h-5 text-green-600" />
                    <span className="text-green-600 font-medium">Add Equipment</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Access Codes & Comments */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <button
                type="button"
                onClick={() => toggleSection('access')}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center space-x-3">
                  <Key className="w-5 h-5 text-green-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Access & Comments</h2>
                </div>
                {sectionsOpen.access ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>

            <AnimatePresence>
              {sectionsOpen.access && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-6 space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Access Codes
                    </label>
                    <input
                      type="text"
                      name="accessCodes"
                      value={formData.accessCodes}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter codes separated by commas (e.g., 1234, 5678)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Separate multiple access codes with commas
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Initial Comments
                    </label>
                    <textarea
                      name="comments"
                      value={formData.comments}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter any initial comments or notes about this armory..."
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Submit Button */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Armory...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Create Armory</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}