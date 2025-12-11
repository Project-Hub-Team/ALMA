import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { MdDownload, MdSearch, MdCalendarToday, MdPeople, MdCheckCircle, MdCancel, MdRemoveCircle } from 'react-icons/md';
import { useAuth } from '../../contexts/AuthContext';
import { readAllRecords } from '../../utils/database';
import { CLASSES } from '../../constants/ghanaEducation';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const AttendanceHistory = () => {
  const { userProfile } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [students, setStudents] = useState({});

  useEffect(() => {
    loadAttendanceHistory();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [attendanceRecords, selectedClass, startDate, endDate]);

  const loadAttendanceHistory = async () => {
    try {
      setLoading(true);
      const [attendanceResult, usersResult] = await Promise.all([
        readAllRecords('attendance'),
        readAllRecords('users')
      ]);

      if (attendanceResult.success && usersResult.success) {
        // Convert Firebase objects to arrays
        const attendanceData = Object.values(attendanceResult.data || {});
        const usersData = Object.values(usersResult.data || {});

        // Filter attendance records for teacher's classes
        const teacherClasses = userProfile?.classes || [];
        const teacherAttendance = attendanceData.filter(record =>
          teacherClasses.includes(record.classId)
        );

        // Create students lookup
        const studentsLookup = {};
        usersData.filter(user => user.role === 'student').forEach(student => {
          studentsLookup[student.id] = student;
        });

        setStudents(studentsLookup);
        setAttendanceRecords(teacherAttendance);
      }
    } catch (error) {
      console.error('Error loading attendance history:', error);
      toast.error('Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = attendanceRecords;

    if (selectedClass) {
      filtered = filtered.filter(record => record.classId === selectedClass);
    }

    if (startDate) {
      filtered = filtered.filter(record => record.date >= startDate);
    }

    if (endDate) {
      filtered = filtered.filter(record => record.date <= endDate);
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    setFilteredRecords(filtered);
  };

  const getClassName = (classId) => {
    const classObj = CLASSES.find(cls => cls.id === classId);
    return classObj ? classObj.name : classId;
  };

  const getAttendanceStats = (attendance) => {
    const attendanceValues = Object.values(attendance || {});
    const present = attendanceValues.filter(status => status === 'present').length;
    const absent = attendanceValues.filter(status => status === 'absent').length;
    const total = attendanceValues.length;
    return { present, absent, total };
  };

  const downloadPDF = () => {
    if (filteredRecords.length === 0) {
      toast.error('No attendance records to download');
      return;
    }

    const doc = new jsPDF();

    // Add title
    doc.setFontSize(20);
    doc.text('Attendance History Report', 20, 20);

    // Add filters info
    doc.setFontSize(12);
    let yPos = 35;
    if (selectedClass) {
      doc.text(`Class: ${getClassName(selectedClass)}`, 20, yPos);
      yPos += 7;
    }
    if (startDate || endDate) {
      const dateRange = `${startDate || 'Start'} to ${endDate || 'End'}`;
      doc.text(`Date Range: ${dateRange}`, 20, yPos);
      yPos += 7;
    }
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPos);
    yPos += 10;

    // Prepare table data
    const tableData = filteredRecords.map(record => {
      const stats = getAttendanceStats(record.attendance);
      return [
        new Date(record.date).toLocaleDateString(),
        getClassName(record.classId),
        stats.present,
        stats.absent,
        stats.total,
        `${((stats.present / stats.total) * 100).toFixed(1)}%`
      ];
    });

    // Add table
    doc.autoTable({
      head: [['Date', 'Class', 'Present', 'Absent', 'Total', 'Attendance %']],
      body: tableData,
      startY: yPos,
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    // Save the PDF
    const fileName = `attendance_history_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    toast.success('PDF downloaded successfully');
  };

  const clearFilters = () => {
    setSelectedClass('');
    setStartDate('');
    setEndDate('');
  };

  if (loading) {
    return (
      <DashboardLayout title="Attendance History">
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Attendance History">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Attendance History</h2>
            <p className="text-gray-600">View and download attendance records</p>
          </div>
          <button
            onClick={downloadPDF}
            className="btn-primary flex items-center gap-2"
            disabled={filteredRecords.length === 0}
          >
            <MdDownload size={20} />
            Download PDF
          </button>
        </div>

        {/* Filters */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="input w-full"
              >
                <option value="">All Classes</option>
                {CLASSES.filter(cls => userProfile?.classes?.includes(cls.id)).map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input w-full"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="btn-secondary w-full"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <div className="flex items-center gap-3">
              <MdCalendarToday className="text-blue-500" size={24} />
              <div>
                <p className="text-sm text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-800">{filteredRecords.length}</p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <MdCheckCircle className="text-green-500" size={24} />
              <div>
                <p className="text-sm text-gray-600">Avg Attendance</p>
                <p className="text-2xl font-bold text-gray-800">
                  {filteredRecords.length > 0
                    ? `${(filteredRecords.reduce((acc, record) => {
                        const stats = getAttendanceStats(record.attendance);
                        return acc + (stats.present / stats.total);
                      }, 0) / filteredRecords.length * 100).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-3">
              <MdPeople className="text-purple-500" size={24} />
              <div>
                <p className="text-sm text-gray-600">Classes Covered</p>
                <p className="text-2xl font-bold text-gray-800">
                  {new Set(filteredRecords.map(r => r.classId)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Records Table */}
        <div className="card">
          <div className="overflow-x-auto">
            {filteredRecords.length === 0 ? (
              <div className="text-center py-8">
                <MdCalendarToday className="mx-auto text-gray-400" size={48} />
                <p className="text-gray-500 mt-2">No attendance records found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Absent</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.map((record, index) => {
                    const stats = getAttendanceStats(record.attendance);
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {getClassName(record.classId)}
                        </td>
                        <td className="px-4 py-3 text-sm text-green-600 font-medium">
                          {stats.present}
                        </td>
                        <td className="px-4 py-3 text-sm text-red-600 font-medium">
                          {stats.absent}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {stats.total}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {stats.total > 0 ? `${((stats.present / stats.total) * 100).toFixed(1)}%` : '0%'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}