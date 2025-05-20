import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import crypto from 'crypto'
import { getConfig, saveConfig } from './config'
import { mergePdf } from '../utils/pdftk'

let userDataPath = app.getPath('userData')
let pdfToolDir = `${userDataPath}/pdftool/`
let userConfigPath = `${pdfToolDir}/config.json`

export const uploadWatermark = (e, data) => {
  const { file } = data;

  // 确保watermark目录存在
  if (!fs.existsSync(pdfToolDir)) {
    fs.mkdirSync(pdfToolDir, { recursive: true });
  }

  const fileName = file.name
  // 生成随机 MD5 哈希值
  const randomString = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const md5Hash = crypto.createHash('md5').update(randomString).digest('hex');
  // 获取文件扩展名
  const extname = path.extname(file.path);
  // 使用随机 MD5 哈希值作为文件名
  const newFileName = `${md5Hash}${extname}`;
  const newPath = path.join(pdfToolDir, newFileName);

  // 复制文件到watermark目录
  fs.copyFileSync(file.path, newPath);

  // 更新配置文件
  const config = getConfig(userConfigPath);
  const info = {
    md5: md5Hash,
    name: fileName,
    path: newPath
  }
  config.watermark.push(info)
  saveConfig(userConfigPath, config);

  // 发送成功消息回渲染进程
  e.sender.send('watermark-upload-success', info);
}

export const deleteWatermark = (e, data) => {
  const watermarkPath = data.path

  // 获取当前配置
  const config = getConfig(userConfigPath);

  // 从配置中移除该水印
  config.watermark = config.watermark.filter(item => item.path !== watermarkPath);
  saveConfig(userConfigPath, config);

  // 删除实际的水印文件
  if (fs.existsSync(watermarkPath)) {
    fs.unlinkSync(watermarkPath);
  }

  // 通知渲染进程更新界面
  e.sender.send('watermark-delete-success', data);
}

export const addWatermark = async (e, data) => {
  const { files, watermark } = data;

  // 获取当前配置
  const config = getConfig(userConfigPath);

  for (let i = 0; i < files.length; i++) {
    let file = files[i]

    e.sender.send('file-status-update', { id: file.id, status: 'processing', msg: '' });

    try {
      //加水印
      await mergePdf(file.path, watermark.path, config.outputFolder)

      e.sender.send('file-status-update', { id: file.id, status: 'completed', msg: '' });
    } catch (err) {
      e.sender.send('file-status-update', { id: file.id, status: 'error', msg: err.message });
    }
  }
} 