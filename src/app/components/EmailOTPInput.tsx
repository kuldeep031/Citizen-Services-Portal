import { useState } from 'react';
import { Loader2, CheckCircle, Mail } from 'lucide-react';
import { api } from '../../lib/api';

interface EmailOTPInputProps {
  email: string;
  onVerified: (verificationToken: string) => void;
  disabled?: boolean;
}

export function EmailOTPInput({ email, onVerified, disabled }: EmailOTPInputProps) {
  const [step, setStep] = useState<'idle' | 'sending' | 'sent' | 'verifying' | 'verified'>('idle');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handleSendOTP = async () => {
    if (!email || !email.includes('@')) {
      setError('Enter a valid email address');
      return;
    }
    setError('');
    setStep('sending');

    try {
      await api.post('otp/send-email', { email });
      setStep('sent');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
      setStep('idle');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Enter the 6-digit code');
      return;
    }
    setError('');
    setStep('verifying');

    try {
      const res = await api.post<{ verified: boolean; verificationToken: string }>('otp/verify-email', { email, code: otp });
      if (res.verified) {
        setStep('verified');
        onVerified(res.verificationToken);
      } else {
        setError('Verification failed');
        setStep('sent');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
      setStep('sent');
    }
  };

  if (step === 'verified') {
    return (
      <div className="flex items-center gap-2 p-3 bg-success/10 rounded-lg">
        <CheckCircle className="w-4 h-4 text-success" />
        <span className="text-sm font-medium text-success">Email verified</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {step === 'idle' || step === 'sending' ? (
        <button
          type="button"
          onClick={handleSendOTP}
          disabled={disabled || step === 'sending' || !email}
          className="flex items-center gap-2 min-h-[44px] px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {step === 'sending' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Mail className="w-4 h-4" />
          )}
          {step === 'sending' ? 'Sending...' : 'Send OTP'}
        </button>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter 6-digit code"
            className="flex-1 px-4 py-3 min-h-[44px] rounded-lg border border-input bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent text-center tracking-widest font-mono"
          />
          <button
            type="button"
            onClick={handleVerifyOTP}
            disabled={step === 'verifying' || otp.length !== 6}
            className="min-h-[44px] px-5 py-2.5 bg-success text-success-foreground rounded-lg text-sm font-medium hover:bg-success/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {step === 'verifying' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {step === 'sent' && (
        <button
          type="button"
          onClick={handleSendOTP}
          className="text-[13px] text-primary font-medium hover:underline"
        >
          Resend OTP
        </button>
      )}
    </div>
  );
}
