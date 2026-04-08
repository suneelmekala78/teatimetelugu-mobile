/* ─── Bilingual helpers ─── */

export interface BilingualText {
  en: string;
  te: string;
}

export interface BilingualDescription {
  en: { text: string; html: string };
  te: { text: string; html: string };
}

/* ─── User ─── */

export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: "user" | "admin" | "writer";
  authProvider: "local" | "google";
  avatar: string;
  isActive: boolean;
  preferredLang: "en" | "te";
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthorRef {
  _id: string;
  fullName: string;
  avatar: string;
}

/* ─── News ─── */

export interface News {
  _id: string;
  author: AuthorRef;
  slug: string;
  title: BilingualText;
  shortNews: BilingualText;
  thumbnail: string;
  description: BilingualDescription;
  category: string;
  subCategory: string | null;
  movieRating: number | null;
  audio: { en: string | null; te: string | null };
  tags: { en: string[]; te: string[] };
  viewCount: number;
  reactionsCount: number;
  commentsCount: number;
  status: "draft" | "published" | "archived";
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ─── Gallery ─── */

export interface Gallery {
  _id: string;
  author: AuthorRef;
  slug: string;
  name: BilingualText;
  title: BilingualText;
  thumbnail: string | null;
  description: BilingualDescription;
  subCategory: string;
  images: string[];
  tags: { en: string[]; te: string[] };
  audio: { en: string | null; te: string | null };
  viewCount: number;
  reactionsCount: number;
  commentsCount: number;
  status: "draft" | "published" | "archived";
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ─── Video ─── */

export interface Video {
  _id: string;
  author: AuthorRef;
  slug: string;
  title: BilingualText;
  thumbnail: string;
  videoUrl: string;
  subCategory: string;
  tags: { en: string[]; te: string[] };
  viewCount: number;
  status: "draft" | "published" | "archived";
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ─── Comment ─── */

export interface Comment {
  _id: string;
  target: string;
  targetModel: "News" | "Gallery";
  author: AuthorRef | null;
  text: string;
  language: "en" | "te";
  parentComment: string | null;
  likes: string[];
  dislikes: string[];
  isDeleted: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ─── Reactions ─── */

export interface ReactionSummary {
  [type: string]: number;
}

/* ─── Home Config ─── */

export interface MediaLink {
  image: string;
  url: string;
}

export interface PositionedNews {
  news: {
    _id: string;
    title: BilingualText;
    slug: string;
    thumbnail: string;
    category: string;
    publishedAt: string | null;
  };
  position: number;
}

export interface MovieEntry {
  movie: BilingualText;
  releaseDate: BilingualText;
  category: BilingualText;
}

export interface CollectionEntry {
  movie: BilingualText;
  amount: BilingualText;
  category: BilingualText;
}

export interface HomeConfig {
  _id: string;
  breakingNews: PositionedNews[];
  trendingNews: PositionedNews[];
  hotTopics: PositionedNews[];
  movieReleases: MovieEntry[];
  movieCollections: CollectionEntry[];
  posters: {
    popup: MediaLink;
    movie: MediaLink;
    navbar: MediaLink;
  };
  ads: {
    homeLong: MediaLink;
    homeShort: MediaLink;
    categoryLong: MediaLink;
    categoryShort: MediaLink;
    newsLong: MediaLink;
    newsShort: MediaLink;
  };
  extraLinks: string[];
  createdAt: string;
  updatedAt: string;
}

/* ─── Search ─── */

export interface SearchHit {
  id: string;
  slug: string;
  title_en?: string;
  title_te?: string;
  name_en?: string;
  name_te?: string;
  thumbnail: string;
  category?: string;
  subCategory?: string;
  publishedAt?: string;
  author_name?: string;
}

export interface SearchResult {
  index: string;
  hits: SearchHit[];
  total: number;
}

/* ─── Pagination ─── */

export interface Pagination {
  page: number;
  pages: number;
  total: number;
}

/* ─── Language ─── */

export type Language = "en" | "te";
