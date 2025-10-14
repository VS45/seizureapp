'use client';
import { useState, useEffect, useMemo } from 'react';
import { FiX, FiUser, FiMail, FiBriefcase, FiSave, FiEye, FiEyeOff } from 'react-icons/fi';

export default function EditUserModal({ isOpen, onClose, user, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    serviceNo: '',
    rank: '',
    officeCode: '',
    role: 'creator',
    isVerified: true
  });
  const [offices, setOffices] = useState([]);
  const [loadingOffices, setLoadingOffices] = useState(true);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOfficeDropdown, setShowOfficeDropdown] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');

  const ranks = [
    'CGC', 'DCG', 'ACG', 'CC', 'DC', 'AC', 'CSC', 'SC', 'DSC', 
    'ASC I', 'ASC II', 'PIC', 'SIC', 'IC', 'AIC', 'CA I', 'CA II', 'CA III', 'Other'
  ];

  const roles = [
    { value: 'creator', label: 'Creator' },
    { value: 'validator', label: 'Validator' },
    { value: 'analyst', label: 'Analyst' },
    { value: 'admin', label: 'Admin' },
    { value: 'legal', label: 'Legal' },
    { value: 'valuation', label: 'Valuation' },
    { value: 'dcrevenue', label: 'DC Revenue' },
    { value: 'dcenforcement', label: 'DC Enforcement' },
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
        }
      } catch (err) {
        console.error('Error loading offices:', err);
      } finally {
        setLoadingOffices(false);
      }
    };
    
    if (isOpen) {
      fetchOffices();
    }
  }, [isOpen]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        serviceNo: user.serviceNo || '',
        rank: user.rank || '',
        officeCode: user.office?.code || user.officeCode || '',
        role: user.role || 'creator',
        isVerified: user.isVerified !== false
      });
      setPassword('');
      setErrors({});
    }
  }, [user]);

  const filteredOffices = useMemo(() => {
    if (!searchTerm) return offices;
    return offices.filter(office => 
      office.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      office.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [offices, searchTerm]);

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.serviceNo) newErrors.serviceNo = 'Service number is required';
    if (!formData.rank) newErrors.rank = 'Rank is required';
    if (!formData.officeCode) newErrors.officeCode = 'Office is required';
    
    if (password && !/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/.test(password)) {
      newErrors.password = 'Password must contain 8+ chars, 1 uppercase, 1 number, 1 special char';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const updateData = { ...formData };
      if (password) {
        updateData.password = password;
      }
      
      await onSubmit(updateData);
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleOfficeSelect = (officeCode) => {
    setFormData(prev => ({ ...prev, officeCode }));
    setShowOfficeDropdown(false);
    setSearchTerm('');
  };

  const selectedOffice = offices.find(office => office.code === formData.officeCode);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-gray-200 p-4 sticky top-0 bg-white">
          <div className="flex items-center space-x-2">
            <FiUser className="text-blue-600 text-xl" />
            <h3 className="text-lg font-semibold text-gray-800">Edit User</h3>
            <span className="text-sm text-gray-500">({user.email})</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Service Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Number</label>
              <input
                type="text"
                name="serviceNo"
                value={formData.serviceNo}
                onChange={handleChange}
                className={`w-full p-2 border ${errors.serviceNo ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500`}
              />
              {errors.serviceNo && <p className="mt-1 text-sm text-red-600">{errors.serviceNo}</p>}
            </div>

            {/* Rank */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rank</label>
              <select
                name="rank"
                value={formData.rank}
                onChange={handleChange}
                className={`w-full p-2 border ${errors.rank ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">Select Rank</option>
                {ranks.map(rank => (
                  <option key={rank} value={rank}>{rank}</option>
                ))}
              </select>
              {errors.rank && <p className="mt-1 text-sm text-red-600">{errors.rank}</p>}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full p-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500`}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full p-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500`}
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Office */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Office</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search office..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setShowOfficeDropdown(true)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {showOfficeDropdown && filteredOffices.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredOffices.map(office => (
                      <div
                        key={office._id}
                        className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => handleOfficeSelect(office.code)}
                      >
                        {office.code} - {office.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedOffice && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: <strong>{selectedOffice.code} - {selectedOffice.name}</strong>
                </p>
              )}
              {errors.officeCode && <p className="mt-1 text-sm text-red-600">{errors.officeCode}</p>}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isVerified"
                  checked={formData.isVerified}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {formData.isVerified ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Password Reset */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reset Password (leave blank to keep current)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full p-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 pr-10`}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? <FiEyeOff className="text-gray-400" /> : <FiEye className="text-gray-400" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              {password && (
                <p className="mt-1 text-xs text-gray-500">
                  Password must contain: 8+ characters, 1 uppercase, 1 number, 1 special character
                </p>
              )}
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
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
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center disabled:opacity-50"
            >
              <FiSave className="mr-2" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}