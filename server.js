const app = require('./backend/src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`-----------------------------------------`);
  console.log(`🚀 SOLID Sunucu Başlatıldı: http://localhost:${PORT}`);
  console.log(`📡 Modüler Yapı: Aktif`);
  console.log(`-----------------------------------------`);
});