import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../../auth';
import { LayoutDashboard, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { api, ApiError } from '../../lib/api';

export function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('auth/register', { name, email, password, phone: phone || undefined });
      await login({ email, password });
      navigate('/citizen', { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary to-primary/90 p-12 flex-col justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[15px] font-semibold text-primary-foreground">Citizen Services Portal</p>
            <p className="text-[11px] text-primary-foreground/60">Government of India</p>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-primary-foreground mb-4 leading-tight">
            Join the Unified<br />Citizen Services Portal
          </h1>
          <p className="text-primary-foreground/75 text-[15px] leading-relaxed max-w-md">
            Create your account to submit complaints, track applications, and access all civic utility services from one platform.
          </p>
        </div>

        <p className="text-[12px] text-primary-foreground/40">
          &copy; 2025 Unified Citizen Services Portal. Government of India.
        </p>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-foreground">Citizen Services Portal</p>
              <p className="text-[11px] text-muted-foreground">Government of India</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">Create your account</h2>
            <p className="text-[15px] text-muted-foreground">Fill in your details to register as a citizen</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3.5 bg-destructive/5 border border-destructive/15 rounded-lg flex items-start gap-2.5" role="alert">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-card-foreground mb-1.5">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-3 min-h-[44px] rounded-lg border border-input bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-card-foreground mb-1.5">
                Email Address
              </label>
              <input
                id="reg-email"
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
              <label htmlFor="reg-phone" className="block text-sm font-medium text-card-foreground mb-1.5">
                Phone Number <span className="text-muted-foreground font-normal">(optional)</span>
              </label>
              <input
                id="reg-phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Your phone number"
                className="w-full px-4 py-3 min-h-[44px] rounded-lg border border-input bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-card-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
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
            </div>

            <div>
              <label htmlFor="reg-confirm" className="block text-sm font-medium text-card-foreground mb-1.5">
                Confirm Password
              </label>
              <input
                id="reg-confirm"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full px-4 py-3 min-h-[44px] rounded-lg border border-input bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full min-h-[48px] px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
