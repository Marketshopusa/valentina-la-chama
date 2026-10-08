/**
 * Utility functions for handling media (videos, gifs, images)
 * and sequential film carousels across the application.
 */

export const isVideoUrl = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  return (
    lower.endsWith('.mp4') ||
    lower.endsWith('.webm') ||
    lower.endsWith('.mov') ||
    lower.endsWith('.m4v') ||
    lower.includes('video/') ||
    lower.startsWith('data:video')
  );
};

export const isGifUrl = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  return (
    lower.endsWith('.gif') ||
    lower.includes('image/gif') ||
    lower.startsWith('data:image/gif')
  );
};

export const normalizeMediaList = (
  mediaList?: string[] | null,
  coverImage?: string | null,
  fallbackImage?: string | null
): string[] => {
  const result: string[] = [];
  if (Array.isArray(mediaList)) {
    for (const item of mediaList) {
      if (item && typeof item === 'string' && item.trim()) {
        result.push(item.trim());
      }
    }
  }
  if (result.length === 0 && coverImage && typeof coverImage === 'string' && coverImage.trim()) {
    result.push(coverImage.trim());
  }
  if (result.length === 0 && fallbackImage && typeof fallbackImage === 'string' && fallbackImage.trim()) {
    result.push(fallbackImage.trim());
  }
  return result.slice(0, 6);
};

export const DEFAULT_IMAGE_SLIDE_DURATION_SEC = 6;
