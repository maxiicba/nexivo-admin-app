export interface AppNotification {
  id: string;
  type: 'system' | 'sales' | 'stock' | 'subscription' | 'admin' | 'custom';
  title: string;
  message: string;
  category: string | null;
  severity: 'info' | 'warning' | 'error' | 'success';
  actionUrl: string | null;
  targetType: 'account' | 'role' | 'user';
  read: boolean;
  createdAt: string;
}

export interface NotificationPage {
  data: AppNotification[];
  total: number;
}
