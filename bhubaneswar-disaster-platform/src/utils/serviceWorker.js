import { Workbox } from 'workbox-window';

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.workbox !== undefined) {
    const wb = new Workbox('/sw.js');

    wb.addEventListener('installed', event => {
      if (event.isUpdate) {
        if (confirm('New content is available! Click OK to refresh.')) {
          window.location.reload();
        }
      }
    });

    wb.addEventListener('activated', event => {
      if (event.isUpdate) {
        console.log('Service worker activated.');
      }
    });

    wb.register()
      .then(registration => {
        console.log('Service Worker registered:', registration);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
      })
      .catch(error => {
        console.error(error.message);
      });
  }
}