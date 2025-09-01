import axios from "axios";
import { HostEndpoint } from "./Endpoint";
import { clearToken, getToken } from "./helper";

const api = axios.create({
  baseURL: HostEndpoint, // FastAPI backend later
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      clearToken();
      // You can broadcast a logout event or hard-redirect:
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export const get = (url: string) => {
  return api.get(`${url}`)
}

export const post = (url: string, data: any) => {
  return api.post(`${url}`, data);
};

export const patch = (url: string, data: any) => {
  return api.patch(`${url}`,data);
}

export const del = (url: string) => {
  return api.delete(`${url}`);
}
export default api;
