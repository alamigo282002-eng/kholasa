/**
 * KHULASA - MATERIAL DESIGN 3 DYNAMIC THEME ENGINE
 * Handles Theme Mode (Light / Dark / Sepia) and Material You Seed Palettes.
 */

const ThemeEngine = {
  currentTheme: 'light', // 'light' | 'dark' | 'sepia'
  currentPalette: 'default', // 'default' | 'emerald' | 'amber' | 'rose' | 'violet' | 'ocean'

  init() {
    // Load saved preferences
    const savedTheme = localStorage.getItem('khulasa_theme') || 'light';
    const savedPalette = localStorage.getItem('khulasa_palette') || 'default';
    
    this.setTheme(savedTheme, false);
    this.setPalette(savedPalette, false);
  },

  setTheme(mode, save = true) {
    this.currentTheme = mode;
    document.documentElement.setAttribute('data-theme', mode);
    
    // Update theme meta color for mobile browser bars
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      if (mode === 'dark') {
        metaThemeColor.setAttribute('content', '#121316');
      } else if (mode === 'sepia') {
        metaThemeColor.setAttribute('content', '#fbf0dc');
      } else {
        metaThemeColor.setAttribute('content', '#fdfbff');
      }
    }

    if (save) {
      localStorage.setItem('khulasa_theme', mode);
    }
  },

  setPalette(paletteName, save = true) {
    this.currentPalette = paletteName;
    if (paletteName === 'default') {
      document.documentElement.removeAttribute('data-palette');
    } else {
      document.documentElement.setAttribute('data-palette', paletteName);
    }

    if (save) {
      localStorage.setItem('khulasa_palette', paletteName);
    }
  },

  // Temporarily apply book seed color during reading mode
  applyBookSeed(hexColor) {
    if (!hexColor) return;
    document.documentElement.style.setProperty('--md-sys-color-primary', hexColor);
  },

  resetBookSeed() {
    document.documentElement.style.removeProperty('--md-sys-color-primary');
  }
};
