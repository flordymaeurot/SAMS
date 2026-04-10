import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'amber' | 'ocean' | 'forest' | 'rose' | 'violet' | 'slate';

export const THEMES: { id: Theme; name: string; description: string; colors: string[] }[] = [
  { id: 'amber',  name: 'Amber Dusk',    description: 'Warm amber & orange — the default',   colors: ['#f59e0b','#ea580c','#1e293b'] },
  { id: 'ocean',  name: 'Ocean Breeze',  description: 'Cool sky blue & indigo',               colors: ['#0ea5e9','#6366f1','#0f172a'] },
  { id: 'forest', name: 'Forest Canopy', description: 'Fresh green & lime',                   colors: ['#22c55e','#84cc16','#14532d'] },
  { id: 'rose',   name: 'Rose Garden',   description: 'Bold rose & pink',                     colors: ['#f43f5e','#ec4899','#4c0519'] },
  { id: 'violet', name: 'Violet Dusk',   description: 'Deep purple & violet',                 colors: ['#8b5cf6','#a855f7','#2e1065'] },
  { id: 'slate',  name: 'Midnight Slate','description': 'Minimal dark slate & charcoal',      colors: ['#64748b','#0f172a','#334155'] },
];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  currentTheme = signal<Theme>(this.loadTheme());

  constructor() {
    effect(() => {
      this.applyTheme(this.currentTheme());
    });
  }

  setTheme(theme: Theme) {
    this.currentTheme.set(theme);
    localStorage.setItem('sams-theme', theme);
  }

  private loadTheme(): Theme {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('sams-theme') : null;
    return (saved as Theme) || 'amber';
  }

  private applyTheme(theme: Theme) {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }
}
