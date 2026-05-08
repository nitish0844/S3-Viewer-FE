import axios from "axios";

import { encryptData, decryptData } from "../utils/crypto";
import { useAuthStore } from "../store/authStore";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// REQUEST INTERCEPTOR
api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      console.log("Skipping encryption for FormData");

      return config;
    }

    if (config.data && ["post", "put", "patch"].includes(config.method)) {
      config.data = {
        payload: encryptData(config.data),
      };
    }

    return config;
  },

  (error) => Promise.reject(error),
);

// RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => {
    if (response.data.payload) {
      const decrypted = decryptData(response.data.payload);

      response.data = decrypted;
    }

    return response;
  },

  async (error) => {
    // SESSION EXPIRED
    if (error.response?.data?.detail === "401: Invalid session") {
      // clear zustand
      useAuthStore.getState().clearSession();
      // redirect login
      window.location.href = "/";
    }

    return Promise.reject(error);
  },
);

export default api;
