import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { TabViewModule } from 'primeng/tabview';
import { CardModule } from 'primeng/card';
import { ChipModule } from 'primeng/chip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ChatService } from '../services/chat.service';
import { LowercaseDirective } from '../accounts/lowercase.directive';
import { SupportAgent, ChatFaqEntry } from '../interfaces/chat.interface';

@Component({
  selector: 'app-chat-config',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule, DialogModule,
    InputTextModule, InputTextareaModule, InputSwitchModule, InputNumberModule,
    DropdownModule, TagModule, TabViewModule, CardModule, ChipModule,
    ConfirmDialogModule, ToastModule, TooltipModule, LowercaseDirective,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './chat-config.component.html',
})
export class ChatConfigComponent implements OnInit {
  private destroyRef = inject(DestroyRef);

  // Agents
  agents: SupportAgent[] = [];
  showAgentDialog = false;
  agentForm = { firstName: '', lastName: '', email: '', displayName: '', maxConversations: 10 };
  savingAgent = false;

  // FAQ
  faqEntries: ChatFaqEntry[] = [];
  showFaqDialog = false;
  faqForm = { question: '', answer: '', keywords: '', isGlobal: true };
  savingFaq = false;

  // Unanswered questions
  unansweredQuestions: any[] = [];
  loadingUnanswered = false;
  unansweredFilter: 'all' | 'pending' | 'reviewed' = 'pending';
  showReviewDialog = false;
  reviewingQuestion: any = null;
  reviewNotes = '';
  savingReview = false;

  filterOptions = [
    { label: 'Pendientes', value: 'pending' },
    { label: 'Revisadas', value: 'reviewed' },
    { label: 'Todas', value: 'all' },
  ];

  // Cache
  clearingCache = false;

  // Credentials dialog
  showCredentialsDialog = false;
  createdAgentEmail = '';
  createdAgentPassword = '';

  // AI Providers
  providerOptions = [
    { label: 'Claude (Anthropic)', value: 'claude' },
    { label: 'OpenAI', value: 'openai' },
  ];

  constructor(
    private chatService: ChatService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
  ) {}

  ngOnInit(): void {
    this.loadAgents();
    this.loadFaq();
    this.loadUnanswered();
  }

  // --- Agents ---
  loadAgents(): void {
    this.chatService.getSupportAgents()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (agents) => this.agents = agents,
        error: (err) => {
          console.error('[ChatConfig] loadAgents error', err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los agentes' });
        },
      });
  }

  openAgentDialog(): void {
    this.agentForm = { firstName: '', lastName: '', email: '', displayName: '', maxConversations: 10 };
    this.showAgentDialog = true;
  }

  saveAgent(): void {
    this.savingAgent = true;
    this.chatService.createSupportAgent(this.agentForm)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (agent: any) => {
          this.agents = [...this.agents, agent];
          this.showAgentDialog = false;
          this.savingAgent = false;
          if (agent.tempPassword) {
            this.createdAgentEmail = this.agentForm.email;
            this.createdAgentPassword = agent.tempPassword;
            this.showCredentialsDialog = true;
          } else {
            this.messageService.add({ severity: 'success', summary: 'Agente creado', detail: `${agent.displayName} fue creado exitosamente` });
          }
        },
        error: (err) => {
          this.savingAgent = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al crear agente' });
        },
      });
  }

  deleteAgent(agent: SupportAgent): void {
    this.confirmationService.confirm({
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      message: `Desactivar a ${agent.displayName}?`,
      acceptLabel: 'Si',
      rejectLabel: 'No',
      accept: () => {
        this.chatService.deleteSupportAgent(agent.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.agents = this.agents.filter(a => a.id !== agent.id);
              this.messageService.add({ severity: 'success', summary: 'Agente desactivado' });
            },
            error: (err) => {
              console.error('[ChatConfig] deleteAgent error', err);
              this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Error al desactivar agente' });
            },
          });
      },
    });
  }

  getStatusSeverity(status: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    switch (status) {
      case 'online': return 'success';
      case 'busy': return 'warning';
      case 'offline': return 'danger';
      default: return 'info';
    }
  }

  // --- Cache ---
  clearBotCache(): void {
    this.clearingCache = true;
    this.chatService.clearBotCache()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.clearingCache = false;
          this.messageService.add({ severity: 'success', summary: 'Cache limpiado', detail: res.message });
        },
        error: () => {
          this.clearingCache = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo limpiar el cache' });
        },
      });
  }

  // --- FAQ ---
  loadFaq(): void {
    this.chatService.getFaqEntries()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (entries) => this.faqEntries = entries,
        error: (err) => {
          console.error('[ChatConfig] loadFaq error', err);
          this.messageService.add({ severity: 'error', summary: 'Error al cargar FAQ', detail: err.error?.message || err.message || 'Error desconocido' });
        },
      });
  }

  openFaqDialog(): void {
    this.faqForm = { question: '', answer: '', keywords: '', isGlobal: true };
    this.showFaqDialog = true;
  }

  saveFaq(): void {
    this.savingFaq = true;
    const data = {
      question: this.faqForm.question,
      answer: this.faqForm.answer,
      keywords: this.faqForm.keywords.split(',').map(k => k.trim()).filter(k => k),
      isGlobal: this.faqForm.isGlobal,
    };
    this.chatService.createFaqEntry(data)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (entry) => {
          this.faqEntries = [...this.faqEntries, entry];
          this.showFaqDialog = false;
          this.savingFaq = false;
          this.messageService.add({ severity: 'success', summary: 'FAQ creada' });
        },
        error: () => {
          this.savingFaq = false;
          this.messageService.add({ severity: 'error', summary: 'Error al crear FAQ' });
        },
      });
  }

  deleteFaq(entry: ChatFaqEntry): void {
    this.confirmationService.confirm({
      message: 'Eliminar esta entrada de FAQ?',
      accept: () => {
        this.chatService.deleteFaqEntry(entry.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.faqEntries = this.faqEntries.filter(e => e.id !== entry.id);
              this.messageService.add({ severity: 'success', summary: 'FAQ eliminada' });
            },
            error: (err) => {
              console.error('[ChatConfig] deleteFaq error', err);
              this.messageService.add({ severity: 'error', summary: 'Error al eliminar FAQ' });
            },
          });
      },
    });
  }

  // --- Unanswered Questions ---
  loadUnanswered(): void {
    this.loadingUnanswered = true;
    const reviewed = this.unansweredFilter === 'pending' ? false
      : this.unansweredFilter === 'reviewed' ? true : undefined;
    this.chatService.getUnansweredQuestions(reviewed)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (questions) => {
          this.unansweredQuestions = questions;
          this.loadingUnanswered = false;
        },
        error: (err) => {
          console.error('[ChatConfig] loadUnanswered error', err);
          this.loadingUnanswered = false;
        },
      });
  }

  onFilterChange(): void {
    this.loadUnanswered();
  }

  getReasonLabel(reason: string): string {
    switch (reason) {
      case 'escalated': return 'Escalado';
      case 'off_topic': return 'Fuera de tema';
      case 'error': return 'Error';
      default: return reason;
    }
  }

  getReasonSeverity(reason: string): 'success' | 'secondary' | 'info' | 'warning' | 'danger' | 'contrast' | undefined {
    switch (reason) {
      case 'escalated': return 'warning';
      case 'off_topic': return 'info';
      case 'error': return 'danger';
      default: return 'info';
    }
  }

  openReviewDialog(question: any): void {
    this.reviewingQuestion = question;
    this.reviewNotes = question.reviewNotes || '';
    this.showReviewDialog = true;
  }

  saveReview(): void {
    if (!this.reviewingQuestion) return;
    this.savingReview = true;
    this.chatService.markAsReviewed(this.reviewingQuestion.id, this.reviewNotes)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.reviewingQuestion.isReviewed = true;
          this.reviewingQuestion.reviewNotes = this.reviewNotes;
          this.showReviewDialog = false;
          this.savingReview = false;
          this.messageService.add({ severity: 'success', summary: 'Marcada como revisada' });
          if (this.unansweredFilter === 'pending') {
            this.unansweredQuestions = this.unansweredQuestions.filter(q => q.id !== this.reviewingQuestion.id);
          }
        },
        error: () => {
          this.savingReview = false;
          this.messageService.add({ severity: 'error', summary: 'Error al marcar como revisada' });
        },
      });
  }
}
