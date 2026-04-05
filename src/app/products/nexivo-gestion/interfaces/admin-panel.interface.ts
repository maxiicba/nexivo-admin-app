export interface AdminDashboardStats {
  accounts: {
    total: number;
    active: number;
    suspended: number;
    inactive: number;
    recentRegistrations: number;
  };
  subscriptions: {
    mrr: number;
    trialing: number;
    active: number;
    pastDue: number;
    suspended: number;
    cancelled: number;
  };
  users: {
    total: number;
    activeSessions: number;
  };
  recentAccounts: RecentAccount[];
}

export interface RecentAccount {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  planName: string;
}

export interface AccountSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  mode?: 'simple' | 'full';
  created_at: string;
  owner?: { username: string; email: string; authProvider?: string };
  subscription: {
    status: string;
    planName: string;
    currentPrice: number;
    billingCycle: string;
  } | null;
}

export interface AccountDetail {
  account: any;
  subscription: any;
  usage: {
    products: number;
    clients: number;
    suppliers: number;
    users: number;
    salePoints: number;
  };
  recentSalesSummary: {
    totalSales: number;
    totalRevenue: number;
  };
  treasuryBalance: number;
  paymentHistory: any[];
}

export interface ActivityLogEntry {
  id: string;
  userId: string;
  accountId: string;
  controller: string;
  action: string;
  method: string;
  path: string;
  statusCode: number;
  ip: string;
  metadata: any;
  createdAt: string;
  user?: { username: string; email: string };
  account?: { name: string; email: string };
}

export interface ActivityLogResponse {
  data: ActivityLogEntry[];
  total: number;
}

export interface AccountNote {
  id: string;
  accountId: string;
  content: string;
  createdBy: string;
  createdByUser?: { username: string; first_name: string; last_name: string };
  createdAt: string;
  updatedAt: string;
}

export interface StoreOverview {
  accountId: string;
  name: string;
  slug: string;
  isPublished: boolean;
  logoKey: string;
  totalOrders: number;
  totalCustomers: number;
  mercadoPagoConnected: boolean;
}
