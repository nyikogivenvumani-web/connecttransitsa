/**
 * T-C-10: MediaPicker component tests.
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { MediaPicker } from '../../components/MediaPicker';
import { messages } from '../../constants/messages';

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images', Videos: 'Videos' },
}));
jest.mock('expo-audio', () => ({
  useAudioRecorder: jest.fn(() => ({
    record: jest.fn(),
    stop: jest.fn(),
    uri: null,
    durationMillis: 0,
  })),
  requestMicrophonePermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
}));

describe('T-C-10: MediaPicker', () => {
  it('rejects a 4th photo with correct message', async () => {
    const onError = jest.fn();
    render(
      <MediaPicker
        photos={[
          { uri: 'a.jpg', size: 100 },
          { uri: 'b.jpg', size: 100 },
          { uri: 'c.jpg', size: 100 },
        ]}
        videos={[]}
        audio={null}
        onAddPhoto={async () => {}}
        onAddVideo={async () => {}}
        onAddAudio={async () => {}}
        onError={onError}
        testID="media-picker"
      />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('media-picker-add-photo'));
    });
    expect(onError).toHaveBeenCalledWith(messages.mediaMaxPhotos);
  });

  it('rejects a 2nd video with correct message', async () => {
    const onError = jest.fn();
    render(
      <MediaPicker
        photos={[]}
        videos={[{ uri: 'v.mp4', size: 100, durationSeconds: 5 }]}
        audio={null}
        onAddPhoto={async () => {}}
        onAddVideo={async () => {}}
        onAddAudio={async () => {}}
        onError={onError}
        testID="media-picker2"
      />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('media-picker2-add-video'));
    });
    expect(onError).toHaveBeenCalledWith(messages.mediaMaxVideos);
  });

  it('rejects a photo over 5MB', async () => {
    const ImagePicker = require('expo-image-picker');
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'big.jpg', fileSize: 6 * 1024 * 1024 }],
    });
    const onError = jest.fn();
    render(
      <MediaPicker
        photos={[]}
        videos={[]}
        audio={null}
        onAddPhoto={async () => {}}
        onAddVideo={async () => {}}
        onAddAudio={async () => {}}
        onError={onError}
        testID="media-picker3"
      />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('media-picker3-add-photo'));
    });
    expect(onError).toHaveBeenCalledWith(messages.mediaPhotoTooLarge);
  });

  it('rejects a video over 25MB', async () => {
    const ImagePicker = require('expo-image-picker');
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'big.mp4', fileSize: 26 * 1024 * 1024, duration: 10 }],
    });
    const onError = jest.fn();
    render(
      <MediaPicker
        photos={[]}
        videos={[]}
        audio={null}
        onAddPhoto={async () => {}}
        onAddVideo={async () => {}}
        onAddAudio={async () => {}}
        onError={onError}
        testID="media-picker4"
      />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('media-picker4-add-video'));
    });
    expect(onError).toHaveBeenCalledWith(messages.mediaVideoTooLarge);
  });

  it('rejects a video over 30 seconds', async () => {
    const ImagePicker = require('expo-image-picker');
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'long.mp4', fileSize: 1024, duration: 35 }],
    });
    const onError = jest.fn();
    render(
      <MediaPicker
        photos={[]}
        videos={[]}
        audio={null}
        onAddPhoto={async () => {}}
        onAddVideo={async () => {}}
        onAddAudio={async () => {}}
        onError={onError}
        testID="media-picker5"
      />,
    );
    await act(async () => {
      fireEvent.press(screen.getByTestId('media-picker5-add-video'));
    });
    expect(onError).toHaveBeenCalledWith(messages.mediaVideoTooLong);
  });
});
