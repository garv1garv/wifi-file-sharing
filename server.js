const express = require('express');
const multer = require('multer');
const QRCode = require('qrcode');
const os = require('os');
const path = require('path');
const fs = require('fs');

const app = express(); // This is the missing app initialization
const PORT = 3000;
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

// Keep your original file download route
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

// Keep your original IP detection
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

// Modified upload route with CSS (only change)
app.post('/upload', upload.single('file'), async (req, res) => {
  const localIp = getLocalIp();
  const originalName = encodeURIComponent(req.file.originalname);
  const fileUrl = `http://${localIp}:${PORT}/files/${req.file.filename}?original=${originalName}`;
  const qrImageUrl = await QRCode.toDataURL(fileUrl);

  res.send(`
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        background: linear-gradient(45deg, #6a11cb, #2575fc, #37ecba, #f441a5);
        background-size: 400% 400%;
        animation: gradientBG 15s ease infinite;
        font-family: 'Inter', sans-serif;
        color: white;
        overflow: hidden;
      }

      .qr-container {
        background: rgba(255, 255, 255, 0.1);
        padding: 3rem;
        border-radius: 20px;
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        text-align: center;
        transform: translateY(0);
        animation: float 6s ease-in-out infinite;
        max-width: 500px;
        width: 90%;
      }

      h2 {
        font-size: 2rem;
        margin-bottom: 1rem;
        text-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        animation: textPop 0.8s ease-out;
      }

      .qr-image {
        margin: 2rem 0;
        transition: transform 0.3s ease;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.1);
      }

      .qr-image:hover {
        transform: scale(1.05);
      }

      .file-link {
        display: block;
        margin: 1rem 0;
        color: white;
        text-decoration: none;
        background: rgba(255, 255, 255, 0.2);
        padding: 1rem;
        border-radius: 8px;
        transition: all 0.3s ease;
      }

      .file-link:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-2px);
      }

      .back-link {
        display: inline-block;
        margin-top: 2rem;
        padding: 0.8rem 1.5rem;
        background: linear-gradient(45deg, #ff6b6b, #ff8e53);
        color: white;
        border-radius: 8px;
        text-decoration: none;
        font-weight: bold;
        transition: all 0.3s ease;
      }

      .back-link:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
      }

      @keyframes gradientBG {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
      }

      @keyframes textPop {
        0% { opacity: 0; transform: translateY(20px) scale(0.9); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
    </style>

    <div class="qr-container">
      <h2>📲 Scan to Download</h2>
      <img class="qr-image" src="${qrImageUrl}" alt="QR Code" width="250"/>
      <a href="${fileUrl}" class="file-link">${req.file.originalname}</a>
      <a href="/" class="back-link">⬅ Upload Another File</a>
    </div>
  `);
});

// Keep your original server startup
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server ready at http://${getLocalIp()}:${PORT}`);
});