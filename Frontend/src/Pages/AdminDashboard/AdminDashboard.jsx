import Sidebar from "../../components/Admindashboard/Adminsidebar";
import { Outlet } from "react-router-dom";
import { useBackNavigationBlock } from "../../hooks/useBackNavigationBlock.js";

export default function Dashboard(){
  // Completely block back navigation from dashboard
  useBackNavigationBlock();

  return(
    <div>
      <Sidebar/>
      <div className="ml-[260px] h-screen overflow-y-auto bg-gray-50 p-8">
        <Outlet/>
      </div>
    </div>
  );
}