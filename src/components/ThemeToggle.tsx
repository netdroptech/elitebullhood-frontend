import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 34, height: 34, borderRadius: 8,
        background: 'transparent',
        border: '1px solid transparent',
        cursor: 'pointer',
        color: isDark ? 'hsl(240 5% 65%)' : 'hsl(240 5% 40%)',
        transition: 'all 0.15s',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
        e.currentTarget.style.color = isDark ? 'hsl(40 6% 90%)' : 'hsl(240 5% 20%)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent'
        e.currentTarget.style.borderColor = 'transparent'
        e.currentTarget.style.color = isDark ? 'hsl(240 5% 65%)' : 'hsl(240 5% 40%)'
      }}
    >
      {isDark
        ? <Moon size={16} />
        : <Sun  size={16} />
      }
    </button>
  )
}
