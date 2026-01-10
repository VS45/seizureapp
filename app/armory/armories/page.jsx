'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArmoryTable } from '@/components/tables/ArmoryTable'
import { SearchBar } from '@/components/ui/SearchBar'
import { FilterMenu } from '@/components/ui/FilterMenu'
import { Plus, Warehouse } from 'lucide-react'

export default function ArmoriesPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(true)
  const [error, setError] = useState('')
  const [armories, setArmories] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const router = useRouter()

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
        setError('You do not have permission to access armory management pages')
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

  const fetchArmories = async () => {
    try {
      const response = await fetch('/api/armories')
      if (response.ok) {
        const data = await response.json()
        setArmories(data.armories)
      } else {
        console.error('Failed to fetch armories')
      }
    } catch (error) {
      console.error('Failed to fetch armories:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    if (user) {
      fetchArmories()
    }
  }, [user])

  const filteredArmories = armories.filter(armory => {
    const matchesSearch = armory.armoryName.toLowerCase().includes(search.toLowerCase()) ||
                         armory.armoryCode.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || armory.status === statusFilter
    return matchesSearch && matchesStatus
  })

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

  // Only render the content if user is authenticated and authorized
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
        <div className="text-lg">Loading armories...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Armories</h1>
          <p className="text-gray-600 mt-2">
            Manage weapon and equipment inventory across all locations
          </p>
        </div>
        {user.role !== 'officer' && (
          <Link
            href="/armory/armories/create"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Armory
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <Warehouse className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{armories.length}</p>
              <p className="text-sm text-gray-600">Total Armories</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-green-600 text-sm font-bold">A</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {armories.filter(a => a.status === 'active').length}
              </p>
              <p className="text-sm text-gray-600">Active</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-yellow-600 text-sm font-bold">M</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {armories.filter(a => a.status === 'maintenance').length}
              </p>
              <p className="text-sm text-gray-600">Maintenance</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
              <span className="text-red-600 text-sm font-bold">I</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {armories.filter(a => a.status === 'inactive').length}
              </p>
              <p className="text-sm text-gray-600">Inactive</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search armories..."
            />
          </div>
          <FilterMenu
            label="Status"
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'maintenance', label: 'Maintenance' },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border">
        <ArmoryTable armories={filteredArmories} />
      </div>
    </div>
  )
}