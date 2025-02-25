const express = require('express');
const path = require('path');
const app = express();

// ✅ 정적 파일 서빙 (index.html 포함)
app.use(express.static(path.join(__dirname, 'public')));

// ✅ 정적 파일 서빙 (index.html 포함)
app.use(express.static(path.join(__dirname, 'resources')));

// ✅ 기본 루트 경로에서 index.html 제공
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', '/startpage.html'));
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () =>
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`)
);
