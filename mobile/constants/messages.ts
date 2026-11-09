/**
 * All user-visible strings in one place so translation can be added later.
 * Rule 9: Use exact labels from PRD and IMPLEMENTATION_PLAN.
 * Rule 3.3: Keep all text here even though F6 (localisation) is deferred.
 */
export const messages = {
  // Offline banner
  offlineReport: 'Network connection lost. Your report draft has been saved locally.',
  offlineGeneral: "You're offline.",

  // MediaPicker limits (PRD BR4)
  mediaMaxPhotos: 'You can only attach up to 3 photos.',
  mediaMaxVideos: 'You can only attach 1 video.',
  mediaPhotoTooLarge: 'Photo is too large. Maximum size is 5 MB.',
  mediaVideoTooLarge: 'Video is too large. Maximum size is 25 MB.',
  mediaVideoTooLong: 'Video is too long. Maximum duration is 30 seconds.',
  mediaAudioTooLarge: 'Audio is too large. Maximum size is 10 MB.',
  mediaAudioTooLong: 'Audio is too long. Maximum duration is 60 seconds.',

  // OTP / auth
  otpResendTimer: (seconds: number) => `Resend in ${seconds}s`,
  otpResend: 'Resend code',

  // SOS button
  sosTap1: 'Tap 2 more times to activate SOS',
  sosTap2: 'Tap 1 more time to activate SOS',
  sosSending: 'Sending SOS…',

  // Status chips & timeline
  statusSubmitted: 'Submitted',
  statusUnderReview: 'Under Review',
  statusEscalated: 'Escalated',
  statusResolved: 'Resolved',
  statusDismissed: 'Dismissed',
  statusDecisionPublished: 'Decision Published',

  // Admin accounts on mobile
  adminMobileNotice: 'Admin accounts use the web dashboard.',

  // Confirm modal — log out
  logOutTitle: 'Log out',
  logOutMessage: 'Are you sure you want to log out?',
  logOutConfirm: 'Log out',

  // Confirm modal — delete account
  deleteAccountTitle: 'Delete account',
  deleteAccountMessage:
    'Your account and personal details will be deleted. Reports you submitted will be anonymised and kept for accountability. This cannot be undone.',
  deleteAccountConfirm: 'Delete account',

  // Generic
  cancel: 'Cancel',
  confirm: 'Confirm',
  retry: 'Try again',

  // Description privacy helper (PRD Section 14 #18)
  descriptionHelper: 'Do not include your name or contact details.',

  // Report incident (Phase 4 – F1, F2)
  reportRateLimit: "You're sending reports too quickly. Try again later.",
  reportNetworkOffline: 'Network connection lost. Your report draft has been saved locally.',
  reportPlateRequired: 'Vehicle registration plate is required',
  reportVideoTooLarge: 'File too large. Video must be under 25MB.',
  reportPhotoTooLarge: 'File too large. Photo must be under 5MB.',
  reportAudioTooLarge: 'File too large. Audio must be under 10MB.',

  // Report success (Phase 4 – S7)
  reportSuccessMessage:
    'Your incident report has been securely lodged. Your identity remains strictly confidential.',

  // Leave report guard (T-S3-2)
  leaveReportTitle: 'Leave report?',
  leaveReportMessage: 'Your unsaved report will be lost. Are you sure?',
  leaveReportConfirm: 'Leave',
} as const;
