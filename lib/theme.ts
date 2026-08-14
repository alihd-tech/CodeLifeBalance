export type Theme = "light" | "dark" | "system"

export const THEME_STORAGE_KEY = "clb-theme"
export const THEME_ORDER: Theme[] = ["light", "dark", "system"]

/**
 * Runs before first paint so a stored theme never flashes the wrong colors.
 * Kept as a string because it has to be inlined into the document head.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='light'||t==='dark'){document.documentElement.classList.add(t)}}catch(e){}})()`
