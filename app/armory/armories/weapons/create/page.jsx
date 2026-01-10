// app/manage-inventory/weapons/create/page.jsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiSave, FiX, FiPlus, FiMinus, FiRefreshCw, FiSearch } from 'react-icons/fi'

export default function CreateWeaponPage() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [authLoading, setAuthLoading] = useState(true)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [weaponTypes, setWeaponTypes] = useState([])
    const [loadingWeapons, setLoadingWeapons] = useState(false)
    const [armories, setArmories] = useState([])
    const [loadingArmories, setLoadingArmories] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedArmory, setSelectedArmory] = useState('')

    const [formData, setFormData] = useState({
        armoryId: '',
        weapons: []
    })

    const [newWeapon, setNewWeapon] = useState({
        weaponType: '',
        serialNumber: '',
        quantity: 1,
        condition: 'serviceable',
        manufacturer: '',
        acquisitionDate: '',
        notes: ''
    })

    // Fetch user data and available data
    const fetchUserData = async () => {
        try {
            const response = await fetch('/api/auth/me')
            if (!response.ok) {
                router.push('/login')
                return
            }

            const userData = await response.json()
            setUser(userData.user)

            // Check permissions
            const allowedRoles = ['admin', 'armourer']
            if (!allowedRoles.includes(userData.user.role)) {
                setError('You do not have permission to add weapons.')
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

    // Fetch available weapon types
    const fetchWeaponTypes = async () => {
        setLoadingWeapons(true)
        try {
            const response = await fetch('/api/armory/weapon-types?includeStats=true')
            if (!response.ok) {
                throw new Error('Failed to fetch weapon types')
            }
            const data = await response.json()
            if (data.success) {
                setWeaponTypes(data.weaponTypes || [])
            } else {
                throw new Error(data.error || 'Failed to load weapon types')
            }
        } catch (error) {
            console.error('Error fetching weapon types:', error)
            alert('Failed to load weapon types. Please try again.')
        } finally {
            setLoadingWeapons(false)
        }
    }

    // Fetch available armories
    const fetchArmories = async () => {
        setLoadingArmories(true)
        try {
            const response = await fetch('/api/armory/armories?limit=100')
            if (!response.ok) {
                throw new Error('Failed to fetch armories')
            }
            const data = await response.json()
            if (data.success) {
                setArmories(data.armories || [])
            } else {
                throw new Error(data.error || 'Failed to load armories')
            }
        } catch (error) {
            console.error('Error fetching armories:', error)
            alert('Failed to load armories. Please try again.')
        } finally {
            setLoadingArmories(false)
        }
    }

    useEffect(() => {
        fetchUserData()
        fetchWeaponTypes()
        fetchArmories()
    }, [])

    // Get filtered weapon types based on search
    const getFilteredWeaponTypes = () => {
        if (!searchTerm) return weaponTypes
        
        return weaponTypes.filter(weapon => 
            weapon.weaponType.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (weapon.manufacturer && weapon.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()))
        )
    }

    // Get selected weapon type details
    const getSelectedWeaponType = () => {
        return weaponTypes.find(w => w.weaponType === newWeapon.weaponType)
    }

    // Handle weapon type change
    const handleWeaponTypeChange = (e) => {
        const weaponType = e.target.value
        const selectedWeapon = weaponTypes.find(w => w.weaponType === weaponType)
        
        setNewWeapon(prev => ({
            ...prev,
            weaponType: weaponType,
            manufacturer: selectedWeapon?.manufacturer || '',
            quantity: 1
        }))
    }

    // Handle weapon input change
    const handleWeaponInputChange = (e) => {
        const { name, value } = e.target
        
        if (name === 'quantity') {
            const selectedWeapon = getSelectedWeaponType()
            const maxQuantity = selectedWeapon?.availableQuantity || 0
            const newQuantity = Math.min(Math.max(1, parseInt(value) || 1), maxQuantity)
            
            setNewWeapon(prev => ({
                ...prev,
                [name]: newQuantity
            }))
        } else {
            setNewWeapon(prev => ({
                ...prev,
                [name]: value
            }))
        }
    }

    // Add weapon to list
    const addWeapon = () => {
        if (!newWeapon.weaponType || !newWeapon.serialNumber) {
            alert('Please select a weapon type and enter a serial number')
            return
        }

        if (!selectedArmory) {
            alert('Please select an armory first')
            return
        }

        // Check if serial number is unique in current list
        const isDuplicate = formData.weapons.some(w => w.serialNumber === newWeapon.serialNumber)
        if (isDuplicate) {
            alert('This serial number is already in the list')
            return
        }

        const selectedWeapon = getSelectedWeaponType()
        
        // Check available quantity
        if (selectedWeapon && newWeapon.quantity > selectedWeapon.availableQuantity) {
            alert(`Cannot add ${newWeapon.quantity} weapons. Only ${selectedWeapon.availableQuantity} available.`)
            return
        }

        const weaponToAdd = {
            ...newWeapon,
            acquisitionDate: newWeapon.acquisitionDate || new Date().toISOString().split('T')[0]
        }

        setFormData(prev => ({
            ...prev,
            weapons: [...prev.weapons, weaponToAdd]
        }))

        // Update local weapon types quantity
        if (selectedWeapon) {
            const updatedWeaponTypes = weaponTypes.map(w => 
                w.weaponType === newWeapon.weaponType 
                    ? { ...w, availableQuantity: w.availableQuantity - newWeapon.quantity }
                    : w
            )
            setWeaponTypes(updatedWeaponTypes)
        }

        // Reset form
        setNewWeapon({
            weaponType: '',
            serialNumber: '',
            quantity: 1,
            condition: 'serviceable',
            manufacturer: '',
            acquisitionDate: '',
            notes: ''
        })
    }

    // Remove weapon from list
    const removeWeapon = (index) => {
        const weaponToRemove = formData.weapons[index]
        
        if (weaponToRemove) {
            // Return quantity to available quantity
            const updatedWeaponTypes = weaponTypes.map(w => 
                w.weaponType === weaponToRemove.weaponType 
                    ? { ...w, availableQuantity: w.availableQuantity + weaponToRemove.quantity }
                    : w
            )
            setWeaponTypes(updatedWeaponTypes)
        }
        
        setFormData(prev => ({
            ...prev,
            weapons: prev.weapons.filter((_, i) => i !== index)
        }))
    }

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!selectedArmory) {
            alert('Please select an armory')
            return
        }

        if (formData.weapons.length === 0) {
            alert('Please add at least one weapon')
            return
        }

        // Double-check user permissions
        if (user && !['admin', 'armourer'].includes(user.role)) {
            setError('You do not have permission to add weapons.')
            return
        }

        setLoading(true)

        try {
            const response = await fetch(`/api/armory/armories/${selectedArmory}/weapons`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    weapons: formData.weapons,
                    updatedBy: user.id,
                    updatedByName: user.name
                }),
            })

            const data = await response.json()

            if (data.success) {
                alert('Weapons added successfully!')
                router.push(`/manage-inventory/armories/${selectedArmory}`)
            } else {
                alert(data.error || 'Failed to add weapons')
            }
        } catch (error) {
            console.error('Error adding weapons:', error)
            alert('Failed to add weapons')
        } finally {
            setLoading(false)
        }
    }

    // Show loading states
    if (authLoading || loadingWeapons || loadingArmories) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    // Show error state
    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center max-w-md mx-auto p-6">
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
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded max-w-md">
                        <p>Loading user data...</p>
                    </div>
                </div>
            </div>
        )
    }

    const filteredWeaponTypes = getFilteredWeaponTypes()

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Add Weapons to Armory</h1>
                        <p className="text-gray-600">Add new weapons to an existing armory inventory</p>
                    </div>
                    <div className="text-sm text-gray-500">
                        <span className="font-medium">Logged in as: </span>
                        <span className="capitalize">{user.role} - {user.name}</span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
                {/* Armory Selection */}
                <div className="border-b pb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Armory</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Armory *
                            </label>
                            <select
                                value={selectedArmory}
                                onChange={(e) => setSelectedArmory(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                            >
                                <option value="">Select an Armory</option>
                                {armories.map(armory => (
                                    <option key={armory._id} value={armory._id}>
                                        {armory.armoryName} - {armory.armoryCode} ({armory.location})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            {selectedArmory && (
                                <button
                                    type="button"
                                    onClick={() => router.push(`/manage-inventory/armories/${selectedArmory}`)}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center"
                                >
                                    View Armory Details
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Weapons Entry Section */}
                <div className="border-t pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Add Weapons</h3>
                        <button
                            type="button"
                            onClick={fetchWeaponTypes}
                            disabled={loadingWeapons}
                            className="flex items-center text-sm text-green-600 hover:text-green-800"
                        >
                            <FiRefreshCw className={`mr-1 ${loadingWeapons ? 'animate-spin' : ''}`} />
                            Refresh Weapons List
                        </button>
                    </div>
                    
                    {/* Weapon Search */}
                    <div className="mb-4">
                        <div className="relative">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search weapon types or manufacturers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    {/* Add Weapon Form */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                                <select
                                    name="weaponType"
                                    value={newWeapon.weaponType}
                                    onChange={handleWeaponTypeChange}
                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                    disabled={loadingWeapons}
                                >
                                    <option value="">Select Type</option>
                                    {filteredWeaponTypes.map((weapon, index) => {
                                        const alreadyAdded = formData.weapons
                                            .filter(w => w.weaponType === weapon.weaponType)
                                            .reduce((total, w) => total + w.quantity, 0)
                                        const netAvailable = weapon.availableQuantity - alreadyAdded
                                        return (
                                            <option 
                                                key={index} 
                                                value={weapon.weaponType}
                                                disabled={netAvailable <= 0}
                                            >
                                                {weapon.weaponType} {netAvailable > 0 ? `(${netAvailable} available)` : '(Out of stock)'}
                                            </option>
                                        )
                                    })}
                                </select>
                                {newWeapon.weaponType && (
                                    <div className="mt-1 text-xs">
                                        <span className="text-gray-600">
                                            Available: {getSelectedWeaponType()?.availableQuantity || 0} units
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Serial No *</label>
                                <input
                                    type="text"
                                    name="serialNumber"
                                    value={newWeapon.serialNumber}
                                    onChange={handleWeaponInputChange}
                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                    placeholder="S62565046"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                <input
                                    type="number"
                                    name="quantity"
                                    value={newWeapon.quantity}
                                    onChange={handleWeaponInputChange}
                                    min="1"
                                    max={getSelectedWeaponType()?.availableQuantity || 1}
                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                />
                                {newWeapon.weaponType && (
                                    <div className="text-xs text-gray-500 mt-1">
                                        Max: {getSelectedWeaponType()?.availableQuantity || 0}
                                    </div>
                                )}
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                                <select
                                    name="condition"
                                    value={newWeapon.condition}
                                    onChange={handleWeaponInputChange}
                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                >
                                    <option value="serviceable">Serviceable</option>
                                    <option value="unserviceable">Unserviceable</option>
                                    <option value="under_maintenance">Under Maintenance</option>
                                    <option value="missing">Missing</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                                <input
                                    type="text"
                                    name="manufacturer"
                                    value={newWeapon.manufacturer || (getSelectedWeaponType()?.manufacturer || '')}
                                    onChange={handleWeaponInputChange}
                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                    placeholder="Manufacturer"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Acquisition Date</label>
                                <input
                                    type="date"
                                    name="acquisitionDate"
                                    value={newWeapon.acquisitionDate}
                                    onChange={handleWeaponInputChange}
                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <input
                                    type="text"
                                    name="notes"
                                    value={newWeapon.notes}
                                    onChange={handleWeaponInputChange}
                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                    placeholder="Optional notes"
                                />
                            </div>
                            
                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={addWeapon}
                                    disabled={!newWeapon.weaponType || !newWeapon.serialNumber || !selectedArmory}
                                    className="bg-green-600 text-white px-4 py-2 rounded flex items-center hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed w-full justify-center"
                                >
                                    <FiPlus className="mr-1" />
                                    Add Weapon
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Weapons List Preview */}
                    {formData.weapons.length > 0 && (
                        <div className="mt-6">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4">
                                Weapons to Add ({formData.weapons.length})
                            </h4>
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white border rounded-lg">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial No</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manufacturer</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {formData.weapons.map((weapon, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="font-medium">{weapon.weaponType}</span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="text-sm text-gray-600">{weapon.serialNumber}</span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="text-sm text-gray-600">{weapon.quantity}</span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                                        weapon.condition === 'serviceable' ? 'bg-green-100 text-green-800' :
                                                        weapon.condition === 'unserviceable' ? 'bg-red-100 text-red-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                        {weapon.condition.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="text-sm text-gray-600">{weapon.manufacturer || '-'}</span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeWeapon(index)}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <FiMinus />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                        <FiX className="mr-2" />
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || formData.weapons.length === 0 || !selectedArmory}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FiSave className="mr-2" />
                        {loading ? 'Adding Weapons...' : `Add ${formData.weapons.length} Weapons`}
                    </button>
                </div>
            </form>
        </div>
    )
}