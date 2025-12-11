import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MdSchool, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import toast from 'react-hot-toast';

/**
 * Login Page
 */
const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Image Background */}
      <div 
        className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('/bg.jpeg')`
        }}
      >
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-12">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-white rounded-full mb-6 p-6 overflow-hidden">
            <img 
              src="/ALMA logo.png" 
              alt="ALMA Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-4xl font-bold mb-4">Welcome Back!</h2>
          <p className="text-xl text-center max-w-md">
            Administrative & Learning Management Architecture - Empowering Education Excellence
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 to-white min-h-screen">
        <div className="max-w-md w-full space-y-6 sm:space-y-8">
          {/* Logo - Mobile Only */}
          <div className="flex justify-center lg:hidden">
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-full shadow-xl p-5 flex items-center justify-center">
              <img 
                src="/ALMA logo.png" 
                alt="ALMA Logo" 
                className="w-full h-full object-contain" 
              />
            </div>
          </div>

          {/* Desktop Title */}
          <div className="hidden lg:block text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Sign In
            </h1>
            <p className="text-gray-600">Enter your credentials to continue</p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:p-10 border border-gray-100">
            {/* Mobile: Sign In Title */}
            <div className="lg:hidden text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Sign In</h2>
              <p className="text-sm sm:text-base text-gray-600 mt-2">Enter your credentials to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006B3F] focus:border-transparent transition-all"
                  placeholder="Enter your email"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#006B3F] focus:border-transparent transition-all"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
                  >
                    {showPassword ? <MdVisibilityOff size={22} /> : <MdVisibility size={22} />}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-[#006B3F] hover:text-[#005030] font-medium transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#006B3F] hover:bg-[#005030] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-4 text-xs sm:text-sm text-gray-500 font-medium">OR</span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            {/* Alternative Actions */}
            <div className="space-y-3">
              <Link
                to="/voucher-registration"
                className="block w-full text-center py-3 px-4 border-2 border-[#006B3F] text-[#006B3F] font-semibold rounded-lg hover:bg-[#006B3F] hover:text-white transition-all duration-200"
              >
                Register with E-Voucher
              </Link>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs sm:text-sm text-gray-600 mt-6 px-4">
            © 2025 ALMA. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
