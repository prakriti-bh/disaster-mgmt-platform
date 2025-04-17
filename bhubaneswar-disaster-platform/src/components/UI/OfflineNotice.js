'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function OfflineNotice() {
  const [isOffline, setIsOffline] = useState(false);
  const { t } = useTranslation('common');

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-yellow-500 text-black p-4 text-center z-50">
      <p className="font-medium">
        {t('offlineNotice')}
      </p>
    </div>
  );
}