export type AccountMode = 'simple' | 'full';

export interface Account {
    id: string;
    name: string;
    description: string;
    email: string;
    phone: string;
    status: string;
    icon: string;
    mode: AccountMode;
    businessType?: string;
    businessDescription?: string;
    created_at: string;
    updated_at: string;
    owner: Owner;
    deletionScheduledAt?: string | null;
}

export interface Owner {
    id: string;
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface AvailableAccount {
  accountId: string;
  name: string;
  icon: string;
  mode: AccountMode;
  status: string;
  role: { id: number; name: string; alias: string } | null;
  isOwner: boolean;
}
