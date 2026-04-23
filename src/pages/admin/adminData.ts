export interface AdminUser {
  id: string
  name: string
  email: string
  phone: string
  country: string
  flag: string
  initials: string
  color: string
  balance: number
  totalDeposits: number
  totalWithdrawals: number
  totalProfit: number
  status: 'active' | 'suspended' | 'pending'
  kycStatus: 'verified' | 'pending' | 'rejected' | 'unsubmitted'
  plan: string
  joinDate: string
  lastSeen: string
  referrals: number
}

export interface AdminTransaction {
  id: string
  userId: string
  userName: string
  userEmail: string
  type: 'deposit' | 'withdrawal' | 'trade_win' | 'trade_loss' | 'bonus' | 'referral'
  amount: number
  status: 'completed' | 'pending' | 'rejected' | 'processing'
  method: string
  date: string
  reference: string
  note?: string
}

export const MOCK_USERS: AdminUser[] = [
  { id: 'u001', name: 'Edwin Okafor',      email: 'netdroptech@gmail.com', phone: '+234 801 234 5678', country: 'Nigeria',      flag: '🇳🇬', initials: 'EO', color: '#a78bfa', balance: 14820.50, totalDeposits: 22000, totalWithdrawals: 9500, totalProfit: 2320.50,  status: 'active',    kycStatus: 'verified',    plan: 'Premium',  joinDate: '2025-08-14', lastSeen: 'Active now',  referrals: 3  },
  { id: 'u002', name: 'Sarah Mitchell',    email: 's.mitchell@email.com',  phone: '+1 415 555 0192',  country: 'USA',           flag: '🇺🇸', initials: 'SM', color: '#60a5fa', balance: 31050.00, totalDeposits: 45000, totalWithdrawals: 18000, totalProfit: 4050.00,  status: 'active',    kycStatus: 'verified',    plan: 'Elite',    joinDate: '2025-06-02', lastSeen: '5 min ago',   referrals: 7  },
  { id: 'u003', name: 'Kwame Asante',      email: 'k.asante@protonmail.com', phone: '+233 244 567 890', country: 'Ghana',       flag: '🇬🇭', initials: 'KA', color: '#a78bfa', balance: 5320.00,  totalDeposits: 8000,  totalWithdrawals: 3200,  totalProfit: 520.00,   status: 'active',    kycStatus: 'pending',     plan: 'Standard', joinDate: '2025-11-19', lastSeen: '2 hr ago',    referrals: 1  },
  { id: 'u004', name: 'Lena Hoffmann',     email: 'lena.h@outlook.de',     phone: '+49 176 2345 6789', country: 'Germany',     flag: '🇩🇪', initials: 'LH', color: '#f59e0b', balance: 72400.00, totalDeposits: 95000, totalWithdrawals: 28000, totalProfit: 5400.00,  status: 'active',    kycStatus: 'verified',    plan: 'Elite',    joinDate: '2025-03-28', lastSeen: '1 day ago',   referrals: 12 },
  { id: 'u005', name: 'James Okonkwo',     email: 'jokw@yahoo.com',        phone: '+234 703 456 7890', country: 'Nigeria',     flag: '🇳🇬', initials: 'JO', color: '#f87171', balance: 0,        totalDeposits: 1200,  totalWithdrawals: 1200,  totalProfit: -80.00,   status: 'suspended', kycStatus: 'rejected',    plan: 'Standard', joinDate: '2025-12-05', lastSeen: '3 days ago',  referrals: 0  },
  { id: 'u006', name: 'Maria Reyes',       email: 'm.reyes@gmail.com',     phone: '+52 55 1234 5678',  country: 'Mexico',      flag: '🇲🇽', initials: 'MR', color: '#a78bfa', balance: 9800.00,  totalDeposits: 12500, totalWithdrawals: 4000,  totalProfit: 1300.00,  status: 'active',    kycStatus: 'verified',    plan: 'Premium',  joinDate: '2025-09-10', lastSeen: '4 hr ago',    referrals: 2  },
  { id: 'u007', name: 'David Chen',        email: 'd.chen@techmail.com',   phone: '+86 139 0013 8888', country: 'China',       flag: '🇨🇳', initials: 'DC', color: '#fb923c', balance: 25600.00, totalDeposits: 38000, totalWithdrawals: 15000, totalProfit: 2600.00,  status: 'active',    kycStatus: 'verified',    plan: 'Elite',    joinDate: '2025-05-17', lastSeen: '30 min ago',  referrals: 5  },
  { id: 'u008', name: 'Amina Diallo',      email: 'a.diallo@mail.sn',      phone: '+221 77 456 7890',  country: 'Senegal',     flag: '🇸🇳', initials: 'AD', color: '#e879f9', balance: 3200.00,  totalDeposits: 4500,  totalWithdrawals: 1500,  totalProfit: 200.00,   status: 'pending',   kycStatus: 'unsubmitted', plan: 'Standard', joinDate: '2026-01-20', lastSeen: '1 hr ago',    referrals: 0  },
  { id: 'u009', name: 'Raj Patel',         email: 'raj.patel@biz.in',      phone: '+91 98765 43210',   country: 'India',       flag: '🇮🇳', initials: 'RP', color: '#22d3ee', balance: 18750.00, totalDeposits: 27000, totalWithdrawals: 9500,  totalProfit: 1250.00,  status: 'active',    kycStatus: 'verified',    plan: 'Premium',  joinDate: '2025-07-04', lastSeen: '15 min ago',  referrals: 4  },
  { id: 'u010', name: 'Fatima Al-Rashid',  email: 'f.alrashid@domain.ae',  phone: '+971 50 234 5678',  country: 'UAE',         flag: '🇦🇪', initials: 'FA', color: '#a3e635', balance: 54300.00, totalDeposits: 80000, totalWithdrawals: 30000, totalProfit: 4300.00,  status: 'active',    kycStatus: 'verified',    plan: 'Elite',    joinDate: '2025-04-12', lastSeen: '2 days ago',  referrals: 9  },
  { id: 'u011', name: 'Carlos Mendoza',    email: 'c.mendoza@correo.co',   phone: '+57 310 234 5678',  country: 'Colombia',    flag: '🇨🇴', initials: 'CM', color: '#a78bfa', balance: 6700.00,  totalDeposits: 9000,  totalWithdrawals: 2800,  totalProfit: 500.00,   status: 'active',    kycStatus: 'pending',     plan: 'Standard', joinDate: '2025-10-22', lastSeen: '6 hr ago',    referrals: 1  },
  { id: 'u012', name: 'Nina Volkova',      email: 'n.volkova@mail.ru',     phone: '+7 916 234 5678',   country: 'Russia',      flag: '🇷🇺', initials: 'NV', color: '#60a5fa', balance: 11200.00, totalDeposits: 16000, totalWithdrawals: 6000,  totalProfit: 1200.00,  status: 'active',    kycStatus: 'verified',    plan: 'Premium',  joinDate: '2025-08-30', lastSeen: '3 hr ago',    referrals: 3  },
  { id: 'u013', name: 'Tariq Osman',       email: 't.osman@webmail.sd',    phone: '+249 91 234 5678',  country: 'Sudan',       flag: '🇸🇩', initials: 'TO', color: '#f59e0b', balance: 850.00,   totalDeposits: 1000,  totalWithdrawals: 200,   totalProfit: 50.00,    status: 'pending',   kycStatus: 'unsubmitted', plan: 'Standard', joinDate: '2026-02-14', lastSeen: '2 days ago',  referrals: 0  },
  { id: 'u014', name: 'Sophie Laurent',    email: 's.laurent@gmail.fr',    phone: '+33 6 12 34 56 78', country: 'France',      flag: '🇫🇷', initials: 'SL', color: '#f87171', balance: 33900.00, totalDeposits: 52000, totalWithdrawals: 21000, totalProfit: 2900.00,  status: 'active',    kycStatus: 'verified',    plan: 'Elite',    joinDate: '2025-02-19', lastSeen: '45 min ago',  referrals: 6  },
  { id: 'u015', name: 'Blessing Nwosu',    email: 'blessing.n@gmail.com',  phone: '+234 812 345 6789', country: 'Nigeria',     flag: '🇳🇬', initials: 'BN', color: '#a78bfa', balance: 4100.00,  totalDeposits: 6000,  totalWithdrawals: 2500,  totalProfit: 600.00,   status: 'active',    kycStatus: 'verified',    plan: 'Standard', joinDate: '2025-10-08', lastSeen: '1 day ago',   referrals: 2  },
  { id: 'u016', name: 'Hyun-Ji Park',      email: 'hj.park@kakao.com',     phone: '+82 10 2345 6789',  country: 'South Korea', flag: '🇰🇷', initials: 'HP', color: '#a78bfa', balance: 22100.00, totalDeposits: 31000, totalWithdrawals: 11000, totalProfit: 2100.00,  status: 'active',    kycStatus: 'verified',    plan: 'Premium',  joinDate: '2025-06-25', lastSeen: '8 hr ago',    referrals: 4  },
]

export const MOCK_TRANSACTIONS: AdminTransaction[] = [
  { id: 'tx001', userId: 'u002', userName: 'Sarah Mitchell',   userEmail: 's.mitchell@email.com', type: 'deposit',    amount: 5000,   status: 'completed',  method: 'Bank Transfer', date: '2026-03-31 14:22', reference: 'DEP-8821', },
  { id: 'tx002', userId: 'u001', userName: 'Edwin Okafor',     userEmail: 'netdroptech@gmail.com', type: 'deposit',    amount: 2000,   status: 'completed',  method: 'USDT (TRC20)', date: '2026-03-31 11:05', reference: 'DEP-8820', },
  { id: 'tx003', userId: 'u004', userName: 'Lena Hoffmann',    userEmail: 'lena.h@outlook.de',     type: 'withdrawal', amount: 3000,   status: 'pending',    method: 'Bank Transfer', date: '2026-03-31 09:48', reference: 'WTH-3312', },
  { id: 'tx004', userId: 'u009', userName: 'Raj Patel',        userEmail: 'raj.patel@biz.in',      type: 'trade_win',  amount: 820,    status: 'completed',  method: 'Platform',      date: '2026-03-31 08:30', reference: 'TRD-1190', },
  { id: 'tx005', userId: 'u007', userName: 'David Chen',       userEmail: 'd.chen@techmail.com',   type: 'deposit',    amount: 10000,  status: 'completed',  method: 'BTC',           date: '2026-03-30 22:14', reference: 'DEP-8819', },
  { id: 'tx006', userId: 'u014', userName: 'Sophie Laurent',   userEmail: 's.laurent@gmail.fr',    type: 'withdrawal', amount: 8000,   status: 'completed',  method: 'Wire Transfer', date: '2026-03-30 19:55', reference: 'WTH-3311', },
  { id: 'tx007', userId: 'u010', userName: 'Fatima Al-Rashid', userEmail: 'f.alrashid@domain.ae',  type: 'deposit',    amount: 15000,  status: 'completed',  method: 'USDC (ERC20)',  date: '2026-03-30 17:30', reference: 'DEP-8818', },
  { id: 'tx008', userId: 'u003', userName: 'Kwame Asante',     userEmail: 'k.asante@protonmail.com', type: 'trade_loss', amount: 250,  status: 'completed',  method: 'Platform',      date: '2026-03-30 15:10', reference: 'TRD-1189', },
  { id: 'tx009', userId: 'u001', userName: 'Edwin Okafor',     userEmail: 'netdroptech@gmail.com', type: 'bonus',      amount: 100,    status: 'completed',  method: 'Platform',      date: '2026-03-30 12:00', reference: 'BON-0045', note: 'Welcome bonus' },
  { id: 'tx010', userId: 'u006', userName: 'Maria Reyes',      userEmail: 'm.reyes@gmail.com',     type: 'deposit',    amount: 2500,   status: 'processing', method: 'Debit Card',    date: '2026-03-30 10:22', reference: 'DEP-8817', },
  { id: 'tx011', userId: 'u012', userName: 'Nina Volkova',     userEmail: 'n.volkova@mail.ru',     type: 'withdrawal', amount: 1500,   status: 'pending',    method: 'USDT (TRC20)',  date: '2026-03-29 20:45', reference: 'WTH-3310', },
  { id: 'tx012', userId: 'u016', userName: 'Hyun-Ji Park',     userEmail: 'hj.park@kakao.com',     type: 'trade_win',  amount: 1400,   status: 'completed',  method: 'Platform',      date: '2026-03-29 18:00', reference: 'TRD-1188', },
  { id: 'tx013', userId: 'u005', userName: 'James Okonkwo',    userEmail: 'jokw@yahoo.com',        type: 'withdrawal', amount: 1200,   status: 'rejected',   method: 'Bank Transfer', date: '2026-03-29 14:30', reference: 'WTH-3309', note: 'Account suspended' },
  { id: 'tx014', userId: 'u002', userName: 'Sarah Mitchell',   userEmail: 's.mitchell@email.com',  type: 'trade_win',  amount: 2200,   status: 'completed',  method: 'Platform',      date: '2026-03-29 11:15', reference: 'TRD-1187', },
  { id: 'tx015', userId: 'u011', userName: 'Carlos Mendoza',   userEmail: 'c.mendoza@correo.co',   type: 'deposit',    amount: 1000,   status: 'completed',  method: 'Debit Card',    date: '2026-03-28 09:00', reference: 'DEP-8816', },
  { id: 'tx016', userId: 'u015', userName: 'Blessing Nwosu',   userEmail: 'blessing.n@gmail.com',  type: 'referral',   amount: 50,     status: 'completed',  method: 'Platform',      date: '2026-03-28 08:00', reference: 'REF-0022', note: 'Referral commission' },
]
