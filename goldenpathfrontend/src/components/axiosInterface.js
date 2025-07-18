import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://goldenpathproject.onrender.com',
  withCredentials: false,
});

export default axiosInstance;