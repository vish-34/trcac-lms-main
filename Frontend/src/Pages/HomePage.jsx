import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function HomePage() {

   const navigate = useNavigate();

    const loginfunction = () => {
        navigate("/login");
    }

    const adminLoginFunction = () => {
        navigate("/admin-login");
    }

    const createUserFunction = () => {
        navigate("/admin-create-user");
    }


  return (

    

    <div className="min-h-screen bg-white flex flex-col">

      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-12 py-4">

        <div className="flex items-center gap-3">
          <img src="/logo.png" className="h-14 w-14 object-contain" alt="TRCAC EduVeda" />
          <span className="text-2xl font-semibold tracking-tight text-slate-900">
            TRCAC EduVeda
          </span>
        </div>

        <div className="flex gap-6 items-center">

          <button onClick={loginfunction} className="text-sm font-medium">
            Student/Teacher Login
          </button>

          <button onClick={adminLoginFunction} className="text-sm font-medium">
            Admin Login
          </button>

        </div>

      </nav>



      {/* HERO */}

      <div className="flex flex-1 justify-center items-center relative overflow-hidden">

        {/* CLOCK */}

        <motion.img
          src="/clock.png"
          alt="clock"

          initial={{ x:-120 , opacity:0 }}
          animate={{ x:0 , opacity:.35 }}

          transition={{ duration:.8 }}

          className="absolute left-10 top-1/2 -translate-y-1/2 w-[300px] pointer-events-none"
        />



{/* LEFT DOODLE LINE */}

<motion.svg
initial={{opacity:0 , x:-60}}
animate={{opacity:.5 , x:0}}

transition={{duration:1}}

className="absolute left-40 top-20 pointer-events-none"

width="200"
height="150"
viewBox="0 0 200 150"
>

<path
d="M10 80 Q90 10 180 80"
stroke="#6366F1"
strokeWidth="3"
strokeDasharray="8"
fill="transparent"
/>

</motion.svg>



{/* RIGHT DOODLE BLOB */}

<motion.svg

initial={{opacity:0 , x:60}}
animate={{opacity:.35 , x:0}}

transition={{duration:1}}

className="absolute right-24 bottom-20 pointer-events-none"

width="260"
height="200"
viewBox="0 0 300 200"
>

<path
d="M50 100C40 40 140 10 210 60C280 110 240 180 160 180C80 180 60 140 50 100Z"

fill="#EEF2FF"
/>

<path
d="M70 110 Q150 20 240 120"
stroke="#6366F1"
strokeWidth="3"
strokeDasharray="6"
fill="transparent"
/>

</motion.svg>



{/* SMALL FLOATING STARS */}

<motion.svg
animate={{ y:[0,-10,0] }}
transition={{ repeat:Infinity , duration:4 }}

className="absolute right-40 top-32 opacity-60 pointer-events-none"

width="60"
height="60"
>

<circle cx="20" cy="20" r="5" fill="#6366F1"/>

<circle cx="45" cy="40" r="4" fill="#6366F1"/>

</motion.svg>



        {/* CENTER TEXT */}

        <div className="text-center -mt-16">

          <motion.h1
           initial={{ opacity:0 , y:30 }}
           animate={{ opacity:1 , y:0 }}
           transition={{ duration:.6 }}

           className="text-8xl font-bold leading-tight">

            Build.
          </motion.h1>


          <motion.h1
           initial={{ opacity:0 , y:30 }}
           animate={{ opacity:1 , y:0 }}
           transition={{ duration:.6 }}

           className="text-8xl font-bold leading-tight">

            Learn.
          </motion.h1>


          <motion.h1
           initial={{ opacity:0 , y:30 }}
           animate={{ opacity:1 , y:0 }}
           transition={{ duration:.6 }}

           className="text-8xl font-bold leading-tight">

            Excel.
          </motion.h1>

        </div>

      </div>

    </div>

  );

}
