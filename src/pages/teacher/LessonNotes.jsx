import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { MdCloudUpload, MdDownload, MdDelete, MdAdd } from 'react-icons/md';
import { useAuth } from '../../contexts/AuthContext';
import { CLASSES } from '../../constants/ghanaEducation';
import { readAllRecords, createRecord, deleteRecord } from '../../utils/database';
import { uploadStudentDocument } from '../../Controller/storage';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export const LessonNotes = () => {
  const { userProfile } = useAuth();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    file: null
  });

  const loadNotes = async () => {
    if (!selectedClass || !selectedSubject) return;
    setLoading(true);
    try {
      const result = await readAllRecords('lesson-notes');
      if (result.success) {
        const classNotes = result.data.filter(
          n => n.classId === selectedClass && n.subject === selectedSubject && n.teacherId === userProfile.id
        );
        setNotes(classNotes);
      }
    } catch (error) {
      toast.error('Failed to load lesson notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [selectedClass, selectedSubject]);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.file) {
      toast.error('Please select a file');
      return;
    }

    try {
      const fileData = await uploadStudentDocument(uploadForm.file, `lesson-notes/${userProfile.id}`);
      
      const noteData = {
        title: uploadForm.title,
        description: uploadForm.description,
        fileUrl: fileData.url,
        fileName: uploadForm.file.name,
        classId: selectedClass,
        subject: selectedSubject,
        teacherId: userProfile.id,
        uploadedAt: Date.now()
      };

      await createRecord('lesson-notes', noteData);
      toast.success('Lesson note uploaded successfully');
      setShowUploadModal(false);
      setUploadForm({ title: '', description: '', file: null });
      loadNotes();
    } catch (error) {
      toast.error('Failed to upload lesson note');
    }
  };

  const deleteNote = async (noteId) => {
    if (window.confirm('Are you sure you want to delete this lesson note?')) {
      try {
        await deleteRecord(`lesson-notes/${noteId}`);
        toast.success('Lesson note deleted successfully');
        loadNotes();
      } catch (error) {
        toast.error('Failed to delete lesson note');
      }
    }
  };

  const myClasses = userProfile?.classes || [];

  return (
    <DashboardLayout title="Lesson Notes">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Lesson Notes</h2>
            <p className="text-gray-600">Upload and manage lesson notes for your classes</p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary flex items-center gap-2"
            disabled={!selectedClass || !selectedSubject}
          >
            <MdAdd size={18} />
            Upload Note
          </button>
        </div>

        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="input w-full"
              >
                <option value="">Choose a class...</option>
                {CLASSES.filter(cls => myClasses.includes(cls.id)).map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="input w-full"
              >
                <option value="">Choose a subject...</option>
                {selectedClass && CLASSES.find(c => c.id === selectedClass)?.subjects?.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="card">
            <h3 className="text-lg font-bold mb-4">Lesson Notes ({notes.length})</h3>
            
            {notes.length === 0 ? (
              <div className="text-center py-12">
                <MdCloudUpload className="mx-auto mb-4 text-gray-400" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Lesson Notes</h3>
                <p className="text-gray-600">Upload your first lesson note for this class and subject.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notes.map(note => (
                  <div key={note.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <MdCloudUpload className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{note.title}</h4>
                        <p className="text-sm text-gray-600">{note.description}</p>
                        <p className="text-xs text-gray-500">{note.fileName}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(note.fileUrl, '_blank')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Download"
                      >
                        <MdDownload size={18} />
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <MdDelete size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Upload Lesson Note</h3>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  className="input"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
                <input
                  type="file"
                  onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files[0] })}
                  className="input"
                  accept=".pdf,.doc,.docx,.ppt,.pptx"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn btn-primary flex-1">
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
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
