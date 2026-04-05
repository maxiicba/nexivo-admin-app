export interface Conversation {
  id: string;
  accountId: string;
  account?: { id: string; name: string; icon?: string };
  initiatedBy: 'client' | 'support' | 'superadmin' | 'bot';
  assignedAgent?: SupportAgent;
  assignedAgentId?: string;
  status: 'active' | 'closed' | 'archived';
  botActive: boolean;
  closedAt?: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  // UI helpers
  unreadCount?: number;
  lastMessage?: ChatMessage;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: 'client' | 'support' | 'superadmin' | 'bot';
  senderUserId?: string;
  senderAgentId?: string;
  content: string;
  metadata?: Record<string, any>; // May include: { tutorialId, tutorialTitle, tutorialThumbnail } for tutorial recommendations
  readAt?: string;
  createdAt: string;
}

export interface SupportAgent {
  id: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  displayName: string;
  status: 'online' | 'offline' | 'busy';
  maxConversations: number;
  createdAt: string;
}

export interface Ticket {
  id: string;
  conversationId: string;
  conversation?: Conversation;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdBy: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatConfig {
  id: string;
  accountId: string;
  botEnabled: boolean;
  botMaxQueries: number;
  botQueriesUsed: number;
  botResetDate: string;
  aiProvider: string;
  aiModel: string;
  knowledgeBase?: string;
  autoEscalate: boolean;
}

export interface ChatFaqEntry {
  id: string;
  accountId?: string;
  question: string;
  answer: string;
  keywords: string[];
  isGlobal: boolean;
  sortOrder: number;
}

export interface ChatStats {
  activeConversations: number;
  unassignedCount: number;
  openTickets: number;
  onlineAgents: number;
}

export interface ChatMessagePayload {
  message: ChatMessage;
  conversation: { id: string; accountId: string };
}
