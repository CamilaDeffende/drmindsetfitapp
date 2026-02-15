/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	theme: {
    	container: {
    		center: true,
    		padding: '2rem',
    		screens: {
    			'2xl': '1400px'
    		}
    	},
    	extend: {

      // MF_NEON_DS_V1
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "Apple Color Emoji",
          "Segoe UI Emoji"
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace"
        ],
      },
      colors: {
        mf: {
          bg: "hsl(var(--mf-bg) / <alpha-value>)",
          panel: "hsl(var(--mf-panel) / <alpha-value>)",
          panel2: "hsl(var(--mf-panel-2) / <alpha-value>)",
          text: "hsl(var(--mf-text) / <alpha-value>)",
          muted: "hsl(var(--mf-muted) / <alpha-value>)",
          border: "hsl(var(--mf-border) / <alpha-value>)",
          ring: "hsl(var(--mf-ring) / <alpha-value>)",
          neonBlue: "hsl(var(--mf-neon-blue) / <alpha-value>)",
          neonPurple: "hsl(var(--mf-neon-purple) / <alpha-value>)",
          neonGreen: "hsl(var(--mf-neon-green) / <alpha-value>)",
          danger: "hsl(var(--mf-danger) / <alpha-value>)",
          warn: "hsl(var(--mf-warn) / <alpha-value>)",
          ok: "hsl(var(--mf-ok) / <alpha-value>)",
        },
      },
      boxShadow: {
        "mf-soft": "0 10px 30px -12px rgba(0,0,0,.55)",
        "mf-glow-blue": "0 0 0 1px rgba(0,0,0,.1), 0 0 28px -6px hsl(var(--mf-neon-blue) / .55)",
        "mf-glow-purple": "0 0 0 1px rgba(0,0,0,.1), 0 0 28px -6px hsl(var(--mf-neon-purple) / .55)",
        "mf-glow-green": "0 0 0 1px rgba(0,0,0,.1), 0 0 28px -6px hsl(var(--mf-neon-green) / .55)",
      },
      backgroundImage: {
        "mf-radial":
          "radial-gradient(1200px circle at var(--mf-spot-x, 40%) var(--mf-spot-y, 0%), hsl(var(--mf-neon-blue) / .18), transparent 40%), radial-gradient(900px circle at 70% 20%, hsl(var(--mf-neon-purple) / .16), transparent 42%), radial-gradient(800px circle at 20% 60%, hsl(var(--mf-neon-green) / .12), transparent 45%)",
        "mf-grid":
          "linear-gradient(to right, rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.04) 1px, transparent 1px)",
      },
      keyframes: {
        "mf-float": { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-2px)" } },
        "mf-pulseGlow": { "0%,100%": { filter: "drop-shadow(0 0 0 rgba(0,0,0,0))" }, "50%": { filter: "drop-shadow(0 0 14px hsl(var(--mf-neon-blue) / .45))" } },
      },
      animation: {
        "mf-float": "mf-float 4s ease-in-out infinite",
        "mf-pulseGlow": "mf-pulseGlow 3.2s ease-in-out infinite",
      },
      borderRadius: {
        mf: "1.25rem",
      },

    		colors: {
    			border: 'var(--border)',
    			input: 'var(--input)',
    			ring: 'var(--ring)',
    			background: 'var(--background)',
    			foreground: 'var(--foreground)',
    			primary: {
    				DEFAULT: 'var(--primary)',
    				foreground: 'var(--primary-foreground)'
    			},
    			secondary: {
    				DEFAULT: 'var(--secondary)',
    				foreground: 'var(--secondary-foreground)'
    			},
    			destructive: {
    				DEFAULT: 'var(--destructive)',
    				foreground: 'var(--destructive-foreground)'
    			},
    			muted: {
    				DEFAULT: 'var(--muted)',
    				foreground: 'var(--muted-foreground)'
    			},
    			accent: {
    				DEFAULT: 'var(--accent)',
    				foreground: 'var(--accent-foreground)'
    			},
    			popover: {
    				DEFAULT: 'var(--popover)',
    				foreground: 'var(--popover-foreground)'
    			},
    			card: {
    				DEFAULT: 'var(--card)',
    				foreground: 'var(--card-foreground)'
    			},
    			sidebar: {
    				DEFAULT: 'var(--sidebar)',
    				foreground: 'var(--sidebar-foreground)',
    				primary: 'var(--sidebar-primary)',
    				'primary-foreground': 'var(--sidebar-primary-foreground)',
    				accent: 'var(--sidebar-accent)',
    				'accent-foreground': 'var(--sidebar-accent-foreground)',
    				border: 'var(--sidebar-border)',
    				ring: 'var(--sidebar-ring)'
    			}
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		keyframes: {
    			'fade-in': {
    				'0%': {
    					opacity: '0'
    				},
    				'100%': {
    					opacity: '1'
    				}
    			},
    			'slide-up': {
    				'0%': {
    					transform: 'translateY(20px)',
    					opacity: '0'
    				},
    				'100%': {
    					transform: 'translateY(0)',
    					opacity: '1'
    				}
    			},
    			'scale-in': {
    				'0%': {
    					transform: 'scale(0.95)',
    					opacity: '0'
    				},
    				'100%': {
    					transform: 'scale(1)',
    					opacity: '1'
    				}
    			},
    			'accordion-down': {
    				from: {
    					height: '0'
    				},
    				to: {
    					height: 'var(--radix-accordion-content-height)'
    				}
    			},
    			'accordion-up': {
    				from: {
    					height: 'var(--radix-accordion-content-height)'
    				},
    				to: {
    					height: '0'
    				}
    			}
    		},
    		animation: {
    			'fade-in': 'fade-in 0.6s ease-out',
    			'slide-up': 'slide-up 0.8s ease-out',
    			'scale-in': 'scale-in 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out'
    		},
    		fontFamily: {
    			sans: [
    				'var(--font-sans)',
    				'system-ui',
    				'sans-serif'
    			]
    		}
    	}
    },
	plugins: [require("tailwindcss-animate")],
};