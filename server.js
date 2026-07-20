require('dotenv').config();
const app = require('./backend/src/app');
const { printMobileConnectionHint } = require('./backend/src/utils/lanIp');

const PORT = process.env.PORT || 3000;

const dgram = require('dgram');

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Sunucu 0.0.0.0:${PORT} üzerinde dinliyor (tüm ağ arayüzleri)`);
  console.log('📡 Modüler Yapı: Aktif');
  printMobileConnectionHint(PORT);

  // Kalıcı Çözüm: Firestore'a güncel IP'yi yaz
  try {
    const { db } = require('./backend/src/config/firebase');
    const { getRecommendedMobileHost } = require('./backend/src/utils/lanIp');
    const ip = getRecommendedMobileHost();
    if (ip && db) {
      await db.collection('system_config').doc('backend_info').set({
        ip: ip,
        port: PORT,
        updatedAt: new Date(),
      });
      console.log(`🌐 [Auto-Discovery] IP Adresi Firestore'a yazıldı: ${ip}:${PORT}`);
    }
  } catch (e) {
    console.warn('⚠️ Firestore IP senkronizasyonu yapılamadı:', e.message);
  }
});

// UDP Broadcast for Automatic Mobile Discovery
const udpServer = dgram.createSocket('udp4');
udpServer.on('message', (msg, rinfo) => {
  if (msg.toString().trim() === 'AKILLI_BESLENME_DISCOVER') {
    const reply = Buffer.from(`AKILLI_BESLENME_SERVER:${PORT}`);
    udpServer.send(reply, rinfo.port, rinfo.address, (err) => {
      if (err) console.error('UDP Error:', err);
      else console.log(`[Auto-Discovery] Mobil cihaza IP gönderildi: ${rinfo.address}`);
    });
  }
});
udpServer.bind(3001, '0.0.0.0', () => {
  console.log('📡 UDP Auto-Discovery port 3001 üzerinde aktif');
});