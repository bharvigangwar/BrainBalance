// ===================================
//   BRAINBALANCE — PWA MODULE
//   Service worker registration + install prompt
// ===================================

let deferredPrompt = null;

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('✅ Service Worker registered:', registration.scope);
    } catch (error) {
      console.warn('Service Worker registration failed:', error);
    }
  });
}

// Handle install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  // Could show a custom install button here
  console.log('📱 PWA install available');
});

// Track install
window.addEventListener('appinstalled', () => {
  console.log('✅ BrainBalance installed as PWA');
  deferredPrompt = null;
});
