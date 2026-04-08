import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "@/types";

interface UserState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (user: User, accessToken: string, refreshToken?: string) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  hydrate: () => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (user, accessToken, refreshToken) => {
    await AsyncStorage.setItem("accessToken", accessToken);
    if (refreshToken) {
      await AsyncStorage.setItem("refreshToken", refreshToken);
    }
    await AsyncStorage.setItem("user", JSON.stringify(user));
    set({ user, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    await AsyncStorage.multiRemove(["accessToken", "refreshToken", "user"]);
    set({ user: null, isAuthenticated: false });
  },

  updateUser: (data) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  hydrate: async () => {
    try {
      const [userJson, token] = await AsyncStorage.multiGet([
        "user",
        "accessToken",
      ]);
      if (userJson[1] && token[1]) {
        set({
          user: JSON.parse(userJson[1]),
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
