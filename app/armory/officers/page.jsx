'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Edit, Trash2, User, Shield, Mail, Phone, MapPin } from 'lucide-react'

export default function OfficersPage() {
  const router = useRouter()
  
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [error, setError] = useState('')
  const [officers, setOfficers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRank, setFilterRank] = useState('')
  const [filterTeam, setFilterTeam] = useState('')
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

      // Check if user has permission to access officers
      const allowedRoles = ['admin', 'armourer']
      if (!allowedRoles.includes(userData.user.role)) {
        setError('You do not have permission to manage officers. Only administrators and armourers can access officer management.')
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

  const fetchOfficers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/armory/officers')
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched officers data:', data);
        setOfficers(data.officers || [])
      } else {
        console.error('Failed to fetch officers')
      }
    } catch (error) {
      console.error('Error fetching officers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    if (user && ['admin', 'armourer'].includes(user.role)) {
      fetchOfficers()
    }
  }, [user])

  const handleDeleteOfficer = async (officerId) => {
    try {
      // Double-check user has permission to delete
      if (user && user.role !== 'admin') {
        alert('Only administrators can delete officers. Armourers cannot delete officer records.')
        return
      }

      const response = await fetch(`/api/officers/${officerId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setOfficers(officers.filter(officer => officer._id !== officerId))
        setDeleteConfirm(null)
        alert('Officer deleted successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to delete officer: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting officer:', error)
      alert('Failed to delete officer')
    }
  }

  // Filter officers based on search and filters
  const filteredOfficers = officers.filter(officer => {
    const matchesSearch = 
      officer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      officer.serviceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      officer.email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRank = !filterRank || officer.rank === filterRank
    const matchesTeam = !filterTeam || officer.patrolTeam?.name === filterTeam

    return matchesSearch && matchesRank && matchesTeam
  })

  // Get unique values for filters
  const ranks = [...new Set(officers.map(officer => officer.rank).filter(Boolean))]
  const teams = [...new Set(officers.map(officer => officer.patrolTeam?.name).filter(Boolean))]

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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Officers Management</h1>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
              user.role === 'admin' ? 'bg-red-100 text-red-800 border-red-200' :
              'bg-blue-100 text-blue-800 border-blue-200'
            }`}>
              {user.role.toUpperCase()}
            </div>
          </div>
          <p className="text-gray-600">
            Manage police officers and their information
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Viewing as: {user.name} ({user.unit || 'Main Armory'})
          </p>
        </div>
        
        {/* Only show add button for admin and armourer */}
        {['admin', 'armourer'].includes(user.role) && (
          <button
            onClick={() => router.push('/armory/officers/create')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Officer</span>
          </button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Officers</p>
              <p className="text-2xl font-bold text-gray-900">{officers.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Officers</p>
              <p className="text-2xl font-bold text-green-600">
                {officers.filter(o => o.status === 'active').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <User className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Assigned to Teams</p>
              <p className="text-2xl font-bold text-purple-600">
                {officers.filter(o => o.patrolTeam).length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <User className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Access Level</p>
              <p className="text-lg font-bold text-orange-600 capitalize">
                {user.role}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Shield className="w-6 h-6 text-orange-600" />
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
              placeholder="Search officers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Rank Filter */}
          <select
            value={filterRank}
            onChange={(e) => setFilterRank(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Ranks</option>
            {ranks.map(rank => (
              <option key={rank} value={rank}>{rank}</option>
            ))}
          </select>

          {/* Team Filter */}
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Teams</option>
            {teams.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('')
              setFilterRank('')
              setFilterTeam('')
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Clear Filters</span>
          </button>
        </div>
      </div>

      {/* Officers Grid */}
      <div className="bg-white rounded-lg border">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredOfficers.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No officers found</h3>
            <p className="text-gray-500 mb-4">
              {officers.length === 0 ? 'No officers have been added yet.' : 'No officers match your search criteria.'}
            </p>
            {['admin', 'armourer'].includes(user.role) && (
              <button
                onClick={() => router.push('/armory/officers/create')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Add First Officer
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredOfficers.map((officer, index) => (
              <motion.div
                key={officer._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/officers/${officer._id}`)}
              >
                {/* Officer Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {officer.rank} {officer.name}
                      </h3>
                      <p className="text-sm text-gray-600">{officer.serviceNo}</p>
                      <p className="text-xs text-gray-500">Unit: {officer.unit || 'Not assigned'}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                    {/* Only show edit button for admin and armourer */}
                    {['admin', 'armourer'].includes(user.role) && (
                      <button
                        onClick={() => router.push(`/officers/${officer._id}/edit`)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {/* Only show delete button for admin */}
                    {user.role === 'admin' && (
                      <button
                        onClick={() => setDeleteConfirm(officer._id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Officer Details */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{officer.email}</span>
                  </div>
                  
                  {officer.phone && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{officer.phone}</span>
                    </div>
                  )}

                  {officer.patrolTeam && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{officer.patrolTeam.name}</span>
                    </div>
                  )}

                  {officer.office && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{officer.office.name}</span>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="mt-4 pt-4 border-t">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    officer.status === 'active' 
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : 'bg-red-100 text-red-800 border-red-200'
                  }`}>
                    {officer.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
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
              Delete Officer
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this officer? This action cannot be undone and will remove all associated data.
            </p>
            <div className="text-sm text-gray-500 mb-4">
              <p className="font-medium">Warning:</p>
              <p>This will permanently remove the officer record from the system.</p>
              {user.role !== 'admin' && (
                <p className="text-red-600 mt-1">Only administrators can delete officers.</p>
              )}
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteOfficer(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Officer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}