const { app, BrowserWindow, ipcMain, Notification, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let mainWindow;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 380,
    height: 480,
    resizable: false,
    frame: true,
    title: '番茄钟',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

function createTray() {
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAbwAAAG8B8aLcQwAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAEoSURBVDiNpZMxTsNAEEX/rNeOAwUlHVdA4gJcAokLcAQkLkCBaOgouQIVHZyAgoKSK0DJEYh8AUfYjpM4uzOULMSJE6f4pdHu/Jk3u7OWmRHHfh0A2QB4BDAH0BHRIyI+gPgJ4AvAh4h+AGwB7Jv/Cumcc4iI4JwDAJRSQEQAMDOYGaUUAKCUAjM73/fRtq2klMJms0EIgd57AEBKCV/v63UdSimUZQkRIaUUjDHQWqNuGkTXwrqFap1AjBFaa3jv0XUdjDHQWkspJSmlAIBSCk3TwDmH1WqFpmlgjJFSCiEEOOewXq/RdR2MMSilJO89nHPYbDZomoYAYIwBAGitIYQAESEiAEBrDQBQSoGZw32OiBAC3nt478GcME0Tuq6DEAJKKaSUUFUVUkoIIaC1RkoJIQRSSliWhd77A4A9M9ftWohuAAAAAElFTkSuQmCC'
  );
  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    { label: '显示窗口', click: () => mainWindow.show() },
    { type: 'separator' },
    { label: '退出', click: () => app.quit() }
  ]);
  tray.setToolTip('番茄钟');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => mainWindow.show());
}

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  // 保持托盘运行
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('show-notification', (_, title, body) => {
  if (Notification.isSupported()) {
    const n = new Notification({ title, body, silent: false });
    n.show();
  }
});

ipcMain.handle('set-title', (_, title) => {
  if (mainWindow) {
    mainWindow.setTitle(title);
  }
});

ipcMain.handle('set-always-on-top', (_, flag) => {
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(flag);
  }
});
