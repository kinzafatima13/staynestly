import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, User } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export type UserRole = 'guest' | 'host';

export async function signupEmailPassword(
  name: string,
  email: string,
  password: string,
  role: UserRole
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName: name });
  }
  await setDoc(doc(db, 'users', cred.user.uid), {
    name,
    email,
    role,
    createdAt: serverTimestamp(),
  });
  return cred.user;
}

export async function loginEmailPassword(email: string, password: string) {
  const res = await signInWithEmailAndPassword(auth, email, password);
  return res.user;
}

export async function logout() {
  await signOut(auth);
}

export async function getUserRole(user: User): Promise<UserRole | null> {
  const snap = await getDoc(doc(db, 'users', user.uid));
  if (!snap.exists()) return null;
  const data = snap.data() as { role?: UserRole };
  return data.role ?? null;
}
