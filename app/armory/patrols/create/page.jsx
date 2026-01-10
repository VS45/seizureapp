'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Users } from 'lucide-react'

export default function CreatePatrolPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [offices, setOffices] = useState([])
  const [officers, setOfficers] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    office: '',
    members: []
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

      // Check if user has permission to create patrols
      // Only admin can create patrols
      if (userData.user.role !== 'admin') {
        setError('Only administrators can create patrol teams. You do not have permission to create patrol teams.')
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

  const fetchInitialData = async () => {
    try {
      const [officesRes, officersRes] = await Promise.all([
        fetch('/api/armory/offices'),
        fetch('/api/armory/officers')
      ])

      if (officesRes.ok) {
        const officesData = await officesRes.json()
        setOffices(officesData.offices)
      }

      if (officersRes.ok) {
        const officersData = await officersRes.json()
        setOfficers(officersData.officers)
      }
    } catch (error) {
      console.error('Failed to fetch initial data:', error)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchInitialData()
    }
  }, [user])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Double-check user has permission
    if (user && user.role !== 'admin') {
      alert('Only administrators can create patrol teams')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/armory/patrols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        router.push('/armory/patrols')
      } else {
        const error = await response.json()
        alert(`Failed to create patrol team: ${error.error}`)
      }
    } catch (error) {
      console.error('Create patrol failed:', error)
      alert('Failed to create patrol team')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleMemberChange = (officerId, isChecked) => {
    setFormData(prev => ({
      ...prev,
      members: isChecked 
        ? [...prev.members, officerId]
        : prev.members.filter(id => id !== officerId)
    }))
  }

  // Filter officers by selected office
  const filteredOfficers = officers.filter(officer => 
    !formData.office || officer.office?._id === formData.office
  )

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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Create New Patrol Team</h1>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
              user.role === 'admin' ? 'bg-red-100 text-red-800 border-red-200' :
              'bg-blue-100 text-blue-800 border-blue-200'
            }`}>
              {user.role.toUpperCase()}
            </div>
          </div>
          <p className="text-gray-600">
            Set up a new patrol team and assign officers
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Creating as: {user.name} ({user.unit || 'Main Armory'})
          </p>
        </div>
      </div>

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-white rounded-lg border p-6 space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patrol Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patrol Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Alpha Team, Bravo Squad"
            />
          </div>

          {/* Patrol Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patrol Code *
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., PAT-001, BRAVO-01"
            />
          </div>

          {/* Office */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Office *
            </label>
            <select
              name="office"
              value={formData.office}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Office</option>
              {offices.map((office) => (
                <option key={office._id} value={office._id}>
                  {office.name} ({office.code})
                </option>
              ))}
            </select>
          </div>

          {/* Created By */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Created By
            </label>
            <input
              type="text"
              value={user.name || 'Current User'}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>
        </div>

        {/* Members Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Team Members
          </label>
          {formData.office ? (
            <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
              {filteredOfficers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No officers available in this office
                </div>
              ) : (
                filteredOfficers.map((officer) => (
                  <label
                    key={officer._id}
                    className="flex items-center p-4 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.members.includes(officer._id)}
                      onChange={(e) => handleMemberChange(officer._id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">
                        {officer.rank} {officer.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {officer.serviceNo} • {officer.patrolTeam?.name || 'No patrol team'}
                      </div>
                      <div className="text-xs text-gray-500">
                        Unit: {officer.unit || 'Not assigned'}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500 border rounded-lg">
              Please select an office to see available officers
            </div>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Selected {formData.members.length} officer(s)
          </p>
        </div>

        {/* Admin Only Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Users className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm font-medium text-blue-800">Administrator Action Required</p>
              <p className="text-sm text-blue-700 mt-1">
                Only administrators can create patrol teams. This action will be logged in the system audit trail.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Users className="w-4 h-4 mr-2" />
            {loading ? 'Creating...' : 'Create Patrol Team'}
          </button>
        </div>
      </motion.form>
    </div>
  )
}