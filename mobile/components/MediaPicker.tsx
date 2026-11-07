import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { tokens } from '../theme/tokens';
import { messages } from '../constants/messages';

const MAX_PHOTOS = 3;
const MAX_VIDEOS = 1;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 25 * 1024 * 1024;
const MAX_VIDEO_SECONDS = 30;
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const MAX_AUDIO_SECONDS = 60;

export interface PhotoItem {
  uri: string;
  size: number;
}

export interface VideoItem {
  uri: string;
  size: number;
  durationSeconds: number;
}

export interface AudioItem {
  uri: string;
  size: number;
  durationSeconds: number;
}

interface MediaPickerProps {
  photos: PhotoItem[];
  videos: VideoItem[];
  audio: AudioItem | null;
  onAddPhoto: (photo: PhotoItem) => Promise<void>;
  onAddVideo: (video: VideoItem) => Promise<void>;
  onAddAudio: (audio: AudioItem) => Promise<void>;
  onError: (message: string) => void;
  testID?: string;
}

export function MediaPicker({
  photos,
  videos,
  audio,
  onAddPhoto,
  onAddVideo,
  onAddAudio,
  onError,
  testID,
}: MediaPickerProps) {
  const handleAddPhoto = async () => {
    if (photos.length >= MAX_PHOTOS) {
      onError(messages.mediaMaxPhotos);
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const size = asset.fileSize ?? 0;
    if (size > MAX_PHOTO_BYTES) {
      onError(messages.mediaPhotoTooLarge);
      return;
    }
    await onAddPhoto({ uri: asset.uri, size });
  };

  const handleAddVideo = async () => {
    if (videos.length >= MAX_VIDEOS) {
      onError(messages.mediaMaxVideos);
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const size = asset.fileSize ?? 0;
    const durationSeconds = (asset.duration ?? 0) / 1000;

    if (size > MAX_VIDEO_BYTES) {
      onError(messages.mediaVideoTooLarge);
      return;
    }
    if (durationSeconds > MAX_VIDEO_SECONDS) {
      onError(messages.mediaVideoTooLong);
      return;
    }
    await onAddVideo({ uri: asset.uri, size, durationSeconds });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        testID={testID ? `${testID}-add-photo` : undefined}
        style={styles.btn}
        onPress={handleAddPhoto}
      >
        <Text style={styles.btnText}>📷 Add photo ({photos.length}/{MAX_PHOTOS})</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID={testID ? `${testID}-add-video` : undefined}
        style={styles.btn}
        onPress={handleAddVideo}
      >
        <Text style={styles.btnText}>🎥 Add video ({videos.length}/{MAX_VIDEOS})</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID={testID ? `${testID}-add-audio` : undefined}
        style={styles.btn}
        onPress={async () => {
          // Audio recording handled by parent via onAddAudio
        }}
      >
        <Text style={styles.btnText}>🎙 {audio ? 'Replace audio' : 'Add audio note'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: tokens.space[1],
  },
  btn: {
    height: tokens.size.touchMin,
    borderRadius: tokens.radius.input,
    borderWidth: 1,
    borderColor: tokens.color.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: tokens.color.surface,
  },
  btnText: {
    fontSize: tokens.font.label.size,
    color: tokens.color.text,
    fontFamily: tokens.font.family,
  },
});
