'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {  FiFileText, FiHome, FiLogOut, FiPieChart} from 'react-icons/fi';
export default function CreatorLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const router = useRouter()
    const pathname = usePathname()

    const navItems = [
        { name: 'Dashboard', href: '/creator/dashboard', icon: <FiHome size={20} /> },
        { name: 'Seizures', href: '/creator/seizures', icon: <FiFileText size={20} /> },
        { name: 'Charts', href: '/creator/reports/charts', icon: <FiPieChart size={20} /> },
        { name: 'Create Seizure', href: '/creator/create', icon: <FiFileText size={20} /> },
    ]

    const fetchUserData = async () => {
        try {
            const response = await fetch('/api/auth/me');
            if (!response.ok)  return router.push('/login');

            const userData = await response.json();
            console.log(userData.user)
            setUser(userData.user);

            // Check if user is admin - only admins can access admin pages
            if (userData.user.role !== 'creator') {
                setError('You do not have permission to access admin pages');
                setLoading(false);

                // Redirect non-admin users after a delay
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
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        )
    }

    // Show error state for non-admin users
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

    // Only render the layout if user is admin and no errors
    if (!user || user.role !== 'creator') {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded max-w-md">
                        <p>Verifying permissions...</p>
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
                        <h1 className="text-xl font-bold">SeizureMS</h1>
                    ) : (
                        <div className="w-8 h-8 bg-green-600 rounded-full"></div>
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
                                        <summary className={`flex items-center p-3 rounded-lg cursor-pointer ${pathname.startsWith('/operations') ? 'bg-green-700' : 'hover:bg-green-700'}`}>
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
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        {sidebarOpen && (
                            <div className="ml-3">
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-green-200">{user.role}</p>
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
                            {navItems.find(item => pathname === item.href || (item.subItems?.some(sub => pathname === sub.href)))?.name || 'Dashboard'}
                        </h2>
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <button className="p-1 rounded-full hover:bg-gray-200">
                                    <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                                    🔔
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