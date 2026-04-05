import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Socket, io } from 'socket.io-client';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { Conversation, ChatMessage, ChatMessagePayload, SupportAgent, Ticket, ChatConfig, ChatFaqEntry, ChatStats } from '../interfaces/chat.interface';

@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private socket: Socket | null = null;
  private baseUrl = `${environment.managementApiUrl}/chat`;

  // State
  private conversations$ = new BehaviorSubject<Conversation[]>([]);
  private activeConversation$ = new BehaviorSubject<Conversation | null>(null);
  private messages$ = new BehaviorSubject<ChatMessage[]>([]);
  private unreadCount$ = new BehaviorSubject<number>(0);
  private typing$ = new BehaviorSubject<{ conversationId: string; senderType: string } | null>(null);
  private botTyping$ = new BehaviorSubject<string | null>(null); // conversationId
  private connected$ = new BehaviorSubject<boolean>(false);

  // Public observables
  conversations = this.conversations$.asObservable();
  activeConversation = this.activeConversation$.asObservable();
  messages = this.messages$.asObservable();
  unreadCount = this.unreadCount$.asObservable();
  typing = this.typing$.asObservable();
  botTyping = this.botTyping$.asObservable();
  isConnected = this.connected$.asObservable();

  private newMessage$ = new Subject<ChatMessagePayload>();
  newMessage = this.newMessage$.asObservable();

  private conversationClosed$ = new Subject<string>();
  conversationClosed = this.conversationClosed$.asObservable();

  private typingTimeout: any;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  // --- WebSocket Connection ---

  connect(): void {
    // If already connected, skip
    if (this.socket?.connected) return;

    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.socket = io(`${environment.wsUrl}/chat`, {
      query: { isSuperAdmin: true },
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
    });

    this.socket.on('connect', () => {
      this.connected$.next(true);
      // Re-join active conversation room after reconnect
      const active = this.activeConversation$.value;
      if (active) {
        this.socket!.emit('chat:join', { conversationId: active.id });
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('[Chat] Disconnected:', reason);
      this.connected$.next(false);
      // If the server closed the connection (e.g. auth error), force a full reconnect
      if (reason === 'io server disconnect') {
        setTimeout(() => {
          this.disconnect();
          this.connect();
        }, 2000);
      }
    });

    this.socket.on('connect_error', (err) => {
      console.error('[Chat] Connection error:', err.message);
    });

    this.socket.on('chat:error', (data: { reason: string; detail?: string }) => {
      console.error('[Chat] Server rejected connection:', data.reason, data.detail || '');
      // If rejected for auth reasons, try full reconnect
      if (data.reason === 'no_session' || data.reason === 'invalid_token') {
        this.disconnect();
      }
    });

    this.socket.on('chat:message', (payload: ChatMessagePayload) => {
      this.handleIncomingMessage(payload);
    });

    this.socket.on('chat:typing', (data: { conversationId: string; senderType: string }) => {
      this.typing$.next(data);
      clearTimeout(this.typingTimeout);
      this.typingTimeout = setTimeout(() => this.typing$.next(null), 3000);
    });

    this.socket.on('chat:bot-typing', (data: { conversationId: string }) => {
      this.botTyping$.next(data.conversationId);
    });

    this.socket.on('chat:read', (data: { conversationId: string; messageId: string; readAt: string }) => {
      const msgs = this.messages$.value.map(m =>
        m.id === data.messageId ? { ...m, readAt: data.readAt } : m
      );
      this.messages$.next(msgs);
    });

    this.socket.on('chat:escalated', (data: { conversationId: string; agent?: SupportAgent }) => {
      const convs = this.conversations$.value.map(c =>
        c.id === data.conversationId ? { ...c, botActive: false, assignedAgent: data.agent } : c
      );
      this.conversations$.next(convs);

      // Also update active conversation so the widget reflects the change
      const active = this.activeConversation$.value;
      if (active && active.id === data.conversationId) {
        this.activeConversation$.next({ ...active, botActive: false, assignedAgent: data.agent || active.assignedAgent });
      }
    });

    this.socket.on('chat:closed', (data: { conversationId: string }) => {
      this.handleConversationClosed(data.conversationId);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected$.next(false);
  }

  /** Disconnect, clear all state, and reconnect */
  reconnect(): void {
    this.disconnect();
    this.resetState();
    this.connect();
  }

  private resetState(): void {
    this.conversations$.next([]);
    this.activeConversation$.next(null);
    this.messages$.next([]);
    this.unreadCount$.next(0);
    this.typing$.next(null);
    this.botTyping$.next(null);
    clearTimeout(this.typingTimeout);
  }

  private handleIncomingMessage(payload: ChatMessagePayload): void {
    this.botTyping$.next(null);
    this.newMessage$.next(payload);

    const active = this.activeConversation$.value;

    // Update messages if viewing this conversation
    if (active && active.id === payload.conversation.id) {
      const current = this.messages$.value;
      if (!current.find(m => m.id === payload.message.id)) {
        this.messages$.next([...current, payload.message]);
      }
    }

    // Update conversation list
    const convs = this.conversations$.value;
    const idx = convs.findIndex(c => c.id === payload.conversation.id);
    if (idx > -1) {
      const updated = [...convs];
      updated[idx] = {
        ...updated[idx],
        lastMessageAt: payload.message.createdAt,
        lastMessage: payload.message,
        unreadCount: active?.id === payload.conversation.id
          ? updated[idx].unreadCount
          : (updated[idx].unreadCount || 0) + 1,
      };
      // Sort by last message
      updated.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      this.conversations$.next(updated);
    }

    // Update global unread count
    if (!active || active.id !== payload.conversation.id) {
      this.unreadCount$.next(this.unreadCount$.value + 1);
    }
  }

  // --- Socket Emitters ---

  sendMessage(conversationId: string, content: string): void {
    this.socket?.emit('chat:send', { conversationId, content });
  }

  emitTyping(conversationId: string): void {
    this.socket?.emit('chat:typing', { conversationId });
  }

  markAsRead(conversationId: string, messageId: string): void {
    this.socket?.emit('chat:read', { conversationId, messageId });
  }

  escalateToHuman(conversationId: string): void {
    this.socket?.emit('chat:escalate', { conversationId });
  }

  closeConversation(conversationId: string): void {
    this.socket?.emit('chat:close', { conversationId });
  }

  // --- HTTP API ---

  // Conversations
  createConversation(accountId: string, initialMessage?: string): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.baseUrl}/conversations`, { accountId, initialMessage }, { withCredentials: true });
  }

  getConversationsByAccount(accountId: string): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.baseUrl}/conversations/account/${accountId}`, { withCredentials: true });
  }

  getConversation(id: string): Observable<Conversation> {
    return this.http.get<Conversation>(`${this.baseUrl}/conversations/${id}`, { withCredentials: true });
  }

  getMessages(conversationId: string, take = 50, skip = 0): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.baseUrl}/conversations/${conversationId}/messages?take=${take}&skip=${skip}`, { withCredentials: true });
  }

  sendMessageRest(conversationId: string, content: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.baseUrl}/conversations/${conversationId}/messages`, { content }, { withCredentials: true });
  }

  // Tickets
  createTicket(conversationId: string, subject: string, priority?: string): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.baseUrl}/conversations/${conversationId}/tickets`, { subject, priority }, { withCredentials: true });
  }

  updateTicket(ticketId: string, data: Partial<Ticket>): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.baseUrl}/tickets/${ticketId}`, data, { withCredentials: true });
  }

  getOpenTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.baseUrl}/tickets/open`, { withCredentials: true });
  }

  getTicketsByConversation(conversationId: string): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.baseUrl}/conversations/${conversationId}/tickets`, { withCredentials: true });
  }

  getAllTickets(params: {
    status?: string;
    accountId?: string;
    priority?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Observable<{ data: Ticket[]; total: number }> {
    const httpParams = new HttpParams({ fromObject: Object.entries(params)
      .filter(([_, v]) => v != null && v !== '')
      .reduce((acc, [k, v]) => ({ ...acc, [k]: String(v) }), {} as Record<string, string>) });
    return this.http.get<{ data: Ticket[]; total: number }>(
      `${this.baseUrl}/tickets`, { params: httpParams, withCredentials: true }
    );
  }

  initiateConversation(accountId: string, message: string): Observable<{ conversation: Conversation; message: ChatMessage }> {
    return this.http.post<{ conversation: Conversation; message: ChatMessage }>(
      `${this.baseUrl}/conversations/initiate`, { accountId, message }, { withCredentials: true }
    );
  }

  // Agent
  getAgentConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.baseUrl}/agent/conversations`, { withCredentials: true });
  }

  getUnassignedConversations(): Observable<Conversation[]> {
    return this.http.get<Conversation[]>(`${this.baseUrl}/agent/conversations/unassigned`, { withCredentials: true });
  }

  takeConversation(conversationId: string): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.baseUrl}/agent/conversations/${conversationId}/take`, {}, { withCredentials: true });
  }

  transferConversation(conversationId: string, agentId: string): Observable<Conversation> {
    return this.http.post<Conversation>(`${this.baseUrl}/agent/conversations/${conversationId}/transfer/${agentId}`, {}, { withCredentials: true });
  }

  updateAgentStatus(status: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/agent/status`, { status }, { withCredentials: true });
  }

  // Support Agents (super-admin)
  getSupportAgents(): Observable<SupportAgent[]> {
    return this.http.get<SupportAgent[]>(`${this.baseUrl}/support-agents`, { withCredentials: true });
  }

  createSupportAgent(data: any): Observable<SupportAgent> {
    return this.http.post<SupportAgent>(`${this.baseUrl}/support-agents`, data, { withCredentials: true });
  }

  deleteSupportAgent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/support-agents/${id}`, { withCredentials: true });
  }

  // Config (super-admin)
  getChatConfig(accountId: string): Observable<ChatConfig> {
    return this.http.get<ChatConfig>(`${this.baseUrl}/config/${accountId}`, { withCredentials: true });
  }

  updateChatConfig(accountId: string, data: Partial<ChatConfig>): Observable<ChatConfig> {
    return this.http.patch<ChatConfig>(`${this.baseUrl}/config/${accountId}`, data, { withCredentials: true });
  }

  // FAQ
  getFaqEntries(accountId?: string): Observable<ChatFaqEntry[]> {
    const params = accountId ? `?accountId=${accountId}` : '';
    return this.http.get<ChatFaqEntry[]>(`${this.baseUrl}/faq${params}`, { withCredentials: true });
  }

  createFaqEntry(data: Partial<ChatFaqEntry>): Observable<ChatFaqEntry> {
    return this.http.post<ChatFaqEntry>(`${this.baseUrl}/faq`, data, { withCredentials: true });
  }

  deleteFaqEntry(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/faq/${id}`, { withCredentials: true });
  }

  // Bot cache
  clearBotCache(): Observable<{ deleted: number; message: string }> {
    return this.http.delete<{ deleted: number; message: string }>(`${this.baseUrl}/bot-cache`, { withCredentials: true });
  }

  // Unanswered questions
  getUnansweredQuestions(reviewed?: boolean): Observable<any[]> {
    const params = reviewed !== undefined ? `?reviewed=${reviewed}` : '';
    return this.http.get<any[]>(`${this.baseUrl}/unanswered${params}`, { withCredentials: true });
  }

  markAsReviewed(id: string, reviewNotes?: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/unanswered/${id}/review`, { reviewNotes }, { withCredentials: true });
  }

  // Stats
  getStats(): Observable<ChatStats> {
    return this.http.get<ChatStats>(`${this.baseUrl}/stats`, { withCredentials: true });
  }

  closeConversationHttp(conversationId: string): Observable<Conversation> {
    return this.http.patch<Conversation>(`${this.baseUrl}/conversations/${conversationId}/close`, {}, { withCredentials: true });
  }

  private handleConversationClosed(conversationId: string): void {
    // Remove from conversation lists
    const convs = this.conversations$.value.filter(c => c.id !== conversationId);
    this.conversations$.next(convs);

    // Emit event — components decide whether to clear or keep messages visible
    this.conversationClosed$.next(conversationId);
  }

  // --- State helpers ---

  setActiveConversation(conv: Conversation | null): void {
    this.activeConversation$.next(conv);
    if (conv) {
      // Reset unread for this conversation
      const convs = this.conversations$.value.map(c =>
        c.id === conv.id ? { ...c, unreadCount: 0 } : c
      );
      this.conversations$.next(convs);

      // Load messages
      this.getMessages(conv.id).subscribe({
        next: msgs => this.messages$.next(msgs.reverse()),
        error: err => console.error('[Chat] Failed to load messages:', err),
      });
    } else {
      this.messages$.next([]);
    }
  }

  setConversations(convs: Conversation[]): void {
    this.conversations$.next(convs);
  }

  resetUnreadCount(): void {
    this.unreadCount$.next(0);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
