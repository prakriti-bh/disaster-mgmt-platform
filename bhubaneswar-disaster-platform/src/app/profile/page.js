'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Avatar, 
  Button, 
  TextField, 
  Grid, 
  Tabs, 
  Tab, 
  List, 
  ListItem, 
  ListItemText, 
  Divider, 
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { PersonOutline, History, Settings } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { fetchUserProfile, updateProfile } from '@/store/userSlice';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function Profile() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const router = useRouter();
  const { user, loading, error } = useSelector(state => state.user);
  
  const [tabValue, setTabValue] = useState(0);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    pincode: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    if (!user) {
      dispatch(fetchUserProfile());
    } else {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        pincode: user.pincode || '',
      });
    }
  }, [dispatch, user]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setProfile({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      pincode: user.pincode || '',
    });
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({
      ...profile,
      [name]: value,
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateProfile(profile)).unwrap();
      setIsEditing(false);
    } catch (error) {
      // Error is already handled by the Redux slice
      // and will be displayed in the error Alert
    }
  };
  
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (!user && !loading) {
    router.push('/login');
    return null;
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 0, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ bgcolor: 'primary.main', py: 3, px: 4, color: 'white' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              sx={{ width: 80, height: 80, bgcolor: 'white', color: 'primary.main' }}
              alt={user?.name || "User"}
            >
              {(user?.name || "U")[0]}
            </Avatar>
            <Box sx={{ ml: 3 }}>
              <Typography variant="h5">{user?.name}</Typography>
              <Typography variant="subtitle1">{user?.email}</Typography>
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="fullWidth"
          >
            <Tab icon={<PersonOutline />} label={t('profile.personalInfo')} />
            <Tab icon={<History />} label={t('profile.activityHistory')} />
            <Tab icon={<Settings />} label={t('profile.preferences')} />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  {isEditing ? (
                    <>
                      <Button 
                        variant="outlined" 
                        onClick={handleCancel} 
                        sx={{ mr: 2 }}
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button 
                        type="submit" 
                        variant="contained"
                      >
                        {t('common.save')}
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="outlined" 
                      onClick={handleEdit}
                    >
                      {t('profile.edit')}
                    </Button>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('auth.name')}
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('auth.email')}
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('auth.phone')}
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('auth.address')}
                  name="address"
                  value={profile.address}
                  onChange={handleChange}
                  disabled={!isEditing}
                  multiline
                  rows={2}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('auth.pincode')}
                  name="pincode"
                  value={profile.pincode}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </Grid>
            </Grid>
          </form>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            {t('profile.recentReports')}
          </Typography>
          
          <List>
            <ListItem>
              <ListItemText
                primary="Flooding on Janpath Road"
                secondary={
                  <>
                    <Typography variant="body2">
                      {t('reports.types.flooding')} - {new Date('2023-06-10T15:30:00').toLocaleDateString()}
                    </Typography>
                    <Chip size="small" label={t('reports.status.verified')} color="success" sx={{ mt: 1 }} />
                  </>
                }
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemText
                primary="Power outage in Saheed Nagar"
                secondary={
                  <>
                    <Typography variant="body2">
                      {t('reports.types.powerOutage')} - {new Date('2023-06-08T09:15:00').toLocaleDateString()}
                    </Typography>
                    <Chip size="small" label={t('reports.status.resolved')} color="primary" sx={{ mt: 1 }} />
                  </>
                }
              />
            </ListItem>
          </List>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            {t('profile.notificationSettings')}
          </Typography>
          
          {/* Add notification preferences here */}
        </TabPanel>
      </Paper>
    </Container>
  );
}