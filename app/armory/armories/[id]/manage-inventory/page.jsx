'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
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
  Building
} from 'lucide-react'

// Ammunition types constant
const AMMUNITION_TYPES = ['FMJ', 'HP', 'Tracer', 'AP', 'Frangible', 'Other'];

export default function ManageArmoryInventoryPage() {
  const router = useRouter()
  const params = useParams()
  const armoryId = params.id
  
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [armory, setArmory] = useState(null)
  const [sectionsOpen, setSectionsOpen] = useState({
    weapons: true,
    ammunition: true,
    equipment: true
  })

  // State for dropdown data
  const [weaponModels, setWeaponModels] = useState([])
  const [ammunitionData, setAmmunitionData] = useState({ 
    calibers: [], 
    types: [],
    ammunitionModels: [],
    groupedModels: {}
  })
  const [equipmentModels, setEquipmentModels] = useState([])
  
  // State for new items to be added
  const [newWeapons, setNewWeapons] = useState([])
  const [newAmmunition, setNewAmmunition] = useState([])
  const [newEquipment, setNewEquipment] = useState([])

  // State for ammunition selection
  const [manufacturerOptions, setManufacturerOptions] = useState({})
  const [descriptionMap, setDescriptionMap] = useState({})

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        router.push('/login')
        return
      }

      const userData = await response.json()
      setUser(userData.user)

      const allowedRoles = ['admin', 'armourer']
      if (!allowedRoles.includes(userData.user.role)) {
        setError('You do not have permission to manage armory inventory. Only administrators and armourers can add inventory items.')
        setAuthLoading(false)

        setTimeout(() => {
          router.push('/unauthorized')
        }, 2000)
        return
      }

      setAuthLoading(false)
    } catch (error) {
      console.error('Error fetching user:', error)
      setError('Authentication error. Please login again.')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
  }

  const fetchArmory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/armory/armories/${armoryId}`)
      if (response.ok) {
        const data = await response.json()
        setArmory(data.armory)
      } else {
        console.error('Failed to fetch armory')
        router.push('/armory/armories')
      }
    } catch (error) {
      console.error('Error fetching armory:', error)
      router.push('/armory/armories')
    } finally {
      setLoading(false)
    }
  }

  const fetchDropdownData = async () => {
    try {
      // Fetch weapon models
      const weaponResponse = await fetch('/api/armory/weapon-models')
      if (weaponResponse.ok) {
        const weaponData = await weaponResponse.json()
        setWeaponModels(weaponData.weaponModels || [])
      }

      // Fetch ammunition data with status=active
      const ammoResponse = await fetch('/api/armory/ammunition-models?status=active')
      if (ammoResponse.ok) {
        const ammoData = await ammoResponse.json()
        
        // Extract unique calibers and types
        const calibers = ammoData.calibers || Array.from(new Set(ammoData.ammunitionModels?.map(model => model.caliber) || []))
        const types = ammoData.types || Array.from(new Set(ammoData.ammunitionModels?.map(model => model.type) || []))
        
        // Build manufacturer options map
        const manufacturerMap = {}
        const descMap = {}
        
        if (ammoData.groupedModels) {
          Object.keys(ammoData.groupedModels).forEach(caliber => {
            ammoData.groupedModels[caliber].forEach(model => {
              if (!manufacturerMap[caliber]) {
                manufacturerMap[caliber] = []
              }
              if (!manufacturerMap[caliber].includes(model.manufacturer)) {
                manufacturerMap[caliber].push(model.manufacturer)
              }
              descMap[`${caliber}_${model.manufacturer}`] = model.description || ''
            })
          })
        } else {
          // Fallback: group by caliber and manufacturer
          ammoData.ammunitionModels?.forEach(model => {
            if (!manufacturerMap[model.caliber]) {
              manufacturerMap[model.caliber] = []
            }
            if (!manufacturerMap[model.caliber].includes(model.manufacturer)) {
              manufacturerMap[model.caliber].push(model.manufacturer)
            }
            descMap[`${model.caliber}_${model.manufacturer}`] = model.description || ''
          })
        }
        
        setAmmunitionData({
          calibers: calibers.sort(),
          types: types.sort(),
          ammunitionModels: ammoData.ammunitionModels || [],
          groupedModels: ammoData.groupedModels || {}
        })
        setManufacturerOptions(manufacturerMap)
        setDescriptionMap(descMap)
      }

      // Fetch equipment models
      const equipmentResponse = await fetch('/api/armory/equipment-models')
      if (equipmentResponse.ok) {
        const equipmentData = await equipmentResponse.json()
        setEquipmentModels(equipmentData.equipmentModels || [])
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error)
    }
  }

  const fetchAvailableQuantity = async (itemType, params) => {
    try {
      const queryParams = new URLSearchParams({
        armoryId,
        itemType,
        ...params
      }).toString()

      const response = await fetch(`/api/armory/available-quantity?${queryParams}`)
      if (response.ok) {
        const data = await response.json()
        return {
          availableQuantity: data.availableQuantity || 0,
          existingItem: data.existingItem || null
        }
      }
      return { availableQuantity: 0, existingItem: null }
    } catch (error) {
      console.error('Error fetching available quantity:', error)
      return { availableQuantity: 0, existingItem: null }
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    if (user && armoryId) {
      fetchArmory()
      fetchDropdownData()
    }
  }, [user, armoryId])

  const toggleSection = (section) => {
    setSectionsOpen(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Weapons Management
  const addNewWeapon = () => {
    const newWeapon = {
      weaponType: '',
      serialNumber: '',
      manufacturer: '',
      quantity: 1,
      condition: 'serviceable',
      acquisitionDate: new Date().toISOString().split('T')[0],
      notes: ''
    }
    setNewWeapons(prev => [...prev, newWeapon])
  }

  const updateNewWeapon = async (index, field, value) => {
    const updatedWeapons = [...newWeapons]
    updatedWeapons[index] = { ...updatedWeapons[index], [field]: value }
    
    if (field === 'weaponType' || field === 'manufacturer') {
      const weapon = updatedWeapons[index]
      if (weapon.weaponType && weapon.manufacturer) {
        const { availableQuantity, existingItem } = await fetchAvailableQuantity('weapon', {
          weaponType: weapon.weaponType,
          weaponModel: weapon.manufacturer
        })
        
        updatedWeapons[index] = {
          ...weapon,
          existingAvailable: availableQuantity,
          availableQuantity: weapon.quantity + availableQuantity,
          existingItem: existingItem
        }
      }
    }

    if (field === 'quantity') {
      const weapon = updatedWeapons[index]
      const existingAvailable = weapon.existingAvailable || 0
      updatedWeapons[index] = {
        ...weapon,
        quantity: parseInt(value) || 1,
        availableQuantity: (parseInt(value) || 1) + existingAvailable
      }
    }
    
    setNewWeapons([...updatedWeapons])
  }

  const removeNewWeapon = (index) => {
    setNewWeapons(prev => prev.filter((_, i) => i !== index))
  }

  // Ammunition Management
  const addNewAmmunition = () => {
    const newAmmo = {
      caliber: '',
      type: '',
      manufacturer: '',
      quantity: 0,
      unit: 'rounds',
      lotNumber: '',
      manufactureDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      description: ''
    }
    setNewAmmunition(prev => [...prev, newAmmo])
  }

  const updateNewAmmunition = async (index, field, value) => {
    const updatedAmmunition = [...newAmmunition]
    updatedAmmunition[index] = { ...updatedAmmunition[index], [field]: value }
    
    // If caliber changes, reset manufacturer and description
    if (field === 'caliber') {
      updatedAmmunition[index] = {
        ...updatedAmmunition[index],
        manufacturer: '',
        description: ''
      }
    }
    
    // If manufacturer changes, update description
    if (field === 'manufacturer') {
      const ammo = updatedAmmunition[index]
      const descriptionKey = `${ammo.caliber}_${value}`
      updatedAmmunition[index] = {
        ...ammo,
        description: descriptionMap[descriptionKey] || ''
      }
    }
    
    setNewAmmunition(updatedAmmunition)

    // If caliber, type, or manufacturer changes, fetch available quantity
    if (field === 'caliber' || field === 'type' || field === 'manufacturer') {
      const ammo = updatedAmmunition[index]
      if (ammo.caliber && ammo.type && ammo.manufacturer) {
        const { availableQuantity, existingItem } = await fetchAvailableQuantity('ammunition', {
          caliber: ammo.caliber,
          ammoType: ammo.type,
          manufacturer: ammo.manufacturer
        })
        
        updatedAmmunition[index] = {
          ...ammo,
          existingAvailable: availableQuantity,
          availableQuantity: ammo.quantity + availableQuantity,
          existingItem: existingItem
        }
        setNewAmmunition([...updatedAmmunition])
      }
    }

    // Update available quantity when quantity changes
    if (field === 'quantity') {
      const ammo = updatedAmmunition[index]
      const existingAvailable = ammo.existingAvailable || 0
      updatedAmmunition[index] = {
        ...ammo,
        quantity: parseInt(value) || 0,
        availableQuantity: (parseInt(value) || 0) + existingAvailable
      }
      setNewAmmunition([...updatedAmmunition])
    }
  }

  const removeNewAmmunition = (index) => {
    setNewAmmunition(prev => prev.filter((_, i) => i !== index))
  }

  // Equipment Management
  const addNewEquipment = () => {
    const newEquipmentItem = {
      itemType: '',
      size: '',
      quantity: 1,
      condition: 'serviceable',
      serialNumber: '',
      certificationDate: new Date().toISOString().split('T')[0],
      expiryDate: ''
    }
    setNewEquipment(prev => [...prev, newEquipmentItem])
  }

  const updateNewEquipment = async (index, field, value) => {
    const updatedEquipment = [...newEquipment]
    updatedEquipment[index] = { ...updatedEquipment[index], [field]: value }
    setNewEquipment(updatedEquipment)

    if (field === 'itemType') {
      const equip = updatedEquipment[index]
      if (equip.itemType) {
        const { availableQuantity, existingItem } = await fetchAvailableQuantity('equipment', {
          equipmentType: equip.itemType
        })
        
        updatedEquipment[index] = {
          ...equip,
          existingAvailable: availableQuantity,
          availableQuantity: equip.quantity + availableQuantity,
          existingItem: existingItem
        }
        setNewEquipment([...updatedEquipment])
      }
    }

    if (field === 'quantity') {
      const equip = updatedEquipment[index]
      const existingAvailable = equip.existingAvailable || 0
      updatedEquipment[index] = {
        ...equip,
        quantity: parseInt(value) || 1,
        availableQuantity: (parseInt(value) || 1) + existingAvailable
      }
      setNewEquipment([...updatedEquipment])
    }
  }

  const removeNewEquipment = (index) => {
    setNewEquipment(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (user && !['admin', 'armourer'].includes(user.role)) {
      alert('You do not have permission to manage inventory.')
      return
    }

    // Validate required fields
    const hasInvalidWeapon = newWeapons.some(weapon => !weapon.weaponType || !weapon.serialNumber || !weapon.manufacturer || weapon.quantity <= 0)
    const hasInvalidAmmo = newAmmunition.some(ammo => !ammo.caliber || !ammo.type || !ammo.manufacturer || ammo.quantity <= 0)
    const hasInvalidEquipment = newEquipment.some(equip => !equip.itemType || equip.quantity <= 0)

    if (hasInvalidWeapon || hasInvalidAmmo || hasInvalidEquipment) {
      alert('Please fill in all required fields with valid values')
      return
    }

    setSaving(true)
    try {
      const updateData = {
        weapons: newWeapons.map(w => ({
          weaponType: w.weaponType,
          serialNumber: w.serialNumber,
          manufacturer: w.manufacturer,
          quantity: w.quantity,
          condition: w.condition,
          acquisitionDate: w.acquisitionDate,
          notes: w.notes
        })),
        ammunition: newAmmunition.map(a => ({
          caliber: a.caliber,
          type: a.type,
          manufacturer: a.manufacturer,
          quantity: a.quantity,
          unit: a.unit,
          lotNumber: a.lotNumber,
          manufactureDate: a.manufactureDate,
          expiryDate: a.expiryDate,
          description: a.description
        })),
        equipment: newEquipment.map(e => ({
          itemType: e.itemType,
          size: e.size,
          quantity: e.quantity,
          condition: e.condition,
          serialNumber: e.serialNumber,
          certificationDate: e.certificationDate,
          expiryDate: e.expiryDate
        }))
      }

      const response = await fetch(`/api/armory/armories/${armoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        alert('Inventory items added successfully!')
        router.push(`/armory/armories/${armoryId}`)
      } else {
        const error = await response.json()
        alert(`Failed to update inventory: ${error.error}`)
      }
    } catch (error) {
      console.error('Inventory update failed:', error)
      alert('Failed to update inventory')
    } finally {
      setSaving(false)
    }
  }

  // Get manufacturer options for selected caliber
  const getManufacturerOptions = (caliber) => {
    return manufacturerOptions[caliber] || []
  }

  // Get available types for ammunition
  const getTypeOptions = () => {
    return ammunitionData.types.length > 0 ? ammunitionData.types : AMMUNITION_TYPES
  }

  // Show authentication loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-800 font-semibold">Verifying permissions...</p>
        </div>
      </div>
    )
  }

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
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded max-w-md">
            <p>Loading user data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-800 font-semibold">Loading Armory Data...</p>
        </div>
      </div>
    )
  }

  if (!armory) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Armory Not Found</h2>
        <p className="text-gray-600 mb-6">The armory you're looking for doesn't exist.</p>
        <button
          onClick={() => router.push('/armory/armories')}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
        >
          Back to Armories
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-4">
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
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">Manage Armory Inventory</h1>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                user.role === 'admin' ? 'bg-red-100 text-red-800 border-red-200' :
                'bg-blue-100 text-blue-800 border-blue-200'
              }`}>
                {user.role.toUpperCase()}
              </div>
            </div>
            <p className="text-gray-600 mt-2">
              Add new weapons, ammunition, and equipment to {armory.armoryName}
            </p>
          </div>
        </div>
      </div>

      {/* Armory Summary */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Armory Summary</h2>
          <div className="text-sm text-gray-500">
            <span className="font-medium">Managing as: </span>
            <span>{user.name} ({user.unit || 'Main Armory'})</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <Shield className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Weapons</p>
              <p className="text-2xl font-bold text-gray-900">{armory.totalWeapons || 0}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <Crosshair className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Ammunition</p>
              <p className="text-2xl font-bold text-gray-900">{armory.totalAmmunition || 0}</p>
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
                          <select
                            value={weapon.weaponType}
                            onChange={(e) => updateNewWeapon(index, 'weaponType', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            required
                          >
                            <option value="">Select Weapon Type</option>
                            {weaponModels.map((model, idx) => (
                              <option key={idx} value={model.weaponType || model.type}>{model.weaponType || model.type}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Model/Manufacturer *
                          </label>
                          <select
                            value={weapon.manufacturer}
                            onChange={(e) => updateNewWeapon(index, 'manufacturer', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            required
                            disabled={!weapon.weaponType}
                          >
                            <option value="">Select Model</option>
                            {weapon.weaponType && weaponModels
                              .filter(model => (model.weaponType || model.type) === weapon.weaponType)
                              .map((model, idx) => (
                                <option key={idx} value={model.manufacturer}>
                                  {model.manufacturer}
                                </option>
                              ))}
                          </select>
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
                          <label className="block text-sm font-medium text-gray-700 mb-1">Existing Available</label>
                          <input
                            type="text"
                            value={weapon.existingAvailable || 0}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Add *</label>
                          <input
                            type="number"
                            value={weapon.quantity}
                            onChange={(e) => updateNewWeapon(index, 'quantity', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            min="1"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Total Available Quantity</label>
                          <input
                            type="text"
                            value={weapon.availableQuantity || 0}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-green-50 font-semibold"
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
                            <option value="under_maintenance">Under Maintenance</option>
                            <option value="missing">Missing</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Acquisition Date</label>
                          <input
                            type="date"
                            value={weapon.acquisitionDate || ''}
                            onChange={(e) => updateNewWeapon(index, 'acquisitionDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <textarea
                            value={weapon.notes || ''}
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
                        {/* Caliber Dropdown */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Caliber *
                          </label>
                          <select
                            value={ammo.caliber}
                            onChange={(e) => updateNewAmmunition(index, 'caliber', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">Select Caliber</option>
                            {ammunitionData.calibers.map(caliber => (
                              <option key={caliber} value={caliber}>{caliber}</option>
                            ))}
                          </select>
                        </div>

                        {/* Type Dropdown */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type *
                          </label>
                          <select
                            value={ammo.type}
                            onChange={(e) => updateNewAmmunition(index, 'type', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">Select Type</option>
                            {getTypeOptions().map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>

                        {/* Manufacturer Dropdown */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Manufacturer *
                          </label>
                          <select
                            value={ammo.manufacturer}
                            onChange={(e) => updateNewAmmunition(index, 'manufacturer', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                            disabled={!ammo.caliber}
                          >
                            <option value="">Select Manufacturer</option>
                            {ammo.caliber && getManufacturerOptions(ammo.caliber).map(manufacturer => (
                              <option key={manufacturer} value={manufacturer}>
                                {manufacturer}
                              </option>
                            ))}
                          </select>
                          {ammo.caliber && getManufacturerOptions(ammo.caliber).length === 0 && (
                            <p className="text-xs text-red-500 mt-1">
                              No manufacturers found for this caliber
                            </p>
                          )}
                        </div>

                        {/* Lot Number */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Lot Number</label>
                          <input
                            type="text"
                            value={ammo.lotNumber || ''}
                            onChange={(e) => updateNewAmmunition(index, 'lotNumber', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Manufacturer lot number"
                          />
                        </div>

                        {/* Existing Available */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Existing Available</label>
                          <input
                            type="text"
                            value={ammo.existingAvailable || 0}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          />
                        </div>

                        {/* Quantity to Add */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity to Add *
                          </label>
                          <input
                            type="number"
                            value={ammo.quantity}
                            onChange={(e) => updateNewAmmunition(index, 'quantity', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            min="1"
                            required
                          />
                        </div>

                        {/* Total Available Quantity */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Total Available Quantity</label>
                          <input
                            type="text"
                            value={ammo.availableQuantity || 0}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-blue-50 font-semibold"
                          />
                        </div>

                        {/* Unit */}
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

                        {/* Manufacture Date */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Manufacture Date</label>
                          <input
                            type="date"
                            value={ammo.manufactureDate || ''}
                            onChange={(e) => updateNewAmmunition(index, 'manufactureDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Expiry Date */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                          <input
                            type="date"
                            value={ammo.expiryDate || ''}
                            onChange={(e) => updateNewAmmunition(index, 'expiryDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Description */}
                        <div className="md:col-span-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            value={ammo.description || ''}
                            readOnly
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                            placeholder="Description will auto-populate based on caliber and manufacturer selection"
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
                            Equipment Type *
                          </label>
                          <select
                            value={equip.itemType}
                            onChange={(e) => updateNewEquipment(index, 'itemType', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            required
                          >
                            <option value="">Select Equipment Type</option>
                            {equipmentModels.map((item, idx) => (
                              <option key={idx} value={item.itemType}>{item.itemType}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                          <input
                            type="text"
                            value={equip.size || ''}
                            onChange={(e) => updateNewEquipment(index, 'size', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="e.g., M, L, XL"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
                          <input
                            type="text"
                            value={equip.serialNumber || ''}
                            onChange={(e) => updateNewEquipment(index, 'serialNumber', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            placeholder="Unique serial number"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Existing Available</label>
                          <input
                            type="text"
                            value={equip.existingAvailable || 0}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity to Add *
                          </label>
                          <input
                            type="number"
                            value={equip.quantity}
                            onChange={(e) => updateNewEquipment(index, 'quantity', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                            min="1"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Total Available Quantity</label>
                          <input
                            type="text"
                            value={equip.availableQuantity || 0}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-purple-50 font-semibold"
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
                            <option value="under_maintenance">Under Maintenance</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Certification Date</label>
                          <input
                            type="date"
                            value={equip.certificationDate || ''}
                            onChange={(e) => updateNewEquipment(index, 'certificationDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                          <input
                            type="date"
                            value={equip.expiryDate || ''}
                            onChange={(e) => updateNewEquipment(index, 'expiryDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
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
                <p className="text-sm text-gray-500 mt-1">
                  Adding as: {user.name} ({user.role})
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => router.push(`/armory/armories/${armoryId}`)}
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
  )
}