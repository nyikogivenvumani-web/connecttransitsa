/**
 * T-SETUP-1 (web): Design tokens match Section 7.1 exactly.
 */
import { tokens } from '../../theme/tokens';

describe('T-SETUP-1 tokens (web)', () => {
  describe('color', () => {
    it('color.primary is #0B7A6B', () => expect(tokens.color.primary).toBe('#0B7A6B'));
    it('color.warning is #D97706', () => expect(tokens.color.warning).toBe('#D97706'));
    it('color.info is #0E7490', () => expect(tokens.color.info).toBe('#0E7490'));
    it('color.danger is #DC2626', () => expect(tokens.color.danger).toBe('#DC2626'));
    it('color.success is #059669', () => expect(tokens.color.success).toBe('#059669'));
    it('color.background is #F8FAFC', () => expect(tokens.color.background).toBe('#F8FAFC'));
    it('color.surface is #FFFFFF', () => expect(tokens.color.surface).toBe('#FFFFFF'));
    it('color.text is #0F172A', () => expect(tokens.color.text).toBe('#0F172A'));
    it('color.textMuted is #64748B', () => expect(tokens.color.textMuted).toBe('#64748B'));
    it('color.border is #E2E8F0', () => expect(tokens.color.border).toBe('#E2E8F0'));
    it('color.borderStrong is #CBD5E1', () => expect(tokens.color.borderStrong).toBe('#CBD5E1'));
    it('color.onWarning is #0F172A', () => expect(tokens.color.onWarning).toBe('#0F172A'));
  });

  describe('font sizes', () => {
    it('font.h1.size is 24', () => expect(tokens.font.h1.size).toBe(24));
    it('font.h2.size is 20', () => expect(tokens.font.h2.size).toBe(20));
    it('font.h3.size is 16', () => expect(tokens.font.h3.size).toBe(16));
    it('font.body.size is 14', () => expect(tokens.font.body.size).toBe(14));
    it('font.caption.size is 12', () => expect(tokens.font.caption.size).toBe(12));
    it('font.micro.size is 10', () => expect(tokens.font.micro.size).toBe(10));
    it('font.micro.textTransform is uppercase', () => expect(tokens.font.micro.textTransform).toBe('uppercase'));
    it('font.family is Inter', () => expect(tokens.font.family).toBe('Inter'));
  });

  describe('spacing and sizes', () => {
    it('space.tight is 4', () => expect(tokens.space.tight).toBe(4));
    it('space[1] is 8', () => expect(tokens.space[1]).toBe(8));
    it('space[2] is 16', () => expect(tokens.space[2]).toBe(16));
    it('size.button is 48', () => expect(tokens.size.button).toBe(48));
    it('size.sosButton is 56', () => expect(tokens.size.sosButton).toBe(56));
    it('radius.pill is 24', () => expect(tokens.radius.pill).toBe(24));
    it('layout.maxWidth.console is 720', () => expect(tokens.layout.maxWidth.console).toBe(720));
  });
});
