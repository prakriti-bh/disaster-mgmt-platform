'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Box, Typography, Paper, Button } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

export default function RegistrationSuccess() {
  const { t } = useTranslation();
  const router = useRouter();

  // Redirect to login after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/login');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          {t('app.title')}
        </Typography>
      </Box>

      <Paper elevation={3} sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
        <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
        
        <Typography variant="h5" gutterBottom>
          {t('auth.registrationSuccess')}
        </Typography>
        
        <Typography color="text.secondary" paragraph>
          {t('auth.registrationSuccessMessage')}
        </Typography>

        <Button
          variant="contained"
          onClick={() => router.push('/login')}
          sx={{ mt: 2 }}
        >
          {t('auth.proceedToLogin')}
        </Button>
      </Paper>
    </Container>
  );
}