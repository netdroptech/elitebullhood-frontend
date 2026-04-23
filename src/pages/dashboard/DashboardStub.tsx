import { Construction } from 'lucide-react'

export function DashboardStub({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
      <div style={{
        width: 56, height: 56, borderRadius: '1rem', marginBottom: '1.25rem',
        background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Construction size={24} style={{ color: '#a78bfa' }} />
      </div>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'hsl(40 6% 92%)', marginBottom: 6 }}>
        {title}
      </h2>
      <p style={{ fontSize: 13, color: 'hsl(240 5% 50%)', maxWidth: 320 }}>
        This section is coming soon. We're building something great here.
      </p>
    </div>
  )
}
