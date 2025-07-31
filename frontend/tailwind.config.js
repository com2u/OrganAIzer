// File: /home/com2u/src/OrganAIzer/frontend/tailwind.config.js
// Purpose: Tailwind CSS configuration for OrganAIzer Frontend
// Implements the pastel color system and design specifications

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      fontFamily: {
        'mono': ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', 'Courier', 'monospace'],
      },
      colors: {
        'pastel-blue': '#A0C4FF',
        'pastel-purple': '#BDB2FF',
        'pastel-pink': '#FFC6FF',
        'pastel-red': '#FFADAD',
        'pastel-orange': '#FFD6A5',
        'pastel-yellow': '#FDFFB6',
        'pastel-green': '#CAFFBF',
        'pastel-cyan': '#9BF6FF',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
