import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { router } from '@/app/router';

export const AppProviders: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <NotificationProvider>
          <RouterProvider router={router} />
        </NotificationProvider>
      </AuthProvider>
    </ToastProvider>
  );
};
