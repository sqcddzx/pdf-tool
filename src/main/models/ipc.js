import fs from 'fs'
import path from 'path'
import { app, ipcMain, dialog, shell } from 'electron'
import { getConfig, saveConfig } from './config'
import { addWatermark } from './watermark'

let userDataPath = app.getPath('userData')
let watermarkDir = `${userDataPath}/watermark/`
let userConfigPath = `${watermarkDir}/config.json`

export const ipcSetup = (win) => {
  //上传水印
  ipcMain.on('upload-watermark', (e, data) => {
    const { file } = data;
    
    // 确保watermark目录存在
    if (!fs.existsSync(watermarkDir)) {
      fs.mkdirSync(watermarkDir, { recursive: true });
    }
    
    // 生成新的文件名
    const fileName = path.basename(file.path);
    const newPath = path.join(watermarkDir, fileName);
    
    // 复制文件到watermark目录
    fs.copyFileSync(file.path, newPath);
    
    // 更新配置文件
    const config = getConfig(userConfigPath);
    config.watermark.push({
      name: fileName,
      path: newPath
    })
    saveConfig(userConfigPath, config);
    
    // 发送成功消息回渲染进程
    win.webContents.send('watermark-upload-success', {
      name: fileName,
      path: newPath
    });
  });

  //删除水印
  ipcMain.on('delete-watermark', (e, data) => {
    const watermarkPath = data.path
    
    // 获取当前配置
    const config = getConfig(userConfigPath);
    
    // 从配置中移除该水印
    const newConfig = config.watermark.filter(item => item.path !== watermarkPath);
    saveConfig(userConfigPath, newConfig);
    
    // 删除实际的水印文件
    if (fs.existsSync(watermarkPath)) {
      fs.unlinkSync(watermarkPath);
    }
    
    // 通知渲染进程更新界面
    win.webContents.send('watermark-delete-success', data);
  });

  //添加水印
  ipcMain.on('add-watermark', async (e, data) => {
    const { files, watermark } = data;
    
    // 获取当前配置
    const config = getConfig(userConfigPath);

    for(let i = 0; i < files.length; i++){
      let file = files[i]

      win.webContents.send('file-status-update', { id: file.id, status: 'processing', msg: '' });

      try{
        //加水印
        await addWatermark(file.path, watermark.path, config.outputFolder)

        win.webContents.send('file-status-update', { id: file.id, status: 'completed', msg: '' });
      }catch(err){
        win.webContents.send('file-status-update', { id: file.id, status: 'error', msg: err.message });
      }
    }
  })

  //获取配置
  ipcMain.on('get-config', (e) => {
    let res = getConfig(userConfigPath)
    win.webContents.send(`get-config`, res)
  });

  //保存配置
  ipcMain.on('save-config', (e, data) => {
    saveConfig(userConfigPath, data)
  });

  //选择文件夹
  ipcMain.on('show-save-dialog', async (e, options) => {
    const result = await dialog.showOpenDialog(win, {
      ...options,
      properties: ['openDirectory']
    });
    e.sender.send('save-dialog-result', result);
  });

  //打开文件夹
  ipcMain.on('open-folder', (e, filePath) => {
    shell.showItemInFolder(filePath);
  });

  //关闭窗口
  ipcMain.on('win-close', (e) => {
    app.exit()
  })

  win.on('close', (e) => {
    e.preventDefault()
    win.webContents.send('close-all', {})
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
