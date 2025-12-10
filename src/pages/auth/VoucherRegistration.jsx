import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MdSchool, MdArrowBack, MdCloudUpload, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { CLASSES, GENDER, USER_ROLES } from '../../constants/ghanaEducation';
import { getVoucher, markVoucherAsUsed } from '../../utils/database';
import { uploadStudentPhoto, uploadStudentDocument } from '../../utils/storage';
import { generateStudentId } from '../../utils/helpers';
import { createStudent } from '../../utils/database';
import toast from 'react-hot-toast';

/**
 * Student Self-Registration with E-Voucher
 */
const VoucherRegistration = () => {
  const [step, setStep] = useState(1);
  const [voucherData, setVoucherData] = useState({ serial: '', pin: '' });
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    otherNames: '',
    gender: '',
    dateOfBirth: '',
    classId: '',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    address: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [files, setFiles] = useState({
    photo: null,
    birthCertificate: null
  });

  const { register } = useAuth();
  const navigate = useNavigate();

  // Step 1: Verify Voucher
  const handleVoucherSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await getVoucher(voucherData.serial, voucherData.pin);
      
      if (result.success) {
        setVoucher(result.data);
        setStep(2);
        toast.success('Voucher verified successfully!');
      } else {
        toast.error(result.error || 'Invalid voucher');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Complete Registration
  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Generate student ID
      const studentId = generateStudentId();

      // Register user account
      const registerResult = await register(formData.email, formData.password, {
        displayName: `${formData.firstName} ${formData.lastName}`,
        role: USER_ROLES.STUDENT,
        studentId
      });

      if (!registerResult.success) {
        toast.error(registerResult.error || 'Registration failed');
        setLoading(false);
        return;
      }

      // Upload photo
      let photoURL = '';
      if (files.photo) {
        const photoResult = await uploadStudentPhoto(studentId, files.photo);
        if (photoResult.success) {
          photoURL = photoResult.url;
        }
      }

      // Upload birth certificate
      let birthCertURL = '';
      if (files.birthCertificate) {
        const certResult = await uploadStudentDocument(
          studentId,
          'birth-certificate',
          files.birthCertificate
        );
        if (certResult.success) {
          birthCertURL = certResult.url;
        }
      }

      // Create student record
      const studentData = {
        studentId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        otherNames: formData.otherNames,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        classId: formData.classId,
        guardianName: formData.guardianName,
        guardianPhone: formData.guardianPhone,
        guardianEmail: formData.guardianEmail,
        address: formData.address,
        email: formData.email,
        photoURL,
        birthCertificate: birthCertURL,
        registeredVia: 'voucher',
        voucherId: voucher.id,
        status: 'active'
      };

      const studentResult = await createStudent(studentData);

      if (studentResult.success) {
        // Mark voucher as used
        await markVoucherAsUsed(voucher.id, studentId);
        
        toast.success('Registration successful! Redirecting to dashboard...');
        
        // Wait a moment for auth state to update before redirecting
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } else {
        toast.error('Failed to create student record');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setFiles({
      ...files,
      [e.target.name]: e.target.files[0]
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image Background */}
      <div 
        className="hidden lg:block lg:w-1/2 bg-cover bg-center relative"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('/bg.jpeg')`
        }}
      >
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full mb-6">
            <MdSchool size={60} className="text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-4">Begin Your Journey!</h2>
          <p className="text-xl text-center max-w-md">
            Register with your E-Voucher and become part of Ghana's educational excellence
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="max-w-md w-full py-8">
        {/* Back Button */}
        <Link
          to="/login"
          className="inline-flex items-center text-primary-700 hover:text-primary-800 mb-6"
        >
          <MdArrowBack size={20} className="mr-2" />
          Back to Login
        </Link>

        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-600 rounded-full mb-4">
            <MdSchool size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Student Registration
          </h1>
          <p className="text-gray-600">Register using your E-Voucher</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className={`flex items-center ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              1
            </div>
            <span className="ml-2 font-medium hidden sm:inline">Verify Voucher</span>
          </div>
          <div className={`w-16 h-1 mx-4 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-300'}`} />
          <div className={`flex items-center ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'
            }`}>
              2
            </div>
            <span className="ml-2 font-medium hidden sm:inline">Complete Profile</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Step 1: Voucher Verification */}
          {step === 1 && (
            <form onSubmit={handleVoucherSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Enter Your Voucher Details
                </h2>
                <p className="text-sm text-gray-600">
                  Enter the serial number and PIN from your purchased voucher
                </p>
              </div>

              <div>
                <label htmlFor="serial" className="block text-sm font-medium text-gray-700 mb-2">
                  Voucher Serial Number
                </label>
                <input
                  type="text"
                  id="serial"
                  value={voucherData.serial}
                  onChange={(e) => setVoucherData({ ...voucherData, serial: e.target.value.toUpperCase() })}
                  className="input-field uppercase"
                  placeholder="e.g., ABC123XYZ9"
                  required
                />
              </div>

              <div>
                <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
                  Voucher PIN
                </label>
                <input
                  type="text"
                  id="pin"
                  value={voucherData.pin}
                  onChange={(e) => setVoucherData({ ...voucherData, pin: e.target.value })}
                  className="input-field"
                  placeholder="e.g., 123456"
                  maxLength="6"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify Voucher'}
              </button>
            </form>
          )}

          {/* Step 2: Student Information */}
          {step === 2 && (
            <form onSubmit={handleRegistrationSubmit} className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Complete Your Registration
                </h2>
                <p className="text-sm text-gray-600">
                  Fill in your personal information
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Other Names
                  </label>
                  <input
                    type="text"
                    name="otherNames"
                    value={formData.otherNames}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value={GENDER.MALE}>Male</option>
                    <option value={GENDER.FEMALE}>Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class *
                  </label>
                  <select
                    name="classId"
                    value={formData.classId}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select Class</option>
                    {CLASSES.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-800 mb-4">Guardian Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Guardian Name *
                    </label>
                    <input
                      type="text"
                      name="guardianName"
                      value={formData.guardianName}
                      onChange={handleChange}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Guardian Phone *
                    </label>
                    <input
                      type="tel"
                      name="guardianPhone"
                      value={formData.guardianPhone}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="0XXXXXXXXX"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Guardian Email
                    </label>
                    <input
                      type="email"
                      name="guardianEmail"
                      value={formData.guardianEmail}
                      onChange={handleChange}
                      className="input-field"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="input-field"
                      rows="2"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-800 mb-4">Account Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="input-field pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="input-field"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-800 mb-4">Upload Documents</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Photo * (Max 2MB)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <input
                        type="file"
                        name="photo"
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                        id="photo"
                        required
                      />
                      <label htmlFor="photo" className="cursor-pointer">
                        <MdCloudUpload className="mx-auto text-gray-400 mb-2" size={32} />
                        <p className="text-sm text-gray-600">
                          {files.photo ? files.photo.name : 'Click to upload'}
                        </p>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Birth Certificate (Optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                      <input
                        type="file"
                        name="birthCertificate"
                        onChange={handleFileChange}
                        accept="image/*,application/pdf"
                        className="hidden"
                        id="birthCertificate"
                      />
                      <label htmlFor="birthCertificate" className="cursor-pointer">
                        <MdCloudUpload className="mx-auto text-gray-400 mb-2" size={32} />
                        <p className="text-sm text-gray-600">
                          {files.birthCertificate ? files.birthCertificate.name : 'Click to upload'}
                        </p>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 btn-secondary"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Registering...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default VoucherRegistration;
