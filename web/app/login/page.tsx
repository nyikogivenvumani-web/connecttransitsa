import { tokens } from '../../theme/tokens';

/** A7 – Portal Login. Full implementation in Phase 6. */
export default function LoginPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: tokens.color.background,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: tokens.font.family,
      }}
    >
      <div
        style={{
          backgroundColor: tokens.color.surface,
          borderRadius: tokens.radius.card,
          padding: tokens.space[3],
          boxShadow: tokens.shadow.sheet,
          maxWidth: 400,
          width: '100%',
        }}
      >
        <h1
          style={{
            fontSize: tokens.font.h2.size,
            fontWeight: tokens.font.h2.weight,
            color: tokens.color.text,
            marginBottom: tokens.space[1],
          }}
        >
          ConnectTransit SA
        </h1>
        <p style={{ color: tokens.color.textMuted, fontSize: tokens.font.body.size }}>
          Admin portal — sign in to continue
        </p>
      </div>
    </main>
  );
}
