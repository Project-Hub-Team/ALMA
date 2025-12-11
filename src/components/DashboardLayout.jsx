import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSelector } from 'react-redux';
import { selectSettings } from '../store/slices/systemSlice';
import {
  MdDashboard,
  MdPeople,
  MdSchool,
  MdMenuBook,
  MdAttachMoney,
  MdSettings,
  MdLogout,
  MdMenu,
  MdClose,
  MdDescription,
  MdPersonAdd,
  MdBarChart,
  MdSecurity
} from 'react-icons/md';
import { USER_ROLES } from '../constants/ghanaEducation';
import toast from 'react-hot-toast';

/**
 * Dashboard Layout Component
 * Provides sidebar navigation and header for dashboard pages
 */
const DashboardLayout = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const settings = useSelector(selectSettings);

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      toast.success('Logged out successfully');
      navigate('/login');
    }
  };

  // Navigation items based on role
  const getNavigationItems = () => {
    const role = userProfile?.role;

    if (role === USER_ROLES.SUPER_ADMIN) {
      return [
        { name: 'Dashboard', path: '/dashboard', icon: MdDashboard },
        { name: 'Manage Admins', path: '/super-admin/admins', icon: MdSecurity },
        { name: 'Vouchers', path: '/super-admin/vouchers', icon: MdDescription },
        { name: 'Students', path: '/admin/students', icon: MdPeople },
        { name: 'Teachers', path: '/admin/teachers', icon: MdSchool },
        { name: 'Classes', path: '/admin/classes', icon: MdMenuBook },
        { name: 'Reports', path: '/admin/reports', icon: MdBarChart },
        { name: 'System Settings', path: '/super-admin/settings', icon: MdSettings }
      ];
    }

    if (role === USER_ROLES.ADMIN) {
      return [
        { name: 'Dashboard', path: '/dashboard', icon: MdDashboard },
        { name: 'Students', path: '/admin/students', icon: MdPeople },
        { name: 'Teachers', path: '/admin/teachers', icon: MdSchool },
        { name: 'Classes', path: '/admin/classes', icon: MdMenuBook },
        { name: 'Fees', path: '/admin/fees', icon: MdAttachMoney },
        { name: 'Reports', path: '/admin/reports', icon: MdBarChart }
      ];
    }

    if (role === USER_ROLES.TEACHER) {
      return [
        { name: 'Dashboard', path: '/dashboard', icon: MdDashboard },
        { name: 'My Classes', path: '/teacher/my-classes', icon: MdMenuBook },
        { name: 'Attendance', path: '/teacher/attendance', icon: MdPersonAdd },
        { name: 'Attendance History', path: '/teacher/attendance-history', icon: MdBarChart },
        { name: 'Grade Entry', path: '/teacher/grades', icon: MdDescription },
        { name: 'Lesson Notes', path: '/teacher/lesson-notes', icon: MdMenuBook }
      ];
    }

    if (role === USER_ROLES.STUDENT) {
      return [
        { name: 'Dashboard', path: '/dashboard', icon: MdDashboard },
        { name: 'My Results', path: '/student/results', icon: MdBarChart },
        { name: 'My Fees', path: '/student/fees', icon: MdAttachMoney },
        { name: 'Lesson Notes', path: '/student/lesson-notes', icon: MdMenuBook },
        { name: 'My Attendance', path: '/student/attendance', icon: MdPersonAdd }
      ];
    }

    return [];
  };

  const navigationItems = getNavigationItems();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo/Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              GH
            </div>
            <span className="ml-3 font-semibold text-gray-800 text-sm">
              {settings.schoolName?.substring(0, 20) || 'School SMS'}
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <MdClose size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon size={18} className="mr-2 flex-shrink-0" />
                <span className="font-medium text-sm truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-medium">
              {userProfile?.displayName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-800 truncate">
                {userProfile?.displayName || 'User'}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {userProfile?.role?.replace('_', ' ') || 'User'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
          >
            <MdLogout size={18} className="mr-2" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-6">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700 mr-4"
            >
              <MdMenu size={24} />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 hidden md:block">
              {new Date().toLocaleDateString('en-GB', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
