/**
 * Central registry of static files served from /public/assets.
 * Components import from here — no raw asset path strings anywhere else.
 * Exception: index.html cannot import TS modules, so the favicon reference
 * lives directly in that file.
 */
export const ASSETS = {
  animations: {
    onboardingWelcome: '/assets/animations/onboarding-welcome.gif',
    onboardingTeam: '/assets/animations/onboarding-team.gif',
  },
  logos: {
    white: '/assets/logos/Lyzr_AI_logo_white.png',
    black: '/assets/logos/Lyzr_AI_logo_black.png',
  },
  icons: {
    github: '/assets/icons/github.svg',
    vercel: '/assets/icons/vercel.svg',
    supabase: '/assets/icons/supabase.svg',
    figma: '/assets/icons/figma.svg',
  },
  demo: {
    // Space in folder/file names must be %20-encoded for Vite `/public` serving.
    uiVideo: '/assets/UI%20Demo/UI%20Video.mp4',
  },
} as const
