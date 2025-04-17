'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Snackbar, Alert as MuiAlert } from '@mui/material';

export default function AlertNotification({ onClose }) {
  const alerts = useSelector(state => state.alerts.items);
  const [open, setOpen] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);

  useEffect(() => {
    // Check for new critical or emergency alerts
    const criticalAlerts = alerts?.filter(
      alert => (alert.severity === 'critical' || alert.severity === 'emergency') && !alert.seen
    );
    
    if (criticalAlerts?.length > 0) {
      setCurrentAlert(criticalAlerts[0]);
      setOpen(true);
    }
  }, [alerts]);

  const handleClose = () => {
    setOpen(false);
    if (onClose && currentAlert) {
      onClose(currentAlert.alertId);
    }
  };

  if (!currentAlert) return null;

  return (
    <Snackbar 
      open={open} 
      autoHideDuration={10000} 
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <MuiAlert
        elevation={6}
        variant="filled"
        severity={currentAlert.severity === 'emergency' ? 'error' : 'warning'}
        onClose={handleClose}
      >
        {currentAlert.title}: {currentAlert.description}
      </MuiAlert>
    </Snackbar>
  );
}