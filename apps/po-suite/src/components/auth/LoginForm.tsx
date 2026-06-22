import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Alert, Button, FormField, Input, InlineError, RevealButton } from '../../shared/components';
import { IS_ENTERPRISE } from '../../shared/config/env';

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
      <FormField htmlFor="login-email" label="E-Mail" required>
        <Input
          id="login-email"
          label="E-Mail"
          hideLabel
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="name@beispiel.de"
          autoComplete="email"
          required
        />
      </FormField>

      <FormField htmlFor="login-password" label="Passwort" required>
        <Input
          id="login-password"
          label="Passwort"
          hideLabel
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={setPassword}
          placeholder="Passwort eingeben"
          autoComplete="current-password"
          required
          suffix={
            <RevealButton
              show={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
              label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
            />
          }
        />
      </FormField>

      {!IS_ENTERPRISE && (
        <FormField
          htmlFor="login-apikey"
          label="Anthropic API-Key"
          description={
            <Alert variant="info" className="mt-1">
              Dein API-Key wird nur für diese Browser-Sitzung gespeichert und beim Schliessen des Tabs automatisch gelöscht.
            </Alert>
          }
        >
          <Input
            id="login-apikey"
            label="Anthropic API-Key"
            hideLabel
            type={showApiKey ? 'text' : 'password'}
            value={apiKey}
            onChange={setApiKey}
            placeholder="sk-ant-…"
            autoComplete="off"
            suffix={
              <RevealButton
                show={showApiKey}
                onToggle={() => setShowApiKey((v) => !v)}
                label={showApiKey ? 'API-Key verbergen' : 'API-Key anzeigen'}
              />
            }
          />
        </FormField>
      )}

      {error && <InlineError message={error} />}

      <Button type="submit" loading={loading} className="w-full">
        {loading ? 'Anmelden…' : 'Anmelden'}
      </Button>
    </form>
  );
}
