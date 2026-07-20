const { db, COLLECTIONS } = require('./src/config/firebase');

async function test() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const snapshot = await db.collection(COLLECTIONS.USAGE_STATS)
      .where('type', '==', 'photo_analysis')
      .where('createdAt', '>=', today)
      .get();
      
    console.log(`Found ${snapshot.size} usage_stats today.`);
    snapshot.forEach(doc => console.log(doc.id, doc.data()));
  } catch (e) {
    console.error(e);
  }
}
test();
