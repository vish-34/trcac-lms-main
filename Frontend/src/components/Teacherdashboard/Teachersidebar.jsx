import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Video, FileText, LogOut } from "lucide-react"; // npm install lucide-react
import { useAuth } from "../../context/AuthContext.jsx";

export default function Teachersidebar() {
  const { logout, user, extractNameFromEmail } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Extract dynamic name from user email
  const displayName = user?.email ? extractNameFromEmail(user.email) : 'Teacher';

  const menuItems = [
    { name: "Home", path: "/teacherdashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Assignment", path: "/teacherdashboard/assignment", icon: <Video size={20} /> },
    { name: "Exams", path: "/teacherdashboard/exams", icon: <FileText size={20} /> },
    { name: "Lectures", path: "/teacherdashboard/lectures", icon: <FileText size={20} /> },
  ];

  return (
    <div className="fixed left-0 top-0 w-[280px] h-screen bg-slate-50 border-r border-slate-200 flex flex-col justify-between z-50">
      <div>
        {/* User Profile Section */}
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="font-bold text-slate-800 leading-tight">Welcome back, {displayName}</h2>
              <p className="text-xs font-medium text-indigo-600">Teacher</p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex flex-col px-4 gap-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                  ? "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200" 
                  : "text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                }`
              }
            >
              {item.icon}
              <span className="font-semibold text-sm">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Logout Button */}
      <div className="p-6">
        <button 
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white border border-red-100 text-red-500 font-bold text-sm hover:bg-red-50 transition-colors shadow-sm"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
    
  );
}