const { db } = require('./backend/src/config/firebase');

async function getRecentErrors() {
  try {
    const snapshot = await db.collection('system_errors').orderBy('createdAt', 'desc').limit(5).get();
    if (snapshot.empty) {
      console.log('No recent errors found.');
      return;
    }
    snapshot.forEach(doc => {
      console.log(doc.id, '=>', doc.data());
    });
  } catch (error) {
    console.error('Error fetching system errors:', error);
  }
}

getRecentErrors();
