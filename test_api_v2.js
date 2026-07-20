const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('🧪 Yeni Özellik Testleri Başlatılıyor...\n');

  try {
    // 1. Kullanıcıları Listele (Mevcut bir ID bulmak için)
    console.log('1. Kullanıcılar Listeleniyor...');
    const usersRes = await fetch(`${BASE_URL}/kullanicilar`);
    const users = await usersRes.json();
    
    if (users.length === 0) {
      console.log('⚠️ Test için kayıtlı kullanıcı bulunamadı.');
      return;
    }
    const testUser = users[0];
    console.log(`✅ ${users.length} kullanıcı bulundu. Test kullanıcısı: ${testUser.isim} (ID: ${testUser.id})\n`);

    // 2. Kilo Güncelleme Testi
    console.log('2. Kilo Güncelleme Test Ediliyor...');
    const updateRes = await fetch(`${BASE_URL}/kullanicilar/update/${testUser.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kilo: 85 })
    });
    const updateData = await updateRes.json();
    if (updateRes.status !== 200) {
      console.log('❌ Güncelleme başarısız:', updateData);
      return;
    }
    console.log(`✅ Güncelleme Yanıtı: ${updateData.message}. Yeni VKİ: ${updateData.user.vki}\n`);

    // 3. Yemek Kaydetme Testi
    console.log('3. Yemek Kaydetme Test Ediliyor...');
    const mealRes = await fetch(`${BASE_URL}/meal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: testUser.id,
        foodName: 'Test Burger',
        calories: 650,
        protein: 30,
        carbs: 50,
        fat: 25
      })
    });
    const mealData = await mealRes.json();
    console.log(`✅ Yemek Kaydedildi: ${mealData.message}\n`);

    // 4. Geçmişi Getirme Testi
    console.log('4. Yemek Geçmişi Getiriliyor...');
    const historyRes = await fetch(`${BASE_URL}/history/${testUser.id}`);
    const history = await historyRes.json();
    console.log(`✅ ${history.length} adet yemek kaydı bulundu.\n`);

    // 5. Günlük Özet Testi
    console.log('5. Günlük Özet Test Ediliyor...');
    const summaryRes = await fetch(`${BASE_URL}/summary/${testUser.id}`);
    const summary = await summaryRes.json();
    console.log(`✅ Bugün Alınan Toplam Kalori: ${summary.totalCalories} kcal\n`);

    console.log('🎉 Tüm API testleri başarıyla tamamlandı!');

  } catch (error) {
    console.error('❌ Test sırasında hata oluştu:', error.message);
  }
}

runTests();
