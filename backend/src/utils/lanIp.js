const os = require('os');

/**
 * Mobil cihazların bağlanması gereken LAN IP'leri (Wi-Fi / Ethernet).
 * 172.16–31.x.x genelde WSL/Hyper-V sanal adaptörüdür — telefon erişemez.
 */
function isLikelyVirtualHost(host) {
  const parts = String(host).split('.');
  if (parts.length !== 4) return false;
  const a = Number(parts[0]);
  const b = Number(parts[1]);
  return a === 172 && b >= 16 && b <= 31;
}

function getLanAddresses() {
  const interfaces = os.networkInterfaces();
  const results = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    for (const addr of addrs) {
      if (addr.family !== 'IPv4' || addr.internal) continue;
      const entry = {
        name,
        address: addr.address,
        virtual: isLikelyVirtualHost(addr.address),
      };
      results.push(entry);
    }
  }

  return results;
}

function getRecommendedMobileHost() {
  const all = getLanAddresses();
  const wifi = all.find(
    (a) =>
      !a.virtual &&
      /wi-?fi|wlan|wireless/i.test(a.name) &&
      !/virtual|vethernet|wsl|hyper-v/i.test(a.name)
  );
  if (wifi) return wifi.address;

  const physical = all.find((a) => !a.virtual);
  return physical?.address || null;
}

function printMobileConnectionHint(port = 3000) {
  const all = getLanAddresses();
  const recommended = getRecommendedMobileHost();

  console.log('-----------------------------------------');
  console.log('📱 Mobil uygulama için sunucu adresi:');
  if (recommended) {
    console.log(`   → http://${recommended}:${port}  (Wi-Fi / LAN — bunu kullanın)`);
  } else {
    console.log('   → Wi-Fi IPv4 bulunamadı. `ipconfig` ile kontrol edin.');
  }

  const virtual = all.filter((a) => a.virtual);
  if (virtual.length) {
    console.log('⚠️  SANAL ağ (telefon ERİŞEMEZ — kullanmayın):');
    virtual.forEach((a) => {
      console.log(`   ✗ http://${a.address}:${port}  (${a.name})`);
    });
  }
  console.log('-----------------------------------------');
}

module.exports = {
  isLikelyVirtualHost,
  getLanAddresses,
  getRecommendedMobileHost,
  printMobileConnectionHint,
};
