import { api, publicFetch } from "./api";
import type {
  News,
  Gallery,
  Video,
  Comment,
  HomeConfig,
  ReactionSummary,
  SearchHit,
  SearchResult,
  Pagination,
} from "@/types";

/* ─── Response types ─── */

interface ApiOk {
  success: boolean;
}
interface HomeRes extends ApiOk {
  config: HomeConfig;
}
interface NewsListRes extends ApiOk {
  news: News[];
  pagination?: Pagination;
}
interface NewsBySlugRes extends ApiOk {
  news: News;
}
interface GalleryListRes extends ApiOk {
  galleries: Gallery[];
  pagination?: Pagination;
}
interface GalleryBySlugRes extends ApiOk {
  gallery: Gallery;
}
interface VideoListRes extends ApiOk {
  videos: Video[];
  pagination?: Pagination;
}
interface VideoBySlugRes extends ApiOk {
  video: Video;
}
interface CommentsRes extends ApiOk {
  comments: Comment[];
  pagination?: Pagination;
}
interface ReactionSummaryRes extends ApiOk {
  summary: ReactionSummary;
}
interface SearchRes extends ApiOk {
  query: string;
  hits?: SearchHit[];
  total?: number;
  results?: SearchResult[];
}
interface AuthMeRes extends ApiOk {
  user: {
    _id: string;
    fullName: string;
    email: string;
    avatar: string;
    role: string;
  };
}

/* ═══════════════════ HOME ═══════════════════ */

export const getHomeConfig = () => publicFetch<HomeRes>("/home");

/* ═══════════════════ NEWS ═══════════════════ */

export const getLatestNews = (limit = 12) =>
  publicFetch<NewsListRes>("/news/latest", { limit });

export const getMostViewedNews = (limit = 10) =>
  publicFetch<NewsListRes>("/news/most-viewed", { limit });

export const getPublishedNews = (params: Record<string, string | number>) =>
  publicFetch<NewsListRes>("/news/published", params);

export const getCategoryNews = (
  category: string,
  limit = 6
) => publicFetch<NewsListRes>(`/news/category/${encodeURIComponent(category)}`, { limit });

export const getRelatedNews = (id: string) =>
  publicFetch<NewsListRes>(`/news/related/${encodeURIComponent(id)}`);

export const getNewsBySlug = (slug: string) =>
  publicFetch<NewsBySlugRes>(`/news/slug/${encodeURIComponent(slug)}`);

export const getShortNews = (params: Record<string, string | number>) =>
  publicFetch<NewsListRes>("/news/short-news", params);

/* ═══════════════════ GALLERY ═══════════════════ */

export const getPublishedGallery = (
  params: Record<string, string | number>
) => publicFetch<GalleryListRes>("/gallery/published", params);

export const getLatestGallery = (limit = 6) =>
  publicFetch<GalleryListRes>("/gallery/latest", { limit });

export const getGalleryBySlug = (slug: string) =>
  publicFetch<GalleryBySlugRes>(`/gallery/slug/${encodeURIComponent(slug)}`);

export const getRelatedGallery = (id: string) =>
  publicFetch<GalleryListRes>(`/gallery/related/${encodeURIComponent(id)}`);

/* ═══════════════════ VIDEOS ═══════════════════ */

export const getPublishedVideos = (
  params: Record<string, string | number>
) => publicFetch<VideoListRes>("/videos/published", params);

export const getLatestVideos = (limit = 10) =>
  publicFetch<VideoListRes>("/videos/latest", { limit });

export const getVideosBySubCategory = (
  subCategory: string,
  limit = 10
) =>
  publicFetch<VideoListRes>(
    `/videos/subcategory/${encodeURIComponent(subCategory)}`,
    { limit }
  );

export const getVideoBySlug = (slug: string) =>
  publicFetch<VideoBySlugRes>(`/videos/slug/${encodeURIComponent(slug)}`);

export const getRelatedVideos = (id: string) =>
  publicFetch<VideoListRes>(`/videos/related/${encodeURIComponent(id)}`);

/* ═══════════════════ SEARCH ═══════════════════ */

export const searchContent = (params: Record<string, string | number>) =>
  publicFetch<SearchRes>("/search", params);

/* ═══════════════════ COMMENTS ═══════════════════ */

export const getComments = (
  targetModel: string,
  targetId: string,
  params?: Record<string, string | number>
) =>
  publicFetch<CommentsRes>(
    `/comments/${encodeURIComponent(targetModel)}/${encodeURIComponent(targetId)}`,
    params
  );

export const createComment = (data: {
  target: string;
  targetModel: "News" | "Gallery";
  text: string;
  language: string;
  parentComment?: string;
}) => api.post("/comments", data);

export const getReplies = (commentId: string) =>
  api.get(`/comments/replies/${encodeURIComponent(commentId)}`);

export const deleteComment = (id: string) =>
  api.delete(`/comments/${encodeURIComponent(id)}`);

export const likeComment = (id: string) =>
  api.post(`/comments/${encodeURIComponent(id)}/like`);

export const dislikeComment = (id: string) =>
  api.post(`/comments/${encodeURIComponent(id)}/dislike`);

/* ═══════════════════ REACTIONS ═══════════════════ */

export const getReactionSummary = (targetModel: string, targetId: string) =>
  publicFetch<ReactionSummaryRes>(
    `/reactions/${encodeURIComponent(targetModel)}/${encodeURIComponent(targetId)}/summary`
  );

export const toggleReaction = (data: {
  target: string;
  targetModel: "News" | "Gallery";
  type: string;
}) => api.post("/reactions", data);

export const getMyReaction = (targetModel: string, targetId: string) =>
  api.get(
    `/reactions/${encodeURIComponent(targetModel)}/${encodeURIComponent(targetId)}/me`
  );

/* ═══════════════════ AUTH ═══════════════════ */

export const loginUser = (data: { email: string; password: string }) =>
  api.post("/auth/login", data);

export const registerUser = (data: {
  fullName: string;
  email: string;
  password: string;
}) => api.post("/auth/register", data);

export const googleAuth = (data: { idToken: string }) =>
  api.post("/auth/google", data);

export const getMe = () => api.get<AuthMeRes>("/auth/me");

export const logoutUser = () => api.post("/auth/logout");

export const refreshToken = () => api.post("/auth/refresh");

/* ═══════════════════ CONTACT ═══════════════════ */

export const submitContact = (data: {
  fullName: string;
  email: string;
  subject: string;
  message: string;
}) => api.post("/contact", data);

/* ═══════════════════ FCM ═══════════════════ */

export const registerFcmToken = (token: string) =>
  api.post("/notifications/fcm/register", { token });

export const unregisterFcmToken = (token: string) =>
  api.post("/notifications/fcm/unregister", { token });
