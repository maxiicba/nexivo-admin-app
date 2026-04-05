import { Component, Input, OnInit } from '@angular/core';
import { LayoutService } from "../service/app.layout.service";
import { MenuService } from "../app.menu.service";


@Component({
  selector: 'app-config',
  templateUrl: './app.config.component.html'
})
export class AppConfigComponent implements OnInit {

  @Input() minimal: boolean = false;

  scales: number[] = [12, 13, 14, 15, 16];

  constructor(public layoutService: LayoutService, public menuService: MenuService) { }

  ngOnInit(): void {
    this.loadConfig();
  }

  saveConfig(): void {
    const configToSave = {
      ...this.layoutService.config,
      scale: this.scale
    };
    localStorage.setItem('appConfig', JSON.stringify(configToSave));
  }
  stateOptions: any[] = [{ label: 'Modo día', value: 'day' }, { label: 'Modo noche', value: 'night' }];

  value: string = 'night';

  loadConfig(): void {
    const validThemes = ['lara-light-blue', 'lara-dark-blue'];
    const savedConfig = localStorage.getItem('appConfig');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      // Remap any invalid theme name to a valid one
      if (!validThemes.includes(config.theme)) {
        config.theme = config.colorScheme === 'dark' ? 'lara-dark-blue' : 'lara-light-blue';
        config.colorScheme = config.theme === 'lara-dark-blue' ? 'dark' : 'light';
        localStorage.setItem('appConfig', JSON.stringify(config));
      }
      this.layoutService.config.menuMode = config.menuMode;
      this.layoutService.config.inputStyle = config.inputStyle;
      this.layoutService.config.ripple = config.ripple;
      this.layoutService.config.theme = config.theme;
      this.layoutService.config.colorScheme = config.colorScheme;
      if (config.scale) {
        this.scale = config.scale;
        this.applyScale();
      }
      const themeLink = <HTMLLinkElement>document.getElementById('theme-css');
      if (themeLink && config.theme) {
        const newHref = `assets/layout/styles/theme/${config.theme}/theme.css?v=2`;
        themeLink.setAttribute('href', newHref);
      }
    }
    else {
      // Default: light mode
      const themeLink = <HTMLLinkElement>document.getElementById('theme-css');
      if (themeLink) {
        themeLink.setAttribute('href', 'assets/layout/styles/theme/lara-light-blue/theme.css?v=2');
      }
    }
  }





  get visible(): boolean {
    return this.layoutService.state.configSidebarVisible;
  }

  set visible(_val: boolean) {
    this.layoutService.state.configSidebarVisible = _val;
  }

  get scale(): number {
    return this.layoutService.config.scale;
  }

  set scale(_val: number) {
    this.layoutService.config.scale = _val;
  }

  // Getters y Setters que actualizan la configuración y la guardan
  get menuMode(): string {
    return this.layoutService.config.menuMode;
  }
  set menuMode(_val: string) {
    this.layoutService.config.menuMode = _val;
    this.saveConfig();
  }

  get inputStyle(): string {
    return this.layoutService.config.inputStyle;
  }
  set inputStyle(_val: string) {
    this.layoutService.config.inputStyle = _val;
    this.saveConfig();
  }

  get ripple(): boolean {
    return this.layoutService.config.ripple;
  }
  set ripple(_val: boolean) {
    this.layoutService.config.ripple = _val;
    this.saveConfig();
  }

  onConfigButtonClick(): void {
    this.layoutService.showConfigSidebar();
  }

  changeTheme(theme: string, colorScheme: string): void {
    const themeLink = <HTMLLinkElement>document.getElementById('theme-css');
    const newHref = themeLink.getAttribute('href')!.replace(this.layoutService.config.theme, theme);
    this.replaceThemeLink(newHref, () => {
      this.layoutService.config.theme = theme;
      this.layoutService.config.colorScheme = colorScheme;
      this.saveConfig(); // Guardamos la configuración después de actualizar el tema
      this.layoutService.onConfigUpdate();
    });
  }


  replaceThemeLink(href: string, onComplete: Function): void {
    const id = 'theme-css';
    const themeLink = <HTMLLinkElement>document.getElementById('theme-css');
    const cloneLinkElement = <HTMLLinkElement>themeLink.cloneNode(true);
    cloneLinkElement.setAttribute('href', href);
    cloneLinkElement.setAttribute('id', id + '-clone');
    themeLink.parentNode!.insertBefore(cloneLinkElement, themeLink.nextSibling);

    cloneLinkElement.addEventListener('load', () => {
      themeLink.remove();
      cloneLinkElement.setAttribute('id', id);
      onComplete();
    });
  }


  decrementScale(): void {
    this.scale--;
    this.applyScale();
    this.saveConfig();
  }

  incrementScale(): void {
    this.scale++;
    this.applyScale();
    this.saveConfig();
  }

  applyScale(): void {
    document.documentElement.style.fontSize = this.scale + 'px';
  }
}
