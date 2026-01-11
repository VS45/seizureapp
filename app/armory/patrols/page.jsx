'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Users, MapPin, Clock, Edit, Trash2, UserCheck, Car, Shield } from 'lucide-react'

export default function PatrolsPage() {
  const router = useRouter()
  
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [error, setError] = useState('')
  const [patrols, setPatrols] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        router.push('/login')
        return
      }

      const userData = await response.json()
      setUser(userData.user)

      // Check if user has permission to access patrols
      const allowedRoles = ['admin', 'armourer', 'officer']
      if (!allowedRoles.includes(userData.user.role)) {
        setError('You do not have permission to access patrol management')
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

  const fetchPatrols = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/armory/patrols')
      if (response.ok) {
        const data = await response.json()
console.log('Patrols data:', data.patrols)
        setPatrols(data.patrols || [])
      } else {
        console.error('Failed to fetch patrols')
      }
    } catch (error) {
      console.error('Error fetching patrols:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    if (user) {
      fetchPatrols()
    }
  }, [user])

  const handleDeletePatrol = async (patrolId) => {
    try {
      // Double-check user has permission to delete
      if (user && !['admin', 'armourer'].includes(user.role)) {
        alert('You do not have permission to delete patrols. Only administrators and armourers can delete patrols.')
        return
      }

      const response = await fetch(`/api/armory/patrols/${patrolId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setPatrols(patrols.filter(patrol => patrol._id !== patrolId))
        setDeleteConfirm(null)
        alert('Patrol deleted successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to delete patrol: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting patrol:', error)
      alert('Failed to delete patrol')
    }
  }

  const getStatusBadge = (status) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-blue-100 text-blue-800 border-blue-200',
      scheduled: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    }
    
    const statusLabels = {
      active: 'Active',
      completed: 'Completed',
      scheduled: 'Scheduled',
      cancelled: 'Cancelled'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    )
  }

  const getTypeIcon = (type) => {
    const icons = {
      foot: Users,
      vehicle: Car,
      k9: Shield,
      mixed: UserCheck
    }
    
    const IconComponent = icons[type] || Users
    return <IconComponent className="w-4 h-4" />
  }

  const getTypeLabel = (type) => {
    const labels = {
      foot: 'Foot Patrol',
      vehicle: 'Vehicle Patrol',
      k9: 'K9 Unit',
      mixed: 'Mixed Patrol'
    }
    
    return labels[type] || type
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Filter patrols based on search and filters
  const filteredPatrols = patrols.filter(patrol => {
    const matchesSearch = 
      patrol.patrolName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patrol.area?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patrol.leader?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patrol.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = !statusFilter || patrol.status === statusFilter
    const matchesType = !typeFilter || patrol.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  // Get unique values for filters
  const statuses = [...new Set(patrols.map(patrol => patrol.status).filter(Boolean))]
  const types = [...new Set(patrols.map(patrol => patrol.type).filter(Boolean))]

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A'
    
    const start = new Date(startTime)
    const end = new Date(endTime)
    const duration = (end - start) / (1000 * 60 * 60) // hours
    
    return `${duration.toFixed(1)}h`
  }

  const getOfficerCount = (patrol) => {
    return patrol.officers?.length || 0
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

  // Only render content if user is authenticated
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Patrol Management</h1>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
              user.role === 'admin' ? 'bg-red-100 text-red-800 border-red-200' :
              user.role === 'armourer' ? 'bg-blue-100 text-blue-800 border-blue-200' :
              'bg-green-100 text-green-800 border-green-200'
            }`}>
              {user.role.toUpperCase()}
            </div>
          </div>
          <p className="text-gray-600">
            Organize and track police patrols and field operations
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Viewing as: {user.name} ({user.unit || 'Main Armory'})
          </p>
        </div>
        
        {/* Only show create button for admin and armourer */}
        {user.role !== 'officer' && (
          <button
            onClick={() => router.push('/armory/patrols/create')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Patrol</span>
          </button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Patrols</p>
              <p className="text-2xl font-bold text-gray-900">{patrols.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {patrols.filter(p => p.status === 'active').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Scheduled</p>
              <p className="text-2xl font-bold text-yellow-600">
                {patrols.filter(p => p.status === 'scheduled').length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-blue-600">
                {patrols.filter(p => p.status === 'completed').length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search patrols..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Types</option>
            {types.map(type => (
              <option key={type} value={type}>
                {getTypeLabel(type)}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('')
              setTypeFilter('')
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Clear Filters</span>
          </button>
        </div>
      </div>

      {/* Patrols Grid */}
      <div className="bg-white rounded-lg border">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredPatrols.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No patrols found</h3>
            <p className="text-gray-500 mb-4">
              {patrols.length === 0 
                ? 'No patrols have been created yet.' 
                : 'No patrols match your search criteria.'
              }
            </p>
            {user.role !== 'officer' && (
              <button
                onClick={() => router.push('/armory/patrols/create')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Create First Patrol
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
            {filteredPatrols.map((patrol, index) => (
              <motion.div
                key={patrol._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/armory/patrols/${patrol._id}`)}
              >
                {/* Patrol Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      {getTypeIcon(patrol.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{patrol.patrolName}</h3>
                      <p className="text-sm text-gray-600">{getTypeLabel(patrol.type)}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    {/* Only show edit button for admin and armourer */}
                    {user.role !== 'officer' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/armory/patrols/${patrol._id}/edit`)
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {/* Only show delete button for admin and armourer */}
                    {user.role !== 'officer' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteConfirm(patrol._id)
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div className="mb-4">
                  {getStatusBadge(patrol.status)}
                </div>

                {/* Patrol Details */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{patrol.area}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{getOfficerCount(patrol)} officers</span>
                    {patrol.leader && (
                      <span className="text-gray-400">• Led by {patrol.leader.name}</span>
                    )}
                  </div>

                  {/* Schedule */}
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <div className="flex items-center space-x-1">
                      <span>{formatDate(patrol.startTime)}</span>
                      <span className="text-gray-400">at</span>
                      <span>{formatTime(patrol.startTime)}</span>
                    </div>
                  </div>

                  {/* Duration */}
                  {patrol.endTime && (
                    <div className="text-sm text-gray-600">
                      Duration: {calculateDuration(patrol.startTime, patrol.endTime)}
                    </div>
                  )}

                  {/* Description */}
                  {patrol.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {patrol.description}
                    </p>
                  )}
                </div>

                {/* Equipment Summary */}
                {patrol.equipment && patrol.equipment.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex flex-wrap gap-1">
                      {patrol.equipment.slice(0, 3).map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                        >
                          {item}
                        </span>
                      ))}
                      {patrol.equipment.length > 3 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                          +{patrol.equipment.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Patrol
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this patrol? This action cannot be undone and may affect related distributions.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePatrol(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Patrol
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}