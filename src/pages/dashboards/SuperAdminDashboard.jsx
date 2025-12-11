import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MdPeople, MdSchool, MdMenuBook, MdAttachMoney, MdTrendingUp, MdPersonAdd, MdSettings, MdSecurity, MdConfirmationNumber } from 'react-icons/md';
import { getAllStudents } from '../../Controller/studentsController';
import { getAllTeachers } from '../../Controller/teachersController';
import { readAllRecords } from '../../utils/database';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

/**
 * Super Admin Dashboard
 * Full system overview and control
 */
const SuperAdminDashboard = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalAdmins: 0,
    activeVouchers: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [studentsResult, teachersResult, adminsResult, vouchersResult, usersResult] = await Promise.all([
        getAllStudents(),
        getAllTeachers(),
        readAllRecords('admins').catch(() => ({ success: true, data: [] })),
        readAllRecords('vouchers').catch(() => ({ success: true, data: [] })),
        readAllRecords('users').catch(() => ({ success: true, data: [] }))
      ]);

      // Count users by role (primary source)
      let studentCount = 0;
      let teacherCount = 0;
      let adminCount = 0;

      if (usersResult.success && usersResult.data) {
        studentCount = usersResult.data.filter(u => u.role === 'student').length;
        teacherCount = usersResult.data.filter(u => u.role === 'teacher').length;
        adminCount = usersResult.data.filter(u => u.role === 'admin' || u.role === 'super_admin').length;
      }

      // Fallback to dedicated tables if users table is empty
      if (studentCount === 0 && studentsResult.data?.length > 0) {
        studentCount = studentsResult.data.length;
      }
      if (teacherCount === 0 && teachersResult.data?.length > 0) {
        teacherCount = teachersResult.data.length;
      }
      if (adminCount === 0 && adminsResult.data?.length > 0) {
        adminCount = adminsResult.data.length;
      }

      const newStats = {
        totalStudents: studentCount,
        totalTeachers: teacherCount,
        totalAdmins: adminCount,
        activeVouchers: (vouchersResult.success && vouchersResult.data) ? vouchersResult.data.filter(v => !v.used && v.status === 'unused').length : 0
      };

      setStats(newStats);

      // Get recent activities from users table
      const activities = [];
      
      if (usersResult.success && usersResult.data) {
        // Recent students
        const recentStudents = usersResult.data
          .filter(u => u.role === 'student')
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
          .slice(0, 3);
        
        recentStudents.forEach(student => {
          activities.push({
            type: 'student',
            message: `New student registered: ${student.displayName || student.email}`,
            timestamp: student.createdAt,
            icon: MdPersonAdd,
            color: 'green'
          });
        });

        // Recent teachers
        const recentTeachers = usersResult.data
          .filter(u => u.role === 'teacher')
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
          .slice(0, 2);
        
        recentTeachers.forEach(teacher => {
          activities.push({
            type: 'teacher',
            message: `New teacher added: ${teacher.displayName || teacher.email}`,
            timestamp: teacher.createdAt,
            icon: MdSchool,
            color: 'blue'
          });
        });
      }

      // Sort by timestamp and take last 5
      activities.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setRecentActivities(activities.slice(0, 5));

    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    switch(action) {
      case 'settings':
        navigate('/super-admin/settings');
        break;
      case 'admins':
        navigate('/super-admin/admins');
        break;
      case 'vouchers':
        navigate('/super-admin/vouchers');
        break;
      default:
        break;
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Recently';
    
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    return `${days} day${days !== 1 ? 's' : ''} ago`;
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
      color: 'bg-green-500',
      textColor: 'text-green-600'
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
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Active Vouchers',
      value: stats.activeVouchers,
      icon: MdMenuBook,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    }
  ];

  return (
    <DashboardLayout title="Super Admin Dashboard">
      <div 
        className="space-y-6 min-h-screen bg-cover bg-center bg-fixed"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.90), rgba(255, 255, 255, 0.90)), url('/dashboard welcome banner.jpeg')`
        }}
      >
        {/* Welcome Section */}
        <div 
          className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white bg-cover bg-center relative overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(rgba(22, 163, 74, 0.85), rgba(21, 128, 61, 0.85)), url('/dashboard welcome banner.jpeg')`
          }}
        >
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">
              Welcome back, {userProfile?.displayName}!
            </h2>
            <p className="text-primary-100">
              You have full control over the system. Manage settings, users, and monitor all activities.
            </p>
          </div>
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
            <button 
              onClick={() => handleQuickAction('settings')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
            >
              <MdSettings className="text-primary-600 mb-2" size={24} />
              <h4 className="font-semibold text-gray-800">System Settings</h4>
              <p className="text-sm text-gray-600 mt-1">Configure school details and preferences</p>
            </button>
            
            <button 
              onClick={() => handleQuickAction('admins')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
            >
              <MdPeople className="text-primary-600 mb-2" size={24} />
              <h4 className="font-semibold text-gray-800">Manage Admins</h4>
              <p className="text-sm text-gray-600 mt-1">Add or remove administrator accounts</p>
            </button>
            
            <button 
              onClick={() => handleQuickAction('vouchers')}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors text-left"
            >
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
              {recentActivities.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No recent activities</p>
              ) : (
                recentActivities.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 bg-${activity.color}-100 rounded-full flex items-center justify-center mr-3`}>
                          <Icon className={`text-${activity.color}-600`} size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{activity.message}</p>
                          <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="card-header">System Overview</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Total Users</span>
                  <span className="text-green-600 font-medium">{stats.totalStudents + stats.totalTeachers + stats.totalAdmins}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Students</span>
                  <span className="text-blue-600 font-medium">{stats.totalStudents}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ 
                      width: `${stats.totalStudents > 0 ? Math.min((stats.totalStudents / (stats.totalStudents + stats.totalTeachers + stats.totalAdmins)) * 100, 100) : 0}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Teachers</span>
                  <span className="text-purple-600 font-medium">{stats.totalTeachers}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ 
                      width: `${stats.totalTeachers > 0 ? Math.min((stats.totalTeachers / (stats.totalStudents + stats.totalTeachers + stats.totalAdmins)) * 100, 100) : 0}%` 
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Active Vouchers</span>
                  <span className="text-orange-600 font-medium">{stats.activeVouchers}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full" 
                    style={{ 
                      width: `${stats.activeVouchers > 0 ? Math.min((stats.activeVouchers / 100) * 100, 100) : 0}%` 
                    }}
                  ></div>
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
