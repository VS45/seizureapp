'use client';

import { useUser } from '@/lib/auth-client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Warehouse, 
  Users, 
  Shield, 
  FileText, 
  Building,
  Settings,
  LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';

const menuItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'armourer', 'officer'] },
  { href: '/armories', icon: Warehouse, label: 'Armories', roles: ['admin', 'armourer'] },
  { href: '/officers', icon: Users, label: 'Officers', roles: ['admin', 'armourer', 'officer'] },
  { href: '/patrols', icon: Shield, label: 'Patrol Teams', roles: ['admin', 'armourer'] },
  { href: '/distributions', icon: FileText, label: 'Distributions', roles: ['admin', 'armourer', 'officer'] },
  { href: '/offices', icon: Building, label: 'Offices', roles: ['admin'] },
  { href: '/reports', icon: FileText, label: 'Reports', roles: ['admin', 'armourer'] },
];

export function Sidebar() {
  const { user, logout, hasRole } = useUser();
  const pathname = usePathname();

  if (!user) return null;

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.some(role => hasRole(role))
  );

  return (
    <motion.div 
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="w-64 bg-green-600 shadow-lg flex flex-col "
    >
      {/* Logo */}
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-gray-800">Armory Management</h1>
        <p className="text-sm text-gray-600 mt-1">{user.unit}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center px-4 py-3 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-green-900'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t">
        <div className="flex items-center space-x-3 mb-4 p-2 rounded-lg bg-green-600">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user.role}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <Link
            href="/profile"
            className="flex items-center px-3 py-2 text-sm text-gray-600 rounded-lg hover:bg-gray-50"
          >
            <Settings className="w-4 h-4 mr-2" />
            Profile
          </Link>
          <button
            onClick={logout}
            className="flex items-center w-full px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>
    </motion.div>
  );
}