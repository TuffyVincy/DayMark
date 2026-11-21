import { Download, Share, Smartphone, X } from 'lucide-react';
import { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'sidebar' | 'compact';
}

export function PWAInstallButton({ variant = 'sidebar' }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const buttonClasses =
    variant === 'sidebar'
      ? 'w-full h-10 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap'
      : 'h-10 px-3 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0';

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className={`${buttonClasses} bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-[0_4px_12px_rgba(79,70,229,0.2)]`}
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        Install App
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowGuide(true)}
        className={`${buttonClasses} border border-[#E6E8F2] bg-white hover:bg-[#F8F9FC] text-[#475569] hover:text-[#0F172A]`}
      >
        <Smartphone className="w-3.5 h-3.5 shrink-0 text-[#4F46E5]" />
        {isIOS ? 'Install on iOS' : 'Mobile App'}
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-[2px] p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
        >
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#E6E8F2] p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 id="pwa-guide-title" className="text-base font-bold text-[#0F172A]">
                    {isIOS ? 'Install Daymark on iPhone / iPad' : 'Use Daymark on Mobile'}
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Runs full-screen from your home screen with offline caching
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8F9FC] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="mt-4 space-y-2.5 text-sm text-[#475569]">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-[#EEF2FF] text-[#4F46E5] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Tap the <strong className="text-[#0F172A] inline-flex items-center gap-1">Share <Share className="w-3.5 h-3.5 inline" /></strong> button in Safari&apos;s toolbar.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-[#EEF2FF] text-[#4F46E5] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Scroll down and tap <strong className="text-[#0F172A]">Add to Home Screen</strong>.
                  </span>
                </li>
              </ol>
            ) : (
              <div className="mt-4 space-y-3 text-xs leading-relaxed text-[#475569]">
                <div className="p-3.5 rounded-xl bg-[#F8F9FC] border border-[#E6E8F2]">
                  <p className="font-semibold text-[#0F172A] mb-1">
                    {isAndroid ? 'Install right now in Chrome' : 'Install on Android Phone'}
                  </p>
                  <p>
                    Open Daymark in Google Chrome on Android, tap the menu button (<strong className="text-[#0F172A]">⋮</strong>), and select <strong className="text-[#0F172A]">Install app</strong> or <strong className="text-[#0F172A]">Add to Home screen</strong>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8F9FC] border border-[#E6E8F2]">
                  <p className="font-semibold text-[#0F172A] mb-1">Google Play Store Packaging (TWA)</p>
                  <p>
                    Daymark&apos;s Web App Manifest, Service Worker, and maskable icon are configured for Android Trusted Web Activity packaging via <strong className="text-[#0F172A]">PWABuilder</strong> or <strong className="text-[#0F172A]">Bubblewrap CLI</strong> to generate a signed <code className="font-mono text-[11px] text-[#4F46E5]">.aab</code> bundle for Google Play Console.
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full h-10 rounded-xl bg-[#EEF2FF] hover:bg-[#E0E7FF] text-xs font-semibold text-[#4F46E5] transition-colors cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
