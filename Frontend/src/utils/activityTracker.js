import axios from 'axios';

class ActivityTracker {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL;
    this.user = null;
    this.init();
  }

  init() {
    // Get user from localStorage or context
    const userData = localStorage.getItem('user');
    if (userData) {
      this.user = JSON.parse(userData);
    }
  }

  setUser(user) {
    this.user = user;
  }

  async trackActivity(activityType, activityDetails = {}) {
    if (!this.user || this.user.role !== 'student') {
      return; // Only track student activities
    }

    try {
      const activityData = {
        studentId: this.user.id,
        activityType,
        activityDetails,
        college: this.user.college,
        class: this.user.class || this.user.generateClass?.(),
        userAgent: navigator.userAgent,
        ipAddress: await this.getClientIP()
      };

      await axios.post(`${this.baseURL}/api/activity/track`, activityData);
    } catch (error) {
      console.error('Failed to track activity:', error);
      // Don't throw error to avoid breaking main functionality
    }
  }

  async trackLectureView(lectureId, lectureTitle, lectureSubject, watchDuration, totalDuration) {
    const watchPercentage = totalDuration > 0 ? (watchDuration / totalDuration) * 100 : 0;
    
    await this.trackActivity('lecture_viewed', {
      lectureId,
      lectureTitle,
      lectureSubject,
      watchDuration,
      totalDuration,
      watchPercentage: Math.round(watchPercentage)
    });
  }

  async trackAssignmentSubmission(assignmentId, assignmentTitle, assignmentSubject) {
    await this.trackActivity('assignment_submitted', {
      assignmentId,
      assignmentTitle,
      assignmentSubject
    });
  }

  async trackAssignmentDownload(assignmentId, assignmentTitle, assignmentSubject) {
    await this.trackActivity('assignment_downloaded', {
      assignmentId,
      assignmentTitle,
      assignmentSubject
    });
  }

  async trackLogin() {
    await this.trackActivity('login', {});
  }

  async getClientIP() {
    try {
      // Use a simple IP service or fallback to a generic value
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }
}

// Create singleton instance
const activityTracker = new ActivityTracker();

export default activityTracker;
