import path from 'path'
import { app, ipcMain, dialog, shell } from 'electron'
import { getConfig, saveConfig } from './config'
import { addQueue, setConcurrency } from './pdf2jpg'
import { uploadWatermark, deleteWatermark, addWatermark } from './watermark'

let userDataPath = app.getPath('userData')
let pdfToolDir = `${userDataPath}/pdftool/`
let userConfigPath = `${pdfToolDir}/config.json`

export const ipcSetup = () => {
 
  ipcMain.on('pdf-jpg', (e, data) => {
    addQueue(e, data);
  });

  //上传水印
  ipcMain.on('upload-watermark', (e, data) => {
    uploadWatermark(e, data);
  });

  //删除水印
  ipcMain.on('delete-watermark', (e, data) => {
    deleteWatermark(e, data);
  });

  //添加水印
  ipcMain.on('add-watermark', async (e, data) => {
    await addWatermark(e, data);
  });

  //获取配置
  ipcMain.on('get-config', (e) => {
    const config = getConfig(userConfigPath)
    e.sender.send(`get-config`, config)
  });

  //保存配置
  ipcMain.on('save-config', (e, data) => {
    if(data.concurrency){
      setConcurrency(e, data.concurrency)
    }

    const config = getConfig(userConfigPath)
    saveConfig(userConfigPath, { ...config, ...data })
  });

  //选择文件夹
  ipcMain.on('show-save-dialog', async (e, options) => {
    const result = dialog.showOpenDialog(e.sender.getOwnerBrowserWindow(), {
      ...options,
      properties: ['openDirectory']
    });
    e.sender.send('save-dialog-result', result);
  });

  //打开文件夹
  ipcMain.on('open-folder', (e, filePath) => {
    const config = getConfig(userConfigPath)
    const outputPath = path.join(config.outputFolder, filePath);

    shell.showItemInFolder(outputPath);
  });

  //关闭窗口
  ipcMain.on('win-close', (e) => {
    app.exit()
  })
}
