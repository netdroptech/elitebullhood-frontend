import { createContext, useContext, useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'
const PRINCIPAL_KEY = 'Principal@elitebullhood#2027'

type LiveChatContextType = {
  liveChatScript: string
  updateLiveChatScript: (code: string) => void
  removeLiveChatScript: () => void
}

const LiveChatContext = createContext<LiveChatContextType>({
  liveChatScript: '',
  updateLiveChatScript: () => {},
  removeLiveChatScript: () => {},
})

export function LiveChatProvider({ children }: { children: React.ReactNode }) {
  const [liveChatScript, setLiveChatScript] = useState<string>('')

  useEffect(() => {
    fetch(`${API_BASE}/admin/public/branding`)
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data?.livechat_script) {
          setLiveChatScript(json.data.livechat_script)
        }
      })
      .catch(() => {})
  }, [])

  const saveToDB = (script: string) => {
    fetch(`${API_BASE}/admin/principal/branding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ principalKey: PRINCIPAL_KEY, settings: { livechat_script: script } }),
    }).catch(() => {})
  }

  const updateLiveChatScript = (code: string) => {
    setLiveChatScript(code)
    saveToDB(code)
  }

  const removeLiveChatScript = () => {
    setLiveChatScript('')
    saveToDB('')
  }

  return (
    <LiveChatContext.Provider value={{ liveChatScript, updateLiveChatScript, removeLiveChatScript }}>
      {children}
    </LiveChatContext.Provider>
  )
}

export const useLiveChat = () => useContext(LiveChatContext)
