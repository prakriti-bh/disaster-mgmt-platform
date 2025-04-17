'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Box, Container, Grid, Typography, Paper, Tabs, Tab, Alert as MuiAlert } from '@mui/material';
import { useTranslation } from 'react-i18next';
import dynamic from 'next/dynamic';

// Dynamically import map component to avoid SSR issues with Leaflet
const ResourceMap = dynamic(
  () => import('@/components/ResourceMap/ResourceMap'),
  { ssr: false }
);

const AlertPanel = dynamic(() => import('@/components/Alert/AlertPanel'));
const ReportForm = dynamic(() => import('@/components/CommunityReporting/ReportForm'));
const RecentReports = dynamic(() => import('@/components/CommunityReporting/RecentReports'));
const OfflineNotice = dynamic(() => import('@/components/UI/OfflineNotice'));

export default function Home() {
  const { t } = useTranslation();
  const [value, setValue] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const alerts = useSelector(state => state.alerts.items);
  const criticalAlerts = alerts?.filter(alert => alert.severity === 'critical' || alert.severity === 'emergency') || [];

  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <main>
      {!isOnline && <OfflineNotice />}

      <Container maxWidth="lg" sx={{ mt: 2, mb: 4 }}>
        {criticalAlerts.length > 0 && (
          <MuiAlert 
            severity="error" 
            variant="filled" 
            sx={{ mb: 2 }}
          >
            {criticalAlerts[0].title} - {criticalAlerts[0].description}
          </MuiAlert>
        )}

        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={value} 
              onChange={handleChange} 
              aria-label="main navigation tabs" 
              variant="fullWidth"
            >
              <Tab label={t('tabs.map')} />
              <Tab label={t('tabs.alerts')} />
              <Tab label={t('tabs.report')} />
            </Tabs>
          </Box>
          
          <Box role="tabpanel" hidden={value !== 0} sx={{ p: 0 }}>
            {value === 0 && <ResourceMap />}
          </Box>
          
          <Box role="tabpanel" hidden={value !== 1} sx={{ p: 3 }}>
            {value === 1 && <AlertPanel />}
          </Box>
          
          <Box role="tabpanel" hidden={value !== 2} sx={{ p: 3 }}>
            {value === 2 && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <ReportForm />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    {t('reports.recent')}
                  </Typography>
                  <RecentReports />
                </Grid>
              </Grid>
            )}
          </Box>
        </Paper>
      </Container>
    </main>
  );
}
