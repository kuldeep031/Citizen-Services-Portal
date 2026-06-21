import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router';
import { useAuth } from '../../auth';
import { LayoutDashboard, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '../../lib/api';
import { GoogleLoginButton } from '../components/GoogleLoginButton';
import type { UserRole } from '../../auth';

export function LoginPage() {
  const { login, setAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation(['public', 'common']);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const roleRedirects: Record<UserRole, string> = {
    citizen: '/citizen',
    officer: '/officer',
    admin: '/admin',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      const storedAuth = localStorage.getItem('citizen_portal_auth');
      if (storedAuth) {
        const { user } = JSON.parse(storedAuth);
        if (user.mustChangePassword) {
          navigate('/change-password', { replace: true });
        } else {
          navigate(from || roleRedirects[user.role as UserRole], { replace: true });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (data: { idToken: string; name: string; email: string }) => {
    setError('');
    try {
      const res = await api.post<{ user: any; tokens: any }>('auth/google', { idToken: data.idToken });
      setAuth(res.user, res.tokens);
      const role = res.user.role as UserRole;
      navigate(from || roleRedirects[role], { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Google sign-in failed');
      }
    }
  };


  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary to-primary/90 p-12 flex-col justify-between">
        <Link to="/" className="flex items-center gap-3 w-fit">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-primary-foreground">Citizen Services Portal</p>
            <p className="text-[11px] text-primary-foreground/60">{t('login.governmentOf')}</p>
          </div>
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-primary-foreground mb-4 leading-tight">
            Unified Access to<br />All Government Services
          </h1>
          <p className="text-primary-foreground/75 text-[15px] leading-relaxed max-w-md">
            Submit complaints, track applications, and manage civic services — all from a single secure portal.
          </p>
        </div>

        <p className="text-[12px] text-primary-foreground/40">
          &copy; {new Date().getFullYear()} Unified Citizen Services Portal. Government of Country.
        </p>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <Link to="/" className="lg:hidden flex items-center gap-3 mb-8 w-fit">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-foreground">Citizen Services Portal</p>
              <p className="text-[11px] text-muted-foreground">{t('login.governmentOf')}</p>
            </div>
          </Link>

          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">{t('login.title')}</h2>
            <p className="text-[15px] text-muted-foreground">Sign in with your email or Google account</p>
          </div>

          {/* Google Login */}
          <GoogleLoginButton onSuccess={handleGoogleSuccess} />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-background px-3 text-muted-foreground">or continue with email</span></div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3.5 bg-destructive/5 border border-destructive/15 rounded-lg flex items-start gap-2.5" role="alert">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-card-foreground mb-1.5">
                {t('login.email')}
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 min-h-[44px] rounded-lg border border-input bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-card-foreground mb-1.5">
                {t('login.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 min-h-[44px] rounded-lg border border-input bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end mt-1.5">
                <Link to="/change-password" className="text-[13px] text-primary font-medium hover:underline">
                  Forgot Password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[48px] px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('login.signingIn') : t('login.submitButton')}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t('login.noAccount')}{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              {t('login.registerLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
