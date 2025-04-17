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
  Stack
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { login } from '@/store/userSlice';

export default function Login() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const router = useRouter();
  const { loading, error } = useSelector(state => state.user);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await dispatch(login(formData)).unwrap();
      router.push('/');
    } catch (error) {
      // Error is handled by the Redux slice
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          {t('app.title')}
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" gutterBottom>
          {t('app.subtitle')}
        </Typography>
      </Box>
      
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          {t('auth.login')}
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label={t('auth.email')}
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
            autoFocus
          />
          
          <TextField
            fullWidth
            label={t('auth.password')}
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : t('auth.loginButton')}
          </Button>
          
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Link href="/forgot-password" passHref>
              <Typography variant="body2" component="a" color="primary" sx={{ textDecoration: 'none' }}>
                {t('auth.forgotPassword')}
              </Typography>
            </Link>
            
            <Link href="/register" passHref>
              <Typography variant="body2" component="a" color="primary" sx={{ textDecoration: 'none' }}>
                {t('auth.noAccount')}
              </Typography>
            </Link>
          </Stack>
        </form>
      </Paper>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="body2" align="center" color="text.secondary">
          {t('auth.guestMessage')}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Button variant="outlined" onClick={() => router.push('/')}>
            {t('auth.continueAsGuest')}
          </Button>
        </Box>
      </Box>
    </Container>
  );
}