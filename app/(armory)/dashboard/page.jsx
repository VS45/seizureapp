'use client';

import { useUser } from '@/lib/auth-client';
import { StatCard } from '@/components/cards/StatCard';
import { InventoryChart } from '@/components/charts/InventoryChart';
import { IssuanceChart } from '@/components/charts/IssuanceChart';
import { motion } from 'framer-motion';
import { 
  Warehouse, 
  Users, 
  Shield, 
  FileText, 
  AlertTriangle,
  CheckCircle 
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useUser();

  // Mock data - in real app, fetch from API
  const stats = {
    totalArmories: 24,
    totalOfficers: 156,
    totalPatrols: 12,
    issuedWeapons: 89,
    pendingRenewals: 8,
    overdueRenewals: 3
  };

  const recentActivities = [
    { id: 1, action: 'Weapon issued', officer: 'John Doe', time: '2 hours ago', type: 'issue' },
    { id: 2, action: 'Renewal completed', officer: 'Jane Smith', time: '4 hours ago', type: 'renewal' },
    { id: 3, action: 'Armory audit', officer: 'HQ Armory', time: '1 day ago', type: 'audit' },
    { id: 4, action: 'Equipment returned', officer: 'Mike Johnson', time: '1 day ago', type: 'return' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Armory Management System
        </h1>
        <p className="text-gray-600">
          Monitor weapons, track distributions, and manage renewals in one place.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <StatCard
          title="Total Armories"
          value={stats.totalArmories}
          icon={Warehouse}
          color="blue"
        />
        <StatCard
          title="Active Officers"
          value={stats.totalOfficers}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Patrol Teams"
          value={stats.totalPatrols}
          icon={Shield}
          color="purple"
        />
        <StatCard
          title="Issued Weapons"
          value={stats.issuedWeapons}
          icon={FileText}
          color="orange"
        />
        <StatCard
          title="Pending Renewals"
          value={stats.pendingRenewals}
          icon={AlertTriangle}
          color="yellow"
        />
        <StatCard
          title="Overdue Renewals"
          value={stats.overdueRenewals}
          icon={AlertTriangle}
          color="red"
        />
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <IssuanceChart />
        </motion.div>
        <motion.div variants={itemVariants}>
          <InventoryChart />
        </motion.div>
      </div>

      {/* Recent Activities */}
      <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activities</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg border">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${activity.type === 'issue' ? 'bg-blue-100 text-blue-600' : ''}
                  ${activity.type === 'renewal' ? 'bg-green-100 text-green-600' : ''}
                  ${activity.type === 'audit' ? 'bg-purple-100 text-purple-600' : ''}
                  ${activity.type === 'return' ? 'bg-gray-100 text-gray-600' : ''}
                `}>
                  {activity.type === 'renewal' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-500">by {activity.officer}</p>
                </div>
                <div className="text-sm text-gray-500">{activity.time}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
} 