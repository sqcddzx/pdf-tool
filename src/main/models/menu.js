import { Menu, MenuItem } from 'electron'

let menu = null

export const menuSetup = (win) => {
  menu = Menu.buildFromTemplate([
    {
      label: '配置',
      submenu: [
        {
          label: '输出目录',
          click: () => {
            win.webContents.send(`show-output-folder-settings`)
          },
        }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            win.webContents.send(`show-about`)
          },
        }
      ]
    }
  ])
  Menu.setApplicationMenu(menu)
}