import axios from 'axios';
import { mockApi } from './mockApi';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const instance = USE_MOCK
    ? mockApi
    : axios.create({
        baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    });

if (!USE_MOCK) {
    instance.interceptors.request.use(
        (config) => {
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const { token } = JSON.parse(userInfo);
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );
}

export default instance;
