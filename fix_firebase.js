const { db } = require('./backend/src/config/firebase');

async function fix() {
  try {
    await db.collection('users').doc('TncVahRE4BITVGHFn0Nl').update({
      authId: '2hszdic9NMRz24E0yNdwvVRNq6b2'
    });
    console.log('User authId updated successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fix();
