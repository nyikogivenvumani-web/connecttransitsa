/**
 * T-BR4-2 – Media validation rules checked in the app before upload.
 * These are the pure rule functions in lib/rules/media.ts.
 */
import {
  validatePhoto,
  validateVideo,
  validateAudio,
  canAddPhoto,
  canAddVideo,
  canAddAudio,
} from '../../lib/rules/media';

const MB = 1024 * 1024;

describe('T-BR4-2 media rules (app-side)', () => {
  // ── Photos ──────────────────────────────────────────────────────────────
  describe('validatePhoto', () => {
    it('T-BR4-2a accepts a photo under 5 MB', () => {
      expect(validatePhoto({ size: 4 * MB })).toBeNull();
    });

    it('T-BR4-2b rejects a photo over 5 MB with the PRD message', () => {
      expect(validatePhoto({ size: 6 * MB })).toBe(
        'File too large. Photo must be under 5MB.',
      );
    });

    it('T-BR4-2c accepts a photo exactly at 5 MB', () => {
      expect(validatePhoto({ size: 5 * MB })).toBeNull();
    });
  });

  describe('canAddPhoto', () => {
    it('T-BR4-2d allows adding when count < 3', () => {
      expect(canAddPhoto(2)).toBeNull();
    });

    it('T-BR4-2e rejects a 4th photo', () => {
      expect(canAddPhoto(3)).toBe('You can only attach up to 3 photos.');
    });
  });

  // ── Videos ──────────────────────────────────────────────────────────────
  describe('validateVideo', () => {
    it('T-BR4-2f accepts a valid video', () => {
      expect(validateVideo({ size: 10 * MB, durationSeconds: 20 })).toBeNull();
    });

    it('T-BR4-2g rejects video over 25 MB with the PRD message', () => {
      expect(validateVideo({ size: 26 * MB, durationSeconds: 10 })).toBe(
        'File too large. Video must be under 25MB.',
      );
    });

    it('T-BR4-2h rejects video over 30 s', () => {
      expect(validateVideo({ size: 5 * MB, durationSeconds: 31 })).toBe(
        'Video is too long. Maximum duration is 30 seconds.',
      );
    });

    it('T-BR4-2i accepts a video exactly at 25 MB and 30 s', () => {
      expect(validateVideo({ size: 25 * MB, durationSeconds: 30 })).toBeNull();
    });
  });

  describe('canAddVideo', () => {
    it('T-BR4-2j allows adding when count < 1', () => {
      expect(canAddVideo(0)).toBeNull();
    });

    it('T-BR4-2k rejects a 2nd video', () => {
      expect(canAddVideo(1)).toBe('You can only attach 1 video.');
    });
  });

  // ── Audio ────────────────────────────────────────────────────────────────
  describe('validateAudio', () => {
    it('T-BR4-2l accepts valid audio', () => {
      expect(validateAudio({ size: 5 * MB, durationSeconds: 30 })).toBeNull();
    });

    it('T-BR4-2m rejects audio over 10 MB', () => {
      expect(validateAudio({ size: 11 * MB, durationSeconds: 30 })).toBe(
        'File too large. Audio must be under 10MB.',
      );
    });

    it('T-BR4-2n rejects audio over 60 s', () => {
      expect(validateAudio({ size: 5 * MB, durationSeconds: 61 })).toBe(
        'Audio is too long. Maximum duration is 60 seconds.',
      );
    });
  });

  describe('canAddAudio', () => {
    it('T-BR4-2o allows adding when no audio yet', () => {
      expect(canAddAudio(false)).toBeNull();
    });

    it('T-BR4-2p rejects a 2nd audio note', () => {
      expect(canAddAudio(true)).toBe('You can only attach 1 audio note.');
    });
  });
});
