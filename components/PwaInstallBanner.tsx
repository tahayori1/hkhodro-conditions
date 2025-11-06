import React, { useState, useEffect } from 'react';
import { InstallIcon } from './icons/InstallIcon';
import { ShareIcon } from './icons/ShareIcon';
import { CloseIcon } from './icons/CloseIcon';

const PwaInstallBanner: React.FC = () => {
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const wasDismissed = sessionStorage.getItem('pwaInstallDismissed') === 'true';
        if (wasDismissed) return;

        // Detect iOS
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(ios);

        // Standard PWA install prompt for non-iOS
        const handler = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e);
            if (!ios) {
                setIsVisible(true);
            }
        };
        window.addEventListener('beforeinstallprompt', handler);

        // Show for iOS if not in standalone mode
        if (ios && !('standalone' in navigator && (navigator as any).standalone)) {
            setIsVisible(true);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        installPrompt.userChoice.then(() => {
            setIsVisible(false);
        });
    };
    
    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem('pwaInstallDismissed', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-800 text-white p-4 flex items-center justify-between shadow-lg z-50 animate-slide-up sm:flex-row flex-col sm:text-right text-center gap-4">
            <div className="flex items-center gap-4">
                <img src="/vite.svg" alt="App Icon" className="w-12 h-12 bg-white p-1 rounded-lg flex-shrink-0" />
                <div>
                    <h3 className="font-bold">نصب اپلیکیشن</h3>
                    <p className="text-sm text-slate-300">برای دسترسی سریع و آفلاین، برنامه را به صفحه اصلی اضافه کنید.</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                {isIOS ? (
                    <div className="flex items-center gap-2 text-sm bg-slate-700 px-3 py-2 rounded-lg">
                        <span>روی آیکون</span>
                        <ShareIcon className="w-5 h-5" />
                        <span>و سپس Add to Home Screen بزنید.</span>
                    </div>
                ) : (
                    <button
                        onClick={handleInstallClick}
                        className="flex items-center gap-2 bg-sky-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors"
                    >
                        <InstallIcon />
                        <span>نصب</span>
                    </button>
                )}
                <button onClick={handleDismiss} className="text-slate-400 hover:text-white" aria-label="بستن">
                    <CloseIcon />
                </button>
            </div>
             <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .animate-slide-up {
                    animation: slide-up 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default PwaInstallBanner;
