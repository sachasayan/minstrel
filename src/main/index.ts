import { app, shell, BrowserWindow, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.icns?asset'
import { registerFileOpsHandlers } from './fileOps'
import { registerSettingsHandlers } from './settingsManager'
import { registerSqliteOpsHandlers } from './sqliteOps'
import { registerTraceExportHandlers } from './traceExport'
import { loadMainEnv } from './env'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}), // expose window controls in Windows/Linux
    ...(process.platform === 'darwin'
      ? {
          icon
        }
      : {
          icon: join(__dirname, '../../resources/icon.png')
        }),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  loadMainEnv()

  if (is.dev) {
    // Native Electron extension loading to replace electron-devtools-installer
    // This avoids deprecation warnings and uses the modern session.extensions API.
    const reduxDevToolsPath = join(
      app.getPath('userData'),
      'extensions/lmhkpmbekcpmknklioeibfkpmmfibljd'
    )

    session.defaultSession.extensions
      .loadExtension(reduxDevToolsPath, { allowFileAccess: true })
      .then((ext) => console.log(`Added Extension:  ${ext.name}`))
      .catch((err) => {
        if (err.message.includes('Extension cannot be loaded from')) {
          console.warn(
            'Redux DevTools not found locally. Please install it once via the library or manually to populate the directory.'
          )
        } else {
          console.error('An error occurred while loading Redux DevTools: ', err)
        }
      })
  }

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  registerFileOpsHandlers()
  registerSettingsHandlers()
  registerSqliteOpsHandlers()
  registerTraceExportHandlers()

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
