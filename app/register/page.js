'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOfficeDropdown, setShowOfficeDropdown] = useState(false);
  const router = useRouter();

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
    if (!searchTerm) return offices;
    return offices.filter(office => 
      office.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      office.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [offices, searchTerm]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOfficeSelect = (officeCode) => {
    setFormData(prev => ({ ...prev, officeCode }));
    setShowOfficeDropdown(false);
    setSearchTerm('');
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowOfficeDropdown(true);
  };

  const validatePassword = (password) => {
    const regex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    return regex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!validatePassword(formData.password)) {
      setError('Password must contain at least 8 characters, one uppercase letter, one number, and one special character');
      setLoading(false);
      return;
    }

    if (!formData.officeCode) {
      setError('Please select an office');
      setLoading(false);
      return;
    }

    if (!formData.rank) {
      setError('Please select a rank');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceNo: formData.serviceNo,
          rank: formData.rank,
          name: formData.name,
          email: formData.email,
          password: formData.password,
          officeCode: formData.officeCode,
          role: formData.role
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Redirect to verification page or show success message
      router.push('/verify?email=' + encodeURIComponent(formData.email));
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const selectedOffice = offices.find(office => office.code === formData.officeCode);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create a new account
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="serviceNo" className="sr-only">Service Number</label>
              <input
                id="serviceNo"
                name="serviceNo"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Service Number"
                value={formData.serviceNo}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="rank" className="sr-only">Rank</label>
              <select
                id="rank"
                name="rank"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                value={formData.rank}
                onChange={handleChange}
              >
                <option value="">Select Rank</option>
                {ranks.map((rank) => (
                  <option key={rank} value={rank}>
                    {rank}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="name" className="sr-only">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            
            {/* Custom Office Search Dropdown */}
            <div className="relative">
              <label htmlFor="officeSearch" className="sr-only">Search Office</label>
              <input
                id="officeSearch"
                type="text"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Search Office..."
                value={searchTerm}
                onChange={handleSearchChange}
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
              
              {/* Display selected office */}
              {formData.officeCode && selectedOffice && (
                <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Selected: </span>
                    {selectedOffice.code} - {selectedOffice.name}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="role" className="sr-only">Role</label>
              <select
                id="role"
                name="role"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="creator">Creator</option>
                <option value="validator">Validator</option>
                <option value="admin">Admin</option>
                <option value="legal">Legal</option>
                <option value="user">User</option>
                <option value="armourer">Armourer</option>
              </select>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || loadingOffices}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>

        <div className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}