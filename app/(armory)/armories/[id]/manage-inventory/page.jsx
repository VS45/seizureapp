'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUser } from '@/lib/auth-client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Shield, 
  Package, 
  Wrench,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Key,
  Building,
  MapPin,
  Users
} from 'lucide-react';

export default function ManageArmoryInventoryPage() {
  const { user, loading: authLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const armoryId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [armory, setArmory] = useState(null);
  const [sectionsOpen, setSectionsOpen] = useState({
    weapons: true,
    ammunition: true,
    equipment: true
  });

  // State for new items to be added
  const [newWeapons, setNewWeapons] = useState([]);
  const [newAmmunition, setNewAmmunition] = useState([]);
  const [newEquipment, setNewEquipment] = useState([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && armoryId) {
      fetchArmory();
    }
  }, [user, armoryId]);

  const fetchArmory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/armories/${armoryId}`);
      console.log("armory ID: ",armoryId)
      if (response.ok) {
        const data = await response.json();
         console.log("armory Data: ",data.armory)
        setArmory(data.armory);
       /*   if (response.ok) {
        const data = await response.json();
        setArmory(data);
      } */
      } else {
        console.error('Failed to fetch armory');
        router.push('/armories');
      }
    } catch (error) {
      console.error('Error fetching armory:', error);
      router.push('/armories');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setSectionsOpen(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Weapons Management
  const addNewWeapon = () => {
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
    setNewWeapons(prev => [...prev, newWeapon]);
  };

  const updateNewWeapon = (index, field, value) => {
    setNewWeapons(prev => 
      prev.map((weapon, i) => 
        i === index ? { ...weapon, [field]: value } : weapon
      )
    );
  };

  const removeNewWeapon = (index) => {
    setNewWeapons(prev => prev.filter((_, i) => i !== index));
  };

  // Ammunition Management
  const addNewAmmunition = () => {
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
    setNewAmmunition(prev => [...prev, newAmmo]);
  };

  const updateNewAmmunition = (index, field, value) => {
    setNewAmmunition(prev => 
      prev.map((ammo, i) => 
        i === index ? { ...ammo, [field]: value } : ammo
      )
    );
  };

  const removeNewAmmunition = (index) => {
    setNewAmmunition(prev => prev.filter((_, i) => i !== index));
  };

  // Equipment Management
  const addNewEquipment = () => {
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
    setNewEquipment(prev => [...prev, newEquipment]);
  };

  const updateNewEquipment = (index, field, value) => {
    setNewEquipment(prev => 
      prev.map((equip, i) => 
        i === index ? { ...equip, [field]: value } : equip
      )
    );
  };

  const removeNewEquipment = (index) => {
    setNewEquipment(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const hasInvalidWeapon = newWeapons.some(weapon => !weapon.weaponType || !weapon.serialNumber);
    const hasInvalidAmmo = newAmmunition.some(ammo => !ammo.caliber || !ammo.type || ammo.quantity <= 0);
    const hasInvalidEquipment = newEquipment.some(equip => !equip.name || !equip.type || equip.quantity <= 0);

    if (hasInvalidWeapon || hasInvalidAmmo || hasInvalidEquipment) {
      alert('Please fill in all required fields with valid values');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        weapons: newWeapons,
        ammunition: newAmmunition,
        equipment: newEquipment
      };

      const response = await fetch(`/api/armories/${armoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        alert('Inventory items added successfully!');
        router.push(`/armories/${armoryId}`);
      } else {
        const error = await response.json();
        alert(`Failed to update inventory: ${error.error}`);
      }
    } catch (error) {
      console.error('Inventory update failed:', error);
      alert('Failed to update inventory');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-800 font-semibold">Loading Armory Data...</p>
        </div>
      </div>
    );
  }

  if (!armory) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Armory Not Found</h2>
        <p className="text-gray-600 mb-6">The armory you're looking for doesn't exist.</p>
        <button
          onClick={() => router.push('/armories')}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
        >
          Back to Armories
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Armory Inventory</h1>
            <p className="text-gray-600 mt-2">
              Add new weapons, ammunition, and equipment to {armory.armoryName}
            </p>
          </div>
        </div>
      </div>

      {/* Armory Summary */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Armory Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <Shield className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Weapons</p>
              <p className="text-2xl font-bold text-gray-900">{armory.weapons?.length || 0}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <Crosshair className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Ammunition</p>
              <p className="text-2xl font-bold text-gray-900">{armory.ammunition?.length || 0}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
            <Wrench className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Equipment</p>
              <p className="text-2xl font-bold text-gray-900">{armory.equipment?.length || 0}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Building className="w-8 h-8 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Location</p>
              <p className="text-sm font-bold text-gray-900 truncate">{armory.location || 'Not specified'}</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* New Weapons Section */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <button
                type="button"
                onClick={() => toggleSection('weapons')}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-green-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Add New Weapons</h2>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                    {newWeapons.length} new items
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
                  {newWeapons.map((weapon, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="border-2 border-dashed border-green-200 rounded-lg p-4 bg-green-50"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">New Weapon #{index + 1}</h3>
                        <button
                          type="button"
                          onClick={() => removeNewWeapon(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Weapon Type *
                          </label>
                          <input
                            type="text"
                            value={weapon.weaponType}
                            onChange={(e) => updateNewWeapon(index, 'weaponType', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="e.g., Rifle, Pistol"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Serial Number *
                          </label>
                          <input
                            type="text"
                            value={weapon.serialNumber}
                            onChange={(e) => updateNewWeapon(index, 'serialNumber', e.target.value)}
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
                            onChange={(e) => updateNewWeapon(index, 'model', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="Model name/number"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Caliber</label>
                          <input
                            type="text"
                            value={weapon.caliber}
                            onChange={(e) => updateNewWeapon(index, 'caliber', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="e.g., 5.56mm, 9mm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                          <select
                            value={weapon.condition}
                            onChange={(e) => updateNewWeapon(index, 'condition', e.target.value)}
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
                            value={weapon.status}
                            onChange={(e) => updateNewWeapon(index, 'status', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          >
                            <option value="available">Available</option>
                            <option value="reserved">Reserved</option>
                            <option value="maintenance">In Maintenance</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                          <input
                            type="number"
                            value={weapon.quantity}
                            onChange={(e) => updateNewWeapon(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            min="1"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Available Quantity</label>
                          <input
                            type="number"
                            value={weapon.availableQuantity}
                            onChange={(e) => updateNewWeapon(index, 'availableQuantity', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            min="0"
                            max={weapon.quantity}
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <textarea
                            value={weapon.notes}
                            onChange={(e) => updateNewWeapon(index, 'notes', e.target.value)}
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
                    onClick={addNewWeapon}
                    className="w-full py-3 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-5 h-5 text-green-600" />
                    <span className="text-green-600 font-medium">Add New Weapon</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* New Ammunition Section */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <button
                type="button"
                onClick={() => toggleSection('ammunition')}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center space-x-3">
                  <Crosshair className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Add New Ammunition</h2>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                    {newAmmunition.length} new items
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
                  {newAmmunition.map((ammo, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="border-2 border-dashed border-blue-200 rounded-lg p-4 bg-blue-50"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">New Ammunition #{index + 1}</h3>
                        <button
                          type="button"
                          onClick={() => removeNewAmmunition(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Caliber *
                          </label>
                          <input
                            type="text"
                            value={ammo.caliber}
                            onChange={(e) => updateNewAmmunition(index, 'caliber', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 5.56mm, 9mm"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type *
                          </label>
                          <input
                            type="text"
                            value={ammo.type}
                            onChange={(e) => updateNewAmmunition(index, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., Ball, Tracer, Hollow Point"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Lot Number</label>
                          <input
                            type="text"
                            value={ammo.lotNumber}
                            onChange={(e) => updateNewAmmunition(index, 'lotNumber', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Manufacturer lot number"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity *
                          </label>
                          <input
                            type="number"
                            value={ammo.quantity}
                            onChange={(e) => updateNewAmmunition(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            min="1"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Available Quantity</label>
                          <input
                            type="number"
                            value={ammo.availableQuantity}
                            onChange={(e) => updateNewAmmunition(index, 'availableQuantity', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            min="0"
                            max={ammo.quantity}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                          <select
                            value={ammo.unit}
                            onChange={(e) => updateNewAmmunition(index, 'unit', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                            onChange={(e) => updateNewAmmunition(index, 'expiryDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                          <select
                            value={ammo.condition}
                            onChange={(e) => updateNewAmmunition(index, 'condition', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                            <option value="poor">Poor</option>
                            <option value="expired">Expired</option>
                          </select>
                        </div>

                        <div className="md:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <textarea
                            value={ammo.notes}
                            onChange={(e) => updateNewAmmunition(index, 'notes', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Additional notes or remarks"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  <button
                    type="button"
                    onClick={addNewAmmunition}
                    className="w-full py-3 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-600 font-medium">Add New Ammunition</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* New Equipment Section */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b">
              <button
                type="button"
                onClick={() => toggleSection('equipment')}
                className="flex items-center justify-between w-full text-left"
              >
                <div className="flex items-center space-x-3">
                  <Wrench className="w-5 h-5 text-purple-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Add New Equipment</h2>
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm">
                    {newEquipment.length} new items
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
                  {newEquipment.map((equip, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="border-2 border-dashed border-purple-200 rounded-lg p-4 bg-purple-50"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">New Equipment #{index + 1}</h3>
                        <button
                          type="button"
                          onClick={() => removeNewEquipment(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name *
                          </label>
                          <input
                            type="text"
                            value={equip.name}
                            onChange={(e) => updateNewEquipment(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="e.g., Helmet, Vest, Radio"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type *
                          </label>
                          <input
                            type="text"
                            value={equip.type}
                            onChange={(e) => updateNewEquipment(index, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="e.g., Protective Gear, Communication"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                          <input
                            type="text"
                            value={equip.serialNumber}
                            onChange={(e) => updateNewEquipment(index, 'serialNumber', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="Unique serial number"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity *
                          </label>
                          <input
                            type="number"
                            value={equip.quantity}
                            onChange={(e) => updateNewEquipment(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            min="1"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Available Quantity</label>
                          <input
                            type="number"
                            value={equip.availableQuantity}
                            onChange={(e) => updateNewEquipment(index, 'availableQuantity', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            min="0"
                            max={equip.quantity}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                          <select
                            value={equip.condition}
                            onChange={(e) => updateNewEquipment(index, 'condition', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
                            onChange={(e) => updateNewEquipment(index, 'status', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="available">Available</option>
                            <option value="issued">Issued</option>
                            <option value="maintenance">In Maintenance</option>
                          </select>
                        </div>

                        <div className="md:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <textarea
                            value={equip.notes}
                            onChange={(e) => updateNewEquipment(index, 'notes', e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="Additional notes or remarks"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  <button
                    type="button"
                    onClick={addNewEquipment}
                    className="w-full py-3 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-5 h-5 text-purple-600" />
                    <span className="text-purple-600 font-medium">Add New Equipment</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Submit Button */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ready to Add Items</h3>
                <p className="text-gray-600">
                  Total new items: {newWeapons.length + newAmmunition.length + newEquipment.length}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => router.push(`/armories/${armoryId}`)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || (newWeapons.length === 0 && newAmmunition.length === 0 && newEquipment.length === 0)}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Adding Items...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Add Inventory Items</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}