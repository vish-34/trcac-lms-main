import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Database, Cpu, Globe, Calculator, Microscope, Palette, TrendingUp, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

// Icon mapping for different subjects
const iconMap = {
  'Computer': <Cpu className="w-6 h-6" />,
  'Mathematics': <Calculator className="w-6 h-6" />,
  'Database': <Database className="w-6 h-6" />,
  'Networks': <Globe className="w-6 h-6" />,
  'Science': <Microscope className="w-6 h-6" />,
  'Arts': <Palette className="w-6 h-6" />,
  'Commerce': <TrendingUp className="w-6 h-6" />,
  'default': <BookOpen className="w-6 h-6" />
};

// Color schemes for subject cards
const colorSchemes = [
  'from-blue-500 to-cyan-400',
  'from-purple-500 to-pink-500',
  'from-orange-500 to-amber-400',
  'from-green-500 to-emerald-400',
  'from-indigo-500 to-purple-400',
  'from-rose-500 to-pink-400'
];

export default function Subjects() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);

  useEffect(() => {
    fetchSubjects();
  }, [user]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError('');

      // For now, using mock student ID. In production, use actual student ID from auth
      const studentId = user?.id || 'mock-student-id';
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/subjects/student/${studentId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch subjects');
      }

      const data = await response.json();
      
      if (data.success) {
        setSubjects(data.subjects);
        setStudentInfo(data.studentInfo);
      } else {
        setError('Unable to load subjects');
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSubjectIcon = (subjectName) => {
    for (const [key, icon] of Object.entries(iconMap)) {
      if (subjectName.toLowerCase().includes(key.toLowerCase())) {
        return icon;
      }
    }
    return iconMap.default;
  };

  const getColorScheme = (index) => {
    return colorSchemes[index % colorSchemes.length];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your subjects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
          <button 
            onClick={fetchSubjects}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 px-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-1">
            Your Curriculum
          </h2>
          <h1 className="text-4xl font-extrabold text-slate-900">
            My Subjects
          </h1>
          {studentInfo && (
            <p className="text-gray-600 mt-2">
              {studentInfo.course} - Semester {studentInfo.semester}
            </p>
          )}
        </div>
        <button className="text-slate-500 hover:text-blue-600 font-medium flex items-center gap-2 transition-colors">
          View All <ArrowRight size={18} />
        </button>
      </div>

      {/* Subjects Grid */}
      {subjects.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No subjects found</h3>
          <p className="text-gray-500">
            Subjects for your semester will appear here once they are added.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {subjects.map((subject, index) => (
            <motion.div
              key={subject._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="group relative bg-white border border-slate-100 p-8 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden cursor-pointer"
            >
              {/* Background Glow Effect */}
              <div 
                className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${getColorScheme(index)} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} 
              />
              
              {/* Icon Container */}
              <div 
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getColorScheme(index)} flex items-center justify-center text-white mb-6 shadow-lg transform group-hover:rotate-6 transition-transform`}
              >
                {getSubjectIcon(subject.subjectName)}
              </div>

              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                {subject.subjectCode}
              </h3>
              <p className="text-slate-500 text-sm font-medium mb-3">
                {subject.subjectName}
              </p>
              
              {/* Subject Details */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Credits:</span>
                  <span className="font-medium text-gray-700">{subject.credits}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Type:</span>
                  <span className="font-medium text-gray-700 capitalize">{subject.type}</span>
                </div>
              </div>
              
              {/* Action Button */}
              <div className="flex items-center text-sm font-bold text-slate-400 group-hover:text-slate-900 transition-colors">
                <span>View Modules</span>
                <motion.span 
                  className="ml-2"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  →
                </motion.span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
