'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiSave, FiX, FiPlus, FiMinus, FiRefreshCw } from 'react-icons/fi'

export default function CreateArmoryPage() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [authLoading, setAuthLoading] = useState(true)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [weaponTypes, setWeaponTypes] = useState([]) // New state for weapon types
    const [loadingWeapons, setLoadingWeapons] = useState(false) // Loading state for weapon types
    const [formData, setFormData] = useState({
        armoryName: '',
        armoryCode: '',
        location: '',
        unit: '',
        securityLevel: 'medium',
        currentCustodian: {
            serviceNo: '',
            rank: '',
            name: ''
        },
        weapons: [],
        ammunition: [],
        equipment: [],
        otherItems: []
    })

    const [newWeapon, setNewWeapon] = useState({
        weaponType: '',
        serialNumber: '',
        quantity: 1,
        condition: 'serviceable',
        manufacturer: '',
        notes: ''
    })

    // Fetch available weapon types with their quantities
    const fetchWeaponTypes = async () => {
        setLoadingWeapons(true)
        try {
            const response = await fetch('/api/armory/weapon-types')
            if (!response.ok) {
                throw new Error('Failed to fetch weapon types')
            }
            const data = await response.json()
            setWeaponTypes(data.weaponTypes || [])
        } catch (error) {
            console.error('Error fetching weapon types:', error)
            setError('Failed to load weapon types. Please try again.')
        } finally {
            setLoadingWeapons(false)
        }
    }

    // Get selected weapon type details
    const getSelectedWeaponType = () => {
        return weaponTypes.find(w => w.weaponType === newWeapon.weaponType)
    }

    // Update available quantity when weapon type changes
    const handleWeaponTypeChange = (e) => {
        const weaponType = e.target.value
        const selectedWeapon = weaponTypes.find(w => w.weaponType === weaponType)
        
        setNewWeapon(prev => ({
            ...prev,
            weaponType: weaponType,
            manufacturer: selectedWeapon?.manufacturer || '',
            // Reset quantity to 1 when changing weapon type
            quantity: 1
        }))
    }

    const fetchUserData = async () => {
        try {
            const response = await fetch('/api/auth/me')
            if (!response.ok) {
                router.push('/login')
                return
            }

            const userData = await response.json()
            setUser(userData.user)

            // Check if user has permission to create armories
            const allowedRoles = ['admin', 'armourer']
            if (!allowedRoles.includes(userData.user.role)) {
                setError('You do not have permission to create armories. Only administrators and armourers can create new armories.')
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

    useEffect(() => {
        fetchUserData()
        fetchWeaponTypes()
    }, [])

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleCustodianChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            currentCustodian: {
                ...prev.currentCustodian,
                [name]: value
            }
        }))
    }

    const handleWeaponInputChange = (e) => {
        const { name, value } = e.target
        
        // If changing quantity, ensure it doesn't exceed available quantity
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

    const addWeapon = () => {
        if (newWeapon.weaponType && newWeapon.serialNumber) {
            const selectedWeapon = getSelectedWeaponType()
            
            // Check if we have enough quantity available
            if (selectedWeapon && newWeapon.quantity > selectedWeapon.availableQuantity) {
                alert(`Cannot add ${newWeapon.quantity} weapons. Only ${selectedWeapon.availableQuantity} available.`)
                return
            }
            
            setFormData(prev => ({
                ...prev,
                weapons: [...prev.weapons, { ...newWeapon }]
            }))
            
            // Update the available quantity in weaponTypes state
            if (selectedWeapon) {
                const updatedWeaponTypes = weaponTypes.map(w => 
                    w.weaponType === newWeapon.weaponType 
                        ? { ...w, availableQuantity: w.availableQuantity - newWeapon.quantity }
                        : w
                )
                setWeaponTypes(updatedWeaponTypes)
            }
            
            setNewWeapon({
                weaponType: '',
                serialNumber: '',
                quantity: 1,
                condition: 'serviceable',
                manufacturer: '',
                notes: ''
            })
        } else {
            alert('Please select a weapon type and enter a serial number')
        }
    }

    const removeWeapon = (index) => {
        const weaponToRemove = formData.weapons[index]
        
        // Return the quantity to available quantity when removing
        if (weaponToRemove) {
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

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        // Double-check user has permission
        if (user && !['admin', 'armourer'].includes(user.role)) {
            setError('You do not have permission to create armories.')
            return
        }

        setLoading(true)

        try {
            const response = await fetch('/api/armory/armories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            const data = await response.json()

            if (data.success) {
                router.push('/armory/armories')
            } else {
                alert(data.error || 'Failed to create armory')
            }
        } catch (error) {
            console.error('Error creating armory:', error)
            alert('Failed to create armory')
        } finally {
            setLoading(false)
        }
    }

    // Calculate total quantity of a weapon type already added to form
    const getAlreadyAddedQuantity = (weaponType) => {
        return formData.weapons
            .filter(w => w.weaponType === weaponType)
            .reduce((total, w) => total + w.quantity, 0)
    }

    // Show authentication loading state
    if (authLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Verifying permissions...</p>
                </div>
            </div>
        )
    }

    // Show error state for unauthorized users
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

    // Only render the form if user is authenticated and authorized
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

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Create New Armory</h1>
                        <p className="text-gray-600">Add a new armory inventory record</p>
                    </div>
                    <div className="text-sm text-gray-500">
                        <span className="font-medium">Logged in as: </span>
                        <span className="capitalize">{user.role} - {user.name}</span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Armory Name *
                        </label>
                        <input
                            type="text"
                            name="armoryName"
                            value={formData.armoryName}
                            onChange={handleInputChange}
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Enter armory name"
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
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Enter armory code"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Location *
                        </label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Enter location"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Unit *
                        </label>
                        <select
                            name="unit"
                            value={formData.unit}
                            onChange={handleInputChange}
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="">Select Unit</option>
                            <option value="FOU C">FOU C</option>
                            <option value="Border Drill">Border Drill</option>
                            <option value="Headquarters">Headquarters</option>
                            <option value="Regional Command">Regional Command</option>
                            <option value="Main Armory">Main Armory</option>
                            <option value="Field Unit">Field Unit</option>
                            <option value="Training Unit">Training Unit</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Security Level
                        </label>
                        <select
                            name="securityLevel"
                            value={formData.securityLevel}
                            onChange={handleInputChange}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="maximum">Maximum</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Created By
                        </label>
                        <input
                            type="text"
                            value={user.name || 'Current User'}
                            disabled
                            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                        />
                    </div>
                </div>

                {/* Current Custodian */}
                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Custodian</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Service Number *
                            </label>
                            <input
                                type="text"
                                name="serviceNo"
                                value={formData.currentCustodian.serviceNo}
                                onChange={handleCustodianChange}
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="e.g., 38681"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rank *
                            </label>
                            <input
                                type="text"
                                name="rank"
                                value={formData.currentCustodian.rank}
                                onChange={handleCustodianChange}
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="e.g., DSC"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.currentCustodian.name}
                                onChange={handleCustodianChange}
                                required
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="e.g., ET AKUAVE"
                            />
                        </div>
                    </div>
                </div>

                {/* Weapons Management */}
                <div className="border-t pt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Weapons Inventory</h3>
                        <button
                            type="button"
                            onClick={fetchWeaponTypes}
                            disabled={loadingWeapons}
                            className="flex items-center text-sm text-green-600 hover:text-green-800"
                        >
                            <FiRefreshCw className={`mr-1 ${loadingWeapons ? 'animate-spin' : ''}`} />
                            Refresh Available Weapons
                        </button>
                    </div>
                    
                    {/* Add Weapon Form */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                                <div className="relative">
                                    <select
                                        name="weaponType"
                                        value={newWeapon.weaponType}
                                        onChange={handleWeaponTypeChange}
                                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                        disabled={loadingWeapons}
                                    >
                                        <option value="">Select Type</option>
                                        {weaponTypes.map((weapon, index) => {
                                            const alreadyAdded = getAlreadyAddedQuantity(weapon.weaponType)
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
                                    {loadingWeapons && (
                                        <div className="absolute right-2 top-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                        </div>
                                    )}
                                </div>
                                {newWeapon.weaponType && (
                                    <div className="mt-1 text-xs">
                                        <span className="text-gray-600">
                                            Available: {getSelectedWeaponType()?.availableQuantity || 0} units
                                        </span>
                                        {getAlreadyAddedQuantity(newWeapon.weaponType) > 0 && (
                                            <span className="ml-2 text-orange-600">
                                                (Already added: {getAlreadyAddedQuantity(newWeapon.weaponType)})
                                            </span>
                                        )}
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
                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={addWeapon}
                                    disabled={!newWeapon.weaponType || !newWeapon.serialNumber}
                                    className="bg-green-600 text-white px-4 py-2 rounded flex items-center hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FiPlus className="mr-1" />
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Weapons List */}
                    {formData.weapons.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="font-medium text-gray-700">Added Weapons:</h4>
                            {formData.weapons.map((weapon, index) => (
                                <div key={index} className="flex justify-between items-center p-3 bg-white border rounded">
                                    <div>
                                        <span className="font-medium">{weapon.weaponType}</span>
                                        <span className="text-sm text-gray-500 ml-2">(S/N: {weapon.serialNumber})</span>
                                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                            weapon.condition === 'serviceable' ? 'bg-green-100 text-green-800' :
                                            weapon.condition === 'unserviceable' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {weapon.condition}
                                        </span>
                                        <span className="ml-2 text-sm text-gray-500">Qty: {weapon.quantity}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeWeapon(index)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        <FiMinus />
                                    </button>
                                </div>
                            ))}
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
                        disabled={loading}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center disabled:opacity-50"
                    >
                        <FiSave className="mr-2" />
                        {loading ? 'Creating...' : 'Create Armory'}
                    </button>
                </div>
            </form>
        </div>
    )
}