import type { SapsItem } from '../../lib/api/saps'; import type { OrgRow, OversightCase } from '../../lib/api/system';

export const mkSaps = (over: Partial<SapsItem> = {}): SapsItem => ({
  id: 'q1', status: 'new', webhook_status: 'sent', created_at: '2026-11-09T08:00:00Z',
  payload: {
    case_ref: 'TC-2026-0007', vehicle_plate: 'CA 123 GP', category: 'Physical Assault', description: 'Driver hit a passenger',
    location_text: 'Bellville taxi rank', saps_case_number: 'CAS 12/11/2026', reporter_full_name: 'Thabo Mokoena', reporter_id_number: '9803145009088',
  }, ...over,
});
export const mkOrg = (over: Partial<OrgRow> = {}): OrgRow => ({ id: 'o1', name: 'DORLJOTA', type: 'Taxi', is_oversight: false, ...over });
export const mkOversight = (over: Partial<OversightCase> = {}): OversightCase => ({
  id: 'r9', case_ref: 'TC-2026-0009', unlisted_entity_name: 'Khaya Shuttles', vehicle_plate: 'CA 999 GP', category: 'Overcharging',
  description: 'Overcharged', created_at: '2026-11-08T08:00:00Z', ...over,
});
