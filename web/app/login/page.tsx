import { tokens } from '../../theme/tokens';
import { LoginForm } from '../../components/LoginForm';

export default function LoginPage() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: tokens.color.background, display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: tokens.font.family, padding: tokens.space[2] }}>
      <LoginForm />
    </main>
  );
}
