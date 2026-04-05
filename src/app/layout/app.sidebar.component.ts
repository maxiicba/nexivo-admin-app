import { Component, ElementRef } from '@angular/core';
import { LayoutService } from "./service/app.layout.service";

@Component({
    selector: 'app-sidebar',
    templateUrl: './app.sidebar.component.html',
    styles: [`:host { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }`]
})
export class AppSidebarComponent {

    constructor(
        public layoutService: LayoutService,
        public el: ElementRef,
    ) { }

    get isCollapsed(): boolean {
        return this.layoutService.state.staticMenuDesktopInactive;
    }

    toggleCollapse(): void {
        if (this.layoutService.isDesktop()) {
            this.layoutService.state.staticMenuDesktopInactive = !this.layoutService.state.staticMenuDesktopInactive;
        } else {
            this.layoutService.state.staticMenuMobileActive = false;
        }
    }
}
