import { Menu, MenuItem } from 'electron'

let menu = null

export const menuSetup = (win) => {
  menu = Menu.buildFromTemplate([
    {
      label: '首页',
      click: () => {
        win.webContents.send('set-pannel', { pannel: 'home' });
      }
    },
    {
      label: '配置',
      submenu: [
        {
          label: '基础配置',
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