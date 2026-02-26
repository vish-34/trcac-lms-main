import React from 'react';
import { motion } from 'framer-motion'; // Install via: npm install framer-motion
import { BookOpen, Database, Cpu, ArrowRight } from 'lucide-react'; // Premium icons

const subjects = [
  { name: "CN", full: "Computer Networks", color: "from-blue-500 to-cyan-400", icon: <BookOpen className="w-6 h-6" /> },
  { name: "DBMS", full: "Database Systems", color: "from-purple-500 to-pink-500", icon: <Database className="w-6 h-6" /> },
  { name: "OS", full: "Operating Systems", color: "from-orange-500 to-amber-400", icon: <Cpu className="w-6 h-6" /> },
];

const SubjectSlider = () => {
  return (
    <div className="py-10 px-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-1">Curriculum</h2>
          <h1 className="text-4xl font-extrabold text-slate-900">Total Subjects</h1>
        </div>
        <button className="text-slate-500 hover:text-blue-600 font-medium flex items-center gap-2 transition-colors">
          View All <ArrowRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {subjects.map((sub, index) => (
          <motion.div
            key={sub.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -10 }}
            className="group relative bg-white border border-slate-100 p-8 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden cursor-pointer"
          >
            {/* Background Glow Effect */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${sub.color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
            
            {/* Icon Container */}
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${sub.color} flex items-center justify-center text-white mb-6 shadow-lg transform group-hover:rotate-6 transition-transform`}>
              {sub.icon}
            </div>

            <h3 className="text-2xl font-bold text-slate-800 mb-2">{sub.name}</h3>
            <p className="text-slate-500 text-sm font-medium mb-6">{sub.full}</p>
            
            <div className="flex items-center text-sm font-bold text-slate-400 group-hover:text-slate-900 transition-colors">
              <span>Explore Modules</span>
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
    </div>
  );
};

export default SubjectSlider;