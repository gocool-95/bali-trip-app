import React from 'react';
import { createRoot } from 'react-dom/client';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import App from './App';
import { requestNotificationPermission, scheduleActivityReminders } from './services/notifications';
import { ensureLocalData, syncFromServer } from './services/sync';

// Bootstrap: load local data, attempt sync, schedule notifications
async function bootstrap() {
  if (Capacitor.isNativePlatform()) {
    StatusBar.setStyle({ style: Style.Dark });
  }

  await ensureLocalData();
  syncFromServer().then(() => {
    scheduleActivityReminders();
  });
  requestNotificationPermission();
}

bootstrap();

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
