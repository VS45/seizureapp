'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Edit, 
  Plus, 
  Warehouse, 
  Shield, 
  Calendar,
  FileText,
  Users
} from 'lucide-react'

export default function ArmoryDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [error, setError] = useState('')
  const [armory, setArmory] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        router.push('/login')
        return
      }

      const userData = await response.json()
      setUser(userData.user)

      // Check if user has required role
      const allowedRoles = ['admin', 'armourer', 'officer']
      if (!allowedRoles.includes(userData.user.role)) {
        setError('You do not have permission to access armory details')
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
      const response = await fetch(`/api/armories/${id}`)
      if (response.ok) {
        const data = await response.json()
        setArmory(data.armory)
      } else {
        console.error('Failed to fetch armory')
      }
    } catch (error) {
      console.error('Failed to fetch armory:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    if (user) {
      fetchArmory()
    }
  }, [id, user])

  // Show authentication loading state
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying permissions...</p>
        </div>
      </div>
    )
  }

  // Show error state for unauthorized users
  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
            <p className="font-bold">Access Denied</p>
            <p className="mt-2">{error}</p>
            <p className="mt-2 text-sm">Redirecting...</p>
          </div>
        </div>
      </div>
    )
  }

  // Only render content if user is authenticated
  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
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
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading armory details...</div>
      </div>
    )
  }

  if (!armory) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-gray-900">Armory not found</h1>
        <button
          onClick={() => router.push('/armories')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Back to Armories
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/armories')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{armory.armoryName}</h1>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                user.role === 'admin' ? 'bg-red-100 text-red-800 border-red-200' :
                user.role === 'armourer' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                'bg-green-100 text-green-800 border-green-200'
              }`}>
                {user.role.toUpperCase()}
              </div>
            </div>
            <p className="text-gray-600 mt-2">
              {armory.armoryCode} • {armory.location}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push(`/distributions/create?armoryId=${id}`)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Issue Items
          </button>
          {user.role === 'admin' && (
            <button
              onClick={() => router.push(`/armories/${id}/edit`)}
              className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border text-center">
          <Warehouse className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{armory.weapons?.length || 0}</div>
          <div className="text-gray-600">Weapons</div>
        </div>
        <div className="bg-white p-6 rounded-lg border text-center">
          <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{armory.ammunition?.length || 0}</div>
          <div className="text-gray-600">Ammo Types</div>
        </div>
        <div className="bg-white p-6 rounded-lg border text-center">
          <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{armory.equipment?.length || 0}</div>
          <div className="text-gray-600">Equipment</div>
        </div>
        <div className="bg-white p-6 rounded-lg border text-center">
          <div className={`w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center ${
            armory.status === 'active' ? 'bg-green-100 text-green-600' :
            armory.status === 'inactive' ? 'bg-gray-100 text-gray-600' :
            'bg-yellow-100 text-yellow-600'
          }`}>
            <Calendar className="w-4 h-4" />
          </div>
          <div className="text-sm font-medium capitalize">{armory.status}</div>
          <div className="text-gray-600">Status</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {['overview', 'weapons', 'ammunition', 'equipment', 'distributions'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'overview' && <FileText className="w-4 h-4 mr-2" />}
                {tab === 'weapons' && <Shield className="w-4 h-4 mr-2" />}
                {tab === 'ammunition' && <Warehouse className="w-4 h-4 mr-2" />}
                {tab === 'equipment' && <Users className="w-4 h-4 mr-2" />}
                {tab === 'distributions' && <Calendar className="w-4 h-4 mr-2" />}
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab armory={armory} />}
          {activeTab === 'weapons' && <WeaponsTab weapons={armory.weapons} />}
          {activeTab === 'ammunition' && <AmmunitionTab ammunition={armory.ammunition} />}
          {activeTab === 'equipment' && <EquipmentTab equipment={armory.equipment} />}
          {activeTab === 'distributions' && <DistributionsTab armoryId={id} />}
        </div>
      </div>
    </div>
  )
}

// Tab Components remain the same
function OverviewTab({ armory }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Armory Details</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Code:</span>
            <span className="font-medium">{armory.armoryCode}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Location:</span>
            <span className="font-medium">{armory.location}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Unit:</span>
            <span className="font-medium">{armory.unit}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Office:</span>
            <span className="font-medium">{armory.office?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
              armory.status === 'active' ? 'bg-green-100 text-green-800' :
              armory.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {armory.status}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Inventory Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Weapons:</span>
            <span className="font-medium">{armory.weapons?.length || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Ammunition Types:</span>
            <span className="font-medium">{armory.ammunition?.length || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Equipment:</span>
            <span className="font-medium">{armory.equipment?.length || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Created:</span>
            <span className="font-medium">
              {new Date(armory.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function WeaponsTab({ weapons }) {
  if (!weapons || weapons.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No weapons in this armory
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Weapons Inventory</h3>
        <span className="text-sm text-gray-600">{weapons.length} weapons</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {weapons.map((weapon) => (
          <div key={weapon._id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-gray-900">{weapon.weaponType}</h4>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                weapon.condition === 'serviceable' ? 'bg-green-100 text-green-800' :
                weapon.condition === 'unserviceable' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {weapon.condition}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">SN: {weapon.serialNumber}</p>
            <p className="text-sm text-gray-600 mb-2">Model: {weapon.model}</p>
            <p className="text-sm text-gray-600 mb-2">Caliber: {weapon.caliber}</p>
            <div className="flex justify-between items-center mt-3">
              <span className="text-sm text-gray-500">
                Qty: {weapon.availableQuantity}/{weapon.quantity}
              </span>
              <span className={`text-sm font-medium ${
                weapon.availableQuantity === 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {weapon.availableQuantity === 0 ? 'Out of Stock' : 'Available'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AmmunitionTab({ ammunition }) {
  if (!ammunition || ammunition.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No ammunition in this armory
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Ammunition Inventory</h3>
        <span className="text-sm text-gray-600">{ammunition.length} types</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Caliber</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Type</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Lot Number</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Quantity</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Expiry</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Condition</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {ammunition.map((ammo) => (
              <tr key={ammo._id}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{ammo.caliber}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{ammo.type}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{ammo.lotNumber}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {ammo.availableQuantity}/{ammo.quantity} {ammo.unit}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {ammo.expiryDate ? new Date(ammo.expiryDate).toLocaleDateString() : 'N/A'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    ammo.condition === 'serviceable' ? 'bg-green-100 text-green-800' :
                    ammo.condition === 'expired' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {ammo.condition}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function EquipmentTab({ equipment }) {
  if (!equipment || equipment.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No equipment in this armory
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Equipment Inventory</h3>
        <span className="text-sm text-gray-600">{equipment.length} items</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {equipment.map((item) => (
          <div key={item._id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-gray-900">{item.name}</h4>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                item.condition === 'serviceable' ? 'bg-green-100 text-green-800' :
                item.condition === 'unserviceable' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {item.condition}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">Type: {item.type}</p>
            {item.serialNumber && (
              <p className="text-sm text-gray-600 mb-2">SN: {item.serialNumber}</p>
            )}
            <div className="flex justify-between items-center mt-3">
              <span className="text-sm text-gray-500">
                Qty: {item.availableQuantity}/{item.quantity}
              </span>
              <span className={`text-sm font-medium ${
                item.availableQuantity === 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {item.availableQuantity === 0 ? 'Out of Stock' : 'Available'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DistributionsTab({ armoryId }) {
  const [distributions, setDistributions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDistributions()
  }, [armoryId])

  const fetchDistributions = async () => {
    try {
      const response = await fetch(`/api/distributions?armoryId=${armoryId}`)
      if (response.ok) {
        const data = await response.json()
        setDistributions(data.distributions || [])
      }
    } catch (error) {
      console.error('Failed to fetch distributions:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-4">Loading distributions...</div>
  }

  if (distributions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No distributions from this armory
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Recent Distributions</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Distribution No</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Officer</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Squad</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date Issued</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {distributions.map((dist) => (
              <tr key={dist._id}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{dist.distributionNo}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {dist.officer?.name} ({dist.officer?.serviceNo})
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{dist.squadName}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(dist.dateIssued).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    dist.status === 'issued' ? 'bg-blue-100 text-blue-800' :
                    dist.status === 'returned' ? 'bg-green-100 text-green-800' :
                    dist.status === 'partial_return' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {dist.status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}