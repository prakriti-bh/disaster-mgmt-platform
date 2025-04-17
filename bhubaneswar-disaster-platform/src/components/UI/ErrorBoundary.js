'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { withErrorTracking, ErrorCategory } from '@/utils/errorTracking';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Track the error with our error tracking system
    withErrorTracking(error, 'ErrorBoundary', {
      componentStack: errorInfo.componentStack,
      category: ErrorCategory.UI
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    const { t } = this.props;

    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            p: 3,
            textAlign: 'center'
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom color="error">
            {t('errors.somethingWentWrong')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 600 }}>
            {t('errors.tryAgainLater')}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={this.handleRetry}
            sx={{ mr: 2 }}
          >
            {t('common.retry')}
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => window.location.reload()}
          >
            {t('common.refresh')}
          </Button>
          {process.env.NODE_ENV === 'development' && (
            <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                {this.state.error?.stack || this.state.error?.message}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

export default function ErrorBoundaryWrapper(props) {
  const { t } = useTranslation();
  return <ErrorBoundary t={t} {...props} />;
}