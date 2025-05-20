import { app, BrowserWindow, screen } from 'electron'
import { menuSetup } from './models/menu'
import { ipcSetup } from './models/ipc'
import '../renderer/store'

if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let win

const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

const createWindow = () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  win = new BrowserWindow({
    width: Math.floor(width * 0.8),
    height: Math.floor(height * 0.8),
    resizable: true,
    useContentSize: true,
    icon: `file://${__dirname}/../../../build/icons/icon.png`,
    // frame: false
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  })

  win.loadURL(winURL)
  
  // 设置菜单
  menuSetup(win)

  // 处理 IPC 事件
  ipcSetup(win)

  win.on('close', (e) => {
    e.preventDefault()
    e.sender.send('close-all', {})
  })

  win.on('closed', () => {
    win = null
  })

  win.webContents.on('did-finish-load', () => {
    // let listStr = process.argv.find(item => item.startsWith('--list='))
    // if(listStr){
    //   let label = listStr.split('=')[1]
    //   win.webContents.send(`project-open`, label)

    //   let startStr = process.argv.find(item => item.startsWith('--start'))
    //   if(startStr){
    //     win.webContents.send(`start-all`)
    //   }
    // }
  });
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})