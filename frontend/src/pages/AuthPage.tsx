import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoginForm } from '../components/auth/LoginForm';

export function AuthPage() {
  const { user } = useAuth();

  if (user) return <Navigate to="/tools" replace />;

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <main className="w-full max-w-sm" aria-label="Anmeldung">
        <div className="text-center mb-10">
          <h1 className="font-serif text-3xl font-semibold text-ink">AI Tools</h1>
          <p className="text-sm text-ink-secondary mt-2">Story Generator · Text Polisher · Test Case Generator</p>
        </div>

        <div className="bg-surface rounded-xl shadow-sm border border-edge p-8">
          <h2 className="font-serif text-xl font-semibold text-ink mb-6">Anmelden</h2>
          <LoginForm />
        </div>
      </main>
    </div>
  );
}
