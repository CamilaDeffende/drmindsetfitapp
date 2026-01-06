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