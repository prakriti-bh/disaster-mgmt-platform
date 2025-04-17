'use client';

import '@/utils/i18n';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/store/store';
import { ThemeProvider } from '@mui/material/styles';
import theme from '@/utils/theme';
import CssBaseline from '@mui/material/CssBaseline';
import MainLayout from '@/components/Layout/MainLayout';
import ErrorBoundary from '@/components/UI/ErrorBoundary';

export default function ClientLayout({ children }) {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <MainLayout>
              {children}
            </MainLayout>
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </ErrorBoundary>
  );
}