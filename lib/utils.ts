import type { Language } from "@/types";

/**
 * Format date for display
 */
export function formatDate(
  date: string | number | Date | null | undefined,
  lang: Language = "en"
): string {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(lang === "te" ? "te-IN" : "en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Relative time (e.g., "5 minutes ago")
 */
export function timeAgo(date: string | number | Date | null | undefined, lang: Language = "en"): string {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";

  const now = Date.now();
  const diff = now - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (lang === "te") {
    if (seconds < 60) return "ఇప్పుడే";
    if (minutes < 60) return `${minutes} నిమిషాల క్రితం`;
    if (hours < 24) return `${hours} గంటల క్రితం`;
    if (days < 7) return `${days} రోజుల క్రితం`;
    return formatDate(d, lang);
  }

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(d, lang);
}

/**
 * Format view count (e.g., "1.2K", "3.4M")
 */
export function formatCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}

/**
 * Extract YouTube video ID from URL
 */
export function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Get YouTube thumbnail URL
 */
export function getYouTubeThumbnail(
  url: string,
  quality: "default" | "hqdefault" | "maxresdefault" = "hqdefault"
): string | null {
  const id = getYouTubeId(url);
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/${quality}.jpg`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

/**
 * Strip HTML tags from string
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}
