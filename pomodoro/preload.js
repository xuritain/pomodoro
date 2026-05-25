const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  notification: {
    show: (title, body) => ipcRenderer.invoke('show-notification', title, body)
  },
  title: {
    set: (text) => ipcRenderer.invoke('set-title', text)
  },
  alwaysOnTop: {
    set: (flag) => ipcRenderer.invoke('set-always-on-top', flag)
  }
});
