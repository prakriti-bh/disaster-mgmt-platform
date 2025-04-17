'use client';

import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Alert, 
  CircularProgress,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { register } from '@/store/userSlice';

export default function Register() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const router = useRouter();
  const { loading, error } = useSelector(state => state.user);
  
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    pincode: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear validation error when field is edited
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null,
      });
    }
  };

  const validateStep = () => {
    const errors = {};
    
    if (activeStep === 0) {
      if (!formData.name.trim()) errors.name = t('validation.required');
      if (!formData.email.trim()) errors.email = t('validation.required');
      else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = t('validation.invalidEmail');
      if (!formData.phone.trim()) errors.phone = t('validation.required');
      else if (!/^\d{10}$/.test(formData.phone)) errors.phone = t('validation.invalidPhone');
    } else if (activeStep === 1) {
      if (!formData.password) errors.password = t('validation.required');
      else if (formData.password.length < 8) errors.password = t('validation.passwordLength');
      if (!formData.confirmPassword) errors.confirmPassword = t('validation.required');
      else if (formData.password !== formData.confirmPassword) errors.confirmPassword = t('validation.passwordMismatch');
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep(activeStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateStep()) {
      try {
        await dispatch(register(formData)).unwrap();
        router.push('/registration-success');
      } catch (error) {
        // Error is handled by the Redux slice
      }
    }
  };

  const steps = [
    t('auth.personalInfo'),
    t('auth.securityInfo'),
    t('auth.additionalInfo')
  ];

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          {t('app.title')}
        </Typography>
      </Box>
      
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          {t('auth.createAccount')}
        </Typography>
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={activeStep === steps.length - 1 ? handleSubmit : e => { e.preventDefault(); handleNext(); }}>
          {activeStep === 0 && (
            <>
              <TextField
                fullWidth
                label={t('auth.name')}
                name="name"
                value={formData.name}
                onChange={handleChange}
                margin="normal"
                required
                error={!!formErrors.name}
                helperText={formErrors.name}
              />
              
              <TextField
                fullWidth
                label={t('auth.email')}
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                required
                error={!!formErrors.email}
                helperText={formErrors.email}
              />
              
              <TextField
                fullWidth
                label={t('auth.phone')}
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                margin="normal"
                required
                error={!!formErrors.phone}
                helperText={formErrors.phone}
              />
            </>
          )}
          
          {activeStep === 1 && (
            <>
              <TextField
                fullWidth
                label={t('auth.password')}
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                margin="normal"
                required
                error={!!formErrors.password}
                helperText={formErrors.password}
              />
              
              <TextField
                fullWidth
                label={t('auth.confirmPassword')}
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                margin="normal"
                required
                error={!!formErrors.confirmPassword}
                helperText={formErrors.confirmPassword}
              />
            </>
          )}
          
          {activeStep === 2 && (
            <>
              <TextField
                fullWidth
                label={t('auth.address')}
                name="address"
                value={formData.address}
                onChange={handleChange}
                margin="normal"
                multiline
                rows={3}
              />
              
              <TextField
                fullWidth
                label={t('auth.pincode')}
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                margin="normal"
              />
            </>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
            >
              {t('common.back')}
            </Button>
            
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : activeStep === steps.length - 1 ? (
                t('auth.register')
              ) : (
                t('common.next')
              )}
            </Button>
          </Box>
        </form>
      </Paper>
      
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link href="/login" passHref>
            <Typography component="a" variant="body2" color="primary" sx={{ textDecoration: 'none' }}>
              {t('auth.loginHere')}
            </Typography>
          </Link>
        </Typography>
      </Box>
    </Container>
  );
}