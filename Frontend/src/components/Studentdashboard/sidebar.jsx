import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Video,
  FileText,
  BookOpen,
  LogOut,
  Menu,
  X,
  CheckCircle,
  MessageSquare
} from "lucide-react";

import { useAuth } from "../../context/AuthContext.jsx";
import { useState } from "react";

export default function Sidebar() {

  const { logout, user, extractNameFromEmail } = useAuth();
  const navigate = useNavigate();

  const [open,setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const displayName =
    user?.fullName
      ? user.fullName
      : user?.email
        ? extractNameFromEmail(user.email)
        : "Student";

  const displaySemester = user?.semester || "Student";
  const displayCourse = user?.degree || user?.stream || "Student";


  const menuItems = [

    {
      name:"Home",
      path:"/studentdashboard",
      icon:<LayoutDashboard size={20}/>
    },

    // {
    //   name:"Subjects",
    //   path:"/studentdashboard/subjects",
    //   icon:<BookOpen size={20}/>
    // },

    {
      name:"Lectures",
      path:"/studentdashboard/lectures",
      icon:<Video size={20}/>
    },

    {
      name:"Assignment",
      path:"/studentdashboard/assignment",
      icon:<FileText size={20}/>
    },

    {
      name:"Attendance",
      path:"/studentdashboard/attendance",
      icon:<CheckCircle size={20}/>
    },

    {
      name:"Exams",
      path:"/studentdashboard/exams",
      icon:<FileText size={20}/>
    },

    {
      name:"Query Updates",
      path:"/studentdashboard/query-updates",
      icon:<MessageSquare size={20}/>
    }

  ];


  return (

    <>

      {/* MOBILE MENU BUTTON */}
      <button
        onClick={()=>setOpen(true)}
        className="
        fixed
        top-4
        left-4
        z-[60]
        md:hidden
        bg-white
        shadow-md
        rounded-lg
        p-2
      "
      >
        <Menu size={22}/>
      </button>


      {/* OVERLAY MOBILE */}
      {open && (

        <div
          onClick={()=>setOpen(false)}
          className="
          fixed
          inset-0
          bg-black/30
          z-40
          md:hidden
        "
        />

      )}



      {/* SIDEBAR */}

      <div
        className={`
        fixed
        left-0
        top-0
        w-[280px]
        h-[100dvh]
        md:h-screen
        bg-slate-50
        border-r
        border-slate-200
        flex
        flex-col
        z-50
        overflow-y-auto
        overscroll-contain
        transition-transform
        duration-300

        ${open ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
      `}
      >


        {/* CLOSE BTN MOBILE */}

        <div className="md:hidden flex justify-end p-4">

          <button
            onClick={()=>setOpen(false)}
          >

            <X size={20}/>

          </button>

        </div>



        <div className="flex-1">

          

          {/* USER PROFILE */}

          <div className="p-8">

            <div className="flex items-center gap-3 mb-2">

              <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">

                {displayName
                  .charAt(0)
                  .toUpperCase()}

              </div>


              <div>

                <h2 className="font-bold text-slate-800 leading-tight">

                  {displayName}

                </h2>

                <p className="text-xs font-medium text-indigo-600">

                  SEM {displaySemester} - {displayCourse}

                </p>

                {user?.rollNo && (
                  <p className="text-xs text-slate-500 mt-1">
                    Roll No: {user.rollNo}
                  </p>
                )}

              </div>

            </div>

          </div>



          {/* MENU */}

          <nav className="flex flex-col px-4 gap-2">

            {menuItems.map((item)=>(

              <NavLink

                key={item.path}

                to={item.path}
                
                end = {item.path === "/studentdashboard"}

                onClick={()=>setOpen(false)}

                className={({isActive})=>

                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group

                  ${
                    isActive
                    ?
                    "bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200"
                    :
                    "text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                  }

                `}

              >

                {item.icon}

                <span className="font-semibold text-sm">

                  {item.name}

                </span>

              </NavLink>

            ))}

          </nav>

        </div>



        {/* LOGOUT */}

        <div className="mt-auto p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">

          <button

            onClick={handleLogout}

            className="
            flex
            items-center
            justify-center
            gap-2
            w-full
            py-3
            rounded-xl
            bg-white
            border
            border-red-100
            text-red-500
            font-bold
            text-sm
            hover:bg-red-50
            transition-colors
            shadow-sm
          "

          >

            <LogOut size={18}/>

            Logout

          </button>

        </div>

      </div>

    </>

  );

}
