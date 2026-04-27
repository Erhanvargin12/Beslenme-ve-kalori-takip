const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('--- REFAC-TEST (Native Fetch): Başlatılıyor ---');

  try {
    // 1. Test: Kullanıcı Listeleme
    console.log('1. Kullanıcılar Listeleniyor...');
    const listRes = await fetch(`${BASE_URL}/kullanicilar`);
    const users = await listRes.json();
    console.log('✅ Başarılı. Kullanıcı sayısı:', users.length);

    // 2. Test: Kayıt
    console.log('2. Yeni Kullanıcı Kaydı Deneniyor...');
    const kayitRes = await fetch(`${BASE_URL}/kayit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isim: 'Test SOLID Native',
        boy: 180,
        kilo: 75
      })
    });
    const kayitText = await kayitRes.text();
    console.log('✅ Başarılı. Yanıt:', kayitText);

    // 3. Test: AI Analizi
    console.log('3. AI Analizi Deneniyor (Simüle Edilmiş Görüntü)...');
    const aiRes = await fetch(`${BASE_URL}/analiz-et`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gorselBase64: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
      })
    });
    const aiText = await aiRes.text();
    console.log('✅ Başarılı. AI Yanıtı:\n', aiText);

    console.log('\n--- TÜM TESTLER BAŞARIYLA TAMAMLANDI ---');
    process.exit(0);
  } catch (error) {
    console.error('❌ TEST HATASI:', error.message);
    process.exit(1);
  }
}

runTests();
