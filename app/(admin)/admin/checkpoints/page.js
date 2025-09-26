'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function CheckpointsList() {
  const [checkpoints, setCheckpoints] = useState([]);
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOffices, setLoadingOffices] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [officeSearchTerm, setOfficeSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showOfficeDropdown, setShowOfficeDropdown] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [newCheckpoint, setNewCheckpoint] = useState({
    name: '',
    description: '',
    officeCode: ''
  });
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const itemsPerPage = 10;

  const fetchCheckpoints = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/checkpoints?page=${currentPage}&limit=${itemsPerPage}&search=${searchTerm}`);
      const data = await response.json();
      
      if (data.success) {
        setCheckpoints(data.checkpoints);
        setTotalPages(data.pagination.totalPages);
      } else {
        setError('Failed to fetch checkpoints');
      }
    } catch (error) {
      setError('Error fetching checkpoints');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckpoints();
  }, [currentPage, searchTerm]);

  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const response = await fetch('/api/offices');
        const data = await response.json();
        if (response.ok) {
          setOffices(data);
        } else {
          throw new Error(data.error || 'Failed to load offices');
        }
      } catch (err) {
        setError('Failed to load office list. Please try again later.');
      } finally {
        setLoadingOffices(false);
      }
    };
    
    fetchOffices();
  }, []);

  // Filter offices based on search term
  const filteredOffices = useMemo(() => {
    if (!officeSearchTerm) return offices;
    return offices.filter(office => 
      office.name.toLowerCase().includes(officeSearchTerm.toLowerCase()) ||
      office.code.toLowerCase().includes(officeSearchTerm.toLowerCase())
    );
  }, [offices, officeSearchTerm]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this checkpoint?')) return;

    try {
      const response = await fetch(`/api/checkpoints/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCheckpoints(); // Refresh the list
      } else {
        setError('Failed to delete checkpoint');
      }
    } catch (error) {
      setError('Error deleting checkpoint');
      console.error('Error:', error);
    }
  };

  const handleOfficeSelect = (officeCode) => {
    const office = offices.find(o => o.code === officeCode);
    setSelectedOffice(office);
    setNewCheckpoint(prev => ({ ...prev, officeCode }));
    setShowOfficeDropdown(false);
    setOfficeSearchTerm('');
  };

  const handleOfficeSearchChange = (e) => {
    setOfficeSearchTerm(e.target.value);
    setShowOfficeDropdown(true);
  };

  const handleCreateCheckpoint = async (e) => {
    e.preventDefault();
    
    if (!newCheckpoint.officeCode) {
      setError('Please select an office');
      return;
    }

    setCreating(true);
    
    try {
      const response = await fetch('/api/checkpoints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCheckpoint),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewCheckpoint({ name: '', description: '', officeCode: '' });
        setSelectedOffice(null);
        setOfficeSearchTerm('');
        fetchCheckpoints(); // Refresh the list
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create checkpoint');
      }
    } catch (error) {
      setError('Error creating checkpoint');
      console.error('Error:', error);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading checkpoints...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Checkpoints Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="mt-4 sm:mt-0 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200"
        >
          + Add New Checkpoint
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Search checkpoints..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      {/* Checkpoints Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Office Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {checkpoints.map((checkpoint) => (
              <tr key={checkpoint._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{checkpoint.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{checkpoint.description || 'No description'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{checkpoint.officeCode || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {new Date(checkpoint.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => router.push(`/admin/checkpoints/edit/${checkpoint._id}`)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(checkpoint._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {checkpoints.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No checkpoints found. <button 
            onClick={() => setShowCreateModal(true)} 
            className="text-green-600 hover:underline cursor-pointer"
          >
            Create one
          </button>
        </div>
      )}

      {/* Create Checkpoint Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Checkpoint</h2>
              <form onSubmit={handleCreateCheckpoint}>
                <div className="mb-4">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={newCheckpoint.name}
                    onChange={(e) => setNewCheckpoint({...newCheckpoint, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={newCheckpoint.description}
                    onChange={(e) => setNewCheckpoint({...newCheckpoint, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows="3"
                  />
                </div>
                
                {/* Office Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Office
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Search office..."
                      value={officeSearchTerm}
                      onChange={handleOfficeSearchChange}
                      onFocus={() => setShowOfficeDropdown(true)}
                      disabled={loadingOffices}
                    />
                    {loadingOffices && (
                      <p className="mt-1 text-xs text-gray-500">Loading offices...</p>
                    )}
                    
                    {showOfficeDropdown && filteredOffices.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        <div className="px-3 py-2 bg-gray-100 border-b border-gray-300">
                          <span className="text-sm font-medium text-gray-700">Customs Office</span>
                        </div>
                        {filteredOffices.map((office) => (
                          <div
                            key={office._id}
                            className="px-3 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
                            onClick={() => handleOfficeSelect(office.code)}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">{office.code}</span>
                              <span className="text-sm text-gray-600">{office.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Display selected office */}
                  {selectedOffice && (
                    <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Selected: </span>
                        {selectedOffice.code} - {selectedOffice.name}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewCheckpoint({ name: '', description: '', officeCode: '' });
                      setSelectedOffice(null);
                      setOfficeSearchTerm('');
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !newCheckpoint.officeCode}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors duration-200"
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}