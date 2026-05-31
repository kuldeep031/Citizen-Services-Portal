import admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

function initFirebase() {
  if (admin.apps.length) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('[Firebase] Missing env vars — Google OAuth will not work');
    return;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, '\n'),
    }),
  });
}

initFirebase();

export async function verifyFirebaseToken(idToken: string): Promise<DecodedIdToken> {
  if (!admin.apps.length) {
    throw new Error('Firebase not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.');
  }
  return admin.auth().verifyIdToken(idToken);
}
