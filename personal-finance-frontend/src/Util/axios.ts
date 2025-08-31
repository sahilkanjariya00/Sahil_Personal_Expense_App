import axios from "axios";
import { HostEndpoint } from "./Endpoint";

const api = axios.create({
  baseURL: HostEndpoint, // FastAPI backend later
  withCredentials: false,
});

export const get = (url: string) => {
  return axios.get(`${url}`)
}

export const post = (url: string, data: any) => {
  return axios.post(`${url}`, data);
};

export const patch = (url: string, data: any) => {
  return axios.patch(`${url}`,data);
}

export const del = (url: string) => {
  return axios.delete(`${url}`);
}
export default api;
