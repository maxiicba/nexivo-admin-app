export enum CommissionType {
  PERCENTAGE_FIRST = 'percentage_first',
  PERCENTAGE_RECURRING = 'percentage_recurring',
  FIXED_AMOUNT = 'fixed_amount',
}

export interface Referrer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  code: string;
  discountPercentage: number;
  commissionType: CommissionType;
  commissionValue: number;
  status: string;
  totalEarnings: number;
  referralCount?: number;
  referrals?: Referral[];
  createdAt: string;
  updatedAt: string;
}

export interface Referral {
  id: string;
  referrer: Referrer;
  account: { id: string; name: string; email: string };
  discountApplied: number;
  status: string;
  commissions?: ReferralCommission[];
  createdAt: string;
}

export interface ReferralCommission {
  id: string;
  referral: Referral;
  payment?: { id: string; amount: number };
  amount: number;
  status: string;
  paidAt?: string;
  createdAt: string;
}

export interface ReferralDashboardStats {
  totalReferrers: number;
  activeReferrals: number;
  pendingCommissions: number;
  paidCommissions: number;
}

export interface ReferralCodeValidation {
  valid: boolean;
  discountPercentage: number;
  referrerName: string;
}
