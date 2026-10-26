import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { DEMO_USERS } from '../auth/permissions';

export function LoginPage() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!signIn(username, password)) setError('That username and password don’t match a demo account. Use one of the accounts below.');
  }

  return (
    <div className="login">
      <section className="login__intro">
        <div className="brand brand--large">
          <span className="brand__mark" aria-hidden="true" />
          SiteReady
        </div>
        <h1>Know who is cleared to work on site, before they arrive.</h1>
        <p>
          Track operatives’ cards, training, medicals and holidays in one place, and see expiring qualifications 30 days
          before they lapse.
        </p>
        <p className="login__credit">
          Built by Catalin Lazar with React and TypeScript, based on compliance work on live construction projects.
        </p>
      </section>

      <section className="login__panel" aria-labelledby="signin-heading">
        <h2 id="signin-heading">Sign in to the demo</h2>
        <div className="demo-accounts">
          {DEMO_USERS.map((u) => (
            <button key={u.username} type="button" className="demo-account" onClick={() => signIn(u.username, u.password)}>
              <strong>Continue as {u.displayName.toLowerCase()}</strong>
              <span>{u.description}</span>
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="form" noValidate>
          <p className="form__hint">Or sign in manually. Every demo password is demo1234.</p>
          <label>
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </label>
          {error && (
            <p className="form__error" role="alert">
              {error}
            </p>
          )}
          <button className="btn btn--primary" type="submit">
            Sign in
          </button>
        </form>
      </section>
    </div>
  );
}
