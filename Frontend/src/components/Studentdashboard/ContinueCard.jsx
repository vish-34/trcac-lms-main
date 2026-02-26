const ContinueCard = () => {
  return (
    <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
      {/* Decorative background circle */}
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <h3 className="text-indigo-300 text-sm font-bold uppercase tracking-wider mb-2">Continue Learning</h3>
        <h2 className="text-2xl font-bold mb-6 italic">Computer Networks: Layer 4</h2>
        
        <div className="space-y-4">
          <div className="flex justify-between text-sm font-medium">
            <span>Course Progress</span>
            <span>65%</span>
          </div>
          {/* Custom Progress Bar */}
          <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-400 w-[65%] rounded-full shadow-[0_0_12px_rgba(129,140,248,0.5)]" />
          </div>
          
          <button className="mt-4 bg-white text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors">
            Resume Lecture
          </button>
        </div>
      </div>
    </div>
  );
};