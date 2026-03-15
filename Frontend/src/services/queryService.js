import axios from "axios";

const baseUrl = `${import.meta.env.VITE_API_URL}/api/lecture-queries`;

const queryService = {
  getLectureQueries: async ({ lectureId, role, studentId, teacherName }) => {
    const response = await axios.get(baseUrl, {
      params: {
        lectureId,
        role,
        studentId,
        teacherName,
      },
    });

    return response.data;
  },

  getStudentQueryUpdates: async (studentId, limit) => {
    const response = await axios.get(`${baseUrl}/student/${studentId}/updates`, {
      params: { limit },
    });
    return response.data;
  },

  getTeacherQuerySummary: async (teacherName) => {
    const response = await axios.get(`${baseUrl}/teacher/${encodeURIComponent(teacherName)}/summary`);
    return response.data;
  },

  createQuery: async (payload) => {
    const response = await axios.post(baseUrl, payload);
    return response.data;
  },

  answerQuery: async (queryId, payload) => {
    const response = await axios.patch(`${baseUrl}/${queryId}/answer`, payload);
    return response.data;
  },

  resolveQuery: async (queryId) => {
    const response = await axios.patch(`${baseUrl}/${queryId}/resolve`);
    return response.data;
  },
};

export default queryService;
