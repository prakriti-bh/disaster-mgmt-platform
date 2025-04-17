'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { TextField, Button, Box, FormControl, InputLabel, Select, MenuItem, Stack, Paper, Typography, Alert, Rating, FormControlLabel, Checkbox, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { isOnline, saveDataLocally, queueOfflineAction } from '@/utils/offline';

export default function ReportForm() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    severity: 2,
    address: '',
    isAnonymous: false,
  });
  const [location, setLocation] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSeverityChange = (event, newValue) => {
    setFormData({
      ...formData,
      severity: newValue,
    });
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          setError(t('errors.locationAccess'));
        }
      );
    } else {
      setError(t('errors.geolocationNotSupported'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      const reportData = {
        ...formData,
        coordinates: location,
        status: 'reported',
        createdAt: new Date().toISOString(),
      };
      
      if (isOnline()) {
        // TODO: Replace with actual API call
        // await dispatch(submitReport(reportData));
        await saveDataLocally('reports', reportData);
      } else {
        await saveDataLocally('reports', reportData);
        await queueOfflineAction('submitReport', reportData);
      }
      
      setSuccess(true);
      setFormData({
        title: '',
        description: '',
        type: '',
        severity: 2,
        address: '',
        isAnonymous: false,
      });
      setLocation(null);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
    } catch (err) {
      setError(err.message || t('errors.reportSubmission'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {t('reports.submitNew')}
      </Typography>
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {t('reports.successMessage')}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label={t('reports.title')}
          name="title"
          value={formData.title}
          onChange={handleChange}
          margin="normal"
          required
        />
        
        <FormControl fullWidth margin="normal" required>
          <InputLabel>{t('reports.type')}</InputLabel>
          <Select
            name="type"
            value={formData.type}
            onChange={handleChange}
            label={t('reports.type')}
          >
            <MenuItem value="damage">{t('reports.types.damage')}</MenuItem>
            <MenuItem value="flooding">{t('reports.types.flooding')}</MenuItem>
            <MenuItem value="blocked-road">{t('reports.types.blockedRoad')}</MenuItem>
            <MenuItem value="power-outage">{t('reports.types.powerOutage')}</MenuItem>
            <MenuItem value="medical">{t('reports.types.medical')}</MenuItem>
            <MenuItem value="other">{t('reports.types.other')}</MenuItem>
          </Select>
        </FormControl>
        
        <Box sx={{ mt: 2, mb: 1 }}>
          <Typography component="legend">{t('reports.severity')}</Typography>
          <Rating
            name="severity"
            value={formData.severity}
            onChange={handleSeverityChange}
            max={4}
          />
          <Typography variant="caption" display="block" color="text.secondary">
            {formData.severity === 1 && t('reports.severity.minor')}
            {formData.severity === 2 && t('reports.severity.moderate')}
            {formData.severity === 3 && t('reports.severity.major')}
            {formData.severity === 4 && t('reports.severity.critical')}
          </Typography>
        </Box>
        
        <TextField
          fullWidth
          multiline
          rows={3}
          label={t('reports.description')}
          name="description"
          value={formData.description}
          onChange={handleChange}
          margin="normal"
          required
        />

        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
          <Button 
            variant="outlined" 
            onClick={getLocation}
            disabled={!!location}
            sx={{ mr: 2 }}
          >
            {t('reports.useCurrentLocation')}
          </Button>
          
          {location && (
            <Typography variant="caption" color="success.main">
              {t('reports.locationCaptured')}: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </Typography>
          )}
        </Box>
        
        <TextField
          fullWidth
          label={t('reports.address')}
          name="address"
          value={formData.address}
          onChange={handleChange}
          margin="normal"
          helperText={t('reports.addressHelp')}
        />
        
        <FormControlLabel
          control={
            <Checkbox 
              checked={formData.isAnonymous} 
              onChange={handleChange} 
              name="isAnonymous" 
            />
          }
          label={t('reports.reportAnonymously')}
          sx={{ mt: 1 }}
        />
        
        <Box sx={{ mt: 3 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={submitting || !formData.title || !formData.type || !formData.description || !location}
          >
            {submitting ? <CircularProgress size={24} /> : t('reports.submit')}
          </Button>
        </Box>
      </form>
    </Paper>
  );
}