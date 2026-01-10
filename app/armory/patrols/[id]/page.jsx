'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Edit, 
  Users, 
  User,
  Mail,
  Phone,
  Shield,
  BarChart3
} from 'lucide-react'

export default function PatrolDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [error, setError] = useState('')
  const [patrol, setPatrol] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        router.push('/login')
        return
      }

      const userData = await response.json()
      setUser(userData.user)

      // Check if user has permission to access patrol details
      const allowedRoles = ['admin', 'armourer', 'officer']
      if (!allowedRoles.includes(userData.user.role)) {
        setError('You do not have permission to access patrol team details')
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

  const fetchPatrol = async () => {
    try {
      const response = await fetch(`/api/patrols/${id}`)
      if (response.ok) {
        const data = await response.json()
        setPatrol(data)
      } else {
        console.error('Failed to fetch patrol')
      }
    } catch (error) {
      console.error('Failed to fetch patrol:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPatrolStats = async () => {
    try {
      const response = await fetch(`/api/reports/issuance?groupBy=officer&period=30d`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch patrol stats:', error)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    if (user) {
      fetchPatrol()
      fetchPatrolStats()
    }
  }, [id, user])

  // Calculate patrol-specific stats
  const activeMembers = patrol?.members?.filter(member => member.status === 'active') || []
  const issuanceStats = stats?.issuanceStats?.filter(stat => 
    patrol?.members?.some(member => member._id === stat._id)
  ) || []

  const totalIssuances = issuanceStats.reduce((sum, stat) => sum + stat.count, 0)
  const totalWeapons = issuanceStats.reduce((sum, stat) => sum + (stat.totalWeapons || 0), 0)

  // Show authentication loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
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
      <div className="flex items-center justify-center h-64">
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
      <div className="flex items-center justify-center h-64">
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
        <div className="text-lg">Loading patrol details...</div>
      </div>
    )
  }

  if (!patrol) {
    return (
      <div className="text-center py-8">
        <h1 className="text-2xl font-bold text-gray-900">Patrol team not found</h1>
        <button
          onClick={() => router.push('/patrols')}
          className="mt-4 text-blue-600 hover:text-blue-700"
        >
          Back to Patrol Teams
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
            onClick={() => router.push('/patrols')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{patrol.name}</h1>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                user.role === 'admin' ? 'bg-red-100 text-red-800 border-red-200' :
                user.role === 'armourer' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                'bg-green-100 text-green-800 border-green-200'
              }`}>
                {user.role.toUpperCase()}
              </div>
            </div>
            <p className="text-gray-600 mt-2">
              {patrol.code} • {patrol.office?.name} • {activeMembers.length} members
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Viewing as: {user.name} ({user.unit || 'Main Armory'})
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* Only show edit button for admin */}
          {user.role === 'admin' && (
            <button
              onClick={() => router.push(`/patrols/${id}/edit`)}
              className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Team
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border text-center">
          <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{activeMembers.length}</div>
          <div className="text-gray-600">Active Members</div>
        </div>
        <div className="bg-white p-6 rounded-lg border text-center">
          <BarChart3 className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{totalIssuances}</div>
          <div className="text-gray-600">Total Issuances (30d)</div>
        </div>
        <div className="bg-white p-6 rounded-lg border text-center">
          <Shield className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{totalWeapons}</div>
          <div className="text-gray-600">Weapons Issued (30d)</div>
        </div>
        <div className="bg-white p-6 rounded-lg border text-center">
          <User className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {patrol.members?.filter(m => m.status !== 'active').length || 0}
          </div>
          <div className="text-gray-600">Inactive Members</div>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
              <p className="text-gray-600 mt-1">
                {activeMembers.length} active officers in this patrol team
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className="p-6">
          {activeMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No active members in this patrol team
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeMembers.map((member) => (
                <div key={member._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {member.rank} {member.name}
                      </h3>
                      <p className="text-sm text-gray-600">{member.serviceNo}</p>
                      <p className="text-xs text-gray-500">Unit: {member.unit || 'Not assigned'}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      member.status === 'active' ? 'bg-green-100 text-green-800' :
                      member.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {member.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      {member.email}
                    </div>
                    {member.phone && (
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        {member.phone}
                      </div>
                    )}
                  </div>

                  {/* Officer Stats */}
                  {stats && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-semibold">
                            {issuanceStats.find(s => s._id === member._id)?.count || 0}
                          </div>
                          <div className="text-gray-500">Issuances</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold">
                            {issuanceStats.find(s => s._id === member._id)?.totalWeapons || 0}
                          </div>
                          <div className="text-gray-500">Weapons</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => router.push(`/officers/${member._id}`)}
                    className="w-full mt-4 px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                  >
                    View Profile
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      {issuanceStats.length > 0 && (
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity (30 days)</h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Officer</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Issuances</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Weapons</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Ammunition</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {issuanceStats.map((stat) => {
                    const officer = patrol.members?.find(m => m._id === stat._id)
                    return (
                      <tr key={stat._id}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {officer?.rank} {officer?.name}
                          </div>
                          <div className="text-sm text-gray-600">{officer?.serviceNo}</div>
                          <div className="text-xs text-gray-500">{officer?.unit || 'No unit'}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{stat.count}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{stat.totalWeapons || 0}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{stat.totalAmmunition || 0}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Access Information */}
      <div className="bg-gray-50 rounded-lg border p-4">
        <div className="text-sm text-gray-600">
          <p className="font-medium">Access Information:</p>
          <p className="mt-1">You are viewing this patrol team as a <span className="font-medium capitalize">{user.role}</span>.</p>
          <p className="mt-1">
            {user.role === 'admin' 
              ? 'You have full administrative access to modify this patrol team.' 
              : user.role === 'armourer'
              ? 'You have view-only access to patrol team details.' 
              : 'You have limited view access to patrol team information.'
            }
          </p>
        </div>
      </div>
    </div>
  )
}