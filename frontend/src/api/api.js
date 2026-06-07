import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

// Get all meetings for dashboard
export const getMeetings = () => axios.get(`${BASE_URL}/api/meetings`);

// Get single meeting details
export const getMeeting = (id) => axios.get(`${BASE_URL}/api/meetings/${id}`);

// Upload and process a meeting
export const processMeeting = (formData) =>
  axios.post(`${BASE_URL}/api/process`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

// Delete a meeting
export const deleteMeeting = (id) => axios.delete(`${BASE_URL}/api/meetings/${id}`);