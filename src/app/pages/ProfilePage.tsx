import { useState } from 'react';
import { User, Phone, Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../auth';
import { EmailOTPInput } from '../components/EmailOTPInput';
import { api, ApiError } from '../../lib/api';
import { Link } from 'react-router';

export function ProfilePage() {
  const { user } = useAuth();
  const [editingPhone, setEditingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState(user?.phone || '');
  const [emailToken, setEmailToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleUpdatePhone = async () => {
    if (!emailToken) {
      setError('Please verify your email first');
      return;
    }
    if (!newPhone || newPhone.replace(/\D/g, '').length < 10) {
      setError('Enter a valid phone number');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await api.patch('auth/update-phone', {
        phone: newPhone,
        emailVerificationToken: emailToken,
      });
      setSuccess('Phone number updated successfully');
      setEditingPhone(false);
      setEmailToken('');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to update phone number');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold mb-1">My Profile</h1>
        <p className="text-[15px] text-muted-foreground">View and manage your account details.</p>
      </div>

      {/* Profile Card */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center">
            <User className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <p className="text-lg font-semibold text-card-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
          </div>
        </div>

        <div className="border-t border-border pt-5 space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Email</p>
              <p className="text-sm text-card-foreground">{user.email || '—'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
            <div className="flex-1">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Phone Number</p>
              {!editingPhone ? (
                <div className="flex items-center gap-3">
                  <p className="text-sm text-card-foreground">{user.phone || 'Not set'}</p>
                  <button
                    onClick={() => setEditingPhone(true)}
                    className="text-[13px] text-primary font-medium hover:underline"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="space-y-3 mt-2">
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full px-4 py-3 min-h-[44px] rounded-lg border border-input bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                  />
                  <p className="text-[13px] text-muted-foreground">Verify your email to confirm phone change:</p>
                  <EmailOTPInput email={user.email || ''} onVerified={setEmailToken} />
                  {emailToken && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdatePhone}
                        disabled={saving}
                        className="min-h-[40px] px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                      </button>
                      <button
                        onClick={() => { setEditingPhone(false); setEmailToken(''); setError(''); }}
                        className="min-h-[40px] px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <h3 className="font-semibold text-card-foreground mb-4">Account Actions</h3>
        <Link
          to="/change-password"
          className="inline-flex items-center min-h-[44px] px-5 py-2.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors"
        >
          Change Password
        </Link>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3.5 bg-destructive/5 border border-destructive/15 rounded-lg flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-3.5 bg-success/5 border border-success/15 rounded-lg flex items-start gap-2.5">
          <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
          <p className="text-sm text-success">{success}</p>
        </div>
      )}
    </div>
  );
}
