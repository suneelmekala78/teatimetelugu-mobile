import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// TODO: Replace with your production API URL
const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
    "X-Client-Type": "mobile",
  },
});

/* ── Attach access token to every request ── */
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ── 401 → single refresh attempt with queue ── */
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
          refreshToken,
        }, {
          headers: { "X-Client-Type": "mobile" },
        });

        const newToken: string = data.accessToken;
        await AsyncStorage.setItem("accessToken", newToken);

        if (data.refreshToken) {
          await AsyncStorage.setItem("refreshToken", data.refreshToken);
        }

        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        await AsyncStorage.multiRemove(["accessToken", "refreshToken"]);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/* ── Public fetch (no auth needed) ── */
export async function publicFetch<T>(
  path: string,
  params?: Record<string, string | number>
): Promise<T> {
  const { data } = await api.get<T>(path, { params });
  return data;
}
