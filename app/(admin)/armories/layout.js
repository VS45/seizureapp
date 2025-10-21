'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
    FiArchive, 
    FiBarChart2, 
    FiFileText, 
    FiHome, 
    FiLogOut, 
    FiMapPin, 
    FiPieChart, 
    FiShield, 
    FiUsers,
    FiUserPlus,
    FiTool,
    FiAlertTriangle,
    FiCheckCircle
} from 'react-icons/fi';

export default function ArmoryLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const router = useRouter()
    const pathname = usePathname()

    const navItems = [
        { name: 'Dashboard', href: '/armories/dashboard', icon: <FiHome size={20} /> },
        {
            name: 'Inventory Management',
            icon: <FiArchive size={18} />,
            subItems: [
                { name: 'Weapons', href: '/armories/weapons', icon: <FiShield size={20} /> },
                { name: 'Ammunition', href: '/armories/ammunition', icon: <FiAlertTriangle size={20} /> },
                { name: 'Equipment', href: '/armories/equipment', icon: <FiTool size={20} /> },
                { name: 'Other Items', href: '/armories/other-items', icon: <FiArchive size={20} /> },
            ]
        },
        /* {
            name: 'Operations',
            icon: <FiTool size={18} />,
            subItems: [
                { name: 'Handover/Takeover', href: '/armories/handover', icon: <FiUsers size={20} /> },
                { name: 'Maintenance Log', href: '/armories/maintenance', icon: <FiTool size={20} /> },
                { name: 'Audit Records', href: '/armories/audits', icon: <FiCheckCircle size={20} /> },
            ]
        }, */
        { name: 'Armory Records', href: '/armories/records', icon: <FiFileText size={20} /> },
        { name: 'Reports', href: '/armories/reports', icon: <FiBarChart2 size={20} /> },
        { name: 'Analytics', href: '/armories/analytics', icon: <FiPieChart size={20} /> },
    /*     { name: 'User Management', href: '/armories/users', icon: <FiUsers size={20} /> }, */
        { name: 'Add New Armory', href: '/armories/create', icon: <FiUserPlus size={20} /> },
    ]

    const fetchUserData = async () => {
        try {
            const response = await fetch('/api/auth/me');
            if (!response.ok) return router.push('/login');

            const userData = await response.json();
            console.log(userData.user)
            setUser(userData.user);

            // Check if user has armory role - only armory users can access armory pages
            if (userData.user.role !== 'armourer') {
                setError('You do not have permission to access armory management pages');
                setLoading(false);

                // Redirect non-armory users after a delay
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

    // Show loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading Armory System...</p>
                </div>
            </div>
        )
    }

    // Show error state for non-armory users
    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
                        <p className="font-bold">Access Denied</p>
                        <p className="mt-2">{error}</p>
                        <p className="mt-2 text-sm">Redirecting...</p>
                    </div>
                </div>
            </div>
        )
    }

    // Only render the layout if user has armory role and no errors
    if (!user || user.role !== 'armourer') {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded max-w-md">
                        <p>Verifying armory permissions...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-green-800 text-white transition-all duration-300 flex flex-col`}>
                <div className="p-4 flex items-center justify-between border-b border-green-700">
                    {sidebarOpen ? (
                        <h1 className="text-xl font-bold">ArmoryMS</h1>
                    ) : (
                        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                            <FiShield size={16} />
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-1 rounded-lg hover:bg-green-700"
                    >
                        {sidebarOpen ? '◀' : '▶'}
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto">
                    <ul className="space-y-1 p-2">
                        {navItems.map((item) => (
                            <li key={item.name}>
                                {item.href ? (
                                    <a
                                        href={item.href}
                                        className={`flex items-center p-3 rounded-lg ${pathname === item.href ? 'bg-green-700' : 'hover:bg-green-700'}`}
                                    >
                                        <span className="mr-3">{item.icon}</span>
                                        {sidebarOpen && <span>{item.name}</span>}
                                    </a>
                                ) : (
                                    <details className="group">
                                        <summary className={`flex items-center p-3 rounded-lg cursor-pointer ${pathname.startsWith('/armories/' + item.name.toLowerCase().replace(' ', '-')) ? 'bg-green-700' : 'hover:bg-green-700'}`}>
                                            <span className="mr-3">{item.icon}</span>
                                            {sidebarOpen && (
                                                <>
                                                    <span>{item.name}</span>
                                                    <span className="ml-auto transition-transform group-open:rotate-180">▼</span>
                                                </>
                                            )}
                                        </summary>
                                        <ul className="ml-4 mt-1 space-y-1">
                                            {item.subItems?.map((subItem) => (
                                                <li key={subItem.name}>
                                                    <a
                                                        href={subItem.href}
                                                        className={`flex items-center p-2 rounded-lg text-sm ${pathname === subItem.href ? 'bg-green-600' : 'hover:bg-green-600'}`}
                                                    >
                                                        {subItem.icon && <span className="mr-2">{subItem.icon}</span>}
                                                        {sidebarOpen && <span>{subItem.name}</span>}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </details>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>

                <div className="p-4 border-t border-green-700">
                    <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                            {user?.name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        {sidebarOpen && (
                            <div className="ml-3">
                                <p className="font-medium">{user.name || 'Armory User'}</p>
                                <p className="text-sm text-green-200 capitalize">{user.role || 'armory'}</p>
                                {user.unit && (
                                    <p className="text-xs text-green-300">{user.unit}</p>
                                )}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleLogout}
                        className={`mt-4 flex items-center w-full p-2 rounded-lg hover:bg-red-600 ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
                    >
                        <FiLogOut size={20} />
                        {sidebarOpen && <span className="ml-2">Logout</span>}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <header className="bg-white shadow-sm">
                    <div className="px-6 py-4 flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-gray-800">
                            {navItems.find(item => 
                                pathname === item.href || 
                                (item.subItems?.some(sub => pathname === sub.href))
                            )?.name || 'Armory Dashboard'}
                        </h2>
                        <div className="flex items-center space-x-4">
                            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                {user.unit || 'Main Armory'}
                            </div>
                            <div className="relative">
                                <button className="p-2 rounded-full hover:bg-gray-200">
                                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
                                    <FiAlertTriangle size={20} className="text-gray-600" />
                                </button>
                            </div>
                        </div>
                    </div>
                </header>
                <main className="p-6">{children}</main>
            </div>
        </div>
    )
}