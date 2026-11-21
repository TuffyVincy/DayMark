import { CheckCircle2, Flame, Target } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface AuthWelcomeProps {
  onSignIn: () => Promise<void>;
  authError: string | null;
}

export function AuthWelcome({ onSignIn, authError }: AuthWelcomeProps) {
  return (
    <div className="min-h-screen bg-[#F6F7FB] flex items-center justify-center p-6">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-white border border-[#E6E8F2] rounded-3xl overflow-hidden shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
        {/* Left Brand & Preview Column */}
        <div className="lg:col-span-6 bg-gradient-to-br from-[#4F46E5] via-[#5B4FE9] to-[#7C3AED] text-white p-8 lg:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.3">
                  <path d="M5 12.5l4.2 4.2L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight">Daymark</span>
            </div>

            <h1 className="text-3xl font-bold leading-tight tracking-tight mb-4 [text-wrap:balance]">
              Build daily momentum you can actually see.
            </h1>
            <p className="text-indigo-100 text-sm leading-relaxed mb-8">
              Set clear daily check-offs and measurable numeric goals, log progress in seconds, and keep your streak alive across every device.
            </p>
          </div>

          <div className="space-y-4 border-t border-white/15 pt-6 text-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <span className="text-indigo-50">One-tap check-offs and live numeric counters</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <span className="text-indigo-50">Real-time current &amp; best streak accountability</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                <Target className="w-4 h-4 text-white" />
              </div>
              <span className="text-indigo-50">Private cloud sync tied to your Google account</span>
            </div>
          </div>
        </div>

        {/* Right Sign-In Action Column */}
        <div className="lg:col-span-6 p-8 lg:p-10 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#4F46E5] mb-2">
              Personal Workspace
            </p>
            <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Sign in to Daymark</h2>
            <p className="text-sm text-[#64748B] leading-relaxed mb-8">
              Your habits, daily progress logs, and streaks sync automatically whenever you sign in.
            </p>

            {authError && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed"
              >
                {authError}
              </div>
            )}

            <button
              type="button"
              onClick={() => void onSignIn()}
              className="w-full h-12 px-5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-3 transition-all shadow-[0_6px_18px_rgba(79,70,229,0.22)] cursor-pointer whitespace-nowrap"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"
                />
              </svg>
              Continue with Google
            </button>

            <p className="mt-6 text-xs text-[#64748B] leading-relaxed">
              Your habit history is private and isolated to your account.
            </p>

            <div className="mt-5 pt-5 border-t border-[#E6E8F2]">
              <PWAInstallButton variant="sidebar" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
