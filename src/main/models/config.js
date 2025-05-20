import fs from 'fs'
import path from 'path'
import { app } from 'electron'

//默认初始数据
const defConfig = {
  watermark: [],
  outputFolder: app.getPath('downloads'),
  concurrency: 1
}

export const getConfig = (filePath) => {
  checkFile(filePath)
  let data = fs.readFileSync(filePath)
  return JSON.parse(data)
}

export const saveConfig = (filePath, data) => {
  checkFile(filePath)
  fs.writeFileSync(filePath, JSON.stringify(data))
}

function checkFile (filePath){
  if (fs.existsSync(filePath)) {
    console.log('文件已存在');
  } else {
    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      console.log('目录创建成功');
    }

    fs.writeFileSync(filePath, JSON.stringify(defConfig));
    console.log('文件创建成功');
  }
}