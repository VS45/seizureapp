'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Edit, Building, Calendar, Users, Shield } from 'lucide-react'

export default function OfficeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const officeId = params.id

  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [error, setError] = useState('')
  const [office, setOffice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    patrols: 0,
    officers: 0,
    armories: 0
  })

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        router.push('/auth/login')
        return
      }

      const userData = await response.json()
      setUser(userData.user)

      // Check if user has permission to access office details
      // Only admin can access office details
      if (userData.user.role !== 'admin') {
        setError('Only administrators can view office details')
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
        router.push('/auth/login')
      }, 2000)
    }
  }

  const fetchOffice = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/offices/${officeId}`)
      if (response.ok) {
        const data = await response.json()
        setOffice(data.office)
        
        // Fetch related stats
        fetchOfficeStats(officeId)
      } else {
        console.error('Failed to fetch office')
        router.push('/offices')
      }
    } catch (error) {
      console.error('Error fetching office:', error)
      router.push('/offices')
    } finally {
      setLoading(false)
    }
  }

  const fetchOfficeStats = async (id) => {
    try {
      // Fetch patrols for this office
      const patrolsResponse = await fetch(`/api/patrols?office=${id}`)
      const patrolsData = patrolsResponse.ok ? await patrolsResponse.json() : { patrols: [] }
      
      // Fetch officers for this office
      const officersResponse = await fetch(`/api/officers?office=${id}`)
      const officersData = officersResponse.ok ? await officersResponse.json() : { officers: [] }
      
      // Fetch armories for this office
      const armoriesResponse = await fetch(`/api/armories?office=${id}`)
      const armoriesData = armoriesResponse.ok ? await armoriesResponse.json() : { armories: [] }

      setStats({
        patrols: patrolsData.patrols?.length || 0,
        officers: officersData.officers?.length || 0,
        armories: armoriesData.armories?.length || 0
      })
    } catch (error) {
      console.error('Error fetching office stats:', error)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    if (user && user.role === 'admin' && officeId) {
      fetchOffice()
    }
  }, [user, officeId])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Show authentication loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!office) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Office Not Found</h2>
        <p className="text-gray-600 mb-6">The office you're looking for doesn't exist.</p>
        <button
          onClick={() => router.push('/offices')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Back to Offices
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{office.name}</h1>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                user.role === 'admin' ? 'bg-red-100 text-red-800 border-red-200' :
                'bg-blue-100 text-blue-800 border-blue-200'
              }`}>
                {user.role.toUpperCase()}
              </div>
            </div>
            <p className="text-gray-600">
              Office Code: {office.code}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Viewing as: {user.name} ({user.unit || 'Main Armory'})
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push(`/offices/${officeId}/edit`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Office</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Patrol Teams</p>
              <p className="text-2xl font-bold text-gray-900">{stats.patrols}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Officers</p>
              <p className="text-2xl font-bold text-green-600">{stats.officers}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Armories</p>
              <p className="text-2xl font-bold text-purple-600">{stats.armories}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Building className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
              Active
            </span>
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-1" />
              Created on {formatDate(office.createdAt)}
            </div>
          </div>
          {office.updatedAt !== office.createdAt && (
            <div className="text-sm text-gray-500">
              Last updated: {formatDate(office.updatedAt)}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Office Information */}
          <div className="bg-white border rounded-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Office Information</h2>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Office Name</label>
                  <p className="text-gray-900 font-semibold text-lg">{office.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Office Code</label>
                  <p className="text-gray-900 font-mono bg-gray-100 px-3 py-2 rounded-lg inline-block">
                    {office.code}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                    Active
                  </span>
                </div>
                {office.createdBy && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Created By</label>
                    <p className="text-gray-900">
                      {office.createdBy.name} ({office.createdBy.role})
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timestamps */}
          <div className="bg-white border rounded-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Timeline</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Created</label>
                  <div className="flex items-center space-x-2 text-gray-900">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(office.createdAt)}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                  <div className="flex items-center space-x-2 text-gray-900">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(office.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border rounded-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/offices/${officeId}/edit`)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Office Details</span>
                </button>
                <button
                  onClick={() => router.push('/patrols?office=' + officeId)}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2"
                >
                  <Users className="w-4 h-4" />
                  <span>View Patrol Teams ({stats.patrols})</span>
                </button>
                <button
                  onClick={() => router.push('/officers?office=' + officeId)}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>View Officers ({stats.officers})</span>
                </button>
                <button
                  onClick={() => router.push('/offices')}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Offices</span>
                </button>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-white border rounded-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">System Information</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Office ID</label>
                  <p className="text-gray-900 font-mono text-sm bg-gray-100 px-3 py-2 rounded-lg break-all">
                    {office._id}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Access Level</label>
                  <p className="text-gray-900">
                    <span className="font-medium capitalize">{user.role}</span> - Administrative Access
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}