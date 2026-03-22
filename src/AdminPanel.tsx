import React, { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, query } from 'firebase/firestore';

// NOTE: You will need to fill in your actual Firebase config details here
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  firestoreDatabaseId: "(default)"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  planId: string;
  adsWatchedToday: number;
  balance: number;
}

export default function AdminPanel() {
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      setAllUsers(users);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Admin Panel</h2>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th className="p-2">User</th>
            <th className="p-2">Job</th>
            <th className="p-2">Ads Watched</th>
            <th className="p-2">Balance</th>
          </tr>
        </thead>
        <tbody>
          {allUsers.map((u) => (
            <tr key={u.uid} className="border-b">
              <td className="p-2">{u.displayName || u.email}</td>
              <td className="p-2">{u.planId || 'N/A'}</td>
              <td className="p-2">{u.adsWatchedToday}</td>
              <td className="p-2">PKR {u.balance.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
