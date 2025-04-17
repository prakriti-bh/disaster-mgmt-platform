'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Container, 
  Box, 
  Avatar, 
  Menu, 
  MenuItem, 
  Divider,
  Button 
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Map, 
  Notifications, 
  Report, 
  Info, 
  AccountCircle, 
  Language, 
  Settings, 
  ExitToApp 
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { logout } from '@/store/userSlice';
import { markAlertAsSeen, setAlerts, addAlert } from '@/store/alertSlice';
import { setReports, addReport } from '@/store/reportSlice';
import { setResources, addResource } from '@/store/resourceSlice';
import AlertNotification from '@/components/Alert/AlertNotification';
import OfflineNotice from '@/components/UI/OfflineNotice';
import { startRealtimeSimulation } from '@/utils/mockData';
import LanguageSwitcher from '@/components/UI/LanguageSwitcher';

export default function MainLayout({ children }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.user);
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [langAnchorEl, setLangAnchorEl] = useState(null);
  
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    // Initialize IndexedDB and load cached data
    initializeOfflineStorage();
    
    // Set up online/offline handlers
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Start real-time simulation in development mode
      const cleanup = startRealtimeSimulation({
        onNewReport: (report) => {
          dispatch(addReport(report));
          // Show notification for new report
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Incident Report', {
              body: `${report.type} reported near ${report.location.lat.toFixed(4)}, ${report.location.lng.toFixed(4)}`,
              icon: '/icons/notification-badge.png'
            });
          }
        },
        onNewResource: (resource) => {
          dispatch(addResource(resource));
        },
        onNewAlert: (alert) => {
          dispatch(addAlert(alert));
          // Show notification for new alert
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Emergency Alert', {
              body: `${alert.severity} severity ${alert.type} alert in your area`,
              icon: '/icons/notification-badge.png'
            });
          }
        }
      });

      return cleanup;
    }
  }, [dispatch]);

  const initializeOfflineStorage = async () => {
    try {
      const db = await openDatabase();
      
      // Load initial cached data
      const [alerts, reports, resources] = await Promise.all([
        loadFromStore(db, 'alerts'),
        loadFromStore(db, 'reports'),
        loadFromStore(db, 'resources')
      ]);

      // Update Redux store with cached data
      dispatch(setAlerts(alerts));
      dispatch(setReports(reports));
      dispatch(setResources(resources));

      // If online, fetch fresh data
      if (navigator.onLine) {
        syncWithServer();
      }
    } catch (error) {
      console.error('Failed to initialize offline storage:', error);
    }
  };

  const openDatabase = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('disaster-platform', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores if they don't exist
        ['alerts', 'reports', 'resources'].forEach(store => {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: 'id' });
          }
        });
      };
    });
  };

  const loadFromStore = async (db, storeName) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  };

  const saveToStore = async (db, storeName, data) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Clear existing data
      store.clear();
      
      // Add new data
      data.forEach(item => store.add(item));
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  };

  const handleOnline = () => {
    syncWithServer();
  };

  const handleOffline = () => {
    // Could show a notification or update UI to indicate offline mode
  };

  const syncWithServer = async () => {
    try {
      const [alerts, reports, resources] = await Promise.all([
        fetch('/api/alerts').then(r => r.json()),
        fetch('/api/reports').then(r => r.json()),
        fetch('/api/resources').then(r => r.json())
      ]);

      const db = await openDatabase();

      // Update IndexedDB
      await Promise.all([
        saveToStore(db, 'alerts', alerts),
        saveToStore(db, 'reports', reports),
        saveToStore(db, 'resources', resources)
      ]);

      // Update Redux store
      dispatch(setAlerts(alerts));
      dispatch(setReports(reports));
      dispatch(setResources(resources));
    } catch (error) {
      console.error('Failed to sync with server:', error);
    }
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLangMenuOpen = (event) => {
    setLangAnchorEl(event.currentTarget);
  };
  
  const handleLangMenuClose = () => {
    setLangAnchorEl(null);
  };
  
  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    handleLangMenuClose();
  };
  
  const handleLogout = () => {
    dispatch(logout());
    handleMenuClose();
    router.push('/login');
  };
  
  const menuItems = [
    { text: t('tabs.map'), icon: <Map />, path: '/' },
    { text: t('tabs.alerts'), icon: <Notifications />, path: '/alerts' },
    { text: t('tabs.report'), icon: <Report />, path: '/reports' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {t('app.title', 'Bhubaneswar Disaster Platform')}
          </Typography>
          
          <IconButton color="inherit" onClick={handleLangMenuOpen}>
            <Language />
          </IconButton>
          <Menu
            anchorEl={langAnchorEl}
            open={Boolean(langAnchorEl)}
            onClose={handleLangMenuClose}
          >
            <MenuItem onClick={() => handleLanguageChange('en')}>English</MenuItem>
            <MenuItem onClick={() => handleLanguageChange('or')}>ଓଡ଼ିଆ</MenuItem>
          </Menu>
          
          {user ? (
            <>
              <IconButton
                color="inherit"
                onClick={handleMenuOpen}
              >
                <Avatar 
                  sx={{ width: 32, height: 32 }}
                  alt={user.name || "User"}
                >
                  {(user.name || "U")[0]}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={() => { handleMenuClose(); router.push('/profile'); }}>
                  <ListItemIcon>
                    <AccountCircle fontSize="small" />
                  </ListItemIcon>
                  {t('nav.profile', 'Profile')}
                </MenuItem>
                <MenuItem onClick={() => { handleMenuClose(); router.push('/settings'); }}>
                  <ListItemIcon>
                    <Settings fontSize="small" />
                  </ListItemIcon>
                  {t('nav.settings', 'Settings')}
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <ExitToApp fontSize="small" />
                  </ListItemIcon>
                  {t('nav.logout', 'Logout')}
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button color="inherit" onClick={() => router.push('/login')}>
              {t('nav.login', 'Login')}
            </Button>
          )}
        </Toolbar>
      </AppBar>
      
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={handleDrawerToggle}
          onKeyDown={handleDrawerToggle}
        >
          <List>
            {menuItems.map((item) => (
              <ListItem 
                button 
                key={item.text} 
                onClick={() => router.push(item.path)}
                selected={router.pathname === item.path}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      
      <AlertNotification 
        onClose={(alertId) => dispatch(markAlertAsSeen(alertId))} 
      />
      
      <OfflineNotice />
      
      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>
      
      <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: 'background.paper' }}>
        <Container maxWidth="sm">
          <Typography variant="body2" color="text.secondary" align="center">
            {t('app.footer', '© 2025 Bhubaneswar Disaster Platform')}
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}