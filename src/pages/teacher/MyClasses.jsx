import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { MdMenuBook, MdPeople, MdDescription } from 'react-icons/md';
import { useAuth } from '../../contexts/AuthContext';
import { CLASSES } from '../../constants/ghanaEducation';
import LoadingSpinner from '../../components/LoadingSpinner';

export const MyClasses = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="My Classes">
        <LoadingSpinner />
      </DashboardLayout>
    );
  }

  const myClasses = userProfile?.classes || [];

  return (
    <DashboardLayout title="My Classes">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">My Classes</h2>
          <p className="text-gray-600">Classes assigned to you</p>
        </div>

        {myClasses.length === 0 ? (
          <div className="card text-center py-12">
            <MdMenuBook className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Assigned</h3>
            <p className="text-gray-600">You haven't been assigned to any classes yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myClasses.map(classId => {
              const classInfo = CLASSES.find(c => c.id === classId);
              if (!classInfo) return null;

              return (
                <div key={classId} className="card hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <MdMenuBook className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{classInfo.name}</h3>
                      <p className="text-sm text-gray-600">{classInfo.level}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Students:</span>
                      <span className="font-medium">0</span> {/* TODO: Count students */}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subjects:</span>
                      <span className="font-medium">{classInfo.subjects?.length || 0}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
