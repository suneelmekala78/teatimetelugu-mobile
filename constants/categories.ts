import type { Language } from "@/types";

export const CATEGORIES = {
  general: {
    label: { en: "General", te: "జనరల్" },
    icon: "newspaper-outline",
    subCategories: {
      "andhra-pradesh": { en: "Andhra Pradesh", te: "ఆంధ్ర ప్రదేశ్" },
      telangana: { en: "Telangana", te: "తెలంగాణ" },
      national: { en: "National", te: "జాతీయం" },
      international: { en: "International", te: "అంతర్జాతీయం" },
    },
  },
  politics: {
    label: { en: "Politics", te: "రాజకీయాలు" },
    icon: "megaphone-outline",
    subCategories: {
      "andhra-pradesh": { en: "Andhra Pradesh", te: "ఆంధ్ర ప్రదేశ్" },
      telangana: { en: "Telangana", te: "తెలంగాణ" },
      national: { en: "National", te: "జాతీయం" },
      international: { en: "International", te: "అంతర్జాతీయం" },
    },
  },
  movies: {
    label: { en: "Movies", te: "సినిమాలు" },
    icon: "film-outline",
    subCategories: {
      tollywood: { en: "Tollywood", te: "టాలీవుడ్" },
      bollywood: { en: "Bollywood", te: "బాలీవుడ్" },
      hollywood: { en: "Hollywood", te: "హాలీవుడ్" },
      "south-cinema": { en: "South Cinema", te: "సౌత్ సినిమా" },
      collections: { en: "Collections", te: "కలెక్షన్లు" },
    },
  },
  gossips: {
    label: { en: "Gossips", te: "గాసిప్స్" },
    icon: "chatbubbles-outline",
    subCategories: {
      "andhra-pradesh": { en: "Andhra Pradesh", te: "ఆంధ్ర ప్రదేశ్" },
      telangana: { en: "Telangana", te: "తెలంగాణ" },
      movies: { en: "Movies", te: "సినిమాలు" },
    },
  },
  reviews: {
    label: { en: "Reviews", te: "రివ్యూలు" },
    icon: "star-outline",
    subCategories: {
      theater: { en: "Theater", te: "థియేటర్" },
      ott: { en: "OTT", te: "OTT" },
    },
  },
  gallery: {
    label: { en: "Gallery", te: "గ్యాలరీ" },
    icon: "images-outline",
    subCategories: {
      heroine: { en: "Heroine", te: "హీరోయిన్" },
      hero: { en: "Hero", te: "హీరో" },
      celebrity: { en: "Celebrity", te: "సెలబ్రిటీ" },
    },
  },
  videos: {
    label: { en: "Videos", te: "వీడియోలు" },
    icon: "videocam-outline",
    subCategories: {
      "trailers-teasers": { en: "Trailers & Teasers", te: "ట్రైలర్లు & టీజర్లు" },
      "video-songs": { en: "Video Songs", te: "వీడియో సాంగ్స్" },
      "lyrical-songs": { en: "Lyrical Songs", te: "లిరికల్ సాంగ్స్" },
      ott: { en: "OTT", te: "OTT" },
      events: { en: "Events", te: "ఈవెంట్స్" },
      shows: { en: "Shows", te: "షోస్" },
      "reviews-public-talks": { en: "Reviews & Public Talks", te: "రివ్యూలు & పబ్లిక్ టాక్స్" },
      promos: { en: "Promos", te: "ప్రోమోస్" },
      interviews: { en: "Interviews", te: "ఇంటర్వ్యూలు" },
      other: { en: "Other", te: "ఇతర" },
    },
  },
  ott: {
    label: { en: "OTT", te: "ఓటిటి" },
    icon: "tv-outline",
    subCategories: {},
  },
  sports: {
    label: { en: "Sports", te: "క్రీడలు" },
    icon: "football-outline",
    subCategories: {
      cricket: { en: "Cricket", te: "క్రికెట్" },
      football: { en: "Football", te: "ఫుట్‌బాల్" },
      kabaddi: { en: "Kabaddi", te: "కబడ్డీ" },
      olympics: { en: "Olympics", te: "ఒలింపిక్స్" },
      other: { en: "Other", te: "ఇతర" },
    },
  },
  business: {
    label: { en: "Business", te: "బిజినెస్" },
    icon: "briefcase-outline",
    subCategories: {
      national: { en: "National", te: "జాతీయం" },
      international: { en: "International", te: "అంతర్జాతీయం" },
    },
  },
  technology: {
    label: { en: "Tech", te: "టెక్నాలజీ" },
    icon: "hardware-chip-outline",
    subCategories: {
      national: { en: "National", te: "జాతీయం" },
      international: { en: "International", te: "అంతర్జాతీయం" },
    },
  },
  health: {
    label: { en: "Health", te: "ఆరోగ్యం" },
    icon: "heart-outline",
    subCategories: {
      nutrition: { en: "Nutrition", te: "పోషకాహారం" },
      "mental-health": { en: "Mental Health", te: "మానసిక ఆరోగ్యం" },
      "physical-health": { en: "Physical Health", te: "శారీరక ఆరోగ్యం" },
    },
  },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as CategoryKey[];

/** Navigation categories (excluding gallery and videos since they have their own tabs) */
export const NAV_CATEGORIES: CategoryKey[] = [
  "general",
  "politics",
  "movies",
  "gossips",
  "reviews",
  "ott",
  "sports",
  "business",
  "technology",
  "health",
];

export function getCategoryLabel(key: string, lang: Language = "en"): string {
  const cat = CATEGORIES[key as CategoryKey];
  return cat?.label[lang] ?? key;
}

export function getSubCategoryLabel(
  category: string,
  subCategory: string,
  lang: Language = "en"
): string {
  const cat = CATEGORIES[category as CategoryKey];
  if (!cat) return subCategory;
  const sub = (cat.subCategories as Record<string, { en: string; te: string }>)[
    subCategory
  ];
  return sub?.[lang] ?? subCategory;
}

export function getCategoryIcon(key: string): string {
  const cat = CATEGORIES[key as CategoryKey];
  return cat?.icon ?? "newspaper-outline";
}
