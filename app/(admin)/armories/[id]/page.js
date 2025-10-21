'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiEdit, FiArrowLeft, FiShield, FiUser, FiMapPin, FiHome } from 'react-icons/fi';

export default function ArmoryDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [armory, setArmory] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchArmory();
        }
    }, [params.id]);

    const fetchArmory = async () => {
        try {
            const response = await fetch(`/api/armories/${params.id}`);
            const data = await response.json();
            
            if (data.success) {
                setArmory(data.armory);
            } else {
                console.error('Error fetching armory:', data.error);
            }
        } catch (error) {
            console.error('Error fetching armory:', error);
        } finally {
            setLoading(false);
        }
    };

    const getWeaponSummary = (weapons) => {
        const serviceable = weapons.filter(w => w.condition === 'serviceable').reduce((sum, w) => sum + w.quantity, 0);
        const unserviceable = weapons.filter(w => w.condition === 'unserviceable').reduce((sum, w) => sum + w.quantity, 0);
        const missing = weapons.filter(w => w.condition === 'missing').reduce((sum, w) => sum + w.quantity, 0);
        return { serviceable, unserviceable, missing, total: serviceable + unserviceable + missing };
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        );
    }

    if (!armory) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-800">Armory Not Found</h2>
                <p className="text-gray-600 mt-2">The requested armory could not be found.</p>
                <Link href="/armories" className="text-green-600 hover:text-green-700 mt-4 inline-block">
                    ← Back to Armories
                </Link>
            </div>
        );
    }

    const weaponSummary = getWeaponSummary(armory.weapons);

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <button
                            onClick={() => router.back()}
                            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
                        >
                            <FiArrowLeft className="mr-2" />
                            Back to Armories
                        </button>
                        <h1 className="text-3xl font-bold text-gray-800">{armory.armoryName}</h1>
                        <p className="text-gray-600">Reference: {armory.referenceID}</p>
                    </div>
                    <Link
                        href={`/armories/${armory._id}/edit`}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-green-700"
                    >
                        <FiEdit className="mr-2" />
                        Edit Armory
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Information */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Information Card */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Basic Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center">
                                <FiHome className="text-gray-400 mr-3" />
                                <div>
                                    <p className="text-sm text-gray-600">Armory Code</p>
                                    <p className="font-medium">{armory.armoryCode}</p>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <FiMapPin className="text-gray-400 mr-3" />
                                <div>
                                    <p className="text-sm text-gray-600">Location</p>
                                    <p className="font-medium">{armory.location}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Unit</p>
                                <p className="font-medium">{armory.unit}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Security Level</p>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                    armory.securityLevel === 'maximum' ? 'bg-red-100 text-red-800' :
                                    armory.securityLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                                    armory.securityLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-green-100 text-green-800'
                                }`}>
                                    {armory.securityLevel?.toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Status</p>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                    armory.status === 'active' ? 'bg-green-100 text-green-800' :
                                    armory.status === 'under_audit' ? 'bg-yellow-100 text-yellow-800' :
                                    armory.status === 'maintenance' ? 'bg-blue-100 text-blue-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                    {armory.status?.replace('_', ' ').toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Created</p>
                                <p className="font-medium">{new Date(armory.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Current Custodian Card */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Custodian</h2>
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <FiUser className="text-green-600" />
                            </div>
                            <div>
                                <p className="font-medium text-lg">{armory.currentCustodian?.name}</p>
                                <p className="text-gray-600">{armory.currentCustodian?.rank}</p>
                                <p className="text-sm text-gray-500">Service No: {armory.currentCustodian?.serviceNo}</p>
                                <p className="text-sm text-gray-500">
                                    Since: {new Date(armory.currentCustodian?.takeoverDate).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Weapons Inventory Card */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">Weapons Inventory</h2>
                            <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                                Total: {weaponSummary.total}
                            </span>
                        </div>
                        
                        {/* Weapon Summary */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <p className="text-2xl font-bold text-green-800">{weaponSummary.serviceable}</p>
                                <p className="text-sm text-green-600">Serviceable</p>
                            </div>
                            <div className="text-center p-4 bg-red-50 rounded-lg">
                                <p className="text-2xl font-bold text-red-800">{weaponSummary.unserviceable}</p>
                                <p className="text-sm text-red-600">Unserviceable</p>
                            </div>
                            <div className="text-center p-4 bg-yellow-50 rounded-lg">
                                <p className="text-2xl font-bold text-yellow-800">{weaponSummary.missing}</p>
                                <p className="text-sm text-yellow-600">Missing</p>
                            </div>
                        </div>

                        {/* Weapons List */}
                        <div className="space-y-3">
                            {armory.weapons.map((weapon, index) => (
                                <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                                    <div>
                                        <p className="font-medium">{weapon.weaponType}</p>
                                        <p className="text-sm text-gray-600">Serial: {weapon.serialNumber}</p>
                                        {weapon.manufacturer && (
                                            <p className="text-sm text-gray-500">Manufacturer: {weapon.manufacturer}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            weapon.condition === 'serviceable' ? 'bg-green-100 text-green-800' :
                                            weapon.condition === 'unserviceable' ? 'bg-red-100 text-red-800' :
                                            weapon.condition === 'missing' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {weapon.condition}
                                        </span>
                                        <p className="text-sm text-gray-600 mt-1">Qty: {weapon.quantity}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="font-semibold text-gray-800 mb-4">Inventory Summary</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Total Weapons</span>
                                <span className="font-medium">{weaponSummary.total}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Ammunition Items</span>
                                <span className="font-medium">{armory.ammunition.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Equipment Items</span>
                                <span className="font-medium">{armory.equipment.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Other Items</span>
                                <span className="font-medium">{armory.otherItems.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Handover History */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h3 className="font-semibold text-gray-800 mb-4">Recent Handovers</h3>
                        <div className="space-y-3">
                            {armory.handoverHistory.slice(0, 3).map((record, index) => (
                                <div key={index} className="border-l-4 border-green-500 pl-3">
                                    <p className="font-medium text-sm">{record.name}</p>
                                    <p className="text-xs text-gray-600">{record.rank} • {record.serviceNo}</p>
                                    <p className="text-xs text-gray-500">
                                        {new Date(record.date).toLocaleDateString()} • {record.action.replace('_', ' ')}
                                    </p>
                                </div>
                            ))}
                            {armory.handoverHistory.length > 3 && (
                                <button className="text-green-600 text-sm hover:text-green-700">
                                    View all {armory.handoverHistory.length} records
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}