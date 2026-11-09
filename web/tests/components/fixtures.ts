import type { AdminCase } from '../../lib/api/admin';

export const mkCase = (over: Partial<AdminCase> = {}): AdminCase => ({
  id: 'r1', case_ref: 'TC-2026-0001', organization_name: 'DORLJOTA', unlisted_entity_name: null,
  vehicle_plate: 'CA 123 GP', category: 'Overcharging', custom_category_text: null,
  description: 'Charged double', incident_at: '2026-11-01T08:00:00Z', location_text: 'Cape Town CBD',
  status: 'Submitted', is_escalated: false, admin_decision: null, decision_reasoning: null,
  created_at: '2026-11-02T08:00:00Z', evidence_request_id: null, evidence_request_status: null,
  evidence_request_message: null, evidence_reply_note: null, ...over,
});
