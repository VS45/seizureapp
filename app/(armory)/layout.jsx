'use client';

import { useUser } from '@/lib/auth-client';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const menuItems = [
  { 
    href: '/dashboard', 
    icon: LayoutDashboard, 
    label: 'Dashboard', 
    roles: ['admin', 'armourer', 'officer'] 
  },
  { 
    label: 'Armory Management',
    icon: Warehouse,
    roles: ['admin', 'armourer'],
    submenu: [
      { href: '/armories', icon: Warehouse, label: 'All Armories' },
      { href: '/armories/create', icon: Plus, label: 'Create New Armory' },
      { href: '/armories/manage-inventory', icon: Package, label: 'Manage Inventory' }
    ]
  },
  { 
    href: '/officers', 
    icon: Users, 
    label: 'Officers', 
    roles: ['admin', 'armourer', 'officer'] 
  },
  { 
    href: '/patrols', 
    icon: Shield, 
    label: 'Patrol Teams', 
    roles: ['admin', 'armourer'] 
  },
  { 
    href: '/distributions', 
    icon: FileText, 
    label: 'Distributions', 
    roles: ['admin', 'armourer', 'officer'] 
  },
  { 
    href: '/offices', 
    icon: Building, 
    label: 'Offices', 
    roles: ['admin'] 
  },
  { 
    href: '/reports', 
    icon: FileText, 
    label: 'Reports', 
    roles: ['admin', 'armourer'] 
  },
];

export default function ArmoryLayout({ children }) {
  const { user, logout, hasRole } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openSubmenus, setOpenSubmenus] = useState(new Set(['Armory Management']));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    // Check if user has required role
    const allowedRoles = ['admin', 'armourer', 'officer'];
    if (!allowedRoles.includes(user.role)) {
      setError('You do not have permission to access the Armory Management System');
      setLoading(false);

      setTimeout(() => {
        router.push('/unauthorized');
      }, 3000);
      return;
    }

    setLoading(false);
  }, [user, router]);

  const toggleSubmenu = (label) => {
    const newOpenSubmenus = new Set(openSubmenus);
    if (newOpenSubmenus.has(label)) {
      newOpenSubmenus.delete(label);
    } else {
      newOpenSubmenus.add(label);
    }
    setOpenSubmenus(newOpenSubmenus);
  };

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.some(role => hasRole(role))
  );

  const isActive = (href) => pathname === href;

  const isSubmenuActive = (submenu) => {
    return submenu?.some(item => isActive(item.href)) || false;
  };

  // Get current page title
  const getCurrentPageTitle = () => {
    // Check main menu items
    const currentMainItem = filteredMenuItems.find(item => 
      item.href && isActive(item.href)
    );
    if (currentMainItem) return currentMainItem.label;

    // Check submenu items
    for (const item of filteredMenuItems) {
      if (item.submenu) {
        const currentSubItem = item.submenu.find(subItem => isActive(subItem.href));
        if (currentSubItem) return currentSubItem.label;
      }
    }

    return 'Armory Dashboard';
  };

  const renderMenuItem = (item, depth = 0) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isSubmenuOpen = openSubmenus.has(item.label);
    const Icon = item.icon;

    if (hasSubmenu) {
      const isActiveSubmenu = isSubmenuActive(item.submenu);

      return (
        <div key={item.label}>
          <motion.div
            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            className={`
              flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors
              ${isActiveSubmenu ? 'bg-green-700' : 'text-green-100 hover:text-white hover:bg-green-700'}
            `}
            onClick={() => toggleSubmenu(item.label)}
          >
            <div className="flex items-center space-x-3">
              <Icon className="w-5 h-5" />
              {sidebarOpen && <span className="font-medium">{item.label}</span>}
            </div>
            {sidebarOpen && (
              <motion.div
                animate={{ rotate: isSubmenuOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            )}
          </motion.div>

          <AnimatePresence>
            {hasSubmenu && isSubmenuOpen && sidebarOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="ml-4 border-l-2 border-green-600 border-opacity-30 pl-2 space-y-1">
                  {item.submenu.map((subItem) => renderMenuItem(subItem, depth + 1))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    // Regular menu item
    const active = isActive(item.href);
    
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`
          flex items-center p-3 rounded-xl transition-colors group
          ${depth > 0 ? 'ml-4' : ''}
          ${active 
            ? 'bg-green-600 text-white shadow-lg' 
            : 'text-green-100 hover:text-white hover:bg-green-700'
          }
        `}
      >
        <Icon className="w-5 h-5" />
        {sidebarOpen && (
          <span className="ml-3 font-medium">{item.label}</span>
        )}
        {active && sidebarOpen && (
          <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
        )}
      </Link>
    );
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
    );
  }

  // Show error state for unauthorized users
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-red-600 h-2 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 3, ease: 'linear' }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">Redirecting to unauthorized page...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ 
          width: sidebarOpen ? 256 : 80,
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="bg-green-800 shadow-2xl flex flex-col relative z-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-green-700">
          {sidebarOpen ? (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">ArmoryMS</h1>
                <p className="text-green-200 text-sm">Secure Management</p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg mx-auto">
              <Shield className="w-6 h-6 text-white" />
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-green-200 hover:text-white hover:bg-green-700 rounded-lg transition-colors"
          >
            {sidebarOpen ? <ChevronRight className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredMenuItems.map((item) => renderMenuItem(item))}
        </nav>

        {/* User Profile & Logout */}
        <div className="p-4 border-t border-green-700">
          <div className={`flex items-center space-x-3 mb-4 p-3 bg-green-700 rounded-xl ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {user.name}
                </p>
                <p className="text-green-200 text-xs truncate capitalize">
                  {user.role} • {user.unit || 'Default Unit'}
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
                <Settings className="w-4 h-4 mr-2" />
                Profile
              </Link>
              <button
                onClick={logout}
                className="w-full flex items-center px-3 py-2 text-red-200 hover:text-red-100 hover:bg-red-900 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </motion.div>

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
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    {user.unit || 'Main Armory'}
                  </span>
                </div>

                {/* Notifications */}
                <button className="relative p-2 text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-xl transition-colors">
                  <Bell className="w-5 h-5" />
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
                  {user.role.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}