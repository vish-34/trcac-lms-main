import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext.jsx";

import RecentStudentActivity from "../../components/Teacherdashboard/RecentStudentActivity.jsx";
import PendingAssignmentReviews from "../../components/Teacherdashboard/PendingAssignmentReviews.jsx";
import UpcomingTests from "../../components/Teacherdashboard/UpcomingTests.jsx";

export default function TeacherHome() {

  const { user, extractNameFromEmail } = useAuth();

  const displayName =
    user?.fullName
      ? user.fullName
      : user?.email
        ? extractNameFromEmail(user.email)
        : "Teacher";

  return (

    <div className="space-y-6 md:space-y-8">


      {/* HERO */}

      <motion.div
        initial={{opacity:0,y:30}}
        animate={{opacity:1,y:0}}
        className="
        bg-indigo-100
        rounded-2xl
        p-6 md:p-8

        flex
        flex-col
        sm:flex-row

        gap-6
        sm:items-center
        sm:justify-between
      "
      >

        <div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold">

            Welcome back, {displayName} 👋

          </h1>

          <p className="text-gray-600 mt-2 text-sm md:text-base">

            Manage your students, lectures and academic activities.

          </p>

        </div>



        {/* IMAGE */}

        <img
          src="https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg"
          alt="profile"
          className="
          h-20
          w-20
          sm:h-24
          sm:w-24
          md:h-28
          md:w-28
          rounded-full
          object-cover
          self-start sm:self-auto
        "
        />

      </motion.div>



      {/* STAT CARDS */}

      <div
        className="
        grid
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-4
        gap-4 md:gap-5
      "
      >

        <StatCard
          title="Total Students"
          value="128"
          color="bg-indigo-100"
        />

        <StatCard
          title="Courses Assigned"
          value="4"
          color="bg-purple-100"
        />

        <StatCard
          title="Lectures Completed"
          value="36"
          color="bg-yellow-100"
        />

        <StatCard
          title="Attendance Avg"
          value="87%"
          color="bg-green-100"
        />

      </div>



      {/* SECOND ROW */}

      <div
        className="
        grid
        grid-cols-1
        lg:grid-cols-2
        gap-6
      "
      >

        <PendingAssignmentReviews/>

        <UpcomingTests/>

      </div>



      {/* ACTIVITY */}

      <RecentStudentActivity/>

    </div>

  );

}



/* ---------- STAT CARD ---------- */

function StatCard({title,value,color}){

  return(

    <div
      className={`
      ${color}
      rounded-xl
      p-5
      shadow-sm
    `}
    >

      <p className="text-sm text-gray-600">

        {title}

      </p>

      <h2 className="text-xl md:text-2xl font-semibold mt-2">

        {value}

      </h2>

    </div>

  );

}