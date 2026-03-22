import SupportChat from './components/SupportChat';
import React, { useState, useEffect, useCallback } from 'react';
import LaunchLogo from './components/LaunchLogo';
import { 
  signOut, 
  onAuthStateChanged,
  User,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  increment,
  getDocFromServer,
  getDocs
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from './firebase';
import { UserProfile, Transaction, Notification, Plan } from './types';
import { 
  Wallet, 
  Play, 
  LogOut, 
  History, 
  ArrowUpRight, 
  Coins, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  Smartphone,
  Camera,
  Bell,
  User as UserIcon,
  UserCircle,
  Lock,
  Phone,
  UserPlus,
  Briefcase,
  TrendingUp,
  Copy,
  ArrowDownLeft,
  HelpCircle,
  MessageCircle,
  Upload,
  MoreVertical,
  Settings,
  ShieldCheck,
  Users,
  Share2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PLANS = [
  { id: 1, name: "Job 1 (Free)", deposit: 0, dailyAds: 5, earningPerAd: 3.6, duration: 4, image: "https://picsum.photos/seed/free/400/200" },
  { id: 2, name: "Job 2 (Starter)", deposit: 1250, dailyAds: 6, earningPerAd: 6, duration: 90, image: "https://picsum.photos/seed/starter/400/200" },
  { id: 3, name: "Job 3 (Bronze)", deposit: 2500, dailyAds: 12, earningPerAd: 7.5, duration: 90, image: "https://picsum.photos/seed/bronze/400/200" },
  { id: 4, name: "Job 4 (Silver)", deposit: 5000, dailyAds: 25, earningPerAd: 9, duration: 90, image: "https://picsum.photos/seed/silver/400/200" },
  { id: 5, name: "Job 5 (Gold)", deposit: 10000, dailyAds: 50, earningPerAd: 10.5, duration: 90, image: "https://picsum.photos/seed/gold/400/200" },
  { id: 6, name: "Job 6 (Platinum)", deposit: 20000, dailyAds: 100, earningPerAd: 12, duration: 90, image: "https://picsum.photos/seed/platinum/400/200" },
  { id: 7, name: "Job 7 (Diamond)", deposit: 40000, dailyAds: 200, earningPerAd: 13.5, duration: 90, image: "https://picsum.photos/seed/diamond/400/200" },
  { id: 8, name: "Job 8 (Master)", deposit: 80000, dailyAds: 400, earningPerAd: 15, duration: 90, image: "https://picsum.photos/seed/master/400/200" },
  { id: 9, name: "Job 9 (Elite)", deposit: 150000, dailyAds: 750, earningPerAd: 18, duration: 90, image: "https://picsum.photos/seed/elite/400/200" },
  { id: 10, name: "Job 10 (Pro)", deposit: 300000, dailyAds: 1500, earningPerAd: 21, duration: 90, image: "https://picsum.photos/seed/pro/400/200" },
  { id: 11, name: "Job 11 (Ultimate)", deposit: 500000, dailyAds: 2500, earningPerAd: 24, duration: 90, image: "https://picsum.photos/seed/ultimate/400/200" },
];

// Error handling helper
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

export default function App() {
  const [showLaunchLogo, setShowLaunchLogo] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShowLaunchLogo(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dash' | 'withdraw' | 'history' | 'plans' | 'deposit' | 'invite' | 'settings' | 'profile' | 'withdraw-success'>('dash');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'notifications'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'notifications'));
  }, [user]);

  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, 'notifications', id), { read: true });
  };

  const [authMode, setAuthMode] = useState<'signup'>('signup');
  const [isWatching, setIsWatching] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [currentAd, setCurrentAd] = useState<string>('');
  const [currentVideo, setCurrentVideo] = useState<string>('');

  const adImages = [
    'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=800&q=80'
  ];
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [team, setTeam] = useState<UserProfile[]>([]);
  
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users_public'), where('referredBy', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teamMembers = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile));
      setTeam(teamMembers);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users_public'));
    return () => unsubscribe();
  }, [user]);
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('Easypaisa');
  const [accountNumber, setAccountNumber] = useState('');
  const [withdrawPassword, setWithdrawPassword] = useState('');
  const [newWithdrawPassword, setNewWithdrawPassword] = useState('');
  const [confirmNewWithdrawPassword, setConfirmNewWithdrawPassword] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositScreenshot, setDepositScreenshot] = useState<File | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editPhone, setEditPhone] = useState('');

  // Auto 3-hour notification
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        title: 'Reminder',
        message: 'Time to watch ads and earn!',
        type: 'info',
        read: false,
        createdAt: new Date().toISOString(),
      });
    }, 10800000); // 3 hours
    return () => clearInterval(interval);
  }, [user]);

  // Test connection
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDoc = doc(db, 'users', firebaseUser.uid);
        try {
          const docSnap = await getDoc(userDoc);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // This part handles Google login or first time custom login
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'User',
              balance: 0,
              planId: 1,
              planStartDate: new Date().toISOString(),
              adsWatchedToday: 0,
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDoc, newProfile);
            setProfile(newProfile);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Real-time Profile & Transactions
  useEffect(() => {
    if (!user) return;

    const profileUnsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        setProfile(doc.data() as UserProfile);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`));

    const transQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const transUnsub = onSnapshot(transQuery, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      setTransactions(docs);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'transactions'));

    return () => {
      profileUnsub();
      transUnsub();
    };
  }, [user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (authPassword !== authConfirmPassword) {
        throw new Error("Passwords do not match!");
      }
      if (authPhone.length < 10) {
        throw new Error("Invalid phone number!");
      }

      // Check if phone number already exists
      const phoneQuery = query(collection(db, 'users'), where('phoneNumber', '==', authPhone.trim()));
      const phoneSnap = await getDocs(phoneQuery);
      if (!phoneSnap.empty) {
        throw new Error("This Phone Number is already registered.");
      }

      // Check if name already exists (case-insensitive)
      const nameQuery = query(collection(db, 'users'), where('displayNameLower', '==', authName.trim().toLowerCase()));
      const nameSnap = await getDocs(nameQuery);
      if (!nameSnap.empty) {
        throw new Error("This Name is already taken. Please choose another.");
      }

      // Use phone number as a unique email for Firebase Auth
      const email = `${authPhone.trim()}@watchandearn.com`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, authPassword);
      
      await updateProfile(userCredential.user, { displayName: authName.trim() });

      const newProfile: UserProfile = {
        uid: userCredential.user.uid,
        email: email,
        displayName: authName.trim(),
        displayNameLower: authName.trim().toLowerCase(),
        phoneNumber: authPhone.trim(),
        balance: 0,
        planId: 1,
        planStartDate: new Date().toISOString(),
        adsWatchedToday: 0,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', userCredential.user.uid), newProfile);
      await setDoc(doc(db, 'users_public', userCredential.user.uid), {
        uid: newProfile.uid,
        displayName: newProfile.displayName,
        photoURL: null,
        referredBy: newProfile.referredBy || null,
      });
      
      // Welcome notification
      await addDoc(collection(db, 'notifications'), {
        userId: userCredential.user.uid,
        title: 'Welcome!',
        message: 'Welcome on WATCH& EARN website 🥰🥰🥰',
        type: 'info',
        read: false,
        createdAt: new Date().toISOString(),
      });
      
      setProfile(newProfile);
      setSuccess("Account created successfully!");
      setView('dash');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => signOut(auth);

  const handleUpdatePhone = async () => {
    if (!user || !editPhone) return;
    try {
      setLoading(true);
      await updateDoc(doc(db, 'users', user.uid), {
        phoneNumber: editPhone.trim()
      });
      setSuccess("Phone number updated!");
      setIsEditingPhone(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to update phone number");
    } finally {
      setLoading(false);
    }
  };

  const startAd = useCallback(() => {
    if (isWatching || !profile) return;

    const plan = PLANS.find(p => p.id === profile.planId) || PLANS[0];
    
    // Check for plan expiration
    if (plan.duration && profile.planStartDate) {
      const startDate = new Date(profile.planStartDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > plan.duration) {
        setError(`Your ${plan.name} has expired. Please upgrade to continue earning.`);
        setTimeout(() => setError(null), 3000);
        return;
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const lastAdDate = profile.lastAdDate?.split('T')[0];

    let watchedToday = profile.adsWatchedToday;
    if (lastAdDate !== today) {
      watchedToday = 0;
    }

    if (watchedToday >= plan.dailyAds) {
      setError(`Daily limit reached for ${plan.name}. Upgrade your plan for more ads!`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Check 4-day limit for Job 1 (Free Plan)
    if (plan.id === 1 && profile.planStartDate) {
      const startDate = new Date(profile.planStartDate).getTime();
      const now = new Date().getTime();
      const fourDays = 4 * 24 * 60 * 60 * 1000;
      if (now - startDate > fourDays) {
        setError("Your free trial has expired. Please upgrade to continue earning.");
        setView('plans');
        setTimeout(() => setError(null), 3000);
        return;
      }
    }

    const videoAds = [
      'https://www.w3schools.com/html/mov_bbb.mp4',
      'https://www.w3schools.com/html/movie.mp4'
    ];
    setCurrentAd(adImages[Math.floor(Math.random() * adImages.length)]);
    setCurrentVideo(videoAds[Math.floor(Math.random() * videoAds.length)]);
    setIsWatching(true);
    setTimeLeft(10);
    
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [isWatching, profile]);

  const finishAd = async () => {
    if (!user || !profile) return;
    
    const plan = PLANS.find(p => p.id === profile.planId) || PLANS[0];
    const today = new Date().toISOString().split('T')[0];
    const lastAdDate = profile.lastAdDate?.split('T')[0];

    let watchedToday = profile.adsWatchedToday;
    if (lastAdDate !== today) {
      watchedToday = 0;
    }

    if (watchedToday >= plan.dailyAds) {
      setError(`Daily limit reached for ${plan.name}. Upgrade your plan for more ads!`);
      setTimeout(() => setError(null), 3000);
      setIsWatching(false);
      setCurrentAd('');
      setCurrentVideo('');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        balance: increment(plan.earningPerAd),
        adsWatchedToday: watchedToday + 1,
        lastAdDate: new Date().toISOString()
      });

      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        amount: plan.earningPerAd,
        type: 'earn',
        status: 'completed',
        createdAt: new Date().toISOString()
      });

      setIsWatching(false);
      setCurrentAd('');
      setCurrentVideo('');
      setSuccess(`PKR ${plan.earningPerAd} earned successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'transactions');
      setIsWatching(false);
    }
  };

  const buyPlan = async (planId: number) => {
    if (!user || !profile) return;
    const plan = PLANS.find(p => p.id === planId);
    if (!plan) return;

    if (profile.balance < plan.deposit) {
      setError(`Insufficient balance to buy ${plan.name}. Please earn more or deposit.`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      setLoading(true);
      await updateDoc(doc(db, 'users', user.uid), {
        balance: increment(-plan.deposit),
        planId: plan.id,
        planStartDate: new Date().toISOString(),
        adsWatchedToday: 0 // Reset ads for the new plan
      });

      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        amount: plan.deposit,
        type: 'withdraw', // Using withdraw type for plan purchase for now
        status: 'completed',
        method: 'Plan Purchase',
        accountNumber: plan.name,
        createdAt: new Date().toISOString()
      });

      setSuccess(`${plan.name} activated successfully!`);
      setView('dash');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'users');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 216) {
      setError("Minimum withdrawal is PKR 216");
      return;
    }
    if (amount > profile.balance) {
      setError("Insufficient balance");
      return;
    }
    if (!accountNumber) {
      setError("Please enter account number");
      return;
    }
    if (profile.withdrawalPassword && withdrawPassword !== profile.withdrawalPassword) {
      setError("Incorrect withdrawal password");
      return;
    }
    if (!profile.withdrawalPassword) {
      setError("Please set a withdrawal password in settings first");
      return;
    }

    const now = new Date();
    const day = now.getDay(); // 0 is Sunday
    const hour = now.getHours();

    if (day !== 0) {
      setError("Withdrawals are only allowed on Sundays");
      return;
    }
    if (hour < 6 || hour >= 20) {
      setError("Withdrawals are only allowed between 6:00 AM and 8:00 PM");
      return;
    }

    try {
      setLoading(true);
      await updateDoc(doc(db, 'users', user.uid), {
        balance: increment(-amount)
      });

      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        amount: amount,
        type: 'withdraw',
        status: 'pending',
        method: withdrawMethod,
        accountNumber: accountNumber,
        createdAt: new Date().toISOString()
      });

      setSuccess("Withdrawal request sent! Wait 24h.");
      setWithdrawAmount('');
      setAccountNumber('');
      setView('withdraw-success');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount < 1270) {
      setError("Minimum deposit amount is 1270 PKR");
      return;
    }
    if (!depositScreenshot) {
      setError("Please upload payment screenshot");
      return;
    }

    setLoading(true);
    try {
      // Upload screenshot
      const storageRef = ref(storage, `deposits/${user.uid}_${Date.now()}`);
      await uploadBytes(storageRef, depositScreenshot);
      const screenshotURL = await getDownloadURL(storageRef);

      // SECURITY WARNING: This automatically credits the user's balance upon screenshot upload.
      // This is highly insecure as users can upload fake screenshots to gain balance.
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        amount: amount,
        type: 'deposit',
        status: 'completed',
        method: 'JazzCash',
        screenshotURL: screenshotURL,
        planId: selectedPlan?.id || null,
        createdAt: new Date().toISOString()
      });

      await updateDoc(doc(db, 'users', user.uid), {
        balance: increment(amount)
      });

      setSuccess("Deposit successful! Your balance has been updated.");
      setDepositAmount('');
      setDepositScreenshot(null);
      setSelectedPlan(null);
      setView('dash');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to submit deposit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showLaunchLogo && <LaunchLogo />}
      </AnimatePresence>
      <div className="min-h-screen bg-[#064e3b] pb-24 transition-colors duration-300">
      <header className="bg-white border-b border-emerald-100 sticky top-0 z-10 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">W</div>
            <span className="font-bold text-emerald-900 text-md">WATCH & EARN</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                <UserIcon className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <div>
              <h2 className="font-bold text-stone-900 leading-tight">{profile?.displayName || 'User'}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 bg-emerald-50 rounded-xl text-emerald-600">
              <Bell className="w-6 h-6" />
              {notifications.filter(n => !n.read).length > 0 && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  isMenuOpen ? "bg-emerald-50 text-emerald-600" : "text-stone-400 hover:text-emerald-600"
                )}
              >
                <motion.div
                  animate={{ rotate: isMenuOpen ? 90 : 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <MoreVertical className="w-6 h-6" />
                </motion.div>
              </button>
              {isMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute top-12 right-0 w-48 bg-white rounded-2xl shadow-xl border border-emerald-100 p-2 z-50"
                >
                  <button onClick={() => { setView('profile'); setIsMenuOpen(false); }} className="w-full text-left p-2 rounded-xl hover:bg-emerald-50 text-stone-700">Profile</button>
                  {user && (
                    <button onClick={() => { signOut(auth); setIsMenuOpen(false); }} className="w-full text-left p-2 rounded-xl hover:bg-red-50 text-red-600">Logout</button>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
        {showNotifications && (
          <div className="absolute top-20 right-4 w-80 bg-white rounded-2xl shadow-xl border border-emerald-100 p-4 z-20">
            <h3 className="font-bold text-stone-900 mb-4">Notifications</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {notifications.length === 0 && <p className="text-sm text-stone-500">No notifications</p>}
              {notifications.map((n, i) => (
                <div key={n.id || i} className={cn("p-3 rounded-xl border", n.read ? "bg-stone-50 border-stone-100" : "bg-emerald-50 border-emerald-100")}>
                  <p className="font-bold text-sm text-stone-900">{n.title}</p>
                  <p className="text-xs text-stone-600">{n.message}</p>
                  {!n.read && <button onClick={() => markAsRead(n.id!)} className="text-xs text-emerald-600 font-bold mt-2">Mark as read</button>}
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6">
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-xs font-bold uppercase tracking-wider">Close</button>
            </motion.div>
          )}
          {success && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-4 rounded-2xl flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {view === 'profile' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-white rounded-[2rem] p-8 shadow-xl border border-emerald-100"
          >
            <div className="flex flex-col items-center mb-8">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-lg">
                <UserCircle className="w-16 h-16 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-stone-900">{profile?.displayName || 'User'}</h2>
              <p className="text-stone-500">{user?.email || 'N/A'}</p>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-stone-50 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <Phone className="w-5 h-5 text-emerald-600" />
                    <p className="text-xs text-stone-500">Phone Number</p>
                  </div>
                  <button 
                    onClick={() => {
                      if (isEditingPhone) {
                        handleUpdatePhone();
                      } else {
                        setEditPhone(profile?.phoneNumber || '');
                        setIsEditingPhone(true);
                      }
                    }}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    {isEditingPhone ? 'Save' : 'Edit'}
                  </button>
                </div>
                {isEditingPhone ? (
                  <input 
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-white border border-emerald-100 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Enter phone number"
                  />
                ) : (
                  <p className="font-bold text-stone-900 ml-9">{profile?.phoneNumber || 'Not set'}</p>
                )}
              </div>
              <div className="p-4 bg-stone-50 rounded-2xl flex items-center gap-4">
                <UserCircle className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="text-xs text-stone-500">Plan</p>
                  <p className="font-bold text-emerald-600">{PLANS.find(p => p.id === profile?.planId)?.name || 'No Plan'}</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => signOut(auth)}
              className="w-full mt-8 flex items-center justify-center gap-2 bg-red-50 text-red-600 font-bold py-4 rounded-2xl hover:bg-red-100 transition-all"
            >
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </motion.div>
        )}

        {view === 'dash' && (
          <>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-stone-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-stone-900/20"
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-stone-400 text-sm font-medium">Total Earning</p>
                  <div className={cn(
                    "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider border",
                    (() => {
                      const plan = PLANS.find(p => p.id === profile?.planId) || PLANS[0];
                      if (plan.duration && profile?.planStartDate) {
                        const startDate = new Date(profile.planStartDate);
                        const now = new Date();
                        const diffTime = Math.abs(now.getTime() - startDate.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        if (diffDays > plan.duration) return "bg-red-500/20 text-red-400 border-red-500/30";
                      }
                      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
                    })()
                  )}>
                    {(() => {
                      const plan = PLANS.find(p => p.id === profile?.planId) || PLANS[0];
                      if (plan.duration && profile?.planStartDate) {
                        const startDate = new Date(profile.planStartDate);
                        const now = new Date();
                        const diffTime = Math.abs(now.getTime() - startDate.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        if (diffDays > plan.duration) return `${plan.name} (Expired)`;
                      }
                      return plan.name;
                    })()}
                  </div>
                </div>
                <h1 className="text-4xl font-bold tracking-tight">PKR {profile?.balance?.toFixed(2) || '0.00'}</h1>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <button 
                    onClick={() => setView('deposit')}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20 group-active:scale-95 transition-all">
                      <ArrowDownLeft className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-bold text-stone-300">Deposit</span>
                  </button>
                  <button 
                    onClick={() => setView('withdraw')}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-white/5 group-active:scale-95 transition-all">
                      <Wallet className="w-6 h-6 text-stone-900" />
                    </div>
                    <span className="text-xs font-bold text-stone-300">Withdraw</span>
                  </button>
                  <button 
                    onClick={() => setView('history')}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className="w-14 h-14 bg-stone-800 rounded-2xl flex items-center justify-center shadow-lg shadow-black/20 group-active:scale-95 transition-all">
                      <History className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-bold text-stone-300">History</span>
                  </button>
                </div>
              </div>
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl" />
              <div className="absolute -left-8 -top-8 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />
            </motion.div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-4 gap-4 px-1">
              {[
                { icon: Users, label: 'Team', view: 'team' },
                { icon: Share2, label: 'Invite', view: 'invite' },
                { icon: ShieldCheck, label: 'Jobs', view: 'plans' },
                { icon: HelpCircle, label: 'Help', view: 'faq' },
                { icon: Settings, label: 'Settings', view: 'settings' },
              ].map((item, i) => (
                <button 
                  key={i}
                  onClick={() => setView(item.view as any)}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-12 h-12 bg-white rounded-xl border border-emerald-100 flex items-center justify-center shadow-sm group-hover:bg-emerald-50 transition-colors">
                    <item.icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="font-bold text-stone-900">Daily Tasks</h3>
                {profile && (
                  <p className="text-xs font-bold text-emerald-600">
                    {(() => {
                      const plan = PLANS.find(p => p.id === profile.planId) || PLANS[0];
                      const today = new Date().toISOString().split('T')[0];
                      const lastAdDate = profile.lastAdDate?.split('T')[0];
                      const watched = lastAdDate === today ? profile.adsWatchedToday : 0;
                      return `${watched}/${plan.dailyAds} Ads Watched`;
                    })()}
                  </p>
                )}
              </div>
              <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm">
                <div className={cn(
                  "aspect-video rounded-2xl flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500",
                  isWatching ? "bg-stone-900" : "bg-emerald-50 border-2 border-dashed border-emerald-100"
                )}>
                  {isWatching ? (
                    <>
                      <video 
                        src={currentVideo} 
                        autoPlay
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-[2px]" />
                      
                      {/* Circular Progress Bar around the ad */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <svg className="w-full h-full -rotate-90 p-4">
                          <circle
                            cx="50%" cy="50%" r="45%"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            className="text-stone-700/50"
                          />
                          <circle
                            cx="50%" cy="50%" r="45%"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            strokeDasharray="283"
                            strokeDashoffset={283 - (283 * timeLeft) / 10}
                            className="text-emerald-500 transition-all duration-1000 linear"
                          />
                        </svg>
                      </div>

                      <div className="text-center space-y-2 relative z-10 bg-stone-900/80 p-4 rounded-full w-20 h-20 flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">{timeLeft}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-emerald-50 flex items-center justify-center">
                        <div className="text-center p-6">
                          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-emerald-100">
                            <Play className="w-8 h-8 text-emerald-500" />
                          </div>
                          <p className="text-emerald-800 font-bold text-lg">Ready to Earn?</p>
                          <p className="text-emerald-600/60 text-xs font-medium">Watch a short ad to get PKR {PLANS.find(p => p.id === profile?.planId)?.earningPerAd || 60}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <button 
                  onClick={isWatching && timeLeft === 0 ? finishAd : startAd}
                  disabled={isWatching && timeLeft > 0}
                  className={cn(
                    "w-full mt-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2",
                    isWatching && timeLeft > 0
                      ? "bg-emerald-50 text-emerald-300 cursor-not-allowed" 
                      : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
                  )}
                >
                  {isWatching && timeLeft > 0 ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Watching... {timeLeft}
                    </>
                  ) : isWatching && timeLeft === 0 ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Submit Task
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Watch Ad & Earn PKR {PLANS.find(p => p.id === profile?.planId)?.earningPerAd || 60}
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {view === 'deposit' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <button onClick={() => setView('plans')} className="p-2 bg-white rounded-xl border border-emerald-100">
                <ArrowUpRight className="w-5 h-5 rotate-225" />
              </button>
              <h2 className="text-xl font-bold text-stone-900">Deposit Money {selectedPlan ? `for ${selectedPlan.name}` : ''}</h2>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-6">
              <div className="bg-emerald-900 p-6 rounded-2xl border border-emerald-800 text-center">
                <p className="text-xs text-emerald-200 font-bold uppercase tracking-widest mb-2">JazzCash Account</p>
                <h3 className="text-xl font-bold text-white mb-1">MUHAMMAD FAQEER</h3>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-2xl font-bold text-emerald-300">03060736332</p>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText('03060736332');
                      setSuccess("Number copied!");
                      setTimeout(() => setSuccess(null), 2000);
                    }}
                    className="p-2 bg-emerald-800 rounded-lg border border-emerald-700 text-emerald-200 hover:bg-emerald-700"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-emerald-400 mt-4 font-medium italic">Send payment only to this account</p>
              </div>

              <form onSubmit={handleDeposit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700 ml-1">Amount to Deposit</label>
                  <input 
                    type="number" 
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-stone-700 ml-1">Payment Screenshot</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      onChange={(e) => setDepositScreenshot(e.target.files?.[0] || null)}
                      accept="image/*"
                      className="hidden"
                      id="screenshot-upload"
                    />
                    <label 
                      htmlFor="screenshot-upload"
                      className="w-full bg-emerald-50/50 border-2 border-dashed border-emerald-100 rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-emerald-50 transition-all"
                    >
                      {depositScreenshot ? (
                        <>
                          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                          <p className="text-sm font-bold text-emerald-700">{depositScreenshot.name}</p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-emerald-300" />
                          <p className="text-sm font-bold text-emerald-400">Click to upload screenshot</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Submit"}
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {view === 'invite' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <button onClick={() => setView('dash')} className="p-2 bg-white rounded-xl border border-emerald-100">
                <ArrowUpRight className="w-5 h-5 rotate-225" />
              </button>
              <h2 className="text-xl font-bold text-stone-900">Invite Friends</h2>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-6">
              <div className="text-center space-y-2">
                <h3 className="text-2xl font-bold text-stone-900">Earn Together!</h3>
                <p className="text-stone-500 text-sm">Invite friends and earn rewards for every new user who joins.</p>
              </div>

              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 text-center">
                <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest mb-2">Your Invite Link</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-lg font-bold text-emerald-700 truncate">{window.location.origin}/?ref={user?.uid}</p>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/?ref=${user?.uid}`);
                      setSuccess("Link copied!");
                      setTimeout(() => setSuccess(null), 2000);
                    }}
                    className="p-2 bg-white rounded-lg border border-emerald-100 text-emerald-600 hover:bg-emerald-50"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => window.open(`https://wa.me/?text=Join me on this app! ${window.location.origin}/?ref=${user?.uid}`, '_blank')}
                  className="flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-xl font-bold"
                >
                  <MessageCircle className="w-5 h-5" /> WhatsApp
                </button>
                <button 
                  onClick={() => window.open(`https://www.tiktok.com/share?url=${window.location.origin}/?ref=${user?.uid}`, '_blank')}
                  className="flex items-center justify-center gap-2 py-3 bg-stone-900 text-white rounded-xl font-bold"
                >
                  <Share2 className="w-5 h-5" /> TikTok
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'team' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <button onClick={() => setView('dash')} className="p-2 bg-white rounded-xl border border-emerald-100">
                <ArrowUpRight className="w-5 h-5 rotate-225" />
              </button>
              <h2 className="text-xl font-bold text-stone-900">My Team</h2>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-6">
              {team.length === 0 ? (
                <div className="text-center py-12 text-stone-400">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>No team members yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {team.map((member) => (
                    <div key={member.uid} className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center font-bold text-emerald-700">
                          {member.gender === 'female' ? <UserCircle className="w-6 h-6" /> : <UserIcon className="w-6 h-6" />}
                        </div>
                        <div>
                          <p className="font-bold text-stone-900">{member.displayName}</p>
                          <p className="text-xs text-stone-500">{member.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">PKR {member.balance.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {view === 'faq' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <button onClick={() => setView('dash')} className="p-2 bg-white rounded-xl border border-emerald-100">
                <ArrowUpRight className="w-5 h-5 rotate-225" />
              </button>
              <h2 className="text-xl font-bold text-stone-900">FAQ & Help</h2>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-6">
              {[
                { q: "How do I earn?", a: "Watch ads daily based on your plan." },
                { q: "How to withdraw?", a: "Withdrawals are available on Sundays between 6 AM and 8 PM." },
                { q: "What are the plans?", a: "We have various plans with different daily ad limits and earnings." },
                { q: "Platform rules?", a: "Follow all instructions and do not use bots." }
              ].map((faq, i) => (
                <div key={i} className="border-b border-stone-100 pb-4">
                  <h4 className="font-bold text-stone-900">{faq.q}</h4>
                  <p className="text-stone-500 text-sm">{faq.a}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {view === 'settings' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <button onClick={() => setView('dash')} className="p-2 bg-white rounded-xl border border-emerald-100">
                <ArrowUpRight className="w-5 h-5 rotate-225" />
              </button>
              <h2 className="text-xl font-bold text-stone-900">Settings</h2>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-6">
              <div className="space-y-4 pt-6 border-t border-emerald-100">
                <h3 className="text-lg font-bold text-stone-900">Withdrawal Password</h3>
                <input 
                  type="password" 
                  value={newWithdrawPassword}
                  onChange={(e) => setNewWithdrawPassword(e.target.value)}
                  placeholder="New Password"
                  className="w-full bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
                <input 
                  type="password" 
                  value={confirmNewWithdrawPassword}
                  onChange={(e) => setConfirmNewWithdrawPassword(e.target.value)}
                  placeholder="Confirm New Password"
                  className="w-full bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
                <button
                  onClick={async () => {
                    if (newWithdrawPassword !== confirmNewWithdrawPassword) {
                      setError("Passwords do not match");
                      return;
                    }
                    if (!newWithdrawPassword) {
                      setError("Password cannot be empty");
                      return;
                    }
                    try {
                      await updateDoc(doc(db, 'users', user!.uid), {
                        withdrawalPassword: newWithdrawPassword
                      });
                      setSuccess("Withdrawal password updated!");
                      setNewWithdrawPassword('');
                      setConfirmNewWithdrawPassword('');
                      setTimeout(() => setSuccess(null), 3000);
                    } catch (err) {
                      setError("Failed to update password");
                    }
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl transition-all"
                >
                  {profile?.withdrawalPassword ? "Update Password" : "Set Password"}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'withdraw' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <button onClick={() => setView('dash')} className="p-2 bg-white rounded-xl border border-emerald-100">
                <ArrowUpRight className="w-5 h-5 rotate-225" />
              </button>
              <h2 className="text-xl font-bold text-stone-900">Withdraw Money</h2>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 text-emerald-800 text-sm space-y-2">
              <p className="font-bold">Withdrawal Rules:</p>
              <ul className="list-disc list-inside space-y-1 text-emerald-700">
                <li>Withdrawals are only allowed on <strong>Sundays</strong>.</li>
                <li>Withdrawal time: <strong>6:00 AM to 8:00 PM</strong>.</li>
                <li>Withdrawals are received within <strong>30 minutes</strong>.</li>
              </ul>
            </div>

            <form onSubmit={handleWithdraw} className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm space-y-4">
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <p className="text-xs text-emerald-600 mb-1">Available Balance</p>
                <p className="text-2xl font-bold text-stone-900">PKR {profile?.balance.toFixed(2)}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700 ml-1">Payment Method</label>
                <div className="grid grid-cols-2 gap-3">
                  {['Easypaisa', 'JazzCash'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setWithdrawMethod(m)}
                      className={cn(
                        "py-3 rounded-xl font-bold border transition-all flex items-center justify-center gap-2",
                        withdrawMethod === m 
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                          : "bg-white border-emerald-100 text-emerald-400"
                      )}
                    >
                      <Smartphone className="w-4 h-4" />
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700 ml-1">Amount (Min 216)</label>
                <input 
                  type="number" 
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="e.g. 216"
                  className="w-full bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700 ml-1">Account Number</label>
                <input 
                  type="text" 
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="03xx xxxxxxx"
                  className="w-full bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-stone-700 ml-1">Withdrawal Password</label>
                <input 
                  type="password" 
                  value={withdrawPassword}
                  onChange={(e) => setWithdrawPassword(e.target.value)}
                  placeholder="Enter your withdrawal password"
                  className="w-full bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Submit"}
              </button>
            </form>
          </motion.div>
        )}

        {view === 'withdraw-success' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2rem] p-8 shadow-xl border border-emerald-100 text-center space-y-6"
          >
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-stone-900">Withdrawal Accepted</h2>
              <p className="text-stone-500">Your withdrawal request has been received and is being processed.</p>
            </div>
            <button 
              onClick={() => setView('dash')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition-all"
            >
              Back to Dashboard
            </button>
          </motion.div>
        )}

        {view === 'plans' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <button onClick={() => setView('dash')} className="p-2 bg-white rounded-xl border border-emerald-100">
                <ArrowUpRight className="w-5 h-5 rotate-225" />
              </button>
              <h2 className="text-xl font-bold text-stone-900">Earning Jobs</h2>
            </div>

            <div className="grid gap-6">
              {PLANS.map((p, index) => (
                <motion.div 
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className={cn(
                    "bg-emerald-50/80 rounded-[2rem] border transition-all relative overflow-hidden group",
                    profile?.planId === p.id ? "border-emerald-500 shadow-xl shadow-emerald-500/10" : "border-emerald-100 shadow-md"
                  )}
                >
                  <div className="h-32 w-full overflow-hidden relative">
                    <img 
                      src={p.image} 
                      alt={p.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    {profile?.planId === p.id && (
                      <div className={cn(
                        "absolute top-4 right-4 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-lg",
                        (() => {
                          if (p.duration && profile?.planStartDate) {
                            const startDate = new Date(profile.planStartDate);
                            const now = new Date();
                            const diffTime = Math.abs(now.getTime() - startDate.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            if (diffDays > p.duration) return "bg-red-500";
                          }
                          return "bg-emerald-500";
                        })()
                      )}>
                        {(() => {
                          if (p.duration && profile?.planStartDate) {
                            const startDate = new Date(profile.planStartDate);
                            const now = new Date();
                            const diffTime = Math.abs(now.getTime() - startDate.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            if (diffDays > p.duration) return "Expired";
                          }
                          return "Active";
                        })()}
                      </div>
                    )}
                    <div className="absolute bottom-4 left-6">
                      <h4 className="font-bold text-white text-lg flex items-center gap-2">
                        {p.name}
                        {profile?.planId === p.id && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </h4>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex justify-between items-end mb-6">
                      <div className="space-y-1">
                        <p className="text-xs text-stone-400 font-medium">Daily Earning</p>
                        <p className="text-xl font-bold text-emerald-600">PKR {p.dailyAds * p.earningPerAd}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                            {p.dailyAds} Ads/Day
                          </span>
                          {p.duration && (
                            <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                              {p.duration} Days
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-stone-400 uppercase font-bold tracking-widest mb-1">Deposit</p>
                        <p className="text-2xl font-black text-stone-900">PKR {p.deposit}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => { setSelectedPlan(p); setView('deposit'); }}
                      disabled={profile?.planId === p.id || loading}
                      className={cn(
                        "w-full py-4 rounded-2xl font-bold transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg",
                        profile?.planId === p.id 
                          ? "bg-emerald-50 text-emerald-400 cursor-not-allowed" 
                          : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20"
                      )}
                    >
                      {profile?.planId === p.id ? "Current Plan" : (p.deposit === 0 ? "Activate Free Plan" : `Buy for PKR ${p.deposit}`)}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        {view === 'history' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <button onClick={() => setView('dash')} className="p-2 bg-white rounded-xl border border-emerald-100">
                <ArrowUpRight className="w-5 h-5 rotate-225" />
              </button>
              <h2 className="text-xl font-bold text-stone-900">Transaction History</h2>
            </div>

            <div className="space-y-3">
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-emerald-200">
                  <History className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>No transactions yet</p>
                </div>
              ) : (
                transactions.map((t, i) => (
                  <div key={t.id || i} className="bg-white p-4 rounded-2xl border border-emerald-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        t.type === 'earn' ? "bg-emerald-50 text-emerald-600" : 
                        t.type === 'deposit' ? "bg-blue-50 text-blue-600" : "bg-orange-50 text-orange-600"
                      )}>
                        {t.type === 'earn' ? <Coins className="w-5 h-5" /> : 
                         t.type === 'deposit' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-stone-900 capitalize">{t.type}</p>
                        <p className="text-xs text-stone-400">{new Date(t.createdAt).toLocaleDateString()}</p>
                        {t.screenshotURL && (
                          <a 
                            href={t.screenshotURL} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] text-emerald-600 font-bold hover:underline block mt-1"
                          >
                            View Screenshot
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "font-bold",
                        t.type === 'earn' || t.type === 'deposit' ? "text-emerald-600" : "text-stone-900"
                      )}>
                        {t.type === 'earn' || t.type === 'deposit' ? '+' : '-'} PKR {t.amount}
                      </p>
                      <p className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        t.status === 'completed' ? "text-emerald-500" : 
                        t.status === 'rejected' ? "text-red-500" : "text-orange-500"
                      )}>
                        {t.status}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </main>

      <SupportChat />

      <nav className="fixed bottom-0 left-0 right-0 bg-black backdrop-blur-md border-t border-white/10 px-6 py-3 z-40">
        <div className="max-w-md mx-auto flex justify-around items-center">
          <button 
            onClick={() => setView('dash')}
            className={cn(
              "p-2 rounded-2xl transition-all flex flex-col items-center gap-1",
              view === 'dash' ? "text-emerald-400" : "text-stone-500"
            )}
          >
            <Play className="w-6 h-6" />
            <span className="text-[10px] font-medium">Earn</span>
          </button>
          <button 
            onClick={() => setView('plans')}
            className={cn(
              "p-2 rounded-2xl transition-all flex flex-col items-center gap-1",
              view === 'plans' ? "text-emerald-400" : "text-stone-500"
            )}
          >
            <Briefcase className="w-6 h-6" />
            <span className="text-[10px] font-medium">Plans</span>
          </button>
          <button 
            onClick={() => setView('deposit')}
            className={cn(
              "p-2 rounded-2xl transition-all flex flex-col items-center gap-1",
              view === 'deposit' ? "text-emerald-400" : "text-stone-500"
            )}
          >
            <ArrowDownLeft className="w-6 h-6" />
            <span className="text-[10px] font-medium">Deposit</span>
          </button>
          <button 
            onClick={() => setView('withdraw')}
            className={cn(
              "p-2 rounded-2xl transition-all flex flex-col items-center gap-1",
              view === 'withdraw' ? "text-emerald-400" : "text-stone-500"
            )}
          >
            <Wallet className="w-6 h-6" />
            <span className="text-[10px] font-medium">Withdraw</span>
          </button>
          <button 
            onClick={() => setView('history')}
            className={cn(
              "p-2 rounded-2xl transition-all flex flex-col items-center gap-1",
              view === 'history' ? "text-emerald-400" : "text-stone-500"
            )}
          >
            <History className="w-6 h-6" />
            <span className="text-[10px] font-medium">History</span>
          </button>
        </div>
      </nav>
      </div>
    </>
  );
}
