import React, { useState, useEffect } from 'react';
import { MdGetApp, MdClose } from 'react-icons/md';

// Store the prompt globally to capture it before component mounts
let globalDeferredPrompt = null;

// Capture the event as early as possible
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('beforeinstallprompt event captured globally');
  e.preventDefault();
  globalDeferredPrompt = e;
});

const InstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                       window.navigator.standalone === true;
    
    console.log('Install Button - Is installed:', isInstalled);
    
    if (isInstalled) {
      console.log('App already installed, hiding button');
      setShowInstallButton(false);
      return;
    }

    // Check if user previously dismissed (store in sessionStorage, not localStorage)
    const dismissed = sessionStorage.getItem('installPromptDismissed');
    if (dismissed) {
      console.log('Install prompt was dismissed this session');
      // Don't return - allow it to show again on page refresh
    }

    // Check if the event was already captured before component mounted
    if (globalDeferredPrompt) {
      console.log('Using globally captured install prompt');
      setDeferredPrompt(globalDeferredPrompt);
      setShowInstallButton(true);
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('beforeinstallprompt event fired in component');
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event so it can be triggered later
      globalDeferredPrompt = e;
      setDeferredPrompt(e);
      // Show the install button
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('App installed successfully');
      setShowInstallButton(false);
      setDeferredPrompt(null);
      globalDeferredPrompt = null;
      sessionStorage.removeItem('installPromptDismissed');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setShowInstallButton(false);
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    globalDeferredPrompt = null;
  };

  const handleDismiss = () => {
    console.log('Install prompt dismissed');
    setShowInstallButton(false);
    // Store dismissal in sessionStorage (clears on browser close, not localStorage)
    sessionStorage.setItem('installPromptDismissed', 'true');
  };

  if (!showInstallButton) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 z-50 animate-slide-down px-4 sm:px-0">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-3 sm:p-4 w-full sm:max-w-md border border-gray-200 dark:border-gray-700 relative">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
          aria-label="Dismiss"
        >
          <MdClose className="text-xl" />
        </button>

        {/* Content */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pr-8 sm:pr-0">
          {/* Logo */}
          <div className="flex-shrink-0">
            <img 
              src="/ALMA logo.png" 
              alt="ALMA Logo" 
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-contain"
            />
          </div>

          {/* Text and Actions */}
          <div className="flex-1 min-w-0 flex flex-col gap-2 w-full sm:w-auto">
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                Install ALMA App
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                Quick access from your home screen
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-row gap-2 items-center">
              <button
                onClick={handleInstallClick}
                className="flex items-center justify-center gap-2 bg-[#006B3F] hover:bg-[#005030] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0"
              >
                <MdGetApp className="text-lg" />
                <span>Install</span>
              </button>
              <button
                onClick={handleDismiss}
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 text-sm px-2 py-1 transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallButton;
