/**
 * lib/db/drafts.ts
 * SQLite-backed offline draft cache for incident reports.
 * T-EDGE-1: saves a report draft when offline and returns it after reconnect.
 */
import * as SQLite from 'expo-sqlite';

export interface ReportDraft {
  id: string;
  organizationId: string;
  unlistedEntityName?: string;
  vehiclePlate: string;
  category: string;
  customCategoryText?: string;
  description: string;
  incidentAt: string;
  locationLat?: number;
  locationLng?: number;
  locationText?: string;
  sapsCase?: string;
  /** JSON-serialised array of local file URIs */
  mediaJson?: string;
  createdAt?: string;
}

let _db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('connecttransit.db');
    _db.execSync(`
      CREATE TABLE IF NOT EXISTS report_drafts (
        id TEXT PRIMARY KEY,
        organization_id TEXT NOT NULL,
        unlisted_entity_name TEXT,
        vehicle_plate TEXT NOT NULL,
        category TEXT NOT NULL,
        custom_category_text TEXT,
        description TEXT NOT NULL,
        incident_at TEXT NOT NULL,
        location_lat REAL,
        location_lng REAL,
        location_text TEXT,
        saps_case TEXT,
        media_json TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
  }
  return _db;
}

/** Persist a draft to SQLite. Replaces an existing draft with the same id. */
export async function saveDraft(draft: ReportDraft): Promise<void> {
  const db = getDb();
  db.runSync(
    `INSERT OR REPLACE INTO report_drafts
       (id, organization_id, unlisted_entity_name, vehicle_plate, category,
        custom_category_text, description, incident_at, location_lat,
        location_lng, location_text, saps_case, media_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    draft.id,
    draft.organizationId,
    draft.unlistedEntityName ?? null,
    draft.vehiclePlate,
    draft.category,
    draft.customCategoryText ?? null,
    draft.description,
    draft.incidentAt,
    draft.locationLat ?? null,
    draft.locationLng ?? null,
    draft.locationText ?? null,
    draft.sapsCase ?? null,
    draft.mediaJson ?? null,
  );
}

/** Load a single draft by id, or null if not found. */
export async function loadDraft(id: string): Promise<ReportDraft | null> {
  const db = getDb();
  const row = db.getFirstSync<Record<string, unknown>>(
    'SELECT * FROM report_drafts WHERE id = ?',
    id,
  );
  if (!row) return null;
  return rowToDraft(row);
}

/** Return all saved drafts, oldest first. */
export async function listDrafts(): Promise<ReportDraft[]> {
  const db = getDb();
  const rows = db.getAllSync<Record<string, unknown>>(
    'SELECT * FROM report_drafts ORDER BY created_at ASC',
  );
  return rows.map(rowToDraft);
}

/** Remove a draft by id. */
export async function deleteDraft(id: string): Promise<void> {
  const db = getDb();
  db.runSync('DELETE FROM report_drafts WHERE id = ?', id);
}

function rowToDraft(row: Record<string, unknown>): ReportDraft {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    unlistedEntityName: (row.unlisted_entity_name as string) ?? undefined,
    vehiclePlate: row.vehicle_plate as string,
    category: row.category as string,
    customCategoryText: (row.custom_category_text as string) ?? undefined,
    description: row.description as string,
    incidentAt: row.incident_at as string,
    locationLat: row.location_lat != null ? Number(row.location_lat) : undefined,
    locationLng: row.location_lng != null ? Number(row.location_lng) : undefined,
    locationText: (row.location_text as string) ?? undefined,
    sapsCase: (row.saps_case as string) ?? undefined,
    mediaJson: (row.media_json as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}
