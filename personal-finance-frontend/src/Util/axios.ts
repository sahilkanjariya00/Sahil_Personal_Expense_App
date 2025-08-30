import axios from "axios";
import { HostEndpoint } from "./Endpoint";

const api = axios.create({
  baseURL: HostEndpoint, // FastAPI backend later
  withCredentials: false,
});

export default api;
