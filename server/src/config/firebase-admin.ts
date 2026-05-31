import admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

function initFirebase() {
  if (admin.apps.length) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('[Firebase] Missing env vars — Google OAuth will not work');
    return;
  }

  // Handle various formats of private key from different hosting providers
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, '\n');

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log('[Firebase] Initialized successfully');
  } catch (err) {
    console.error('[Firebase] Init failed:', err);
  }
}

initFirebase();

export async function verifyFirebaseToken(idToken: string): Promise<DecodedIdToken> {
  if (!admin.apps.length) {
    throw new Error('Firebase not configured on server');
  }
  return admin.auth().verifyIdToken(idToken);
}
