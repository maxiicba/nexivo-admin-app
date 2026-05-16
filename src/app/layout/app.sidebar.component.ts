import { Component, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { LayoutService } from "./service/app.layout.service";
import { AuthService } from '../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-sidebar',
    templateUrl: './app.sidebar.component.html',
    styles: [`:host { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }`]
})
export class AppSidebarComponent implements OnInit, OnDestroy {
    user: any = null;
    appVersion = 'v2.4.1';
    operational = true;
    private sub?: Subscription;

    constructor(
        public layoutService: LayoutService,
        private auth: AuthService,
        public el: ElementRef,
    ) { }

    ngOnInit(): void {
        this.sub = this.auth.currentUser$.subscribe(u => this.user = u);
        if (!this.user) this.user = this.auth.getCurrentUser();
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
    }

    get isCollapsed(): boolean {
        return this.layoutService.state.staticMenuDesktopInactive;
    }

    get userInitial(): string {
        const n = (this.user?.first_name || this.user?.email || 'N').toString();
        return n.trim().charAt(0).toUpperCase();
    }

    get userName(): string {
        if (!this.user) return 'Nexivo Admin';
        const first = this.user.first_name || '';
        const last = this.user.last_name || '';
        const full = `${first} ${last}`.trim();
        return full || (this.user.email || 'Nexivo Admin');
    }

    get userEmail(): string {
        return this.user?.email || 'admin@nexivo.io';
    }

    toggleCollapse(): void {
        if (this.layoutService.isDesktop()) {
            this.layoutService.state.staticMenuDesktopInactive = !this.layoutService.state.staticMenuDesktopInactive;
        } else {
            this.layoutService.state.staticMenuMobileActive = false;
        }
    }
}
