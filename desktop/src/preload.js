const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('crowdshield', {
  // Permissions
  getPermissions: () => ipcRenderer.invoke('get-permissions'),
  setPermission: (type, value) => ipcRenderer.invoke('set-permission', type, value),
  requestPermission: (type) => ipcRenderer.invoke('request-permission', type),
  requestAllPermissions: () => ipcRenderer.invoke('request-all-permissions'),

  // Screen capture / sources
  getSources: () => ipcRenderer.invoke('get-sources'),

  // Notifications
  checkNotificationSupport: () => ipcRenderer.invoke('check-notification-support'),
  sendNotification: (title, body) => ipcRenderer.invoke('send-notification', title, body),
  sendUrgentContact: (priority, message) => ipcRenderer.invoke('send-urgent-contact', priority, message),
  getNotifications: () => ipcRenderer.invoke('get-notifications'),
  markNotificationRead: (id) => ipcRenderer.invoke('mark-notification-read', id),

  // Platform info
  platform: process.platform,
  isElectron: true,
});
