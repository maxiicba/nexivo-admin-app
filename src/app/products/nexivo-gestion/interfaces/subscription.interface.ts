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
  /** Club de Socios (fidelización + CRM). Flag propio: no cuelga de hasMarketing. */
  hasLoyalty?: boolean;
  /** CRM (contactos, bandeja, clientes para contactar). Flag propio, no cuelga de hasLoyalty. */
  hasCrm?: boolean;
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
  /** Transferencias que el cliente informo y todavia nadie acredito: cola de trabajo manual. */
  awaitingTransfer: { count: number; totalAmount: number };
  autoDebitActive: number;
  revenueLastMonth: number;
}

/**
 * Datos bancarios para cobrar la suscripcion por transferencia. Fila unica de la
 * tabla subscription_transfer_settings, editable desde este panel (antes eran
 * variables de entorno, que obligaban a redeploy para cambiar un alias).
 */
export interface TransferSettings {
  id?: string;
  isEnabled: boolean;
  bankName: string | null;
  accountHolder: string | null;
  cuit: string | null;
  cbu: string | null;
  alias: string | null;
  accountNumber: string | null;
  contact: string | null;
  instructions: string | null;
  updatedAt?: string;
  updatedByUserId?: string | null;
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
  /** 'mercado_pago' (default) | 'bank_transfer'. */
  paymentMethod?: string;
  /** Con valor = el cliente aviso que transfirio y espera que lo acreditemos. */
  transferReportedAt?: string | null;
  transferReference?: string | null;
  transferNotes?: string | null;
  confirmedAt?: string | null;
  confirmedByUserId?: string | null;
  adminNotes?: string | null;
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
