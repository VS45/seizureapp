'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  LayoutDashboard, 
  Warehouse, 
  Users, 
  Shield, 
  FileText, 
  Building,
  Settings,
  LogOut,
  Menu,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Bell,
  Plus,
  Package,
  Home,
  Archive,
  BarChart2,
  UserPlus,
  FiShield,
  FiAlertTriangle,
  FiTool,
  FiCheckCircle
} from 'lucide-react'

export default function ArmoryLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openSubmenus, setOpenSubmenus] = useState(new Set(['Armory Management']))
  const router = useRouter()
  const pathname = usePathname()

  const navItems = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: <LayoutDashboard size={20} />,
      roles: ['admin', 'armourer', 'officer']
    },
    {
      name: 'Armory Management',
      icon: <Warehouse size={18} />,
      roles: ['admin', 'armourer'],
      subItems: [
        { name: 'All Armories', href: '/armory/armories', icon: <Warehouse size={20} /> },
        { name: 'Create New Armory', href: '/armory/armories/create', icon: <Plus size={20} /> },
        { name: 'Add Weapons', href: '/armory/armories/weapons/create', icon: <Plus size={20} /> },
        { name: 'Manage Inventory', href: '/armory/armories/manage-inventory', icon: <Package size={20} /> },
      ]
    },
    { 
      name: 'Officers', 
      href: '/armory/officers', 
      icon: <Users size={20} />,
      roles: ['admin', 'armourer', 'officer']
    },
    { 
      name: 'Patrol Teams', 
      href: '/armory/patrols', 
      icon: <Shield size={20} />,
      roles: ['admin', 'armourer']
    },
    { 
      name: 'Distributions', 
      href: '/armory/distributions', 
      icon: <FileText size={20} />,
      roles: ['admin', 'armourer', 'officer']
    },
    { 
      name: 'Offices', 
      href: '/armory/offices', 
      icon: <Building size={20} />,
      roles: ['admin']
    },
    { 
      name: 'Reports', 
      href: '/armory/reports', 
      icon: <FileText size={20} />,
      roles: ['admin', 'armourer']
    },
  ]

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        router.push('/login');
        return;
      }

      const userData = await response.json();
      setUser(userData.user);

      // Check if user has required role
      const allowedRoles = ['admin', 'armourer', 'officer'];
      if (!allowedRoles.includes(userData.user.role)) {
        setError('You do not have permission to access the Armory Management System');
        setLoading(false);

        setTimeout(() => {
          router.push('/unauthorized');
        }, 2000);
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching user:', error);
      setError('Authentication error. Please login again.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const toggleSubmenu = (name) => {
    const newOpenSubmenus = new Set(openSubmenus);
    if (newOpenSubmenus.has(name)) {
      newOpenSubmenus.delete(name);
    } else {
      newOpenSubmenus.add(name);
    }
    setOpenSubmenus(newOpenSubmenus);
  };

  const isActive = (href) => pathname === href;
  const isSubmenuActive = (subItems) => subItems?.some(item => isActive(item.href)) || false;

  // Filter menu items based on user role
  const filteredNavItems = navItems.filter(item => 
    !user ? false : item.roles.includes(user.role)
  );

  // Get current page title
  const getCurrentPageTitle = () => {
    const currentMainItem = filteredNavItems.find(item => 
      item.href && isActive(item.href)
    );
    if (currentMainItem) return currentMainItem.name;

    for (const item of filteredNavItems) {
      if (item.subItems) {
        const currentSubItem = item.subItems.find(subItem => isActive(subItem.href));
        if (currentSubItem) return currentSubItem.name;
      }
    }

    return 'Armory Dashboard';
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-800 font-semibold">Loading Armory System...</p>
        </div>
      </div>
    )
  }

  // Show error state for unauthorized users
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-red-600 h-2 rounded-full w-full transition-all duration-3000"></div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Redirecting to unauthorized page...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-green-800 shadow-2xl text-white transition-all duration-300 flex flex-col relative z-10`}>
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b border-green-700">
          {sidebarOpen ? (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield size={24} />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">ArmoryMS</h1>
                <p className="text-green-200 text-sm">Secure Management</p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg mx-auto">
              <Shield size={24} />
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-green-200 hover:text-white hover:bg-green-700 rounded-lg transition-colors"
          >
            {sidebarOpen ? <ChevronRight size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <ul className="space-y-2">
            {filteredNavItems.map((item) => (
              <li key={item.name}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className={`flex items-center p-3 rounded-xl transition-colors ${isActive(item.href) ? 'bg-green-600 text-white shadow-lg' : 'text-green-100 hover:text-white hover:bg-green-700'}`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {sidebarOpen && <span className="font-medium">{item.name}</span>}
                    {isActive(item.href) && sidebarOpen && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </Link>
                ) : (
                  <div>
                    <div
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${isSubmenuActive(item.subItems) ? 'bg-green-700' : 'text-green-100 hover:text-white hover:bg-green-700'}`}
                      onClick={() => toggleSubmenu(item.name)}
                    >
                      <div className="flex items-center space-x-3">
                        <span>{item.icon}</span>
                        {sidebarOpen && <span className="font-medium">{item.name}</span>}
                      </div>
                      {sidebarOpen && (
                        <ChevronDown size={16} className={`transition-transform ${openSubmenus.has(item.name) ? 'rotate-180' : ''}`} />
                      )}
                    </div>

                    {item.subItems && openSubmenus.has(item.name) && sidebarOpen && (
                      <div className="ml-4 border-l-2 border-green-600 border-opacity-30 pl-2 space-y-1 mt-1">
                        {item.subItems.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className={`flex items-center p-2 rounded-lg text-sm ${isActive(subItem.href) ? 'bg-green-600 text-white' : 'text-green-100 hover:text-white hover:bg-green-600'}`}
                          >
                            {subItem.icon && <span className="mr-2">{subItem.icon}</span>}
                            <span>{subItem.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-green-700">
          <div className={`flex items-center ${sidebarOpen ? 'space-x-3 mb-4 p-3 bg-green-700 rounded-xl' : 'justify-center'}`}>
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {user.name || 'Armory User'}
                </p>
                <p className="text-green-200 text-xs truncate capitalize">
                  {user.role || 'user'} • {user.unit || 'Default Unit'}
                </p>
              </div>
            )}
          </div>

          {sidebarOpen && (
            <div className="space-y-1">
              <Link
                href="/profile"
                className="flex items-center px-3 py-2 text-sm text-green-200 rounded-lg hover:bg-green-700 hover:text-white transition-colors"
              >
                <Settings size={16} className="mr-2" />
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-red-200 hover:text-red-100 hover:bg-red-900 rounded-xl transition-colors"
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {getCurrentPageTitle()}
                </h2>
                <p className="text-gray-600 mt-1">
                  {getCurrentPageTitle() === 'Armory Dashboard' 
                    ? 'Welcome to Armory Management System' 
                    : `Manage ${getCurrentPageTitle().toLowerCase()}`
                  }
                </p>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Unit Badge */}
                <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-xl border border-green-200">
                  <Shield size={16} className="text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    {user.unit || 'Main Armory'}
                  </span>
                </div>

                {/* Notifications */}
                <button className="relative p-2 text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-xl transition-colors">
                  <Bell size={20} />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                    3
                  </span>
                </button>

                {/* User Role Badge */}
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                  user.role === 'admin' ? 'bg-red-100 text-red-800 border-red-200' :
                  user.role === 'armourer' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                  'bg-green-100 text-green-800 border-green-200'
                }`}>
                  {user.role?.toUpperCase() || 'USER'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="transition-all duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}