/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      /*
       * ---------------------------------------------------------------------
       * COLOUR — iMessage-inspired dark mode.
       *
       *   plane  ink #121214 / sidebar #121214 / surface #18181b / bubble
       *          #26262a / input #1e1e22 — elevation is expressed by
       *          SURFACE VALUE plus a 1px #2c2c32 border on cards.
       *   text   paper (#E4E4E7)           — primary
       *          muted (#A1A1AA)           — secondary
       *   faint  #71717A                  — placeholder / decorative / disabled
       *                                       only. NOT for body text.
       *   accent #007AFF                  — primary CTA, send button
       *          #7C3AED                  — secondary highlights, badges
       * ---------------------------------------------------------------------
       */
      colors: {
        /* Planes — app frame to raised object. iMessage-inspired dark mode. */
        ink: '#121214',      // plane 0 — app background, chat canvas (--bg-app)
        sidebar: '#121214',  // plane 1 — rail, drawer, panel, incoming message (--bg-sidebar)
        surface: '#18181b',  // plane 2 — cards, composer, inputs, popovers (--bg-card)
        bubble: '#26262a',   // plane 2 alt — outgoing user message bubble (--bg-bubble-user)
        input: '#1e1e22',    // composer / input bar background (--bg-input)

        /* Controls. */
        action: '#323238',   // control fill, inactive track, scrollbar thumb
        paper: '#e4e4e7',    // primary text (--text-primary)
        white: '#ffffff',    // inverted CTA text on accent fills
        /** @deprecated Press tone for the primary button. Superseded by
         *  accent hover; kept so existing classnames do not break. */
        cream: '#F2F2F4',

        /* Accents — iMessage blue for primary actions, purple for highlights. */
        accent: '#007aff',   // --accent-blue — send button, primary CTA
        accentHover: '#0a84ff',
        accentPurple: '#7c3aed', // --accent-purple — badges, highlights
        accentPurpleSoft: '#a78bfa',
        accentRed: '#ff453a', // --accent-red — Apple system red (dark), headline + live accents only, never CTA

        /* Text. Hierarchy comes from size and weight, never
           from opacity — so `text-muted/60` and friends no longer exist. */
        muted: '#a1a1aa',    // secondary text (--text-secondary)
        faint: '#71717a',    // placeholder / decorative / disabled only (--text-muted)

        /* Borders / dividers — solid subtle line on dark. */
        line: '#2c2c32',     // --border-subtle
        lineSoft: 'rgba(44,44,50,0.6)',
      },

      /*
       * ---------------------------------------------------------------------
       * RADIUS — three values, nothing else.
       *   sm    8px  controls, cards, rows, menus, popovers
       *   md   12px  bubbles, composer, dialogs
       *   full      avatars, dots, chips — only when genuinely circular
       * `card` is a legacy alias of `sm`, migrated phase by phase.
       * ---------------------------------------------------------------------
       */
      borderRadius: {
        sm: '8px',
        md: '12px',
        card: '8px', // legacy alias → migrate to `sm`
      },

      /*
       * ---------------------------------------------------------------------
       * TYPE — six steps. Every `text-[Npx]` in the codebase maps to one of
       * these. Nothing renders below 11px; 11px is uppercase-only.
       * ---------------------------------------------------------------------
       */
      fontSize: {
        display: ['28px', { lineHeight: '34px', letterSpacing: '-0.02em' }],
        title: ['17px', { lineHeight: '22px', letterSpacing: '-0.01em' }],
        body: ['15px', { lineHeight: '22px' }],
        label: ['13px', { lineHeight: '18px' }],
        meta: ['12px', { lineHeight: '16px' }],
        micro: ['11px', { lineHeight: '14px', letterSpacing: '0.06em' }],
      },

      /*
       * ---------------------------------------------------------------------
       * MOTION — five named durations and two curves. Transform + opacity
       * only. Anything a user can re-trigger uses a `transition` (naturally
       * interruptible), never a keyframe `animation`.
       * ---------------------------------------------------------------------
       */
      transitionDuration: {
        instant: '120ms',
        enter: '200ms',
        exit: '140ms',
        shift: '260ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(.2,.8,.2,1)',
        depart: 'cubic-bezier(.4,0,1,1)',
        travel: 'cubic-bezier(.4,0,.2,1)',
      },

      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      keyframes: {
        /*
         * DEPRECATED — retained only so Phase 1 produces no visual diff.
         * Each is migrated in the phase that owns its call sites and then
         * deleted: fadeUp → Dialog/Popover/Toaster (P2), typingPulse →
         * StatusDot (P2/P5). Do not use in new code.
         */
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        typingPulse: {
          '0%, 100%': { opacity: '0.25', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },

        /* Overlay lifecycle. `enter` and `exit` are the pair that was
           previously missing — menus used to vanish rather than leave. */
        overlayIn: {
          '0%': { opacity: '0', transform: 'scale(.98) translateY(-2px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        overlayOut: {
          '0%': { opacity: '1', transform: 'scale(1) translateY(0)' },
          '100%': { opacity: '0', transform: 'scale(.98) translateY(-2px)' },
        },
        sheetIn: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        sheetOut: {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(-12px)' },
        },
        /* Content arrival. */
        rise: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        /* The single "something is happening" indicator. */
        pulse: {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '1' },
        },
        spin: { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        /* Deprecated aliases — see the matching keyframes above. */
        fadeUp: 'fadeUp 0.18s ease-out',
        typingPulse: 'typingPulse 1.1s ease-in-out infinite',
        shimmer: 'shimmer 1.4s linear infinite',

        'overlay-in': 'overlayIn 200ms cubic-bezier(.2,.8,.2,1)',
        'overlay-out': 'overlayOut 140ms cubic-bezier(.4,0,1,1)',
        'sheet-in': 'sheetIn 200ms cubic-bezier(.2,.8,.2,1)',
        'sheet-out': 'sheetOut 140ms cubic-bezier(.4,0,1,1)',
        rise: 'rise 180ms cubic-bezier(.2,.8,.2,1)',
        pulse: 'pulse 1.2s linear infinite',
        spin: 'spin 0.7s linear infinite',
      },
    },
  },
  plugins: [],
}
