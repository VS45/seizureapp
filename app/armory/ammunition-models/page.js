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
  XCircle
} from 'lucide-react'

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
    type: ''
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
      model.type.toLowerCase().includes(searchTerm.toLowerCase())
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

  const validateForm = () => {
    const errors = {}
    
    if (!formData.caliber.trim()) errors.caliber = 'Caliber is required'
    if (!formData.type.trim()) errors.type = 'Type is required'
    
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
      caliber: model.caliber,
      type: model.type
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

  const resetForm = () => {
    setFormData({
      caliber: '',
      type: ''
    })
    setFormErrors({})
    setEditingModel(null)
    setShowForm(false)
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
          <p className="text-gray-600 mt-2">Manage ammunition calibers and types for dropdown selection</p>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 5.56x45mm NATO"
                />
                {formErrors.caliber && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.caliber}</p>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type *
                </label>
                <input
                  type="text"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., FMJ, HP, Tracer"
                />
                {formErrors.type && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.type}</p>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-4 border-t">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {editingModel ? 'Update Model' : 'Create Model'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by caliber or type..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Models Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
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
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredModels.map((model) => (
                <tr key={model._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {model.caliber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{model.type}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      model.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
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
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(model)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(model._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
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
            <p className="text-gray-500">No ammunition models found</p>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-green-600 hover:text-green-700 font-medium"
              >
                Add your first ammunition model
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}