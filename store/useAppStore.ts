import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Language } from "@/types";

interface AppState {
  language: Language;
  setLanguage: (lang: Language) => void;
  hydrate: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  language: "en",

  setLanguage: async (lang) => {
    await AsyncStorage.setItem("language", lang);
    set({ language: lang });
  },

  hydrate: async () => {
    try {
      const lang = await AsyncStorage.getItem("language");
      if (lang === "en" || lang === "te") {
        set({ language: lang });
      }
    } catch {
      // ignore
    }
  },
}));
