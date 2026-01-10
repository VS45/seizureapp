'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FiSave, FiX, FiPlus, FiMinus } from 'react-icons/fi'

export default function CreateArmoryPage() {
    const router = useRouter()
    const [user, setUser] = useState(null)
    const [authLoading, setAuthLoading] = useState(true)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
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
            // Only admin and armourer can create armories, officers cannot
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
        setNewWeapon(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const addWeapon = () => {
        if (newWeapon.weaponType && newWeapon.serialNumber) {
            setFormData(prev => ({
                ...prev,
                weapons: [...prev.weapons, { ...newWeapon }]
            }))
            setNewWeapon({
                weaponType: '',
                serialNumber: '',
                quantity: 1,
                condition: 'serviceable',
                manufacturer: '',
                notes: ''
            })
        }
    }

    const removeWeapon = (index) => {
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
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Weapons Inventory</h3>
                    
                    {/* Add Weapon Form */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                                <input
                                    type="text"
                                    name="weaponType"
                                    value={newWeapon.weaponType}
                                    onChange={handleWeaponInputChange}
                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                    placeholder="AK-47"
                                />
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
                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                />
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
                                    value={newWeapon.manufacturer}
                                    onChange={handleWeaponInputChange}
                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                                    placeholder="Manufacturer"
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={addWeapon}
                                    className="bg-green-600 text-white px-4 py-2 rounded flex items-center hover:bg-green-700"
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