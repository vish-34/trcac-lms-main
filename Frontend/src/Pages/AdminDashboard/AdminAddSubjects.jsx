import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";

const AdminAddSubjects = () => {

  const [mode, setMode] = useState("degree");

  const [formData, setFormData] = useState({

    collegeType: "degree",
    year: "",
    semester: "",
    courseOrStream: "",
    subjectName: ""

  });

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  // AUTO RESET SEMESTER WHEN YEAR CHANGES

  useEffect(() => {

    if (mode !== "degree") return;

    if (formData.year === "FY") {

      setFormData(prev => ({ ...prev, semester: "1" }));

    }

    if (formData.year === "SY") {

      setFormData(prev => ({ ...prev, semester: "3" }));

    }

    if (formData.year === "TY") {

      setFormData(prev => ({ ...prev, semester: "5" }));

    }

  }, [formData.year, mode]);


  // HANDLE CHANGE

  const handleChange = (e) => {

    setFormData(prev => ({

      ...prev,
      [e.target.name]: e.target.value

    }));

  };


  // SUBMIT

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");
    setSuccess("");

    if (

      !formData.year ||
      !formData.courseOrStream ||
      !formData.subjectName.trim() ||

      (mode === "degree" && !formData.semester)

    ) {

      setError("All fields required");

      return;

    }

    try {

      setLoading(true);

      const response = await axios.post(

        `${import.meta.env.VITE_API_URL}/api/subjects/add-subject`,

        formData

      );

      if (response.data.success) {

        setSuccess("Subject added successfully ✅");

        setFormData({

          collegeType: mode,
          year: "",
          semester: "",
          courseOrStream: "",
          subjectName: ""

        });

      }

    } catch (err) {

      console.log(err);

      setError(

        err.response?.data?.message ||

        "Something went wrong"

      );

    }

    finally {

      setLoading(false);

    }

  };


  return (

    <div className="min-h-screen bg-gray-50 px-4 py-10">

      <div className="max-w-2xl mx-auto">

        <motion.div

          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}

          className="bg-white rounded-2xl shadow-lg p-6 sm:p-8"

        >

          <h1 className="text-2xl font-semibold mb-6 text-center">

            Add New Subject

          </h1>


          {/* TOGGLE */}

          <div className="flex bg-gray-100 rounded-full p-1 mb-6 w-fit mx-auto">

            {["degree", "junior"].map(tab => (

              <button

                key={tab}
                type="button"

                onClick={() => {

                  setMode(tab);

                  setFormData({

                    collegeType: tab,
                    year: "",
                    semester: "",
                    courseOrStream: "",
                    subjectName: ""

                  });

                }}

                className={`px-6 py-2 rounded-full capitalize transition

${mode === tab ?

                    "bg-white shadow font-medium"

                    :

                    "text-gray-500"

                  }

`}

              >

                {tab === "degree"

                  ?

                  "Degree College"

                  :

                  "Junior College"

                }

              </button>

            ))}

          </div>



          {/* ERROR */}

          {error && (

            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">

              {error}

            </div>

          )}



          {/* SUCCESS */}

          {success && (

            <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg">

              {success}

            </div>

          )}



          <form

            onSubmit={handleSubmit}

            className="space-y-5"

          >


            {/* YEAR */}

            <select

              name="year"

              value={formData.year}

              onChange={handleChange}

              className="w-full border rounded-lg px-4 py-3"

            >

              <option value="">

                Select Year

              </option>

              {mode === "degree" ? (

                <>

                  <option value="FY">

                    First Year (FY)

                  </option>

                  <option value="SY">

                    Second Year (SY)

                  </option>

                  <option value="TY">

                    Third Year (TY)

                  </option>

                </>

              )

                :

                (

                  <>

                    <option value="FYJC">

                      FYJC

                    </option>

                    <option value="SYJC">

                      SYJC

                    </option>

                  </>

                )

              }

            </select>



            {/* SEMESTER */}

            {mode === "degree" && formData.year && (

              <select

                name="semester"

                value={formData.semester}

                onChange={handleChange}

                className="w-full border rounded-lg px-4 py-3"

              >

                {formData.year === "FY" && (

                  <>

                    <option value="1">

                      Semester 1

                    </option>

                    <option value="2">

                      Semester 2

                    </option>

                  </>

                )}

                {formData.year === "SY" && (

                  <>

                    <option value="3">

                      Semester 3

                    </option>

                    <option value="4">

                      Semester 4

                    </option>

                  </>

                )}

                {formData.year === "TY" && (

                  <>

                    <option value="5">

                      Semester 5

                    </option>

                    <option value="6">

                      Semester 6

                    </option>

                  </>

                )}

              </select>

            )}



            {/* COURSE */}

            <select

              name="courseOrStream"

              value={formData.courseOrStream}

              onChange={handleChange}

              className="w-full border rounded-lg px-4 py-3"

            >

              <option value="">

                {mode === "degree"

                  ?

                  "Select Degree"

                  :

                  "Select Stream"

                }

              </option>

              {mode === "degree" ? (

                <>

                  <option value="B.Sc (CS)">B.Sc (CS)</option>
                  <option value="B.Sc (IT)">B.Sc (IT)</option>
                  <option value="BA">BA</option>
                  <option value="BAMMC">BAMMC</option>
                  <option value="BCom">BCom</option>
                  <option value="BMS">BMS</option>
                  <option value="BAF">BAF</option>

                </>

              )

                :

                (

                  <>

                    <option value="Commerce">

                      Commerce

                    </option>

                    <option value="Arts">

                      Arts

                    </option>

                  </>

                )

              }

            </select>



            {/* SUBJECT */}

            <input

              type="text"

              name="subjectName"

              placeholder="Enter Subject Name"

              value={formData.subjectName}

              onChange={handleChange}

              className="w-full border rounded-lg px-4 py-3"

            />



            <button

              type="submit"

              disabled={loading}

              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg"

            >

              {loading ?

                "Adding Subject..."

                :

                "Add Subject"

              }

            </button>

          </form>

        </motion.div>

      </div>

    </div>

  );

};

export default AdminAddSubjects;