import { useMemo, useState } from 'react';
import { nanoid } from 'nanoid';
import {
  SignInWithApple,
  type SignInWithAppleResponse,
} from '@capacitor-community/apple-sign-in';

type ResultState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'success'; data: SignInWithAppleResponse }
  | { kind: 'error'; message: string; raw?: unknown };

function stringifySafe(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function App() {
  const [result, setResult] = useState<ResultState>({ kind: 'idle' });

  const nonce = useMemo(() => nanoid(32), []);
  const state = useMemo(() => nanoid(16), []);

  const handleAppleSignIn = async () => {
    try {
      setResult({ kind: 'loading' });

      // Per plugin README: https://github.com/capacitor-community/apple-sign-in
      const res = await SignInWithApple.authorize({
        clientId: 'com.hightopgames.word',
        redirectURI: 'com.hightopgames.word://auth',
        scopes: 'email name',
        state,
        nonce,
      });

      setResult({ kind: 'success', data: res });
    } catch (err: any) {
      setResult({
        kind: 'error',
        message: err?.message ? String(err.message) : 'Apple Sign In failed',
        raw: err,
      });
    }
  };

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <h1 style={{ margin: 0, fontSize: 28 }}>Apple Sign In Test</h1>
      <p style={{ marginTop: 8, color: '#475569' }}>
        Bundle ID: <code>com.hightopgames.word</code>
      </p>

      <button
        onClick={handleAppleSignIn}
        disabled={result.kind === 'loading'}
        style={{
          marginTop: 16,
          width: '100%',
          padding: '14px 16px',
          borderRadius: 12,
          border: '1px solid #0f172a',
          background: '#000',
          color: '#fff',
          fontSize: 16,
          fontWeight: 600,
          cursor: result.kind === 'loading' ? 'not-allowed' : 'pointer',
        }}
      >
        {result.kind === 'loading' ? 'Signing in…' : 'Sign in with Apple'}
      </button>

      <div style={{ marginTop: 16, fontSize: 12, color: '#64748b' }}>
        <div>
          nonce: <code>{nonce}</code>
        </div>
        <div>
          state: <code>{state}</code>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <h2 style={{ margin: 0, fontSize: 16 }}>Result</h2>
        <pre
          style={{
            marginTop: 10,
            padding: 12,
            borderRadius: 12,
            background: '#0b1220',
            color: '#e2e8f0',
            overflow: 'auto',
            maxHeight: 320,
            fontSize: 12,
          }}
        >
          {result.kind === 'idle' && 'Tap “Sign in with Apple” to begin.'}
          {result.kind === 'loading' && 'Waiting for Apple Sign In…'}
          {result.kind === 'success' && stringifySafe(result.data)}
          {result.kind === 'error' &&
            stringifySafe({ message: result.message, raw: result.raw })}
        </pre>
      </div>
    </div>
  );
}

export default App;
