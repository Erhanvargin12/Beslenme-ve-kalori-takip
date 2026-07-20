const { db } = require('./backend/src/config/firebase');

async function fixMeal() {
  try {
    await db.collection('meals').doc('lfOVwuKaEg5jtLY3aXO1').update({
      userId: '2hszdic9NMRz24E0yNdwvVRNq6b2'
    });
    console.log('Meal userId updated successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixMeal();
