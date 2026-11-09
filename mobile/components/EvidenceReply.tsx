import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { tokens } from '../theme/tokens';
import { Button } from './Button';
import { MediaPicker, PhotoItem, VideoItem, AudioItem } from './MediaPicker';
import { answerEvidenceRequest } from '../lib/api/evidence';
import { canAddPhoto, validatePhoto, canAddVideo, validateVideo } from '../lib/rules/media';

interface Props {
  requestId: string;
  reportId: string;
  message: string;
  onDone: () => void;
}

/** S4 evidence panel: the admin's message (no admin identity) and a reply form. */
export function EvidenceReply({ requestId, reportId, message, onDone }: Props) {
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [audio, setAudio] = useState<AudioItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const hasContent = note.trim().length > 0 || photos.length > 0 || videos.length > 0 || audio !== null;

  const addPhoto = async (p: PhotoItem) => {
    const e = canAddPhoto(photos.length) ?? validatePhoto({ size: p.size });
    if (e) return setError(e);
    setError(null);
    setPhotos((x) => [...x, p]);
  };
  const addVideo = async (v: VideoItem) => {
    const e = canAddVideo(videos.length) ?? validateVideo({ size: v.size, durationSeconds: v.durationSeconds });
    if (e) return setError(e);
    setError(null);
    setVideos((x) => [...x, v]);
  };

  const submit = async () => {
    if (!hasContent) {
      setError('Add a note or a file to reply.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await answerEvidenceRequest({ requestId, reportId, note: note.trim(), photos, videos, audio });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.box} testID="evidence-reply">
      <Text style={styles.title}>Evidence requested</Text>
      <Text style={styles.text}>{message}</Text>
      <TextInput
        testID="evidence-reply-note"
        style={styles.input}
        multiline
        maxLength={500}
        placeholder="Add a note (optional)"
        value={note}
        onChangeText={setNote}
      />
      <MediaPicker
        testID="evidence-reply-media"
        photos={photos}
        videos={videos}
        audio={audio}
        onAddPhoto={addPhoto}
        onAddVideo={addVideo}
        onAddAudio={async (a) => setAudio(a)}
        onError={setError}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button testID="evidence-reply-submit" variant="primary" label="Send reply" loading={busy} onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: tokens.space[1] },
  title: { fontWeight: '700', color: tokens.color.text },
  text: { color: tokens.color.text },
  input: { borderWidth: 1, borderColor: tokens.color.borderStrong, borderRadius: 8, padding: tokens.space[1], minHeight: 72, color: tokens.color.text },
  error: { color: tokens.color.danger },
});
