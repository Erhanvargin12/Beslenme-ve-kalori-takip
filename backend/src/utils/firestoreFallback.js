const { db } = require('../config/firebase');

/**
 * Firestore composite index / FAILED_PRECONDITION hatalarını algılar.
 */
function isFirestoreIndexError(error) {
  const code = error?.code;
  const msg = String(error?.message || '').toLowerCase();
  return (
    code === 9 ||
    code === 'failed-precondition' ||
    code === 'FAILED_PRECONDITION' ||
    msg.includes('index') ||
    msg.includes('failed_precondition') ||
    msg.includes('requires an index')
  );
}

async function fetchCollectionDocs(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

/**
 * Önce indeksli sorguyu dener; index hatasında koleksiyonu ham çekip bellek içi filter/sort uygular.
 * @param {object} options
 * @param {string} options.collectionName
 * @param {() => Promise<Array>} options.runIndexedQuery
 * @param {(doc: object) => boolean} [options.filter]
 * @param {(a: object, b: object) => number} [options.sort]
 */
async function runQueryWithFallback({ collectionName, runIndexedQuery, filter, sort }) {
  try {
    return await runIndexedQuery();
  } catch (error) {
    if (!isFirestoreIndexError(error)) {
      throw error;
    }
    console.warn(
      `[Firestore Fallback] ${collectionName}:`,
      String(error.message || error).substring(0, 120)
    );
    let docs = await fetchCollectionDocs(collectionName);
    if (filter) {
      docs = docs.filter(filter);
    }
    if (sort) {
      docs = docs.sort(sort);
    }
    return docs;
  }
}

module.exports = {
  isFirestoreIndexError,
  fetchCollectionDocs,
  runQueryWithFallback,
};
