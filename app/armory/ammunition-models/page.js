'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Crosshair,
  CheckCircle,
  XCircle,
  Info,
  Package
} from 'lucide-react'

// Ammunition types from the schema
const AMMUNITION_TYPES = ['FMJ', 'HP', 'Tracer', 'AP', 'Frangible', 'Other']
const STATUS_OPTIONS = ['active', 'inactive']

export default function AmmunitionModelsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ammunitionModels, setAmmunitionModels] = useState([])
  const [filteredModels, setFilteredModels] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingModel, setEditingModel] = useState(null)
  const [formData, setFormData] = useState({
    caliber: '',
    type: '',
    manufacturer: '',
    description: '',
    status: 'active'
  })
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    if (user) {
      fetchAmmunitionModels()
    }
  }, [user])

  useEffect(() => {
    filterModels()
  }, [searchTerm, ammunitionModels])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      router.push('/login')
    }
  }

  const fetchAmmunitionModels = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/armory/ammunition-models')
      if (response.ok) {
        const data = await response.json()
        setAmmunitionModels(data.ammunitionModels || [])
        setFilteredModels(data.ammunitionModels || [])
      }
    } catch (error) {
      console.error('Error fetching ammunition models:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterModels = () => {
    if (!searchTerm) {
      setFilteredModels(ammunitionModels)
      return
    }
    
    const filtered = ammunitionModels.filter(model => 
      model.caliber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (model.description && model.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    
    setFilteredModels(filtered)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSelectChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    const errors = {}
    
    if (!formData.caliber.trim()) errors.caliber = 'Caliber is required'
    if (!formData.type.trim()) errors.type = 'Type is required'
    if (!formData.manufacturer.trim()) errors.manufacturer = 'Manufacturer is required'
    
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }
    
    try {
      const url = editingModel ? `/api/armory/ammunition-models/${editingModel}` : '/api/armory/ammunition-models'
      const method = editingModel ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      if (response.ok) {
        const data = await response.json()
        alert(data.message)
        resetForm()
        fetchAmmunitionModels()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving ammunition model:', error)
      alert('Failed to save ammunition model')
    }
  }

  const handleEdit = (model) => {
    setEditingModel(model._id)
    setFormData({
      caliber: model.caliber || '',
      type: model.type || '',
      manufacturer: model.manufacturer || '',
      description: model.description || '',
      status: model.status || 'active'
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this ammunition model?')) return
    
    try {
      const response = await fetch(`/api/armory/ammunition-models/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        alert('Ammunition model deleted successfully')
        fetchAmmunitionModels()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting ammunition model:', error)
      alert('Failed to delete ammunition model')
    }
  }

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    
    if (!confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} this ammunition model?`)) return
    
    try {
      const response = await fetch(`/api/armory/ammunition-models/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        alert(`Ammunition model ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`)
        fetchAmmunitionModels()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status')
    }
  }

  const resetForm = () => {
    setFormData({
      caliber: '',
      type: '',
      manufacturer: '',
      description: '',
      status: 'active'
    })
    setFormErrors({})
    setEditingModel(null)
    setShowForm(false)
  }

  const getTypeColor = (type) => {
    switch(type) {
      case 'FMJ': return 'bg-blue-100 text-blue-800'
      case 'HP': return 'bg-red-100 text-red-800'
      case 'Tracer': return 'bg-yellow-100 text-yellow-800'
      case 'AP': return 'bg-purple-100 text-purple-800'
      case 'Frangible': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ammunition Models</h1>
          <p className="text-gray-600 mt-2">Manage ammunition specifications for the armory inventory system</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>{showForm ? 'Cancel' : 'Add New Model'}</span>
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-lg border p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {editingModel ? 'Edit Ammunition Model' : 'Add New Ammunition Model'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Caliber */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caliber *
                </label>
                <input
                  type="text"
                  name="caliber"
                  value={formData.caliber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., 5.56x45mm NATO, 9x19mm Parabellum, .308 Winchester"
                />
                {formErrors.caliber && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.caliber}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Enter the ammunition caliber/size</p>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleSelectChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select type...</option>
                  {AMMUNITION_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {formErrors.type && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.type}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Select the ammunition type</p>
              </div>

              {/* Manufacturer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manufacturer *
                </label>
                <input
                  type="text"
                  name="manufacturer"
                  value={formData.manufacturer}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., Federal, Hornady, Winchester, Remington"
                />
                {formErrors.manufacturer && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.manufacturer}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">Enter the manufacturer name</p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleSelectChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">Set model status (active/inactive)</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Optional: Add notes, specifications, or details about this ammunition model..."
              />
              <p className="mt-1 text-xs text-gray-500">Optional description or additional details</p>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {editingModel ? 'Update Model' : 'Create Model'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg border p-4 mb-6 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by caliber, type, manufacturer, or description..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div className="mt-2 text-sm text-gray-500 flex items-center">
          <Info className="w-4 h-4 mr-1" />
          Showing {filteredModels.length} of {ammunitionModels.length} models
        </div>
      </div>

      {/* Models Table */}
      <div className="bg-white rounded-lg border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Caliber
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manufacturer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
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
              {filteredModels.map((model) => (
                <tr key={model._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="w-5 h-5 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {model.caliber}
                        </div>
                        <div className="text-xs text-gray-500">
                          Added: {new Date(model.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(model.type)}`}>
                      {model.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{model.manufacturer}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate" title={model.description}>
                      {model.description || <span className="text-gray-400 italic">No description</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleStatus(model._id, model.status)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                        model.status === 'active'
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {model.status === 'active' ? (
                        <>
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleEdit(model)}
                        className="text-blue-600 hover:text-blue-900 flex items-center transition-colors"
                        title="Edit model"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(model._id)}
                        className="text-red-600 hover:text-red-900 flex items-center transition-colors"
                        title="Delete model"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredModels.length === 0 && (
          <div className="text-center py-12">
            <Crosshair className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No ammunition models found</p>
            <p className="text-gray-400 text-sm mb-6">
              {searchTerm ? 'Try a different search term' : 'Get started by adding your first ammunition model'}
            </p>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add New Ammunition Model
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <Info className="w-5 h-5 text-blue-400 mr-2 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">About Ammunition Models</h3>
            <p className="text-sm text-blue-700 mt-1">
              Ammunition models define the specifications for ammunition in the armory inventory. 
              These models are used when adding ammunition to inventory and help maintain 
              consistency in categorization and tracking.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}