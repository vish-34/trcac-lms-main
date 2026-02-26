import Sidebar from "../../components/Studentdashboard/sidebar";
import { Outlet } from "react-router-dom";
import { useBackNavigationBlock } from "../../hooks/useBackNavigationBlock.js";

export default function Dashboard(){

  useBackNavigationBlock();

  return(

    <div className="flex">

      <Sidebar/>

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