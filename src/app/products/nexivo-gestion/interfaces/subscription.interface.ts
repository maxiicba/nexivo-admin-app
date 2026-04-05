export interface Plan {
  id: string;
  name: string;
  displayName: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  maxSalePoints: number;
  maxUsers: number;
  maxProducts?: number;
  maxClients?: number;
  maxSuppliers?: number;
  maxMonthlySales?: number;
  hasOnlineStore?: boolean;
  hasWhatsapp?: boolean;
  hasAdvancedReports?: boolean;
  hasCompras?: boolean;
  hasGastos?: boolean;
  hasAiDescriptions?: boolean;
  maxAiDescriptionsDaily?: number;
  maxAiDescriptionsMonthly?: number;
  hasAiImageAnalysis?: boolean;
  maxMonthlyAiAnalysis?: number;
  maxDailyAiAnalysis?: number;
  hasGranularPermissions?: boolean;
  hasWhatsappAlerts?: boolean;
  hasPayroll?: boolean;
  hasTreasury?: boolean;
  hasAiSearch?: boolean;
  hasStockTransfers?: boolean;
  hasModuleManagement?: boolean;
  hasWarehouse?: boolean;
  hasVisualEditor?: boolean;
  hasMarketing?: boolean;
  marketingAiDailyLimit?: number;
  marketingAiMonthlyLimit?: number;
  hasChatBot?: boolean;
  hasSupportAgent?: boolean;
  hasMercadoPago?: boolean;
  hasInvoiceFlexibility?: boolean;
  hasPaymentMethodFees?: boolean;
  maxChatBotQueriesDaily?: number;
  maxChatBotQueriesMonthly?: number;
  maxDailyDocumentScan?: number;
  maxMonthlyDocumentScan?: number;
  hasTrialPeriod?: boolean;
  trialDays?: number;
  accountMode?: 'simple' | 'full';
  isActive: boolean;
  isRecommended?: boolean;
  sortOrder: number;
}

export interface PlanUsage {
  products: { current: number; limit: number };
  clients: { current: number; limit: number };
  suppliers: { current: number; limit: number };
  salePoints: { current: number; limit: number };
  users: { current: number; limit: number };
  monthlySales: { current: number; limit: number };
}

export interface Subscription {
  id: string;
  account: { id: string; name: string; email: string; status: string };
  plan: Plan;
  billingCycle: 'monthly' | 'annual';
  currentPrice: number;
  status: 'trialing' | 'active' | 'past_due' | 'suspended' | 'cancelled';
  startDate: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt: string | null;
  freeMonths: number;
  cancelledAt: string | null;
  cancellationReason: string | null;
  payments: any[];
  mercadoPagoPreapprovalId?: string;
  mercadoPagoSubscriptionStatus?: string;
}

export interface MpAutoSubscriptionResult {
  id: string;
  init_point: string;
  status: string;
}

export interface PaymentStats {
  pending: { count: number; totalAmount: number };
  completed: { count: number; totalAmount: number };
  overdue: { count: number; totalAmount: number };
  autoDebitActive: number;
  revenueLastMonth: number;
}

export interface AllPaymentsResponse {
  data: AdminPayment[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminPayment {
  id: string;
  amount: number;
  paymentDate: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  mercadoPagoTransactionId?: string;
  mercadoPagoStatus?: string;
  mercadoPagoAuthorizedPaymentId?: string;
  upgradeToPlanId?: string;
  subscription?: {
    id: string;
    billingCycle: string;
    currentPrice: number;
    status: string;
    mercadoPagoPreapprovalId?: string;
    mercadoPagoSubscriptionStatus?: string;
    account?: { id: string; name: string; email: string; status: string };
    plan?: { id: string; displayName: string; name: string };
  };
}

export interface UpgradeResult {
  subscription: Subscription;
  proratedAmount: number;
  daysRemaining: number;
  totalDays: number;
  periodEnd: string;
  proratedPaymentId: string | null;
  newPlan: Plan;
}

export interface DashboardStats {
  total: number;
  byStatus: { trialing: number; active: number; past_due: number; suspended: number; cancelled: number };
  mrr: number;
  accountsWithoutSubscription: number;
}
