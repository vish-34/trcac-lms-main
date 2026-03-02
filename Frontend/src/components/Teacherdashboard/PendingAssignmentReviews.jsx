import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

const PendingAssignmentReviews = () => {

  const { user } = useAuth();
  const navigate = useNavigate();

  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedAssignment, setExpandedAssignment] = useState(null);

  console.log("PendingAssignmentReviews component rendering");

  // =====================
  // REMOVE AFTER VIEW
  // =====================

  const handleViewSubmission = async (assignmentId, submissionId) => {

    console.log('handleViewSubmission called with:', { assignmentId, submissionId });
    
    // Always update local state first for immediate UI feedback
    if (!pendingReviews || !Array.isArray(pendingReviews)) {
      console.log("pendingReviews not available:", pendingReviews);
      return;
    }

    const assignmentIndex =
      pendingReviews.findIndex(
        (a) => a.assignmentId === assignmentId
      );

    console.log('Found assignment index:', assignmentIndex);

    if (assignmentIndex !== -1) {

      const updatedAssignment = {
        ...pendingReviews[assignmentIndex],
      };

      const submissionIndex =
        updatedAssignment.pendingSubmissions.findIndex(
          (s) => s.studentId === submissionId
        );

      console.log('Found submission index:', submissionIndex);

      if (submissionIndex !== -1) {

        updatedAssignment.pendingSubmissions.splice(
          submissionIndex,
          1
        );

        const updatedReviews = [...pendingReviews];

        if (
          updatedAssignment.pendingSubmissions.length === 0
        ) {
          console.log('Removing entire assignment from list');
          updatedReviews.splice(assignmentIndex, 1);
        } else {
          console.log('Updating assignment in list');
          updatedReviews[assignmentIndex] =
            updatedAssignment;
        }

        console.log('Setting new pending reviews:', updatedReviews);
        setPendingReviews(updatedReviews);
      }
    }
    
    // Then try to mark as reviewed in backend
    try {
      console.log('Making API call to:', `${import.meta.env.VITE_API_URL}/api/exams/submission/${assignmentId}/${submissionId}`);
      
      const response = await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/exams/submission/${assignmentId}/${submissionId}`,
        { grade: null, feedback: null } // Optional grade and feedback
      );
      
      console.log('API Response:', response);
      console.log('Submission marked as reviewed:', response.data);
      
    } catch (error) {
      console.error('Error marking submission as reviewed:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      
      // Show error to user so they know it failed
      setError(`Failed to mark submission as reviewed: ${error.response?.data?.message || error.message}`);
    }
  };

  // =====================
  // FETCH DATA
  // =====================

  useEffect(() => {
    fetchPendingReviews();
  }, [user]);

  const fetchPendingReviews = async () => {

    try {

      setLoading(true);

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/exams/pending-reviews/${user?.id}`
      );

      setPendingReviews(
        res.data.pendingReviews || []
      );

    } catch (err) {

      console.error(
        "Error fetching pending reviews:",
        err
      );

      setError(
        "Failed to fetch pending reviews"
      );

    } finally {

      setLoading(false);

    }
  };

  // =====================
  // FORMAT DATE
  // =====================

  const formatDate = (dateString) => {

    const date = new Date(dateString);

    return date.toLocaleDateString("en-US", {

      month: "short",
      day: "numeric",
      year: "numeric",

    });

  };

  const formatTimeAgo = (dateString) => {

    const now = new Date();
    const submittedDate = new Date(dateString);

    const diffMs = now - submittedDate;

    const diffMins = Math.floor(
      diffMs / 60000
    );

    const diffHours = Math.floor(
      diffMins / 60
    );

    const diffDays = Math.floor(
      diffHours / 24
    );

    if (diffMins < 1) return "Just now";

    if (diffMins < 60)
      return `${diffMins} minute${
        diffMins > 1 ? "s" : ""
      } ago`;

    if (diffHours < 24)
      return `${diffHours} hour${
        diffHours > 1 ? "s" : ""
      } ago`;

    return `${diffDays} day${
      diffDays > 1 ? "s" : ""
    } ago`;
  };

  const toggleExpand = (assignmentId) => {

    setExpandedAssignment(
      expandedAssignment === assignmentId
        ? null
        : assignmentId
    );
  };

  // =====================
  // LOADING UI
  // =====================

  if (loading) {

    return (

      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">

        <div className="animate-pulse">

          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>

          <div className="space-y-3">

            {[1,2,3].map(i => (

              <div
                key={i}
                className="border border-gray-200 rounded-lg p-4"
              >

                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>

                <div className="h-3 bg-gray-200 rounded w-1/2"></div>

              </div>

            ))}

          </div>

        </div>

      </div>

    );

  }

  // =====================
  // MAIN UI
  // =====================

  return (

    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">

      {/* HEADER */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">

        <h3 className="text-base sm:text-lg font-semibold text-gray-900">

          Pending Assignment Reviews

        </h3>

        <span className="text-sm text-gray-500">

          {pendingReviews.length} assignment
          {pendingReviews.length !== 1
            ? "s"
            : ""} pending review

        </span>

      </div>

      {/* ERROR DISPLAY */}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">

          <p className="text-sm text-red-700">{error}</p>

          <button
            onClick={() => setError("")}
            className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
          >
            Dismiss
          </button>

        </div>
      )}


      {/* EMPTY */}

      {pendingReviews.length === 0 ? (

        <div className="text-center py-8">

          <svg
            className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />

          </svg>

          <h3 className="mt-2 text-sm font-medium text-gray-900">

            All caught up!

          </h3>

          <p className="mt-1 text-sm text-gray-500">

            No pending assignment reviews.

          </p>

        </div>

      ) : (

        <div className="space-y-4">

          {pendingReviews.map((review) => (

            <div
              key={review.assignmentId}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >

              {/* ASSIGNMENT HEADER */}

              <div
                className="p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                onClick={() =>
                  toggleExpand(
                    review.assignmentId
                  )
                }
              >

                <div className="flex flex-col lg:flex-row lg:justify-between gap-3">

                  <div>

                    <h4 className="font-medium text-sm sm:text-base text-gray-900">

                      {review.title}

                    </h4>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs sm:text-sm text-gray-500">

                      <span>{review.subject}</span>

                      <span>{review.class}</span>

                      <span>{review.college}</span>

                      <span>

                        Deadline :
                        {formatDate(
                          review.deadline
                        )}

                      </span>

                    </div>

                  </div>


                  <div className="flex items-center justify-between lg:justify-end gap-4">

                    <div className="text-right">

                      <div className="text-lg font-semibold text-orange-600">

                        {review.pendingCount}

                      </div>

                      <div className="text-xs text-gray-500">

                        pending

                      </div>

                    </div>

                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedAssignment ===
                        review.assignmentId
                          ? "rotate-180"
                          : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />

                    </svg>

                  </div>

                </div>

              </div>


              {/* EXPANDED */}

              {expandedAssignment ===
                review.assignmentId && (

                <div className="border-t p-4">

                  <h5 className="font-medium mb-3 text-sm sm:text-base">

                    Submitted Assignments (
                    {
                      review
                        .pendingSubmissions
                        .length
                    })

                  </h5>


                  <div className="space-y-3">

                    {review.pendingSubmissions.map(
                      (
                        submission,
                        index
                      ) => (

                        <div
                          key={index}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gray-50 rounded-lg p-3"
                        >

                          <div className="flex items-center space-x-3">

                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">

                              <span className="text-xs font-medium text-blue-600">

                                {submission.studentName
                                  .charAt(0)
                                  .toUpperCase()}

                              </span>

                            </div>

                            <div>

                              <p className="font-medium text-sm">

                                {
                                  submission.studentName
                                }

                              </p>

                              <p className="text-xs sm:text-sm text-gray-500 break-all">

                                {
                                  submission.studentEmail
                                }

                              </p>

                            </div>

                          </div>


                          <div className="text-left sm:text-right">

                            <p className="text-xs sm:text-sm text-gray-500">

                              {formatTimeAgo(
                                submission.submittedAt
                              )}

                            </p>

                            {submission.fileUrl && (

                              <button
                                onClick={() => {

                                  window.open(
                                    `${import.meta.env.VITE_API_URL}${submission.fileUrl}`,
                                    "_blank"
                                  );

                                  handleViewSubmission(
                                    review.assignmentId,
                                    submission.studentId
                                  );

                                }}
                                className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                              >

                                View Submission

                              </button>

                            )}

                          </div>

                        </div>

                      )
                    )}

                  </div>


                  <div className="mt-4 pt-4 border-t">

                    <button
                      onClick={() =>
                        navigate(
                          "/teacherdashboard/assignment"
                        )
                      }
                      className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 text-sm font-medium"
                    >

                      Review All Submissions

                    </button>

                  </div>

                </div>

              )}

            </div>

          ))}

        </div>

      )}

    </div>

  );

};

export default PendingAssignmentReviews;