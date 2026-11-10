'use client';
import React, { useState } from 'react';
import { fetchOrganizations, createOrganization, updateOrganization, createAdminUser, OrgRow } from '../lib/api/system';
import { useLoad } from './useLoad';
import { tokens } from '../theme/tokens';
import { page, container, card, input, button, errorText, muted } from './ui';

const TYPES = ['Taxi', 'Bus', 'E-Hailing'] as const;

/** A5 – Organizations and admin accounts. */
export function Organizations() {
  const { data, error, offline, reload } = useLoad(fetchOrganizations);
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('Taxi');
  const [orgError, setOrgError] = useState<string | null>(null);
  const [editing, setEditing] = useState<OrgRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<string>('Taxi');

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'transport_admin' | 'saps'>('transport_admin');
  const [orgId, setOrgId] = useState('');
  const [adminMsg, setAdminMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true); setOrgError(null);
    try { await createOrganization(name, type); setName(''); reload(); }
    catch (e) { setOrgError(e instanceof Error ? e.message : 'Something went wrong. Try again.'); }
    finally { setBusy(false); }
  };

  const saveEdit = async () => {
    if (!editing || !editName.trim()) return;
    setBusy(true); setOrgError(null);
    try { await updateOrganization(editing.id, editName, editType); setEditing(null); reload(); }
    catch (e) { setOrgError(e instanceof Error ? e.message : 'Something went wrong. Try again.'); }
    finally { setBusy(false); }
  };

  const adminInvalid = !email.trim() || !fullName.trim() || (role === 'transport_admin' && !orgId);
  const createAdmin = async () => {
    if (adminInvalid) return;
    setBusy(true); setAdminMsg(null);
    try {
      await createAdminUser({ email: email.trim(), full_name: fullName.trim(), role, ...(role === 'transport_admin' ? { organization_id: orgId } : {}) });
      setAdminMsg({ ok: true, text: `Invitation sent to ${email.trim()}.` });
      setEmail(''); setFullName('');
    } catch (e) { setAdminMsg({ ok: false, text: e instanceof Error ? e.message : 'Something went wrong. Try again.' }); }
    finally { setBusy(false); }
  };

  const realOrgs = (data ?? []).filter((o) => !o.is_oversight);

  return (
    <main style={page}>
      <div style={container}>
        <h1 style={{ margin: 0, fontSize: tokens.font.h2.size }}>Organizations and Admin Accounts</h1>
        {offline && <div data-testid="offline-alert" role="alert" style={{ ...card, backgroundColor: tokens.color.info, color: '#fff' }}>You&apos;re offline.</div>}
        {error && <p role="alert" style={errorText}>{error}</p>}

        <section style={card}>
          <h2 style={{ margin: 0, fontSize: tokens.font.h2.size }}>Organizations</h2>
          {data === null && !error && <p style={muted}>Loading…</p>}
          {data?.map((o) => (
            <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {editing?.id === o.id ? (
                <>
                  <input data-testid="org-edit-name" style={input} value={editName} onChange={(e) => setEditName(e.target.value)} />
                  <select data-testid="org-edit-type" style={input} value={editType} onChange={(e) => setEditType(e.target.value)}>
                    {TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <button data-testid="org-edit-save" disabled={busy} style={button(busy)} onClick={saveEdit}>Save</button>
                </>
              ) : (
                <>
                  <span>{o.name} <span style={muted}>({o.type})</span></span>
                  {!o.is_oversight && (
                    <button data-testid={`org-edit-${o.id}`} style={button()} onClick={() => { setEditing(o); setEditName(o.name); setEditType(o.type); }}>Edit</button>
                  )}
                </>
              )}
            </div>
          ))}
          <label>Name<input data-testid="org-name" style={input} value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label>Type
            <select data-testid="org-type" style={input} value={type} onChange={(e) => setType(e.target.value)}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          {orgError && <p role="alert" style={errorText}>{orgError}</p>}
          <button data-testid="org-add" disabled={busy || !name.trim()} style={button(busy || !name.trim())} onClick={add}>Add organization</button>
        </section>

        <section style={card}>
          <h2 style={{ margin: 0, fontSize: tokens.font.h2.size }}>Create admin account</h2>
          <label>Email<input data-testid="admin-email" type="email" style={input} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>Full name<input data-testid="admin-name" style={input} value={fullName} onChange={(e) => setFullName(e.target.value)} /></label>
          <label>Role
            <select data-testid="admin-role" style={input} value={role} onChange={(e) => setRole(e.target.value as 'transport_admin' | 'saps')}>
              <option value="transport_admin">Transport Admin</option>
              <option value="saps">SAPS</option>
            </select>
          </label>
          {role === 'transport_admin' && (
            <label>Organization
              <select data-testid="admin-org" style={input} value={orgId} onChange={(e) => setOrgId(e.target.value)}>
                <option value="">Select…</option>
                {realOrgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </label>
          )}
          {adminMsg && <p role="status" style={adminMsg.ok ? { margin: 0, fontWeight: 600 } : errorText}>{adminMsg.text}</p>}
          <button data-testid="admin-create" disabled={adminInvalid || busy} style={button(adminInvalid || busy)} onClick={createAdmin}>Create account</button>
        </section>
      </div>
    </main>
  );
}
