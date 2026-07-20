const { db } = require('./backend/src/config/firebase');

async function debug() {
  try {
    const usersSnap = await db.collection('users').get();
    const users = usersSnap.docs.map(d => ({id: d.id, ...d.data()}));
    
    console.log("USERS:");
    users.forEach(u => console.log(JSON.stringify(u)));

    const mealsSnap = await db.collection('meals').get();
    const meals = mealsSnap.docs.map(d => ({id: d.id, userId: d.data().userId, foodName: d.data().foodName}));
    
    console.log("\nMEALS:");
    meals.forEach(m => console.log(JSON.stringify(m)));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debug();
