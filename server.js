const express = require('express');
const multer = require('multer');
const QRCode = require('qrcode');
const os = require('os');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

app.get('/files/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads', req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }

  const originalName = req.query.original || 'shared-file';
  res.download(filePath, originalName, err => {
    if (err) {
      console.error(err);
      res.status(500).send('Error downloading file');
    }
  });
});

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

app.post('/upload', upload.single('file'), async (req, res) => {
  const localIp = getLocalIp();
  const originalName = encodeURIComponent(req.file.originalname);
  const fileUrl = `http://${localIp}:${PORT}/files/${req.file.filename}?original=${originalName}`;
  const qrImageUrl = await QRCode.toDataURL(fileUrl);

  res.send(`
    <style>
      body { font-family: 'Inter', sans-serif; text-align: center; background: #f4f7fa; padding: 2rem; }
      img { margin-top: 1rem; }
      a { display: inline-block; margin-top: 2rem; text-decoration: none; color: #007bff; }
    </style>
    <h2>📲 Scan to Download</h2>
    <p><a href="${fileUrl}">${fileUrl}</a></p>
    <img src="${qrImageUrl}" alt="QR Code" width="250"/>
    <br><a href="/">⬅ Upload Another File</a>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server ready at http://${getLocalIp()}:${PORT}`);
});