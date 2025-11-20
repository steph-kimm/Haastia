import axios from 'axios';

const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || (isLocalhost ? 'http://localhost:8000' : 'https://haastia.fly.dev');

axios.defaults.baseURL = API_BASE_URL;

export default axios;
