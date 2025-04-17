'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, List, ListItem, ListItemText, Chip, Divider, IconButton, Tooltip, Button, Alert, Stack } from '@mui/material';
import { Warning, Info, ErrorOutline, NotificationsActive, NotificationsOff } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { fetchAlerts } from '@/store/alertSlice';
import { 
  isNotificationsSupported, 
  getNotificationPermissionStatus,
  requestNotificationPermission,
  registerPushSubscription 
} from '@/utils/notificationService';
import AlertNotification from './AlertNotification';
import { endpoints } from '@/utils/api';

// Alert severity icons
const severityIcons = {
  info: <Info color="info" />, 
  warning: <Warning color="warning" />,
  critical: <ErrorOutline color="error" />,
  emergency: <NotificationsActive sx={{ color: 'error.dark' }} />
};

export default function AlertPanel() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { items: alerts, loading, error } = useSelector(state => state.alerts);
  const isLoggedIn = useSelector(state => !!state.user.token);
  const [notificationStatus, setNotificationStatus] = useState('unsupported');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState(null);

  useEffect(() => {
    dispatch(fetchAlerts());
  }, [dispatch]);

  useEffect(() => {
    if (isNotificationsSupported()) {
      setNotificationStatus(getNotificationPermissionStatus());
    }
  }, []);

  const handleSubscribe = async () => {
    try {
      setIsSubscribing(true);
      setSubscriptionError(null);

      // Request permission if needed
      if (notificationStatus !== 'granted') {
        const granted = await requestNotificationPermission();
        if (!granted) {
          setSubscriptionError(t('alerts.notifications.permissionDenied'));
          return;
        }
        setNotificationStatus('granted');
      }

      // Register push subscription
      const subscription = await registerPushSubscription();

      // Save subscription on server
      await endpoints.auth.profile.update({
        notificationSubscription: subscription
      });

      setNotificationStatus('subscribed');
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
      setSubscriptionError(t('alerts.notifications.subscriptionFailed'));
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      setIsSubscribing(true);
      setSubscriptionError(null);

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        // Update server
        await endpoints.auth.profile.update({
          notificationSubscription: null
        });
      }

      setNotificationStatus('default');
    } catch (error) {
      console.error('Failed to unsubscribe from notifications:', error);
      setSubscriptionError(t('alerts.notifications.unsubscribeFailed'));
    } finally {
      setIsSubscribing(false);
    }
  };

  if (loading) return <Typography>{t('common.loading')}</Typography>;
  if (error) return <Typography color="error">{t('errors.fetchFailed')}</Typography>;

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" component="h2">
          {t('alerts.title')}
        </Typography>
        
        {isLoggedIn && isNotificationsSupported() && (
          <Stack direction="row" spacing={2} alignItems="center">
            {notificationStatus === 'subscribed' ? (
              <Tooltip title={t('alerts.notifications.unsubscribe')}>
                <IconButton 
                  onClick={handleUnsubscribe}
                  disabled={isSubscribing}
                  color="primary"
                >
                  <NotificationsActive />
                </IconButton>
              </Tooltip>
            ) : (
              <Button
                startIcon={<NotificationsOff />}
                onClick={handleSubscribe}
                disabled={isSubscribing || notificationStatus === 'denied'}
                variant="outlined"
                size="small"
              >
                {t('alerts.notifications.subscribe')}
              </Button>
            )}
          </Stack>
        )}
      </Box>

      {subscriptionError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubscriptionError(null)}>
          {subscriptionError}
        </Alert>
      )}

      {alerts?.length === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
          {t('alerts.noAlerts')}
        </Typography>
      ) : (
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {alerts.map((alert, index) => (
            <Box key={alert.alertId}>
              {index > 0 && <Divider component="li" />}
              <ListItem alignItems="flex-start">
                <Box sx={{ mr: 2, mt: 1 }}>
                  {severityIcons[alert.severity] || severityIcons.info}
                </Box>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1">{alert.title}</Typography>
                      <Chip 
                        label={t(`alerts.severity.${alert.severity}`)} 
                        color={
                          alert.severity === 'emergency' ? 'error' :
                          alert.severity === 'critical' ? 'error' :
                          alert.severity === 'warning' ? 'warning' : 'info'
                        }
                        size="small"
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2" color="text.primary" sx={{ mt: 1 }}>
                        {alert.description}
                      </Typography>
                      {alert.source && (
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                          {t('alerts.source')}: {alert.source}
                        </Typography>
                      )}
                      {alert.area && (
                        <Typography variant="caption" display="block">
                          {t('alerts.area')}: {alert.area}
                        </Typography>
                      )}
                      <Typography variant="caption" display="block">
                        {new Date(alert.timestamp).toLocaleString()}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
            </Box>
          ))}
        </List>
      )}
    </Box>
  );
}