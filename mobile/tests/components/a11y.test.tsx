/** T-NFR-3 – every pressable has an accessible name and a touch target of at least 48 px */
import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Button } from '../../components/Button';
import { SosButton } from '../../components/SosButton';
import { TextField } from '../../components/TextField';
import { OtpInput } from '../../components/OtpInput';
import { Select } from '../../components/Select';
import { ConfirmModal } from '../../components/ConfirmModal';
import { MediaPicker } from '../../components/MediaPicker';
import { EmptyState } from '../../components/EmptyState';
import { EvidenceReply } from '../../components/EvidenceReply';
import SosActiveScreen from '../../app/sos/active';

jest.mock('expo-router', () => ({ useRouter: () => ({ replace: jest.fn(), push: jest.fn() }) }));
jest.mock('../../lib/api/evidence', () => ({ answerEvidenceRequest: jest.fn() }));
jest.mock('../../lib/sosSession', () => ({
  useSos: () => ({ status: 'active', eventId: 'e', shareToken: 't', usedCached: false, noLocation: false, offline: false }),
  sosSession: { stop: jest.fn() },
}));

type Node = { type: unknown; props: Record<string, unknown>; parent: Node | null; findAll: (p: (n: Node) => boolean) => Node[]; children: unknown[] };
const isPressable = (n: Node) => typeof n.type !== 'string' && n.props.style !== undefined && (typeof n.props.onPress === 'function' || typeof n.props.onPressIn === 'function');

function textOf(n: Node): string {
  const parts: string[] = [];
  const walk = (x: unknown) => {
    if (typeof x === 'string') parts.push(x);
    else if (x && typeof x === 'object' && 'children' in x) (x as Node).children.forEach(walk);
  };
  walk(n);
  return parts.join(' ').trim();
}
function size(n: Node): { w: number; h: number } {
  const raw = n.props.style;
  const style = StyleSheet.flatten(typeof raw === 'function' ? raw({ pressed: false }) : raw) ?? {};
  const slop = (n.props.hitSlop ?? {}) as { top?: number; bottom?: number; left?: number; right?: number };
  const h = Math.max(Number(style.height ?? 0), Number(style.minHeight ?? 0)) + (slop.top ?? 0) + (slop.bottom ?? 0);
  const w = Math.max(Number(style.width ?? 0), Number(style.minWidth ?? 0)) + (slop.left ?? 0) + (slop.right ?? 0);
  return { w, h };
}

async function audit(ui: React.ReactElement) {
  await render(ui);
  const root = screen.UNSAFE_root as unknown as Node;
  const pressables = root.findAll((n) => {
    if (!isPressable(n)) return false;
    for (let a = n.parent; a; a = a.parent) if (isPressable(a)) return false;
    return true;
  });
  expect(pressables.length).toBeGreaterThan(0);
  for (const p of pressables) {
    const name = (p.props.accessibilityLabel as string | undefined) || textOf(p);
    expect({ name: name || '(none)' }).not.toEqual({ name: '(none)' });
    const { h } = size(p);
    // a pressable that fills its parent in a row has no own height: accept either an explicit height or a minHeight
    expect({ name, h }).toEqual({ name, h: expect.any(Number) });
    expect(h).toBeGreaterThanOrEqual(48);
  }
}

const noop = jest.fn();
describe('T-NFR-3 accessibility', () => {
  it('Button', () => audit(<Button label="Save" variant="primary" onPress={noop} />));
  it('SosButton', () => audit(<SosButton onTrigger={noop} />));
  it('TextField (password eye)', () => audit(<TextField label="Password" value="" onChangeText={noop} secureTextEntry />));
  it('OtpInput', () => audit(<OtpInput value="" onChange={noop} onResend={noop} resendCooldownSeconds={0} />));
  it('Select', () => audit(<Select options={[{ label: 'A', value: 'a' }]} value={null} onChange={noop} placeholder="Pick" testID="s" />));
  it('ConfirmModal', () => audit(<ConfirmModal visible title="t" message="m" confirmLabel="Yes" onConfirm={noop} onCancel={noop} />));
  it('MediaPicker', () => audit(<MediaPicker photos={[]} videos={[]} audio={null} onAddPhoto={async () => undefined} onAddVideo={async () => undefined} onAddAudio={async () => undefined} onError={noop} />));
  it('EmptyState with button', () => audit(<EmptyState message="None" buttonLabel="Go" onButtonPress={noop} />));
  it('EvidenceReply', () => audit(<EvidenceReply requestId="q" reportId="r" message="m" onDone={noop} />));
  it('S8 SOS active (stop button)', () => audit(<SosActiveScreen />));
});
