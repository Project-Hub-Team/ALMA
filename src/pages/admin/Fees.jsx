// Admin Pages - Full implementations

import { Students } from './Students';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { MdAdd, MdSearch, MdEdit, MdDelete, MdDownload, MdCloudUpload, MdVisibility, MdPersonAdd, MdAttachMoney, MdPeople, MdSchool, MdPersonAdd as MdUserCheck, MdMenuBook, MdTrendingUp, MdContentCopy } from 'react-icons/md';
import { getAllStudents, createStudent, updateStudent, deleteStudent } from '../../Controller/studentsController';
import { getAllTeachers } from '../../Controller/teachersController';
import { readAllRecords, createRecord, updateRecord, deleteRecord } from '../../utils/database';
import { CLASSES, getSubjectsByClass } from '../../constants/ghanaEducation';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { secondaryAuth, database } from '../../config/firebase.config';
import { ref, remove } from 'firebase/database';
import { useAuth } from '../../contexts/AuthContext';
import { hashPassword, encryptSensitiveFields, decryptSensitiveFields } from '../../Controller/encryption';


export const Fees = () => {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState('term1');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    studentId: '',
    studentName: '',
    amount: '',
    paymentMethod: 'cash',
    term: 'term1',
    feeType: 'tuition',
    transactionId: '',
    notes: ''
  });

  useEffect(() => {
    loadFees();
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const result = await getAllStudents();
      if (result.success) {
        setStudents(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load students');
    }
  };

  const loadFees = async () => {
    try {
      const result = await readAllRecords('fees');
      if (result.success) {
        setFees(result.data || []);
      }
    } catch (error) {
      toast.error('Failed to load fees');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = () => {
    setPaymentForm({
      studentId: '',
      studentName: '',
      amount: '',
      paymentMethod: 'cash',
      term: selectedTerm,
      feeType: 'tuition',
      transactionId: '',
      notes: ''
    });
    setShowPaymentModal(true);
  };

  const handleStudentSelect = (e) => {
    const studentId = e.target.value;
    const student = students.find(s => s.id === studentId);
    setPaymentForm({
      ...paymentForm,
      studentId,
      studentName: student ? student.fullName : ''
    });
  };

  const handleSavePayment = async (e) => {
    e.preventDefault();
    try {
      const paymentData = {
        ...paymentForm,
        paidAmount: parseFloat(paymentForm.amount),
        amount: parseFloat(paymentForm.amount),
        status: 'paid',
        paymentDate: new Date().toISOString(),
        receiptId: `RCP${Date.now()}`
      };

      await createRecord('fees', paymentData);
      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      loadFees();
    } catch (error) {
      console.error('Record payment error:', error);
      toast.error('Failed to record payment');
    }
  };

  const totalExpected = fees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
  const totalPaid = fees.reduce((sum, fee) => sum + (fee.paidAmount || 0), 0);
  const totalOutstanding = totalExpected - totalPaid;

  if (loading) {
    return (
      <DashboardLayout title="Fee Management">
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Fee Management">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Fee Management</h2>
            <p className="text-gray-600">Track fees, payments, and outstanding balances</p>
          </div>
          <button onClick={handleRecordPayment} className="btn btn-primary flex items-center gap-2">
            <MdAdd size={18} />
            Record Payment
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <p className="text-sm text-gray-600">Total Expected</p>
            <p className="text-2xl font-bold text-gray-800">GH₵ {totalExpected.toLocaleString()}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Total Paid</p>
            <p className="text-2xl font-bold text-green-600">GH₵ {totalPaid.toLocaleString()}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Outstanding</p>
            <p className="text-2xl font-bold text-red-600">GH₵ {totalOutstanding.toLocaleString()}</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-600">Collection Rate</p>
            <p className="text-2xl font-bold text-blue-600">
              {totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0}%
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Payment Records</h3>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="input w-auto"
            >
              <option value="term1">Term 1</option>
              <option value="term2">Term 2</option>
              <option value="term3">Term 3</option>
            </select>
          </div>

          {fees.length === 0 ? (
            <div className="text-center py-12">
              <MdAttachMoney className="mx-auto mb-3 text-gray-400" size={48} />
              <p className="text-lg font-medium text-gray-700">No fee records found</p>
              <p className="text-sm text-gray-500">Fee records will appear here once payments are recorded</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {fees.map(fee => (
                    <tr key={fee.id}>
                      <td className="px-4 py-3 text-sm">{fee.studentName}</td>
                      <td className="px-4 py-3 text-sm">{fee.class}</td>
                      <td className="px-4 py-3 text-sm">GH₵ {fee.amount}</td>
                      <td className="px-4 py-3 text-sm text-green-600">GH₵ {fee.paidAmount || 0}</td>
                      <td className="px-4 py-3 text-sm text-red-600">
                        GH₵ {fee.amount - (fee.paidAmount || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          fee.paidAmount >= fee.amount
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {fee.paidAmount >= fee.amount ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Record Payment</h3>
            <form onSubmit={handleSavePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Student *
                </label>
                <select
                  value={paymentForm.studentId}
                  onChange={handleStudentSelect}
                  className="input"
                  required
                >
                  <option value="">Choose a student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.fullName} - {student.class}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fee Type *
                  </label>
                  <select
                    value={paymentForm.feeType}
                    onChange={(e) => setPaymentForm({ ...paymentForm, feeType: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="tuition">Tuition Fee</option>
                    <option value="examination">Examination Fee</option>
                    <option value="library">Library Fee</option>
                    <option value="sports">Sports Fee</option>
                    <option value="uniform">Uniform Fee</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Term *
                  </label>
                  <select
                    value={paymentForm.term}
                    onChange={(e) => setPaymentForm({ ...paymentForm, term: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="term1">Term 1</option>
                    <option value="term2">Term 2</option>
                    <option value="term3">Term 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (GH₵) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="input"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction ID (Optional)
                </label>
                <input
                  type="text"
                  value={paymentForm.transactionId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                  className="input"
                  placeholder="For mobile money or bank transfers"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="input"
                  rows="3"
                  placeholder="Additional payment details or remarks"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">
                  Record Payment
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
export default Fees;