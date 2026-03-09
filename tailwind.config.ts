import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        concrete: "hsl(var(--concrete))",
        stone: "hsl(var(--stone))",
        blueprint: "hsl(var(--blueprint))",
        terracotta: "hsl(var(--terracotta))",
        "warm-white": "hsl(var(--warm-white))",
        charcoal: "hsl(var(--charcoal))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        'display-lg': ['4rem', { lineHeight: '1.08', letterSpacing: '-0.035em', fontWeight: '800' }],
        'display': ['3.25rem', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '700' }],
        'display-sm': ['2.5rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        'body-lg': ['1.0625rem', { lineHeight: '1.7', fontWeight: '400' }],
        'body': ['0.9375rem', { lineHeight: '1.7', fontWeight: '400' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.6', fontWeight: '400' }],
        'caption': ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.02em', fontWeight: '500' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      boxShadow: {
        'soft': 'var(--shadow-soft)',
        'medium': 'var(--shadow-medium)',
        'strong': 'var(--shadow-strong)',
        'elevated': 'var(--shadow-elevated)',
        'glass': 'var(--glass-inner-glow), var(--shadow-medium)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translate3d(0, 8px, 0)" },
          to: { opacity: "1", transform: "translate3d(0, 0, 0)" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translate3d(0, 18px, 0)" },
          to: { opacity: "1", transform: "translate3d(0, 0, 0)" },
        },
        "fade-in-down": {
          from: { opacity: "0", transform: "translate3d(0, -10px, 0)" },
          to: { opacity: "1", transform: "translate3d(0, 0, 0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translate3d(-20px, 0, 0)" },
          to: { opacity: "1", transform: "translate3d(0, 0, 0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translate3d(20px, 0, 0)" },
          to: { opacity: "1", transform: "translate3d(0, 0, 0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale3d(0.94, 0.94, 1)" },
          to: { opacity: "1", transform: "scale3d(1, 1, 1)" },
        },
        "float": {
          "0%, 100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -10px, 0)" },
        },
        "shimmer-slide": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.25s cubic-bezier(0.22,1,0.36,1)",
        "accordion-up": "accordion-up 0.2s cubic-bezier(0.22,1,0.36,1)",
        "fade-in": "fade-in 0.5s cubic-bezier(0.22,1,0.36,1) forwards",
        "fade-in-up": "fade-in-up 0.6s cubic-bezier(0.22,1,0.36,1) forwards",
        "fade-in-down": "fade-in-down 0.5s cubic-bezier(0.22,1,0.36,1) forwards",
        "slide-in-left": "slide-in-left 0.5s cubic-bezier(0.22,1,0.36,1) forwards",
        "slide-in-right": "slide-in-right 0.5s cubic-bezier(0.22,1,0.36,1) forwards",
        "scale-in": "scale-in 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "float": "float 7s ease-in-out infinite",
        "shimmer-slide": "shimmer-slide 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
