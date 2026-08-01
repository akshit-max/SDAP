const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

const zip = new AdmZip();
zip.addLocalFolder(path.join(__dirname, 'dist'));

const outDir = path.join(__dirname, '../web/public/downloads');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

zip.writeZip(path.join(outDir, 'WITHUS-Extension.zip'));
console.log('[WITHUS Extension] Zipped to ' + path.join(outDir, 'WITHUS-Extension.zip'));
