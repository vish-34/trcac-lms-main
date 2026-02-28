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
    console.log('trackActivity called with:', {
      user: this.user,
      activityType,
      activityDetails
    });

    if (!this.user || this.user.role !== 'student') {
      console.log('ActivityTracker: Not tracking - user not student or not found', {
        user: this.user,
        role: this.user?.role
      });
      return; // Only track student activities
    }

    try {
      const activityData = {
        studentId: this.user.id,
        activityType,
        activityDetails,
        college: this.user.college || 'Degree College', // Fallback
        class: this.user.class || this.user.generateClass?.() || 'FYBScCS', // Fallback
        userAgent: navigator.userAgent,
        ipAddress: await this.getClientIP()
      };

      console.log('ActivityTracker: User object details:', {
        userId: this.user.id,
        userRole: this.user.role,
        userCollege: this.user.college,
        userClass: this.user.class,
        userGenerateClass: this.user.generateClass?.()
      });

      console.log('ActivityTracker: Sending activity data', activityData);

      await axios.post(`${this.baseURL}/api/activity/track`, activityData);
      console.log('ActivityTracker: Activity tracked successfully');
    } catch (error) {
      console.error('Failed to track activity:', error);
      console.error('Error response:', error.response?.data);
      // Don't throw error to avoid breaking main functionality
    }
  }

  async trackLectureView(lectureId, lectureTitle, lectureSubject, watchDuration, totalDuration) {
    const watchPercentage = totalDuration > 0 ? (watchDuration / totalDuration) * 100 : 0;
    
    console.log('ActivityTracker: Tracking lecture view', {
      lectureId,
      lectureTitle,
      lectureSubject,
      watchDuration,
      totalDuration,
      watchPercentage: Math.round(watchPercentage)
    });
    
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
