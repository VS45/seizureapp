'use client';
import { useState, useEffect, useMemo } from 'react';
import { FiX, FiUserPlus, FiMail, FiLock, FiUser, FiSearch, FiChevronDown } from 'react-icons/fi';

export default function CreateUserModal({ isOpen, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    serviceNo: '',
    rank: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    officeCode: '',
    role: 'creator'
  });
  const [offices, setOffices] = useState([]);
  const [loadingOffices, setLoadingOffices] = useState(true);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOfficeDropdown, setShowOfficeDropdown] = useState(false);

  const ranks = [
    'CGC',
    'DCG',
    'ACG',
    'CC',
    'DC',
    'AC',
    'CSC',
    'SC',
    'DSC',
    'ASC I',
    'ASC II',
    'PIC',
    'SIC',
    'IC',
    'AIC',
    'CA I',
    'CA II',
    'CA III',
    'Other'
  ];

  const roles = [
    { value: 'creator', label: 'Creator' },
    { value: 'validator', label: 'Validator' },
    { value: 'analyst', label: 'Analyst' },
    { value: 'admin', label: 'Admin' },
    { value: 'legal', label: 'Legal' },
    { value: 'user', label: 'User' },
    { value: 'armourer', label: 'Armourer' }
  ];

  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const response = await fetch('/api/offices');
        const data = await response.json();
        if (response.ok) {
          setOffices(data.offices || data);
        } else {
          throw new Error(data.error || 'Failed to load offices');
        }
      } catch (err) {
        console.error('Error loading offices:', err);
        setErrors(prev => ({ ...prev, officeCode: 'Failed to load office list' }));
      } finally {
        setLoadingOffices(false);
      }
    };
    
    if (isOpen) {
      fetchOffices();
    }
  }, [isOpen]);

  // Filter offices based on search term
  const filteredOffices = useMemo(() => {
    if (!searchTerm) return offices;
    return offices.filter(office => 
      office.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      office.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [offices, searchTerm]);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.serviceNo) newErrors.serviceNo = 'Service number is required';
    if (!formData.rank) newErrors.rank = 'Rank is required';
    if (!formData.name) newErrors.name = 'Name is required';
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/.test(formData.password)) {
      newErrors.password = 'Password must contain 8+ chars, 1 uppercase, 1 number, 1 special char';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.officeCode) {
      newErrors.officeCode = 'Please select an office';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        serviceNo: formData.serviceNo,
        rank: formData.rank,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        office: formData.officeCode, // API expects 'office' field
        role: formData.role
      });
      onClose();
      // Reset form
      setFormData({
        serviceNo: '',
        rank: '',
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        officeCode: '',
        role: 'creator'
      });
      setSearchTerm('');
      setErrors({});
    } catch (error) {
      console.error('Error creating user:', error);
      setErrors({ submit: error.message || 'Failed to create user' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleOfficeSelect = (officeCode, officeName) => {
    setFormData(prev => ({ ...prev, officeCode }));
    setShowOfficeDropdown(false);
    setSearchTerm('');
    if (errors.officeCode) {
      setErrors(prev => ({ ...prev, officeCode: '' }));
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowOfficeDropdown(true);
  };

  const selectedOffice = offices.find(office => office.code === formData.officeCode);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-gray-200 p-4 sticky top-0 bg-white">
          <div className="flex items-center space-x-2">
            <FiUserPlus className="text-green-600 text-xl" />
            <h3 className="text-lg font-semibold text-gray-800">Create New User</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Service Number Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiUser className="text-gray-400" />
              </div>
              <input
                type="text"
                name="serviceNo"
                value={formData.serviceNo}
                onChange={handleChange}
                className={`pl-10 w-full p-2 border ${errors.serviceNo ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                placeholder="e.g., CG12345"
              />
            </div>
            {errors.serviceNo && <p className="mt-1 text-sm text-red-600">{errors.serviceNo}</p>}
          </div>

          {/* Rank Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rank</label>
            <div className="relative">
              <select
                name="rank"
                value={formData.rank}
                onChange={handleChange}
                className={`w-full p-2 border ${errors.rank ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none pr-8`}
              >
                <option value="">Select Rank</option>
                {ranks.map((rank) => (
                  <option key={rank} value={rank}>{rank}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <FiChevronDown className="text-gray-400" />
              </div>
            </div>
            {errors.rank && <p className="mt-1 text-sm text-red-600">{errors.rank}</p>}
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiUser className="text-gray-400" />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`pl-10 w-full p-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                placeholder="John Doe"
              />
            </div>
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="text-gray-400" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`pl-10 w-full p-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                placeholder="user@example.com"
              />
            </div>
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>

          {/* Office Search Field */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Office</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                className={`pl-10 w-full p-2 border ${errors.officeCode ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                placeholder="Search office by name or code..."
                value={searchTerm}
                onChange={handleSearchChange}
                onFocus={() => setShowOfficeDropdown(true)}
                disabled={loadingOffices}
              />
              {loadingOffices && (
                <p className="mt-1 text-xs text-gray-500">Loading offices...</p>
              )}
            </div>

            {/* Office Dropdown */}
            {showOfficeDropdown && filteredOffices.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                <div className="px-3 py-2 bg-gray-100 border-b border-gray-300">
                  <span className="text-sm font-medium text-gray-700">Customs Office</span>
                </div>
                {filteredOffices.map((office) => (
                  <div
                    key={office._id || office.code}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
                    onClick={() => handleOfficeSelect(office.code, office.name)}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{office.code}</span>
                      <span className="text-sm text-gray-600">{office.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Office Display */}
            {formData.officeCode && selectedOffice && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-700">
                  <span className="font-medium">Selected: </span>
                  {selectedOffice.code} - {selectedOffice.name}
                </p>
              </div>
            )}
            {errors.officeCode && <p className="mt-1 text-sm text-red-600">{errors.officeCode}</p>}
          </div>

          {/* Role Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <div className="relative">
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 appearance-none pr-8"
              >
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <FiChevronDown className="text-gray-400" />
              </div>
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-gray-400" />
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`pl-10 w-full p-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                placeholder="••••••••"
              />
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            <p className="mt-1 text-xs text-gray-500">
              Must contain: 8+ characters, 1 uppercase, 1 number, 1 special character
            </p>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-gray-400" />
              </div>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`pl-10 w-full p-2 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500`}
                placeholder="••••••••"
              />
            </div>
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loadingOffices}
              className={`px-4 py-2 rounded-lg text-white ${isSubmitting ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'} flex items-center`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <FiUserPlus className="mr-2" />
                  Create User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}