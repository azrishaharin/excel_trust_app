// Modern UI theme configuration
export const theme = {
  colors: {
    // Primary colors
    primary: {
      main: '#2563eb', // Blue-600
      light: '#60a5fa', // Blue-400
      lighter: '#dbeafe', // Blue-100
      dark: '#1d4ed8', // Blue-700
      darker: '#1e40af', // Blue-800
    },
    // Neutral colors
    neutral: {
      white: '#ffffff',
      background: '#f8fafc', // Slate-50
      surface: '#f1f5f9', // Slate-100
      border: '#e2e8f0', // Slate-200
      text: {
        primary: '#1e293b', // Slate-800
        secondary: '#64748b', // Slate-500
        disabled: '#94a3b8', // Slate-400
      },
    },
    // Semantic colors
    semantic: {
      success: '#10b981', // Emerald-500
      error: '#ef4444', // Red-500
      warning: '#f59e0b', // Amber-500
      info: '#3b82f6', // Blue-500
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, -apple-system, sans-serif',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
};
