/**
 * main.js - Electron entry point for Daily Task Scheduler
 *
 * To run as a desktop app:
 *   npm install
 *   npm start
 *
 * To build distributable packages:
 *   npm run build
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    const win = new BrowserWindow({
        width: 1100,
        height: 750,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    win.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        // Re-open a window on macOS when the dock icon is clicked and no windows are open
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    // Quit on all platforms except macOS
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
