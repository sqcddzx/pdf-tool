const fs = require('fs').promises;
const path = require('path');

async function clearDir(dirPath) {
  const items = await fs.readdir(dirPath, { withFileTypes: true });
  const deletePromises = items
    .filter(item => item.name != 'icons')
    .map(async (item) => {
      const itemPath = path.join(dirPath, item.name);
      if (item.isDirectory()) {
        await clearDir(itemPath);
        return fs.rmdir(itemPath);
      } else {
        return fs.unlink(itemPath);
      }
    });
  await Promise.all(deletePromises);
}

; (async () => {
  let dir = path.join(__dirname, '../build')
  await clearDir(dir)
})()
