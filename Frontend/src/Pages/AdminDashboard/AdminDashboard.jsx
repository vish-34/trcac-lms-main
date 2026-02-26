import Sidebar from "../../components/Admindashboard/Adminsidebar";
import { Outlet } from "react-router-dom";
import { useBackNavigationBlock } from "../../hooks/useBackNavigationBlock.js";

export default function Dashboard(){

  // block back navigation
  useBackNavigationBlock();

  return(

    <div className="flex w-full">

      {/* SIDEBAR */}

      <Sidebar/>


      {/* MAIN CONTENT */}

      <div
        className="
        flex-1
        md:ml-[280px]
        h-screen
        overflow-y-auto
        bg-gray-50
        p-4 sm:p-6 md:p-8
        pt-16 md:pt-8
      "
      >

        <Outlet/>

      </div>

    </div>

  );

}