/**
 * lib/rules/media.ts
 * App-side media validation rules (BR4).
 * Returns null on success or the exact PRD error message string on failure.
 */

const MAX_PHOTOS = 3;
const MAX_VIDEOS = 1;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;   // 5 MB
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;  // 25 MB
const MAX_VIDEO_SECONDS = 30;
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;  // 10 MB
const MAX_AUDIO_SECONDS = 60;

export interface PhotoAsset {
  size: number;
}

export interface VideoAsset {
  size: number;
  durationSeconds: number;
}

export interface AudioAsset {
  size: number;
  durationSeconds: number;
}

/** Returns an error message if a photo violates BR4, otherwise null. */
export function validatePhoto(asset: PhotoAsset): string | null {
  if (asset.size > MAX_PHOTO_BYTES) {
    return 'File too large. Photo must be under 5MB.';
  }
  return null;
}

/** Returns an error message if the photo count limit is exceeded, otherwise null. */
export function canAddPhoto(currentCount: number): string | null {
  if (currentCount >= MAX_PHOTOS) {
    return 'You can only attach up to 3 photos.';
  }
  return null;
}

/** Returns an error message if a video violates BR4, otherwise null. */
export function validateVideo(asset: VideoAsset): string | null {
  if (asset.size > MAX_VIDEO_BYTES) {
    return 'File too large. Video must be under 25MB.';
  }
  if (asset.durationSeconds > MAX_VIDEO_SECONDS) {
    return 'Video is too long. Maximum duration is 30 seconds.';
  }
  return null;
}

/** Returns an error message if the video count limit is exceeded, otherwise null. */
export function canAddVideo(currentCount: number): string | null {
  if (currentCount >= MAX_VIDEOS) {
    return 'You can only attach 1 video.';
  }
  return null;
}

/** Returns an error message if an audio file violates BR4, otherwise null. */
export function validateAudio(asset: AudioAsset): string | null {
  if (asset.size > MAX_AUDIO_BYTES) {
    return 'File too large. Audio must be under 10MB.';
  }
  if (asset.durationSeconds > MAX_AUDIO_SECONDS) {
    return 'Audio is too long. Maximum duration is 60 seconds.';
  }
  return null;
}

/** Returns an error message if an audio note already exists, otherwise null. */
export function canAddAudio(hasAudio: boolean): string | null {
  if (hasAudio) {
    return 'You can only attach 1 audio note.';
  }
  return null;
}
