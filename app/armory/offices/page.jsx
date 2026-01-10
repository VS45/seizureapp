'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Building, Edit, Trash2 } from 'lucide-react'

export default function OfficesPage() {
  const router = useRouter()
  
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [error, setError] = useState('')
  const [offices, setOffices] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
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

      // Check if user has permission to access offices
      // Only admin can access office management
      if (userData.user.role !== 'admin') {
        setError('Only administrators can access office management')
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

  const fetchOffices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/armory/offices')
      if (response.ok) {
        const data = await response.json()
        setOffices(data.offices || [])
      } else {
        console.error('Failed to fetch offices')
      }
    } catch (error) {
      console.error('Error fetching offices:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchOffices()
    }
  }, [user])

  const handleDeleteOffice = async (officeId) => {
    try {
      // Double-check user has permission to delete
      if (user && user.role !== 'admin') {
        alert('Only administrators can delete offices.')
        return
      }

      const response = await fetch(`/api/armory/offices/${officeId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setOffices(offices.filter(office => office._id !== officeId))
        setDeleteConfirm(null)
        alert('Office deleted successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to delete office: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting office:', error)
      alert('Failed to delete office')
    }
  }

  // Filter offices based on search
  const filteredOffices = offices.filter(office => {
    const matchesSearch = 
      office.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      office.code?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

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
            <h1 className="text-3xl font-bold text-gray-900">Office Management</h1>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
              user.role === 'admin' ? 'bg-red-100 text-red-800 border-red-200' :
              'bg-blue-100 text-blue-800 border-blue-200'
            }`}>
              {user.role.toUpperCase()}
            </div>
          </div>
          <p className="text-gray-600">
            Manage police offices and stations
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Viewing as: {user.name} ({user.unit || 'Main Armory'})
          </p>
        </div>
        <button
          onClick={() => router.push('/armory/offices/create')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Office</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Offices</p>
              <p className="text-2xl font-bold text-gray-900">{offices.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Offices</p>
              <p className="text-2xl font-bold text-green-600">
                {offices.length} {/* All offices are considered active in simplified model */}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Building className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Last Updated</p>
              <p className="text-lg font-bold text-purple-600">
                {offices.length > 0 
                  ? new Date(Math.max(...offices.map(o => new Date(o.updatedAt).getTime()))).toLocaleDateString()
                  : 'N/A'
                }
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Edit className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Admin Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <Building className="w-5 h-5 text-blue-600 mr-2" />
          <div>
            <p className="text-sm font-medium text-blue-800">Administrative Access Required</p>
            <p className="text-sm text-blue-700 mt-1">
              You have full administrative access to manage all police offices and stations. 
              All changes will be logged in the system audit trail.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('')
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Clear Search</span>
          </button>
        </div>
      </div>

      {/* Offices Grid */}
      <div className="bg-white rounded-lg border">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredOffices.length === 0 ? (
          <div className="text-center py-12">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No offices found</h3>
            <p className="text-gray-500 mb-4">
              {offices.length === 0 
                ? 'No offices have been created yet.' 
                : 'No offices match your search criteria.'
              }
            </p>
            <button
              onClick={() => router.push('/armory/offices/create')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Create First Office
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
            {filteredOffices.map((office, index) => (
              <motion.div
                key={office._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/armory/offices/${office._id}`)}
              >
                {/* Office Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{office.name}</h3>
                      <p className="text-sm text-gray-600">Code: {office.code}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/armory/offices/${office._id}/edit`)
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteConfirm(office._id)
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Status - All offices are active in simplified model */}
                <div className="mb-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                    Active
                  </span>
                </div>

                {/* Office Details */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Building className="w-4 h-4" />
                    <span className="truncate">{office.name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span className="font-medium">Code:</span>
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">{office.code}</span>
                  </div>

                  {/* Created By Info */}
                  {office.createdBy && (
                    <div className="text-xs text-gray-500">
                      Created by: {office.createdBy.name || 'System Admin'}
                    </div>
                  )}
                </div>

                {/* Timestamps */}
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div>
                      <div className="font-medium">Created</div>
                      <div>{new Date(office.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="font-medium">Updated</div>
                      <div>{new Date(office.updatedAt).toLocaleDateString()}</div>
                    </div>
                  </div>
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
              Delete Office
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this office? This action cannot be undone and may affect assigned patrol teams.
            </p>
            <div className="text-sm text-gray-500 mb-4">
              <p className="font-medium">Warning:</p>
              <p>This will permanently remove the office and all associated data.</p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteOffice(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Office
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}