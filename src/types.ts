export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  displayNameLower?: string;
  phoneNumber?: string;
  photoURL?: string;
  balance: number;
  planId: number;
  planStartDate?: string;
  adsWatchedToday: number;
  lastAdDate?: string;
  createdAt: string;
  withdrawalPassword?: string;
  lastWithdrawalDate?: string;
  referredBy?: string;
  gender?: 'male' | 'female';
}

export interface Notification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export interface Plan {
  id: number;
  name: string;
  deposit: number;
  dailyAds: number;
  earningPerAd: number;
  image: string;
  duration?: number; // in days
}

export interface Transaction {
  id?: string;
  userId: string;
  amount: number;
  type: 'earn' | 'withdraw' | 'deposit';
  status: 'pending' | 'completed' | 'rejected';
  method?: string;
  accountNumber?: string;
  screenshotURL?: string;
  planId?: number;
  createdAt: string;
}
