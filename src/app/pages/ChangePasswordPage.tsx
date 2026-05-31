import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { EmailOTPInput } from '../components/EmailOTPInput';
import { api, ApiError } from '../../lib/api';
import { useAuth } from '../../auth';

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [email, setEmail] = useState(user?.email || '');
  const [emailToken, setEmailToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!emailToken) {
      setError('Please verify your email first');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('auth/change-password', {
        email,
        emailVerificationToken: emailToken,
        newPassword,
      });
      setSuccess(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to change password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAfterSuccess = () => {
    if (isAuthenticated && user) {
      const roleRedirects: Record<string, string> = {
        citizen: '/citizen/profile',
        officer: '/officer/profile',
        admin: '/admin/profile',
      };
      navigate(roleRedirects[user.role] || '/', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h1 className="text-xl font-bold mb-2">Password Changed Successfully</h1>
          <p className="text-[15px] text-muted-foreground mb-6">
            {isAuthenticated
              ? 'Your password has been updated. You can continue using the portal.'
              : 'You can now log in with your new password.'}
          </p>
          <button
            onClick={handleAfterSuccess}
            className="min-h-[48px] px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            {isAuthenticated ? 'Back to Profile' : 'Go to Login'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">Change Password</h2>
          <p className="text-[15px] text-muted-foreground">Verify your email to set a new password.</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-destructive/5 border border-destructive/15 rounded-lg flex items-start gap-2.5" role="alert">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="cp-email" className="block text-sm font-medium text-card-foreground mb-1.5">
              Registered Email Address
            </label>
            <input
              id="cp-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={!!emailToken || !!user?.email}
              className="w-full px-4 py-3 min-h-[44px] rounded-lg border border-input bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent disabled:opacity-60"
            />
            <div className="mt-2">
              <EmailOTPInput email={email} onVerified={setEmailToken} disabled={!email} />
            </div>
          </div>

          {emailToken && (
            <>
              <div>
                <label htmlFor="cp-new" className="block text-sm font-medium text-card-foreground mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="cp-new"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-4 py-3 pr-12 min-h-[44px] rounded-lg border border-input bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="cp-confirm" className="block text-sm font-medium text-card-foreground mb-1.5">
                  Confirm New Password
                </label>
                <input
                  id="cp-confirm"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-4 py-3 min-h-[44px] rounded-lg border border-input bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full min-h-[48px] px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Changing...' : 'Change Password'}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
