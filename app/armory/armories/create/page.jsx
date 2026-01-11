'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Key,
  Building
} from 'lucide-react';

export default function CreateArmoryPage() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [offices, setOffices] = useState([]);
  const [officesLoading, setOfficesLoading] = useState(true);
  const [officesError, setOfficesError] = useState('');
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
    officeId: '',
    location: '',
    unit: '',
    status: 'active',
    weapons: [],
    ammunition: [],
    equipment: [],
    accessCodes: '',
    comments: ''
  });

  const router = useRouter();

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        router.push('/login');
        return;
      }

      const userData = await response.json();
      setUser(userData.user);

      // Check if user has required role (only admin and armourer can create armories)
      const allowedRoles = ['admin', 'armourer'];
      if (!allowedRoles.includes(userData.user.role)) {
        setError('You do not have permission to create armories. Only administrators and armourers can create new armories.');
        setAuthLoading(false);

        setTimeout(() => {
          router.push('/unauthorized');
        }, 2000);
        return;
      }

      // Generate reference ID only for authorized users
      const referenceID = `ARM-${Date.now()}`;
      setFormData(prev => ({ ...prev, referenceID }));
      
      setAuthLoading(false);
    } catch (error) {
      console.error('Error fetching user:', error);
      setError('Authentication error. Please login again.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  };

  const fetchOffices = async () => {
    try {
      setOfficesLoading(true);
      const response = await fetch('/api/offices');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch offices: ${response.status}`);
      }
      
      const officesData = await response.json();
      setOffices(officesData);
    } catch (error) {
      console.error('Error fetching offices:', error);
      setOfficesError('Failed to load offices. Please try again.');
    } finally {
      setOfficesLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      fetchOffices();
    }
  }, [authLoading, user]);

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
    console.log(`Input changed: ${name} = ${value}`);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOfficeChange = (e) => {
    const selectedOfficeId = e.target.value;
    const selectedOffice = offices.find(office => office._id === selectedOfficeId);
    
    setFormData(prev => ({
      ...prev,
      officeId: selectedOfficeId,
      office: selectedOffice ? selectedOffice.name : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting form data:', formData);
    // Validate required fields
    if (!formData.armoryName || !formData.armoryCode) {
      alert('Please fill in all required fields: Armory Name and Armory Code');
      return;
    }
if (!formData.unit) {
      alert('Please fill in all required fields: Unit');
      return;
    }
    if (!formData.officeId) {
      alert('Please select an office for the armory');
      return;
    }

    setLoading(true);
    try {
      // Prepare data for submission
      const selectedOffice = offices.find(office => office._id === formData.officeId);
      
      const submissionData = {
        ...formData,
        referenceID: formData.referenceID || `ARM-${Date.now()}`,
        office: selectedOffice ? {
          _id: selectedOffice._id,
          name: selectedOffice.name,
          code: selectedOffice.code
        } : null,
        accessCodes: formData.accessCodes 
          ? formData.accessCodes.split(',').map(code => code.trim()).filter(code => code)
          : [],
        comments: formData.comments ? [{
          text: formData.comments,
          createdBy: user._id,
          createdByName: user.name,
          createdAt: new Date().toISOString()
        }] : [],
        createdBy: user._id,
        createdByName: user.name
      };

      // Remove officeId from submission as it's not needed in the backend
      delete submissionData.officeId;

      const response = await fetch('/api/armory/armories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
      });

      if (response.ok) {
        const result = await response.json();
        alert('Armory created successfully!');
        console.log('Created armory:', result);
        router.push(`/armory/armories`);
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with User Role Badge */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Create New Armory</h1>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                user.role === 'admin' ? 'bg-red-100 text-red-800 border-red-200' :
                user.role === 'armourer' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                'bg-green-100 text-green-800 border-green-200'
              }`}>
                {user.role.toUpperCase()}
              </div>
            </div>
            <p className="text-gray-600">
              Set up a complete armory with weapons, ammunition, and equipment
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Creating as: {user.name} ({user.unit || 'Main Armory'})
            </p>
          </div>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  Office *
                </label>
                <div className="relative">
                  <select
                    name="officeId"
                    value={formData.officeId}
                    onChange={handleOfficeChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                    required
                  >
                    <option value="">Select an office</option>
                    {officesLoading ? (
                      <option value="" disabled>Loading offices...</option>
                    ) : officesError ? (
                      <option value="" disabled>Error loading offices</option>
                    ) : offices.length === 0 ? (
                      <option value="" disabled>No offices available</option>
                    ) : (
                      offices.map((office) => (
                        <option key={office._id} value={office._id}>
                          {office.name} ({office.code})
                        </option>
                      ))
                    )}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
                {officesError && (
                  <p className="text-xs text-red-600 mt-1">{officesError}</p>
                )}
                {formData.officeId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {offices.find(o => o._id === formData.officeId)?.name}
                  </p>
                )}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Building, room, or specific location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit
                </label>
                <select
                         name="unit"
                          value={formData.unit}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Unit</option>
                            <option value="FOU">FOU</option>
                            <option value="Custom Police">Custom Police</option>
                            <option value="Enforcement">Enforcement</option>
                            <option value="Special Operations">Special Operations</option>
                            <option value="Special Task Force">Special Task Force</option>
                          </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Weapons Inventory</h2>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Model name/number"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Caliber</label>
                          <input
                            type="text"
                            value={weapon.caliber}
                            onChange={(e) => updateWeapon(index, 'caliber', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g., 5.56mm, 9mm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                          <select
                            value={weapon.condition}
                            onChange={(e) => updateWeapon(index, 'condition', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="available">Available</option>
                            <option value="issued">Issued</option>
                            <option value="maintenance">Under Maintenance</option>
                            <option value="reserved">Reserved</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                          <input
                            type="number"
                            value={weapon.quantity}
                            onChange={(e) => updateWeapon(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            min="1"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Available Quantity</label>
                          <input
                            type="number"
                            value={weapon.availableQuantity}
                            onChange={(e) => updateWeapon(index, 'availableQuantity', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Specific location in armory"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <textarea
                            value={weapon.notes}
                            onChange={(e) => updateWeapon(index, 'notes', e.target.value)}
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
                    onClick={addWeapon}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-600 font-medium">Add Weapon</span>
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
                  <Package className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Ammunition Inventory</h2>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                            onChange={(e) => updateAmmunition(index, 'lotNumber', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Manufacturer lot number"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                          <input
                            type="number"
                            value={ammo.quantity}
                            onChange={(e) => updateAmmunition(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            min="0"
                            max={ammo.quantity}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                          <select
                            value={ammo.unit}
                            onChange={(e) => updateAmmunition(index, 'unit', e.target.value)}
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
                            onChange={(e) => updateAmmunition(index, 'expiryDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                          <select
                            value={ammo.condition}
                            onChange={(e) => updateAmmunition(index, 'condition', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Storage location"
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <textarea
                            value={ammo.notes}
                            onChange={(e) => updateAmmunition(index, 'notes', e.target.value)}
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
                    onClick={addAmmunition}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-600 font-medium">Add Ammunition</span>
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
                  <Wrench className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Equipment Inventory</h2>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Unique serial number"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                          <input
                            type="number"
                            value={equip.quantity}
                            onChange={(e) => updateEquipment(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            min="0"
                            max={equip.quantity}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                          <select
                            value={equip.condition}
                            onChange={(e) => updateEquipment(index, 'condition', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Storage location"
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <textarea
                            value={equip.notes}
                            onChange={(e) => updateEquipment(index, 'notes', e.target.value)}
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
                    onClick={addEquipment}
                    className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-5 h-5 text-blue-600" />
                    <span className="text-blue-600 font-medium">Add Equipment</span>
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
                  <Key className="w-5 h-5 text-blue-600" />
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                disabled={loading || officesLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
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