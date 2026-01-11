'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Calendar, User, Package, ArrowUpDown, Download } from 'lucide-react'

export default function DistributionsPage() {
  const router = useRouter()
  
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [error, setError] = useState('')
  const [distributions, setDistributions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        router.push('/login')
        return
      }

      const userData = await response.json()
      setUser(userData.user)

      // Check if user has permission to access distributions
      const allowedRoles = ['admin', 'armourer', 'officer']
      if (!allowedRoles.includes(userData.user.role)) {
        setError('You do not have permission to access distribution records')
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

  // Safe data processing function
  const processDistributionData = (distributions) => {
    if (!Array.isArray(distributions)) return []
    
    return distributions.map(dist => ({
      _id: dist._id || `temp-${Math.random()}`,
      weapons: Array.isArray(dist.weapons) ? dist.weapons : [],
      ammunition: Array.isArray(dist.ammunition) ? dist.ammunition : [],
      equipment: Array.isArray(dist.equipment) ? dist.equipment : [],
      status: dist.status || 'unknown',
      squadName: dist.squadName || 'Unnamed Squad',
      officer: dist.officer || { 
        name: 'Unknown Officer', 
        rank: 'N/A', 
        serviceNo: 'N/A' 
      },
      armory: dist.armory || { 
        armoryName: 'Unknown Armory', 
        code: 'N/A' 
      },
      createdAt: dist.createdAt || new Date().toISOString(),
      expectedReturnDate: dist.expectedReturnDate,
      purpose: dist.purpose || 'Not specified',
      // Include all original properties
      ...dist
    }))
  }

  const fetchDistributions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/armory/distributions')
      if (response.ok) {
        const data = await response.json()
        console.log("Distributions Data: ", data.distributions)
        
        // Process data to ensure safety
        const safeData = processDistributionData(data.distributions || [])
        setDistributions(safeData)
      } else {
        setDistributions([])
      }
    } catch (error) {
      console.error('Error fetching distributions:', error)
      setDistributions([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    if (user) {
      fetchDistributions()
    }
  }, [user])

  // Safe calculation function - handles missing data gracefully
  const calculateTotalItems = (distribution) => {
    if (!distribution) return 0
    
    const sumArray = (arr) => 
      Array.isArray(arr) ? arr.reduce((total, item) => total + (item?.quantity || 0), 0) : 0
    
    const weaponsTotal = sumArray(distribution.weapons)
    const ammunitionTotal = sumArray(distribution.ammunition)
    const equipmentTotal = sumArray(distribution.equipment)
    
    return weaponsTotal + ammunitionTotal + equipmentTotal
  }

  // Count items by type for detailed display
  const getItemBreakdown = (distribution) => {
    if (!distribution) return { weapons: 0, ammunition: 0, equipment: 0 }
    
    return {
      weapons: Array.isArray(distribution.weapons) ? distribution.weapons.length : 0,
      ammunition: Array.isArray(distribution.ammunition) ? distribution.ammunition.length : 0,
      equipment: Array.isArray(distribution.equipment) ? distribution.equipment.length : 0
    }
  }

  const getStatusBadge = (status) => {
    const statusStyles = {
      issued: 'bg-green-100 text-green-800 border border-green-200',
      returned: 'bg-blue-100 text-blue-800 border border-blue-200',
      overdue: 'bg-red-100 text-red-800 border border-red-200',
      partial: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      unknown: 'bg-gray-100 text-gray-800 border border-gray-200'
    }
    
    const statusLabels = {
      issued: 'Issued',
      returned: 'Returned',
      overdue: 'Overdue',
      partial: 'Partial Return',
      unknown: 'Unknown'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
        {statusLabels[status] || status}
      </span>
    )
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'No date'
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      console.error('Invalid date format:', dateString)
      return 'Invalid date'
    }
  }

  // Filter and sort distributions with safe data access
  const filteredDistributions = distributions
    .filter(distribution => {
      if (!distribution) return false
      
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        distribution.squadName?.toLowerCase().includes(searchLower) ||
        distribution.officer?.name?.toLowerCase().includes(searchLower) ||
        distribution.armory?.armoryName?.toLowerCase().includes(searchLower) ||
        distribution.purpose?.toLowerCase().includes(searchLower)

      const matchesStatus = !statusFilter || distribution.status === statusFilter
      
      const matchesDate = !dateFilter || 
        formatDate(distribution.createdAt).toLowerCase().includes(dateFilter.toLowerCase())

      return matchesSearch && matchesStatus && matchesDate
    })
    .sort((a, b) => {
      if (!a || !b) return 0
      
      let aValue = a[sortBy]
      let bValue = b[sortBy]

      // Handle missing values
      if (aValue === undefined || aValue === null) aValue = ''
      if (bValue === undefined || bValue === null) bValue = ''

      if (sortBy === 'createdAt') {
        try {
          aValue = new Date(aValue)
          bValue = new Date(bValue)
        } catch (error) {
          aValue = new Date(0)
          bValue = new Date(0)
        }
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  // Get unique statuses for filter dropdown
  const uniqueStatuses = [...new Set(distributions.map(d => d.status).filter(Boolean))]

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
            <h1 className="text-3xl font-bold text-gray-900">Weapon Distributions</h1>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
              user.role === 'admin' ? 'bg-red-100 text-red-800 border-red-200' :
              user.role === 'armourer' ? 'bg-blue-100 text-blue-800 border-blue-200' :
              'bg-green-100 text-green-800 border-green-200'
            }`}>
              {user.role.toUpperCase()}
            </div>
          </div>
          <p className="text-gray-600">
            Track and manage weapon distributions to officers and squads
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Viewing as: {user.name} ({user.unit || 'Main Armory'})
          </p>
        </div>
        <div className="flex space-x-3">
          {/* Only show create button for admin and armourer */}
          {user.role !== 'officer' && (
            <button
              onClick={() => router.push('/armory/distributions/create')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>New Distribution</span>
            </button>
          )}
          <button
            onClick={() => {/* Export functionality */}}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Distributions</p>
              <p className="text-2xl font-bold text-gray-900">{distributions.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Currently Issued</p>
              <p className="text-2xl font-bold text-green-600">
                {distributions.filter(d => d.status === 'issued').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Package className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">
                {distributions.filter(d => d.status === 'overdue').length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <Package className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-purple-600">
                {distributions.reduce((total, dist) => total + calculateTotalItems(dist), 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
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
              placeholder="Search distributions..."
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
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>

          {/* Date Filter */}
          <input
            type="text"
            placeholder="Filter by date..."
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('')
              setDateFilter('')
            }}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Clear Filters</span>
          </button>
        </div>
      </div>

      {/* Distributions Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredDistributions.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No distributions found</h3>
            <p className="text-gray-500 mb-4">
              {distributions.length === 0 
                ? 'No distributions have been created yet.' 
                : 'No distributions match your search criteria.'
              }
            </p>
            {user.role !== 'officer' && (
              <button
                onClick={() => router.push('/armory/distributions/create')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Create First Distribution
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('squadName')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Squad / Officer</span>
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Armory
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Date Issued</span>
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDistributions.map((distribution) => {
                  const totalItems = calculateTotalItems(distribution)
                  const itemBreakdown = getItemBreakdown(distribution)
                  const hasItems = totalItems > 0
                  
                  return (
                    <motion.tr
                      key={distribution._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/distributions/${distribution._id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">
                            {distribution.squadName}
                          </div>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <User className="w-4 h-4 mr-1" />
                            {distribution.officer?.rank} {distribution.officer?.name}
                            {distribution.officer?.serviceNo && (
                              <span className="ml-2 text-xs bg-gray-100 px-1 rounded">
                                #{distribution.officer.serviceNo}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {distribution.armory?.armoryName}
                        {distribution.armory?.code && (
                          <div className="text-xs text-gray-500">
                            {distribution.armory.code}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Package className="w-4 h-4 mr-1" />
                          {hasItems ? `${totalItems} items` : 'No items'}
                        </div>
                        {hasItems && (
                          <div className="flex gap-2 text-xs text-gray-500 mt-1">
                            {itemBreakdown.weapons > 0 && (
                              <span>{itemBreakdown.weapons} weapons</span>
                            )}
                            {itemBreakdown.ammunition > 0 && (
                              <span>{itemBreakdown.ammunition} ammo</span>
                            )}
                            {itemBreakdown.equipment > 0 && (
                              <span>{itemBreakdown.equipment} equipment</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                          {formatDate(distribution.createdAt)}
                        </div>
                        {distribution.expectedReturnDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            Due: {formatDate(distribution.expectedReturnDate)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(distribution.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/armory/distributions/${distribution._id}`)
                          }}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}