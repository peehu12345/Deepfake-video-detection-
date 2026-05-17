// api.js
import axios from "axios";
import {jwtDecode} from "jwt-decode";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const loginServices = async (payload) => {
  try {
    const res = await API.post("/login", payload);

    if (res.data.access_token) {
      const token = res.data.access_token;
      localStorage.setItem("token", token);
      // decode karke user info store karlo
      const decoded = jwtDecode(token);
      localStorage.setItem("user", JSON.stringify(decoded));

      return decoded; // user info return kar raha
    }
  } catch (err) {
    console.error("Login failed:", err.response.data.detail);
    throw err;
  }
};

export const getCurrentUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export default API;
