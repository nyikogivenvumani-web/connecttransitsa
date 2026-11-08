/**
 * app/report/new.tsx – S3 Report Incident screen.
 *
 * Tests:
 *   T-US1-1  Happy path submit
 *   T-US1-2  Validation errors
 *   T-US1-3  Category "Other" shows custom text field
 *   T-BR9-3  Rate limit error
 *   T-EDGE-1 Offline → draft saved
 *   T-EDGE-2 "Other/Unregistered" org → unlisted entity name
 *   T-EDGE-3 Oversized file → submit disabled
 *   T-S3-1   Location denied → still submittable
 *   T-S3-2   Leave with unsaved input → ConfirmModal
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as Crypto from 'expo-crypto';
import NetInfo from '@react-native-community/netinfo';

import { tokens } from '../../theme/tokens';
import { Select } from '../../components/Select';
import { MediaPicker, PhotoItem, VideoItem, AudioItem } from '../../components/MediaPicker';
import { ConfirmModal } from '../../components/ConfirmModal';
import { Button } from '../../components/Button';

import { fetchOrganizations, submitReport, Organization } from '../../lib/api/reports';
import { saveDraft } from '../../lib/db/drafts';
import { canAddPhoto, validatePhoto, canAddVideo, validateVideo, canAddAudio } from '../../lib/rules/media';

const CATEGORIES = [
  'Sexual Misconduct',
  'Physical Assault',
  'Reckless & Negligent Driving',
  'Overcrowding & Safety Hazard',
  'Extortion & Fare Intimidation',
  'Overcharging',
  'Harassment',
  'Drunk or Impaired Driving',
  'Unroadworthy Vehicle',
  'Refusal of Service or Route Deviation',
  'Other',
];

export default function ReportIncidentScreen() {
  const router = useRouter();

  // ── Form state ──────────────────────────────────────────────────────────
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [unlistedEntity, setUnlistedEntity] = useState('');
  const [plate, setPlate] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [sapsCase, setSapsCase] = useState('');
  const [incidentAt] = useState(new Date().toISOString());
  const [locationLat, setLocationLat] = useState<number | undefined>();
  const [locationLng, setLocationLng] = useState<number | undefined>();
  const [locationText, setLocationText] = useState('');
  const [locationDenied, setLocationDenied] = useState(false);

  // ── Media state ─────────────────────────────────────────────────────────
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [audio, setAudio] = useState<AudioItem | null>(null);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // ── UI state ────────────────────────────────────────────────────────────
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // ── Load orgs and location on mount ────────────────────────────────────
  useEffect(() => {
    fetchOrganizations().then(setOrgs).catch(() => {});

    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status !== 'granted') {
        setLocationDenied(true);
        return;
      }
      Location.getCurrentPositionAsync({}).then(({ coords }) => {
        setLocationLat(coords.latitude);
        setLocationLng(coords.longitude);
      });
    });
  }, []);

  // ── Derived values ──────────────────────────────────────────────────────
  const selectedOrg = orgs.find((o) => o.id === orgId);
  const isOversight = selectedOrg?.is_oversight ?? false;

  const orgOptions = orgs.map((o) => ({ label: o.name, value: o.id }));
  const categoryOptions = CATEGORIES.map((c) => ({ label: c, value: c }));

  const hasUnsavedInput =
    isDirty || !!plate || !!description || !!orgId || !!category;

  const submitDisabled = submitting || !!mediaError;

  // ── Validation ──────────────────────────────────────────────────────────
  function validate(): boolean {
    const e: Record<string, string> = {};

    if (!orgId) e.org = 'Please select an organization.';
    if (!plate.trim()) e.plate = 'Vehicle registration plate is required';
    if (!category) e.category = 'Please select a category.';
    if (category === 'Other' && !customCategory.trim())
      e.customCategory = 'Please describe the category.';
    if (!description.trim()) e.description = 'Description is required.';
    if (description.length > 2000) e.description = 'Description must be under 2000 characters.';
    if (isOversight && !unlistedEntity.trim())
      e.unlistedEntity = 'Please enter the transport operator name.';

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError(null);

    const id = Crypto.randomUUID();

    try {
      const { case_ref } = await submitReport({
        id,
        organizationId: orgId!,
        unlistedEntityName: isOversight ? unlistedEntity : undefined,
        vehiclePlate: plate.trim(),
        category: category!,
        customCategoryText: category === 'Other' ? customCategory : undefined,
        description: description.trim(),
        incidentAt,
        locationLat,
        locationLng,
        locationText: locationText || undefined,
        sapsCase: sapsCase || undefined,
        photos,
        videos,
        audio,
      });

      router.push({ pathname: '/report/success', params: { case_ref } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Try again.';

      // T-EDGE-1: save draft on network failure
      if (msg.includes('Network connection lost')) {
        await saveDraft({
          id,
          organizationId: orgId!,
          unlistedEntityName: isOversight ? unlistedEntity : undefined,
          vehiclePlate: plate.trim(),
          category: category!,
          customCategoryText: category === 'Other' ? customCategory : undefined,
          description: description.trim(),
          incidentAt,
          locationLat,
          locationLng,
          locationText: locationText || undefined,
          sapsCase: sapsCase || undefined,
        });
      }

      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [
    orgId, isOversight, unlistedEntity, plate, category, customCategory,
    description, incidentAt, locationLat, locationLng, locationText,
    sapsCase, photos, videos, audio, router,
  ]);

  // ── Back / leave guard ──────────────────────────────────────────────────
  const handleBack = () => {
    if (hasUnsavedInput) {
      setShowLeaveModal(true);
    } else {
      router.back();
    }
  };

  // ── Media handlers ──────────────────────────────────────────────────────
  const handleAddPhoto = async (photo: PhotoItem) => {
    const countErr = canAddPhoto(photos.length);
    if (countErr) { setMediaError(countErr); return; }
    const sizeErr = validatePhoto({ size: photo.size });
    if (sizeErr) { setMediaError(sizeErr); return; }
    setMediaError(null);
    setPhotos((prev) => [...prev, photo]);
    setIsDirty(true);
  };

  const handleAddVideo = async (video: VideoItem) => {
    const countErr = canAddVideo(videos.length);
    if (countErr) { setMediaError(countErr); return; }
    const sizeErr = validateVideo({ size: video.size, durationSeconds: video.durationSeconds });
    if (sizeErr) { setMediaError(sizeErr); return; }
    setMediaError(null);
    setVideos((prev) => [...prev, video]);
    setIsDirty(true);
  };

  const handleAddAudio = async (a: AudioItem) => {
    setAudio(a);
    setIsDirty(true);
  };

  const handleMediaError = (msg: string) => {
    setMediaError(msg);
  };

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* Back button */}
      <TouchableOpacity
        testID="report-back-btn"
        style={styles.backBtn}
        onPress={handleBack}
        accessibilityLabel="Go back"
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>Report an Incident</Text>
        <Text style={styles.helper}>Do not include your name or contact details.</Text>

        {/* Organization */}
        <Text style={styles.label}>Transport operator</Text>
        <Select
          testID="report-org-select"
          options={orgOptions}
          value={orgId}
          onChange={(v) => { setOrgId(v); setIsDirty(true); }}
          placeholder="Select operator…"
        />
        {errors.org ? <Text style={styles.fieldError}>{errors.org}</Text> : null}

        {/* Unlisted entity name (oversight) */}
        {isOversight && (
          <>
            <Text style={styles.label}>Operator name</Text>
            <TextInput
              testID="report-unlisted-entity-input"
              style={styles.input}
              value={unlistedEntity}
              onChangeText={(v) => { setUnlistedEntity(v); setIsDirty(true); }}
              placeholder="Enter operator name"
              placeholderTextColor={tokens.color.textMuted}
            />
            {errors.unlistedEntity ? (
              <Text style={styles.fieldError}>{errors.unlistedEntity}</Text>
            ) : null}
          </>
        )}

        {/* Vehicle plate */}
        <Text style={styles.label}>Vehicle registration plate</Text>
        <TextInput
          testID="report-plate-input"
          style={[styles.input, errors.plate ? styles.inputError : null]}
          value={plate}
          onChangeText={(v) => { setPlate(v); setIsDirty(true); }}
          placeholder="e.g. CA 123 GP"
          placeholderTextColor={tokens.color.textMuted}
          autoCapitalize="characters"
        />
        {errors.plate ? <Text style={styles.fieldError}>{errors.plate}</Text> : null}

        {/* Category */}
        <Text style={styles.label}>Incident category</Text>
        <Select
          testID="report-category-select"
          options={categoryOptions}
          value={category}
          onChange={(v) => { setCategory(v); setIsDirty(true); }}
          placeholder="Select category…"
        />
        {errors.category ? <Text style={styles.fieldError}>{errors.category}</Text> : null}

        {/* Custom category text */}
        {category === 'Other' && (
          <>
            <Text style={styles.label}>Describe the category</Text>
            <TextInput
              testID="report-custom-category-input"
              style={[styles.input, errors.customCategory ? styles.inputError : null]}
              value={customCategory}
              onChangeText={(v) => { setCustomCategory(v); setIsDirty(true); }}
              placeholder="Briefly describe"
              placeholderTextColor={tokens.color.textMuted}
            />
            {errors.customCategory ? (
              <Text style={styles.fieldError}>{errors.customCategory}</Text>
            ) : null}
          </>
        )}

        {/* Description */}
        <Text style={styles.label}>What happened?</Text>
        <TextInput
          testID="report-description-input"
          style={[styles.input, styles.textArea, errors.description ? styles.inputError : null]}
          value={description}
          onChangeText={(v) => { setDescription(v); setIsDirty(true); }}
          placeholder="Describe the incident (max 2000 characters)"
          placeholderTextColor={tokens.color.textMuted}
          multiline
          numberOfLines={4}
          maxLength={2000}
        />
        {errors.description ? <Text style={styles.fieldError}>{errors.description}</Text> : null}

        {/* SAPS case number (optional) */}
        <Text style={styles.label}>SAPS case number (optional)</Text>
        <TextInput
          testID="report-saps-case-input"
          style={styles.input}
          value={sapsCase}
          onChangeText={(v) => { setSapsCase(v); setIsDirty(true); }}
          placeholder="e.g. CAS 123/01/2026"
          placeholderTextColor={tokens.color.textMuted}
        />

        {/* Incident date/time */}
        <Text testID="report-incident-date" style={styles.label}>
          Incident date: {new Date(incidentAt).toLocaleString()}
        </Text>

        {/* Location */}
        {locationDenied || !locationLat ? (
          <>
            <Text style={styles.label}>Location (optional)</Text>
            <TextInput
              testID="report-location-text-input"
              style={styles.input}
              value={locationText}
              onChangeText={(v) => { setLocationText(v); setIsDirty(true); }}
              placeholder="e.g. Corner of Main and Market St"
              placeholderTextColor={tokens.color.textMuted}
            />
          </>
        ) : (
          <Text testID="report-location-text-input" style={styles.caption}>
            📍 Location captured automatically
          </Text>
        )}

        {/* Media picker */}
        <Text style={styles.label}>Evidence (optional)</Text>
        <MediaPicker
          testID="report-media-picker"
          photos={photos}
          videos={videos}
          audio={audio}
          onAddPhoto={handleAddPhoto}
          onAddVideo={handleAddVideo}
          onAddAudio={handleAddAudio}
          onError={handleMediaError}
        />
        {mediaError ? <Text style={styles.fieldError}>{mediaError}</Text> : null}

        {/* Submit error */}
        {submitError ? (
          <Text style={styles.submitError}>{submitError}</Text>
        ) : null}

        {/* Submit button */}
        <Button
          testID="report-submit-btn"
          label={submitting ? 'Submitting…' : 'Submit Formal Report'}
          variant="primary"
          onPress={handleSubmit}
          disabled={submitDisabled}
          loading={submitting}
        />
      </ScrollView>

      {/* Leave confirmation modal */}
      <ConfirmModal
        visible={showLeaveModal}
        title="Leave report?"
        message="Your unsaved report will be lost. Are you sure?"
        confirmLabel="Leave"
        cancelLabel="Stay"
        onConfirm={() => { setShowLeaveModal(false); router.back(); }}
        onCancel={() => setShowLeaveModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: tokens.color.background,
  },
  backBtn: {
    paddingHorizontal: tokens.space[2],
    paddingVertical: tokens.space[1],
    minHeight: tokens.size.touchMin,
    justifyContent: 'center',
  },
  backText: {
    fontSize: tokens.font.label.size,
    color: tokens.color.primary,
    fontFamily: tokens.font.family,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: tokens.space[2],
    gap: tokens.space[1],
    paddingBottom: tokens.space[5],
  },
  heading: {
    fontSize: tokens.font.h2.size,
    fontWeight: tokens.font.h2.weight,
    color: tokens.color.text,
    fontFamily: tokens.font.family,
    marginBottom: tokens.space[1],
  },
  helper: {
    fontSize: tokens.font.caption.size,
    color: tokens.color.textMuted,
    fontFamily: tokens.font.family,
    marginBottom: tokens.space[2],
  },
  label: {
    fontSize: tokens.font.label.size,
    fontWeight: tokens.font.label.weight,
    color: tokens.color.text,
    fontFamily: tokens.font.family,
    marginTop: tokens.space[1],
  },
  input: {
    height: tokens.size.input,
    borderRadius: tokens.radius.input,
    borderWidth: 1,
    borderColor: tokens.color.borderStrong,
    backgroundColor: tokens.color.surface,
    paddingHorizontal: tokens.space[2],
    fontSize: tokens.font.body.size,
    color: tokens.color.text,
    fontFamily: tokens.font.family,
  },
  inputError: {
    borderColor: tokens.color.danger,
    borderWidth: 2,
  },
  textArea: {
    height: 120,
    paddingTop: tokens.space[1],
    textAlignVertical: 'top',
  },
  caption: {
    fontSize: tokens.font.caption.size,
    color: tokens.color.textMuted,
    fontFamily: tokens.font.family,
  },
  fieldError: {
    fontSize: tokens.font.caption.size,
    color: tokens.color.danger,
    fontFamily: tokens.font.family,
  },
  submitError: {
    fontSize: tokens.font.body.size,
    color: tokens.color.danger,
    fontFamily: tokens.font.family,
    textAlign: 'center',
    marginTop: tokens.space[1],
  },
});
