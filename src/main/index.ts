import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { installExtension, REDUX_DEVTOOLS } from 'electron-devtools-installer'
import icon from '../../resources/icon.icns?asset'
import { registerFileOpsHandlers } from './fileOps'
import { registerSettingsHandlers } from './settingsManager'
import { registerSqliteOpsHandlers } from './sqliteOps'

let mainWindow: BrowserWindow | null = null
let fileToOpen: string | null = null

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, commandLine) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()

      // Handle file opening from second instance
      const filePath = getFilePathFromArgs(commandLine)
      if (filePath) {
        sendOpenFileToRenderer(filePath)
      }
    }
  })
}

function getFilePathFromArgs(argv: string[]): string | null {
  const filePath = argv.find((arg) => arg.endsWith('.mns'))
  return filePath || null
}

function sendOpenFileToRenderer(filePath: string): void {
  if (mainWindow) {
    mainWindow.webContents.send('open-project', filePath)
  }
}

// Handle macOS open-file event
app.on('open-file', (event, path) => {
  event.preventDefault()
  if (path.endsWith('.mns')) {
    if (app.isReady() && mainWindow) {
      sendOpenFileToRenderer(path)
    } else {
      fileToOpen = path
    }
  }
})

function createWindow(): void {
  mainWindow = new BrowserWindow({
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
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
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
  if (!fileToOpen) {
    fileToOpen = getFilePathFromArgs(process.argv)
  }

  ipcMain.handle('get-initial-file', () => {
    const path = fileToOpen
    fileToOpen = null // Clear it after it's been requested once
    return path
  })

  if (is.dev) {
    // Conditionally install Redux DevTools in development
    installExtension(REDUX_DEVTOOLS)
      .then((ext) => console.log(`Added Extension:  ${ext.name}`))
      .catch((err) => console.log('An error occurred: ', err))
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
