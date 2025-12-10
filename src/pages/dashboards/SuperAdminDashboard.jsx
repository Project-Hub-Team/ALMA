import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { MdPeople, MdSchool, MdMenuBook, MdAttachMoney, MdTrendingUp, MdPersonAdd, MdSettings, MdSecurity, MdConfirmationNumber } from 'react-icons/md';
import { getAllStudents, getAllTeachers, readAllRecords } from '../../utils/database';
import LoadingSpinner from '../../components/LoadingSpinner';

/**
 * Super Admin Dashboard
 * Full system overview and control
 */
const SuperAdminDashboard = () => {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalAdmins: 0,
    activeVouchers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [studentsResult, teachersResult, adminsResult, vouchersResult] = await Promise.all([
        getAllStudents(),
        getAllTeachers(),
        readAllRecords('admins'),
        readAllRecords('vouchers')
      ]);

      setStats({
        totalStudents: studentsResult.data?.length || 0,
        totalTeachers: teachersResult.data?.length || 0,
        totalAdmins: adminsResult.data?.length || 0,
        activeVouchers: vouchersResult.data?.filter(v => !v.used).length || 0
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Super Admin Dashboard">
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: MdPeople,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Total Teachers',
      value: stats.totalTeachers,
      icon: MdSchool,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Total Admins',
      value: stats.totalAdmins,
      icon: MdPersonAdd,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'Active Vouchers',
      value: stats.activeVouchers,
      icon: MdMenuBook,
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    }
  ];

  return (
    <DashboardLayout title="Super Admin Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            Welcome back, {userProfile?.displayName}!
          </h2>
          <p className="text-primary-100">
            You have full control over the system. Manage settings, users, and monitor all activities.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                    <Icon className="text-white" size={24} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h3 className="card-header">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left">
              <MdSettings className="text-primary-600 mb-2" size={24} />
              <h4 className="font-semibold text-gray-800">System Settings</h4>
              <p className="text-sm text-gray-600 mt-1">Configure school details and preferences</p>
            </button>
            
            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left">
              <MdPeople className="text-primary-600 mb-2" size={24} />
              <h4 className="font-semibold text-gray-800">Manage Admins</h4>
              <p className="text-sm text-gray-600 mt-1">Add or remove administrator accounts</p>
            </button>
            
            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left">
              <MdMenuBook className="text-primary-600 mb-2" size={24} />
              <h4 className="font-semibold text-gray-800">Generate Vouchers</h4>
              <p className="text-sm text-gray-600 mt-1">Create new student registration vouchers</p>
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="card-header">Recent Activities</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <MdPersonAdd className="text-green-600" size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">New student registered</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <MdSchool className="text-blue-600" size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">New teacher added</p>
                    <p className="text-xs text-gray-500">5 hours ago</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <MdSettings className="text-purple-600" size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">System settings updated</p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="card-header">System Health</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Database</span>
                  <span className="text-green-600 font-medium">Healthy</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '98%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Storage</span>
                  <span className="text-blue-600 font-medium">Good</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Authentication</span>
                  <span className="text-green-600 font-medium">Active</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SuperAdminDashboard;
