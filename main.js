const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 720,
    frame: false,
    resizable: true,
    backgroundColor: '#0f0f0f',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  win.loadFile('client/index.html');

  if (process.argv.includes('--dev')) {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

ipcMain.handle('window:minimize', () => win.minimize());
ipcMain.handle('window:maximize', () => { win.isMaximized() ? win.unmaximize() : win.maximize(); });
ipcMain.handle('window:close', () => win.close());
