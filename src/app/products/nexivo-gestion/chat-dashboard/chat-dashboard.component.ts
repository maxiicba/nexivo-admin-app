import { Component, OnInit, ViewChild, ElementRef, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { CardModule } from 'primeng/card';
import { TabViewModule } from 'primeng/tabview';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ChatService } from '../services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { AccountsService } from '../services/accounts.service';
import { Conversation, ChatMessage, SupportAgent, Ticket, ChatStats } from '../interfaces/chat.interface';

const BOT_NAME = 'Nexivo Bot';

@Component({
  selector: 'app-chat-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, BadgeModule,
    InputTextareaModule, InputTextModule, TagModule, AvatarModule,
    TooltipModule, DialogModule, DropdownModule, CardModule,
    TabViewModule, ProgressSpinnerModule, TableModule, AutoCompleteModule,
  ],
  templateUrl: './chat-dashboard.component.html',
})
export class ChatDashboardComponent implements OnInit {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  private destroyRef = inject(DestroyRef);

  // State
  conversations: Conversation[] = [];
  unassignedConversations: Conversation[] = [];
  activeConversation: Conversation | null = null;
  messages: ChatMessage[] = [];
  tickets: Ticket[] = [];
  stats: ChatStats | null = null;
  agents: SupportAgent[] = [];

  newMessage = '';
  loading = false;
  isTyping = false;
  isBotTyping = false;
  botName = BOT_NAME;

  // Ticket dialog
  showTicketDialog = false;
  ticketSubject = '';
  ticketPriority = 'medium';
  priorityOptions = [
    { label: 'Baja', value: 'low' },
    { label: 'Media', value: 'medium' },
    { label: 'Alta', value: 'high' },
  ];

  // Tickets tab (superadmin)
  allTickets: Ticket[] = [];
  totalTickets = 0;
  ticketPage = 1;
  ticketLimit = 10;
  ticketStatusFilter: string = '';
  ticketPriorityFilter: string = '';

  statusFilterOptions = [
    { label: 'Todos', value: '' },
    { label: 'Abierto', value: 'open' },
    { label: 'En progreso', value: 'in_progress' },
    { label: 'Resuelto', value: 'resolved' },
    { label: 'Cerrado', value: 'closed' },
  ];

  // New conversation dialog (superadmin)
  showNewConversationDialog = false;
  selectedAccount: any = null;
  newConversationMessage: string = '';
  allAccounts: any[] = [];
  filteredAccounts: any[] = [];

  isSuperAdmin = false;
  isSupportAgent = false;
  currentUserId = '';

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private accountsService: AccountsService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.currentUserId = user.id;
    this.isSuperAdmin = user.isSuperAdmin;
    this.isSupportAgent = user.isSupportAgent;

    this.chatService.connect();

    // Subscribe to messages
    this.chatService.messages
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (msgs) => {
          this.messages = msgs;
          this.scrollToBottom();
        },
        error: (err) => console.error('[ChatDashboard] messages error', err),
      });

    this.chatService.typing
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.isTyping = !!data && data.conversationId === this.activeConversation?.id;
        },
        error: (err) => console.error('[ChatDashboard] typing error', err),
      });

    this.chatService.botTyping
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (convId) => {
          this.isBotTyping = !!convId && convId === this.activeConversation?.id;
        },
        error: (err) => console.error('[ChatDashboard] botTyping error', err),
      });

    // Listen for new messages to refresh conversation lists
    this.chatService.newMessage
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.refreshConversations(),
        error: (err) => console.error('[ChatDashboard] newMessage error', err),
      });

    // Listen for closed conversations
    this.chatService.conversationClosed
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (convId) => {
          this.conversations = this.conversations.filter(c => c.id !== convId);
          this.unassignedConversations = this.unassignedConversations.filter(c => c.id !== convId);
          if (this.activeConversation?.id === convId) {
            this.activeConversation = null;
            this.messages = [];
            this.tickets = [];
          }
          this.refreshConversations();
        },
        error: (err) => console.error('[ChatDashboard] conversationClosed error', err),
      });

    this.loadData();

    if (this.isSuperAdmin) {
      this.loadTicketHistory();
    }
  }

  loadData(): void {
    this.loading = true;

    if (this.isSuperAdmin) {
      this.chatService.getStats()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (stats) => this.stats = stats,
          error: (err) => console.error('[ChatDashboard] getStats error', err),
        });
      this.chatService.getSupportAgents()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (agents) => this.agents = agents,
          error: (err) => console.error('[ChatDashboard] getSupportAgents error', err),
        });
      this.chatService.getAgentConversations()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (convs) => {
            this.conversations = convs;
            this.loading = false;
          },
          error: (err) => {
            console.error('[ChatDashboard] getAgentConversations error', err);
            this.loading = false;
          },
        });
      this.chatService.getUnassignedConversations()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (convs) => this.unassignedConversations = convs,
          error: (err) => console.error('[ChatDashboard] getUnassignedConversations error', err),
        });
    } else if (this.isSupportAgent) {
      this.chatService.getAgentConversations()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (convs) => {
            this.conversations = convs;
            this.loading = false;
          },
          error: (err) => {
            console.error('[ChatDashboard] getAgentConversations error', err);
            this.loading = false;
          },
        });
      this.chatService.getUnassignedConversations()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (convs) => this.unassignedConversations = convs,
          error: (err) => console.error('[ChatDashboard] getUnassignedConversations error', err),
        });
    }
  }

  refreshConversations(): void {
    if (this.isSuperAdmin || this.isSupportAgent) {
      this.chatService.getAgentConversations()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (convs) => this.conversations = convs,
          error: (err) => console.error('[ChatDashboard] refreshConversations error', err),
        });
    }
    this.chatService.getUnassignedConversations()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (convs) => this.unassignedConversations = convs,
        error: (err) => console.error('[ChatDashboard] getUnassigned error', err),
      });
    if (this.isSuperAdmin) {
      this.chatService.getStats()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (stats) => this.stats = stats,
          error: (err) => console.error('[ChatDashboard] getStats error', err),
        });
    }
  }

  selectConversation(conv: Conversation): void {
    this.activeConversation = conv;
    this.chatService.setActiveConversation(conv);
    this.chatService.getTicketsByConversation(conv.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tickets) => this.tickets = tickets,
        error: (err) => console.error('[ChatDashboard] getTickets error', err),
      });
  }

  takeConversation(conv: Conversation): void {
    this.chatService.takeConversation(conv.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.unassignedConversations = this.unassignedConversations.filter(c => c.id !== conv.id);
          this.conversations = [updated, ...this.conversations];
          this.selectConversation(updated);
        },
        error: (err) => console.error('[ChatDashboard] takeConversation error', err),
      });
  }

  closeConversation(): void {
    if (!this.activeConversation) return;
    this.chatService.closeConversation(this.activeConversation.id);
  }

  sendMessage(): void {
    const content = this.newMessage.trim();
    if (!content || content.length > 2000 || !this.activeConversation) return;
    this.chatService.sendMessage(this.activeConversation.id, content);
    this.newMessage = '';
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    } else if (this.activeConversation) {
      this.chatService.emitTyping(this.activeConversation.id);
    }
  }

  // Tickets
  openTicketDialog(): void {
    this.ticketSubject = '';
    this.ticketPriority = 'medium';
    this.showTicketDialog = true;
  }

  createTicket(): void {
    if (!this.activeConversation || !this.ticketSubject.trim()) return;
    this.chatService.createTicket(this.activeConversation.id, this.ticketSubject, this.ticketPriority)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (ticket) => {
          this.tickets = [ticket, ...this.tickets];
          this.showTicketDialog = false;
        },
        error: (err) => console.error('[ChatDashboard] createTicket error', err),
      });
  }

  resolveTicket(ticket: Ticket): void {
    this.chatService.updateTicket(ticket.id, { status: 'resolved' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.tickets = this.tickets.map(t => t.id === updated.id ? updated : t);
        },
        error: (err) => console.error('[ChatDashboard] resolveTicket error', err),
      });
  }

  getSenderLabel(msg: ChatMessage): string {
    switch (msg.senderType) {
      case 'bot': return BOT_NAME;
      case 'support': return 'Agente';
      case 'superadmin': return 'Admin';
      case 'client': return 'Cliente';
      default: return '';
    }
  }

  getTicketSeverity(status: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    switch (status) {
      case 'open': return 'danger';
      case 'in_progress': return 'warning';
      case 'resolved': return 'success';
      case 'closed': return 'info';
      default: return 'info';
    }
  }

  getPrioritySeverity(priority: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    switch (priority) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'info';
    }
  }

  getAccountInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  }

  // Ticket history (superadmin)
  loadTicketHistory(): void {
    const params: any = {
      page: this.ticketPage,
      limit: this.ticketLimit,
    };
    if (this.ticketStatusFilter) params.status = this.ticketStatusFilter;
    if (this.ticketPriorityFilter) params.priority = this.ticketPriorityFilter;

    this.chatService.getAllTickets(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.allTickets = res.data;
          this.totalTickets = res.total;
        },
        error: (err) => console.error('[ChatDashboard] getAllTickets error', err),
      });
  }

  onTicketPageChange(event: any): void {
    this.ticketPage = Math.floor(event.first / event.rows) + 1;
    this.ticketLimit = event.rows;
    this.loadTicketHistory();
  }

  onTicketFilterChange(): void {
    this.ticketPage = 1;
    this.loadTicketHistory();
  }

  viewTicketConversation(ticket: any): void {
    if (ticket.conversationId) {
      this.chatService.getConversation(ticket.conversationId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (conv) => this.selectConversation(conv),
          error: (err) => console.error('[ChatDashboard] getConversation error', err),
        });
    }
  }

  // New conversation (superadmin)
  loadAllAccounts(): void {
    this.accountsService.getAccounts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (accounts) => {
          this.allAccounts = accounts;
          this.filteredAccounts = accounts;
        },
        error: (err) => console.error('[Chat] Failed to load accounts:', err),
      });
  }

  filterAccounts(event: any): void {
    const query = (event.query || '').toLowerCase();
    this.filteredAccounts = this.allAccounts.filter(a =>
      (a.name || '').toLowerCase().includes(query)
    );
  }

  openNewConversationDialog(): void {
    this.showNewConversationDialog = true;
    this.selectedAccount = null;
    this.newConversationMessage = '';
    if (this.allAccounts.length === 0) {
      this.loadAllAccounts();
    }
  }

  startConversation(): void {
    if (!this.selectedAccount || !this.newConversationMessage.trim()) return;
    const accountId = this.selectedAccount.id || this.selectedAccount;

    this.chatService.initiateConversation(accountId, this.newConversationMessage)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.showNewConversationDialog = false;
          this.selectConversation(res.conversation);
          this.refreshConversations();
        },
        error: (err) => console.error('[ChatDashboard] initiateConversation error', err),
      });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesContainer?.nativeElement) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    }, 50);
  }
}
