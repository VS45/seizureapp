'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LocationList from '@/components/LocationList';
import StatsCard from '@/components/StatsCard';

export default function LocationsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    userLocations: 0
  });
  const router = useRouter();
  
  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        // Fetch user data
        const userResponse = await fetch('/api/auth/me');
        const userData = await userResponse.json();
        
        if (!userResponse.ok) {
          throw new Error(userData.error || 'Failed to fetch user');
        }
        
        setUser(userData.user);
        
        // Fetch locations data
        const locationsResponse = await fetch('/api/checkpoints');
        const locationsData = await locationsResponse.json();
        
        if (!locationsResponse.ok) {
          throw new Error(locationsData.error || 'Failed to fetch locations');
        }
        
        setLocations(locationsData.locations);
        
        // Calculate stats
        const userLocationsCount = locationsData.locations.filter(
          loc => loc.user._id === userData.user._id
        ).length;
        
        setStats({
          total: locationsData.pagination.total,
          userLocations: userLocationsCount
        });
        
      } catch (error) {
        console.error('Error fetching data:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserAndData();
  }, [router]);
  
  const handleCreateLocation = () => {
    router.push('/checkpoints/create');
  };
  
  const handleDeleteLocation = async (locationId) => {
    try {
      const response = await fetch(`/api/checkpoints/${locationId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete location');
      }
      
      // Refresh the locations list
      const locationsResponse = await fetch('/api/checkpoints');
      const locationsData = await locationsResponse.json();
      
      if (locationsResponse.ok) {
        setLocations(locationsData.locations);
        setStats(prev => ({
          ...prev,
          total: locationsData.pagination.total,
          userLocations: locationsData.locations.filter(
            loc => loc.user._id === user._id
          ).length
        }));
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      alert('Failed to delete location');
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Checkpoint Management</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">{user.name}</span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              user.role === 'admin' ? 'bg-green-100 text-green-800' :
              user.role === 'creator' ? 'bg-gray-100 text-gray-800' :
              'bg-red-100 text-red-800'
            }`}>
              {user.role}
            </span>
            <button 
              onClick={() => {
                fetch('/api/auth/logout', { method: 'POST' })
                  .then(() => router.push('/login'));
              }}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatsCard 
              title="Total Locations" 
              value={stats.total.toString()} 
              trend="up" 
              bgColor="bg-green-50"
              textColor="text-green-800"
              borderColor="border-green-200"
            />
            <StatsCard 
              title="My Locations" 
              value={stats.userLocations.toString()} 
              trend="up" 
              bgColor="bg-blue-50"
              textColor="text-blue-800"
              borderColor="border-blue-200"
            />
            <StatsCard 
              title="Active Locations" 
              value={(stats.total - 2).toString()} 
              trend="stable" 
              bgColor="bg-yellow-50"
              textColor="text-yellow-800"
              borderColor="border-yellow-200"
            />
            <StatsCard 
              title="Recent Additions" 
              value="5" 
              trend="up" 
              bgColor="bg-purple-50"
              textColor="text-purple-800"
              borderColor="border-purple-200"
            />
          </div>
          
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="px-4 py-4 sm:px-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-800">Checkpoints</h3>
              <button
                onClick={handleCreateLocation}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Create New Checkpoint
              </button>
            </div>
            <LocationList 
              locations={locations} 
              userRole={user} 
              onDeleteLocation={handleDeleteLocation}
            />
          </div>
        </div>
      </main>
    </div>
  );
}