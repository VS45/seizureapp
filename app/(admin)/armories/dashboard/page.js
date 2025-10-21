'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FiSearch, 
  FiFilter, 
  FiEye, 
  FiEdit, 
  FiPlus, 
  FiChevronDown, 
  FiChevronUp,
  FiShield,
  FiBox,
  FiAlertTriangle,
  FiCheckCircle
} from 'react-icons/fi';

export default function ArmoriesDashboard() {
  const router = useRouter();
  const [armories, setArmories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    unit: '',
    status: '',
    securityLevel: ''
  });
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchArmories();
  }, []);

  const fetchArmories = async () => {
    try {
      const response = await fetch('/api/armories');
      if (!response.ok) throw new Error('Failed to fetch armories');
      
      const data = await response.json();
      setArmories(data.armories);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching armories:', error);
      setLoading(false);
    }
  };

  // Filter and sort armories
  const filteredArmories = armories.filter(armory => {
    return (
      (searchTerm === '' || 
        armory.referenceID.toLowerCase().includes(searchTerm.toLowerCase()) ||
        armory.armoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        armory.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        armory.weapons.some(w => w.weaponType.toLowerCase().includes(searchTerm.toLowerCase()))
      ) &&
      (filters.unit === '' || armory.unit === filters.unit) &&
      (filters.status === '' || armory.status === filters.status) &&
      (filters.securityLevel === '' || armory.securityLevel === filters.securityLevel)
    );
  });

  // Sort armories
  const sortedArmories = [...filteredArmories].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedArmories.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedArmories.length / itemsPerPage);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (filterName, value) => {
    setFilters({ ...filters, [filterName]: value });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      unit: '',
      status: '',
      securityLevel: ''
    });
    setSearchTerm('');
  };

  const getUniqueValues = (key) => {
    const values = new Set();
    armories.forEach(armory => {
      if (armory[key]) values.add(armory[key]);
    });
    return Array.from(values).sort();
  };

  const getWeaponSummary = (armory) => {
    const serviceable = armory.weapons
      .filter(w => w.condition === 'serviceable')
      .reduce((sum, w) => sum + w.quantity, 0);
    const unserviceable = armory.weapons
      .filter(w => w.condition === 'unserviceable')
      .reduce((sum, w) => sum + w.quantity, 0);
    const missing = armory.weapons
      .filter(w => w.condition === 'missing')
      .reduce((sum, w) => sum + w.quantity, 0);
    
    return { serviceable, unserviceable, missing };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Armory Management</h1>
          <p className="text-gray-600">View and manage all armory inventory records</p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by reference, armory name, location, or weapon type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                <FiFilter className="mr-2" />
                Filters
                {showFilters ? <FiChevronUp className="ml-2" /> : <FiChevronDown className="ml-2" />}
              </button>
              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
              <Link
                href="/armories/create"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FiPlus className="mr-2" />
                New Armory
              </Link>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select
                  value={filters.unit}
                  onChange={(e) => handleFilterChange('unit', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Units</option>
                  {getUniqueValues('unit').map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="under_audit">Under Audit</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Security Level</label>
                <select
                  value={filters.securityLevel}
                  onChange={(e) => handleFilterChange('securityLevel', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Levels</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="maximum">Maximum</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center">
              <FiShield className="text-blue-600 text-xl mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-600">Total Armories</h3>
                <p className="text-2xl font-bold text-gray-800">{armories.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center">
              <FiBox className="text-green-600 text-xl mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-600">Total Weapons</h3>
                <p className="text-2xl font-bold text-gray-800">
                  {armories.reduce((total, armory) => total + (armory.totalWeapons || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center">
              <FiCheckCircle className="text-green-600 text-xl mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-600">Serviceable Weapons</h3>
                <p className="text-2xl font-bold text-gray-800">
                  {armories.reduce((total, armory) => total + (armory.serviceableWeapons || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex items-center">
              <FiAlertTriangle className="text-red-600 text-xl mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-600">Missing Weapons</h3>
                <p className="text-2xl font-bold text-gray-800">
                  {armories.reduce((total, armory) => {
                    const missing = armory.weapons
                      .filter(w => w.condition === 'missing')
                      .reduce((sum, w) => sum + w.quantity, 0);
                    return total + missing;
                  }, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Armories Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('referenceID')}
                  >
                    Reference ID
                    {sortConfig.key === 'referenceID' && (
                      sortConfig.direction === 'asc' ? <FiChevronUp className="inline ml-1" /> : <FiChevronDown className="inline ml-1" />
                    )}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('armoryName')}
                  >
                    Armory Name
                    {sortConfig.key === 'armoryName' && (
                      sortConfig.direction === 'asc' ? <FiChevronUp className="inline ml-1" /> : <FiChevronDown className="inline ml-1" />
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location & Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weapons Summary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Custodian
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    Status
                    {sortConfig.key === 'status' && (
                      sortConfig.direction === 'asc' ? <FiChevronUp className="inline ml-1" /> : <FiChevronDown className="inline ml-1" />
                    )}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('securityLevel')}
                  >
                    Security Level
                    {sortConfig.key === 'securityLevel' && (
                      sortConfig.direction === 'asc' ? <FiChevronUp className="inline ml-1" /> : <FiChevronDown className="inline ml-1" />
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.length > 0 ? (
                  currentItems.map((armory) => {
                    const weaponSummary = getWeaponSummary(armory);
                    return (
                      <tr key={armory._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{armory.referenceID}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{armory.armoryName}</div>
                          <div className="text-sm text-gray-500">{armory.armoryCode}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{armory.location}</div>
                          <div className="text-sm text-gray-500">{armory.unit}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="flex space-x-2 mb-1">
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                S: {weaponSummary.serviceable}
                              </span>
                              <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                                U: {weaponSummary.unserviceable}
                              </span>
                              {weaponSummary.missing > 0 && (
                                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                                  M: {weaponSummary.missing}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              Total: {weaponSummary.serviceable + weaponSummary.unserviceable + weaponSummary.missing}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{armory.currentCustodian?.name}</div>
                          <div className="text-sm text-gray-500">{armory.currentCustodian?.rank}</div>
                          <div className="text-xs text-gray-400">{armory.currentCustodian?.serviceNo}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            armory.status === 'active' ? 'bg-green-100 text-green-800' :
                            armory.status === 'under_audit' ? 'bg-yellow-100 text-yellow-800' :
                            armory.status === 'maintenance' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {armory.status?.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            armory.securityLevel === 'maximum' ? 'bg-red-100 text-red-800' :
                            armory.securityLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                            armory.securityLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {armory.securityLevel?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link
                              href={`/armories/${armory._id}`}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                              title="View Details"
                            >
                              <FiEye />
                            </Link>
                            <Link
                              href={`/armories/${armory._id}/edit`}
                              className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                              title="Edit Armory"
                            >
                              <FiEdit />
                            </Link>
                            <Link
                              href={`/armories/${armory._id}/handover`}
                              className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50"
                              title="Handover/Takeover"
                            >
                              <FiShield />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                      No armories found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(indexOfLastItem, sortedArmories.length)}
                    </span>{' '}
                    of <span className="font-medium">{sortedArmories.length}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}