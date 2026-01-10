'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Building, Calendar, Shield } from 'lucide-react'

export default function EditOfficePage() {
  const router = useRouter()
  const params = useParams()
  const officeId = params.id

  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [originalData, setOriginalData] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    code: ''
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

      // Check if user has permission to edit offices
      // Only admin can edit offices
      if (userData.user.role !== 'admin') {
        setError('Only administrators can edit office information. You do not have permission to perform this action.')
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

  const fetchOffice = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/offices/${officeId}`)
      if (response.ok) {
        const data = await response.json()
        setOriginalData(data.office)
        setFormData({
          name: data.office.name || '',
          code: data.office.code || ''
        })
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

  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    if (user && user.role === 'admin' && officeId) {
      fetchOffice()
    }
  }, [user, officeId])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Double-check user has permission
    if (user && user.role !== 'admin') {
      alert('Only administrators can edit offices.')
      return
    }

    if (!formData.name || !formData.code) {
      alert('Please fill in all required fields')
      return
    }

    // Check if anything changed
    const hasChanges = 
      formData.name !== originalData.name || 
      formData.code !== originalData.code

    if (!hasChanges) {
      alert('No changes detected')
      return
    }

    setSaving(true)
    try {
      // Add updatedBy information
      const updateData = {
        ...formData,
        updatedBy: {
          id: user._id,
          name: user.name,
          role: user.role
        }
      }

      const response = await fetch(`/api/offices/${officeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        alert('Office updated successfully!')
        router.push(`/offices/${officeId}`)
      } else {
        const error = await response.json()
        alert(`Failed to update office: ${error.error}`)
      }
    } catch (error) {
      console.error('Office update failed:', error)
      alert('Failed to update office')
    } finally {
      setSaving(false)
    }
  }

  // Check if form has changes
  const hasChanges = originalData && (
    formData.name !== originalData.name || 
    formData.code !== originalData.code
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
            <h1 className="text-3xl font-bold text-gray-900">Edit Office</h1>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
              user.role === 'admin' ? 'bg-red-100 text-red-800 border-red-200' :
              'bg-blue-100 text-blue-800 border-blue-200'
            }`}>
              {user.role.toUpperCase()}
            </div>
          </div>
          <p className="text-gray-600">
            Update office information
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Editing as: {user.name} ({user.unit || 'Main Armory'})
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg border p-6 space-y-6">
          {/* Administrative Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-800">Administrative Action Required</p>
                <p className="text-sm text-blue-700 mt-1">
                  You are modifying office information as a system administrator. 
                  All changes will be logged in the audit trail.
                </p>
              </div>
            </div>
          </div>

          {/* Change Indicator */}
          {hasChanges && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <p className="text-sm font-medium text-yellow-800">Unsaved changes detected</p>
              </div>
            </div>
          )}

          {/* Office Information */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Office Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Office Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter office name"
                  required
                />
                {originalData && formData.name !== originalData.name && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Original: {originalData.name}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Office Code *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., PS-001"
                  required
                />
                {originalData && formData.code !== originalData.code && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Original: {originalData.code}
                  </p>
                )}
              </div>

              {/* Updated By */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Updated By
                </label>
                <input
                  type="text"
                  value={`${user.name} (${user.role})`}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This change will be recorded under your administrator account
                </p>
              </div>
            </div>
          </div>

          {/* Office Preview */}
          <div className="bg-gray-50 rounded-lg p-4 border">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Office Preview</h3>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  {formData.name || 'Office Name'}
                </h4>
                <p className="text-sm text-gray-600">
                  Code: {formData.code || 'OFFICE-CODE'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                  Active
                </span>
              </div>
              <div className="text-right text-gray-500">
                Last edit: {user.name}
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="bg-gray-50 rounded-lg p-4 border">
            <h3 className="text-lg font-medium text-gray-900 mb-3">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Office ID</label>
                <p className="text-gray-900 font-mono text-xs bg-white px-2 py-1 rounded border">
                  {officeId}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Original Created</label>
                <div className="flex items-center space-x-2 text-gray-900">
                  <Calendar className="w-4 h-4" />
                  <span>{originalData ? new Date(originalData.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Validation Rules */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-lg font-medium text-blue-900 mb-2">Validation Rules</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Office name must be unique across all offices</li>
              <li>• Office code must be unique across all offices</li>
              <li>• Both fields are required</li>
              <li>• Changes will be reflected immediately</li>
              <li>• All modifications are tracked in audit logs</li>
            </ul>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.push(`/offices/${officeId}`)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !formData.name || !formData.code || !hasChanges}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{hasChanges ? 'Save Changes' : 'No Changes'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}