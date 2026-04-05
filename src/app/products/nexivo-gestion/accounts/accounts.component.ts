import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Table } from 'primeng/table';

// PrimeNG Modules
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import { ChipModule } from 'primeng/chip';
import { AccordionModule } from 'primeng/accordion';
import { StepperModule } from 'primeng/stepper';
import { FloatLabelModule } from 'primeng/floatlabel';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { KeyFilterModule } from 'primeng/keyfilter';

// Local services, interfaces and pipes
import { AccountsService } from '../services/accounts.service';
import { ManagementSubscriptionService } from '../services/management-subscription.service';
import { Account, Owner } from '../interfaces/account.interface';
import { Plan } from '../interfaces/subscription.interface';
import { StatusLabelPipe } from './status-label.pipe';
import { StatusSeverityPipe } from './status-severity.pipe';
import { LowercaseDirective } from './lowercase.directive';

export interface CreateAccountDto {
  name: string;
  description?: string;
  email: string;
  phone?: string;
  icon?: string;
  status: 'active' | 'inactive' | 'suspended';
  ownerUsername: string;
  ownerEmail: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  salePointName?: string;
  salePointAddress?: string;
  salePointPhone?: string;
  planId: string;
  billingCycle?: 'monthly' | 'annual';
  freeMonths?: number;
}

export interface UpdateAccountDto {
  name: string;
  description?: string;
  email: string;
  phone?: string;
  icon?: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface SalePoint {
  id: string;
  name: string;
  address?: string;
  phone?: string;
}

@Component({
  standalone: true,
  selector: 'app-accounts',
  templateUrl: './accounts.component.html',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    DropdownModule,
    ToastModule,
    InputTextModule,
    InputTextareaModule,
    InputNumberModule,
    BadgeModule,
    AvatarModule,
    ChipModule,
    AccordionModule,
    StepperModule,
    FloatLabelModule,
    IconFieldModule,
    InputIconModule,
    TooltipModule,
    RippleModule,
    KeyFilterModule,
    StatusLabelPipe,
    StatusSeverityPipe,
    LowercaseDirective,
  ],
  providers: [MessageService],
})
export class AccountsComponent implements OnInit {

  private destroyRef = inject(DestroyRef);

  visible = false;
  active: number = 0;

  accountForm!: FormGroup;
  ownerUserForm!: FormGroup;
  salePointForm!: FormGroup;

  showDialog1() {
    this.accountForm.reset();
    this.active = 0;
    this.visible = true;
  }

  accountDialog: boolean = false;

  accountOwnerDialog: boolean = false;

  deleteaccountDialog: boolean = false;

  deleteAccountsDialog: boolean = false;

  accounts: Account[] = [];

  account: Account = {} as Account;

  selectedAccounts: Account[] = [];

  submitted: boolean = false;

  statuses: any[] = [];

  rowsPerPageOptions = [5, 10, 20];

  ownerUser: Owner = {} as Owner;

  salePoint: SalePoint = {} as SalePoint;

  isSaving: boolean = false;

  // Plan selection
  plans: Plan[] = [];
  subscriptionForm!: FormGroup;

  private validStatuses: Array<'active' | 'inactive' | 'suspended'> = ['active', 'inactive', 'suspended'];

  billingCycleOptions = [
    { label: 'Mensual', value: 'monthly' },
    { label: 'Anual', value: 'annual' }
  ];

  constructor(
    private accountsService: AccountsService,
    private messageService: MessageService,
    private fb: FormBuilder,
    private subscriptionService: ManagementSubscriptionService
  ) { }

  ngOnInit(): void {
    this.accountsService.getAccounts()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => this.accounts = data);
    this.subscriptionService.getActivePlans()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(p => this.plans = p);

    this.statuses = [
      { label: 'ACTIVA', value: 'active' },
      { label: 'INACTIVA', value: 'inactive' },
      { label: 'SUSPENDIDA', value: 'suspended' }
    ];

    this.accountForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern('^[a-zA-ZÀ-ÿ\\s]+$'), Validators.maxLength(255)]],
      email: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')]],
      phone: ['', [Validators.required, Validators.minLength(9), Validators.maxLength(10)]],
      icon: [''],
      description: ['', [Validators.required, Validators.maxLength(600)]],
      status: ['', Validators.required]
    });

    this.ownerUserForm = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')]],
      first_name: ['', [Validators.required, Validators.pattern('^[a-zA-ZÀ-ÿ\\s]+$'), Validators.maxLength(40)]],
      last_name: ['', [Validators.required, Validators.pattern('^[a-zA-ZÀ-ÿ\\s]+$'), Validators.maxLength(40)]]
    });

    this.salePointForm = this.fb.group({
      name: ['', Validators.required],
      address: [''],
      phone: ['', Validators.required]
    });

    this.subscriptionForm = this.fb.group({
      planId: ['', Validators.required],
      billingCycle: ['monthly', Validators.required],
      freeMonths: [0]
    });
  }

  // Typed control accessors to satisfy noPropertyAccessFromIndexSignature
  get accountControls(): { [key: string]: AbstractControl } {
    return this.accountForm.controls;
  }

  get ownerUserControls(): { [key: string]: AbstractControl } {
    return this.ownerUserForm.controls;
  }

  get salePointControls(): { [key: string]: AbstractControl } {
    return this.salePointForm.controls;
  }

  get subscriptionControls(): { [key: string]: AbstractControl } {
    return this.subscriptionForm.controls;
  }

  onSubmit(nextCallback: any) {
    this.submitted = true;
    if (this.accountForm.valid && this.ownerUserForm.valid && this.salePointForm.valid && this.subscriptionForm.valid) {

      const createAccountDto: CreateAccountDto = {
        name: this.accountForm.value.name,
        description: this.accountForm.value.description,
        email: this.accountForm.value.email,
        phone: this.accountForm.value.phone,
        icon: this.accountForm.value.icon || 'https://cdn-icons-png.flaticon.com/512/8345/8345328.png',
        status: (this.accountForm.value.status as 'active' | 'inactive' | 'suspended') ?? 'active',
        ownerUsername: this.ownerUserForm.value.username,
        ownerEmail: this.ownerUserForm.value.email,
        ownerFirstName: this.ownerUserForm.value.first_name,
        ownerLastName: this.ownerUserForm.value.last_name,
        salePointName: this.salePointForm.value.name,
        salePointAddress: this.salePointForm.value.address,
        salePointPhone: this.salePointForm.value.phone,
        planId: this.subscriptionForm.value.planId,
        billingCycle: this.subscriptionForm.value.billingCycle,
        freeMonths: this.subscriptionForm.value.freeMonths || 0
      };
      this.isSaving = true;
      this.accountsService.createAccountAndOwnerUserAndPoint(createAccountDto).subscribe({
        next: (response: any) => {
          this.isSaving = false;
          this.handleNext(nextCallback);
          this.accounts.push(response);
          this.accountDialog = false;
          this.submitted = false;
          this.account = {} as any;
          this.ownerUser = {} as any;
          this.salePoint = {} as any;
        },
        error: (error: any) => {
          this.isSaving = false;
          console.error('Error creating account:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Error al crear cuenta',
            life: 3000
          });
        },
      });
    }
  }

  closeModal(): void {
    this.visible = false;
  }

  handleNext(nextCallback: any): void {
    nextCallback.emit();
    this.messageService.add({
      severity: 'success',
      summary: 'Operación exitosa',
      detail: 'Cuenta, usuario y punto creados con éxito',
      life: 3000
    });
  }

  hideDialog(type: string) {
    switch (type) {
      case 'account':
        this.accountDialog = false;
        this.submitted = false;
        this.accountForm.reset();
        this.ownerUserForm.reset();
        this.salePointForm.reset();
        this.subscriptionForm.reset({ planId: '', billingCycle: 'monthly', freeMonths: 0 });
        this.account = {} as Account;
        this.ownerUser = {} as Owner;
        this.salePoint = {} as SalePoint;
        this.isUpdate = false;
        break;
      case 'userOwner':
        this.accountOwnerDialog = false;
        this.ownerUserForm.reset();
        this.ownerUser = {} as Owner;
        break;
    }
  }

  deleteSelectedAccounts() {
    this.deleteAccountsDialog = true;
  }

  public isUpdate: boolean = false;

  editAccount(account: Account) {
    this.account = { ...account };
    this.accountDialog = true;
    this.isUpdate = true;
  }

  deleteAccount(account: Account) {
    this.deleteaccountDialog = true;
    this.account = { ...account };
  }

  confirmDeleteSelected() {
    this.deleteAccountsDialog = false;
    const ids = this.selectedAccounts.map(a => a.id);
    let completed = 0;
    ids.forEach(id => {
      this.accountsService.deleteAccount(id).subscribe({
        next: () => {
          completed++;
          if (completed === ids.length) {
            this.accounts = this.accounts.filter(val => !ids.includes(val.id));
            this.messageService.add({ severity: 'success', summary: 'Operación exitosa', detail: 'Cuentas eliminadas', life: 3000 });
            this.selectedAccounts = [];
          }
        },
        error: (err: any) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Error al eliminar cuenta', life: 5000 });
        }
      });
    });
  }

  confirmDelete() {
    this.deleteaccountDialog = false;
    this.accountsService.deleteAccount(this.account.id).subscribe({
      next: () => {
        this.accounts = this.accounts.filter(val => val.id !== this.account.id);
        this.messageService.add({ severity: 'success', summary: 'Operación exitosa', detail: 'Cuenta eliminada', life: 3000 });
        this.account = {} as Account;
      },
      error: (err: any) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Error al eliminar la cuenta', life: 5000 });
        this.account = {} as Account;
      }
    });
  }

  saveOwneruser() {
    this.accountOwnerDialog = false;
  }

  saveAccount() {
    this.submitted = true;
    if (this.account.name?.trim()) {
      const updateAccount: UpdateAccountDto = {
        name: this.account.name,
        email: this.account.email,
        description: this.account.description,
        icon: this.account.icon,
        phone: this.account.phone,
        status: this.validStatuses.includes(this.account.status as any) ? (this.account.status as any) : 'active',
      };
      this.accountsService.updateAccount(this.account.id, updateAccount).subscribe({
        next: (response: any) => {
          this.accounts[this.findIndexById(this.account.id)] = this.account;
          this.messageService.add({ severity: 'success', summary: 'Operación exitosa', detail: 'Cuenta actualizada', life: 3000 });
          this.accountDialog = false;
          this.submitted = false;
        },
        error: (err: any) => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Error al actualizar la cuenta' });
          this.isSaving = false;
        },
      });
    }
  }

  findIndexById(id: string): number {
    let index = -1;
    for (let i = 0; i < this.accounts.length; i++) {
      if (this.accounts[i].id === id) {
        index = i;
        break;
      }
    }
    return index;
  }

  onGlobalFilter(table: Table, event: Event) {
    table.filterGlobal((event.target as HTMLInputElement).value, 'contains');
  }

  validateEmail(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  getAvatarColor(name: string): string {
    if (!name) return '#6366f1';
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  getOwnerUsername(account: Account): string {
    return account?.owner?.username ?? '';
  }

  cancelDeletion(account: Account) {
    this.accountsService.cancelDeletion(account.id).subscribe({
      next: () => {
        account.status = 'active' as any;
        account.deletionScheduledAt = null;
        this.messageService.add({
          severity: 'success',
          summary: 'Eliminación cancelada',
          detail: `La cuenta "${account.name}" volvió a estar activa.`,
          life: 4000
        });
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cancelar la eliminación. Intentá de nuevo.',
          life: 4000
        });
      }
    });
  }
}
