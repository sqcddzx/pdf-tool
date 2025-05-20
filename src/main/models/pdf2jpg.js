import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { getConfig } from './config'
import { pdf2jpg } from '../utils/ghostscript'
import { jpg2jpg } from '../utils/magick'

let userDataPath = app.getPath('userData')
let pdfToolDir = `${userDataPath}/pdftool/`
let userConfigPath = `${pdfToolDir}/config.json`

const config = getConfig(userConfigPath);

let taskQueue = [];
let curCount = 0;
let maxCount = config.concurrency || 1

export const setConcurrency = async (e, count) => {
  maxCount = count
  checkQueue(e)
}

export const addQueue = async (e, data) => {
  taskQueue = taskQueue.concat(data.files);
  checkQueue(e)
}

export const checkQueue = (e) => {
  while (curCount < maxCount && taskQueue.length > 0) {
    processQueue(e);
  }
}

async function processQueue(e) {
  if (curCount >= maxCount || taskQueue.length === 0) return;

  curCount++;
  const file = taskQueue.shift();
  const config = getConfig(userConfigPath);

  e.sender.send('file-status-update', { id: file.id, status: 'processing', msg: '' });

  try {
    let inputPath = file.path;
    let outputDir = `${config.outputFolder}/${path.basename(file.path, '.pdf')}`;
    let outputPath = `${outputDir}/%d.jpg`;

    // 检测outputDir是否存在，不存在则创建
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    //pdf转jpg
    await pdf2jpg(inputPath, outputPath, {
      density: 600
    }, (res) => {
      e.sender.send('file-status-update', { id: file.id, status: 'processing', msg: `转JPG: ${res}` });
    });

    //jpg转dpi
    const jpgFiles = fs.readdirSync(outputDir).filter(file => path.extname(file).toLowerCase() === '.jpg');
    for (let i = 0; i < jpgFiles.length; i++) {
      const jpgFile = jpgFiles[i]
      const jpgFilePath = path.join(outputDir, jpgFile);
      await jpg2jpg(jpgFilePath, jpgFilePath, {
        density: 254
      });
      e.sender.send('file-status-update', { id: file.id, status: 'processing', msg: `转DPI: ${i + 1}/${jpgFiles.length}` });
    }

    e.sender.send('file-status-update', { id: file.id, status: 'completed', msg: '' });
  } catch (err) {
    console.log(err);
    e.sender.send('file-status-update', { id: file.id, status: 'error', msg: err.message });
  }

  curCount--;
  processQueue(e);
}