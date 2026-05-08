import { useState, FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button, InlineError, RevealButton } from '../../shared/components';

export function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, apiKey.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-ink mb-1.5">
          E-Mail
        </label>
        <input
          id="login-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-edge rounded-lg px-3.5 py-2.5 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent placeholder:text-ink-tertiary"
          placeholder="name@beispiel.de"
          autoComplete="email"
        />
      </div>

      <div>
        <label htmlFor="login-password" className="block text-sm font-medium text-ink mb-1.5">
          Passwort
        </label>
        <div className="flex items-center border border-edge rounded-lg bg-surface focus-within:ring-2 focus-within:ring-brand focus-within:border-transparent">
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="flex-1 min-w-0 bg-transparent px-3.5 py-2.5 text-sm text-ink focus:outline-none placeholder:text-ink-tertiary"
            placeholder="Passwort eingeben"
            autoComplete="current-password"
          />
          <RevealButton
            show={showPassword}
            onToggle={() => setShowPassword((v) => !v)}
            label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
          />
        </div>
      </div>

      <div>
        <label htmlFor="login-apikey" className="block text-sm font-medium text-ink mb-1.5">
          Anthropic API-Key{' '}
          <span className="text-xs font-normal text-ink-tertiary">(optional)</span>
        </label>
        <div className="flex items-center border border-edge rounded-lg bg-surface focus-within:ring-2 focus-within:ring-brand focus-within:border-transparent">
          <input
            id="login-apikey"
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="flex-1 min-w-0 bg-transparent px-3.5 py-2.5 text-sm text-ink focus:outline-none placeholder:text-ink-tertiary"
            placeholder="sk-ant-…"
            autoComplete="off"
            aria-describedby="login-apikey-hint"
          />
          <RevealButton
            show={showApiKey}
            onToggle={() => setShowApiKey((v) => !v)}
            label={showApiKey ? 'API-Key verbergen' : 'API-Key anzeigen'}
          />
        </div>
        <p className="mt-1.5 text-xs text-ink-tertiary" id="login-apikey-hint">
          Beginnt mit «sk-ant-». Findest du unter{' '}
          <a
            href="https://console.anthropic.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand hover:underline"
          >
            console.anthropic.com
          </a>
        </p>
      </div>

      {error && <InlineError message={error} />}

      <Button type="submit" loading={loading} className="w-full">
        {loading ? 'Anmelden…' : 'Anmelden'}
      </Button>
    </form>
  );
}
