const ContinueCard = () => {

  return (

    <div
      className="
      bg-slate-900
      rounded-3xl
      p-5 sm:p-8
      text-white
      relative
      overflow-hidden
      shadow-2xl
      shadow-indigo-200
    "
    >

      {/* Decorative background circle */}

      <div
        className="
        absolute
        -right-14 sm:-right-10
        -bottom-14 sm:-bottom-10
        w-32 sm:w-40
        h-32 sm:h-40
        bg-indigo-500/20
        rounded-full
        blur-3xl
      "
      />


      <div className="relative z-10">

        <h3
          className="
          text-indigo-300
          text-xs sm:text-sm
          font-bold
          uppercase
          tracking-wider
          mb-2
        "
        >
          Continue Learning
        </h3>


        <h2
          className="
          text-lg sm:text-2xl
          font-bold
          mb-6
          italic
          leading-snug
        "
        >

          Computer Networks: Layer 4

        </h2>


        <div className="space-y-4">

          {/* Progress Header */}

          <div
            className="
            flex
            justify-between
            text-xs sm:text-sm
            font-medium
          "
          >

            <span>Course Progress</span>

            <span>65%</span>

          </div>



          {/* Progress Bar */}

          <div
            className="
            w-full
            h-2
            bg-slate-700
            rounded-full
            overflow-hidden
          "
          >

            <div
              className="
              h-full
              bg-indigo-400
              w-[65%]
              rounded-full
              shadow-[0_0_12px_rgba(129,140,248,0.5)]
            "
            />

          </div>



          {/* Button */}

          <button
            className="
            mt-4
            bg-white
            text-slate-900
            px-6
            py-2.5
            rounded-xl
            font-bold
            text-sm
            hover:bg-indigo-50
            transition-colors
            w-full sm:w-auto
          "
          >

            Resume Lecture

          </button>

        </div>

      </div>

    </div>

  );

};