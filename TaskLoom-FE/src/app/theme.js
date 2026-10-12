const THEME_KEY = 'taskloom-theme'

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {

  }
}

export function getInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {

  }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}
