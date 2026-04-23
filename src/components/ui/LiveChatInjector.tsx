import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SCRIPT_ID = 'apex-livechat-injected'

const TAWK_SCRIPT = `
// var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
// (function(){
// var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
// s1.async=true;
// s1.src='https://embed.tawk.to/69dce3de5b2ee31c384247dd/1jm3dk7sf';
// s1.charset='UTF-8';
// s1.setAttribute('crossorigin','*');
// s0.parentNode.insertBefore(s1,s0);
// })();
`

/** Removes all previously injected live-chat nodes */
function removeInjected() {
  document.querySelectorAll(`[data-apex-livechat]`).forEach(el => el.remove())
}

/**
 * Parses the stored script string and injects it into document.head.
 * Supports:
 *  - <script src="..."></script>          → external script
 *  - <script>/* inline code *\/</script>  → inline script
 *  - raw JS code (no tags)               → wrapped in a script element
 *  - multiple <script> tags in one block → each injected separately
 */
function injectScript(raw: string) {
  removeInjected()
  if (!raw.trim()) return

  const hasScriptTag = /<script[\s\S]*?>/i.test(raw)

  if (!hasScriptTag) {
    // Raw JS — wrap it
    const el = document.createElement('script')
    el.setAttribute('data-apex-livechat', 'true')
    el.id = SCRIPT_ID
    el.textContent = raw
    document.head.appendChild(el)
    return
  }

  // Parse one or more <script> tags out of the string
  const parser = new DOMParser()
  const doc = parser.parseFromString(`<html><head>${raw}</head></html>`, 'text/html')
  const scriptEls = doc.head.querySelectorAll('script')

  scriptEls.forEach((parsed, i) => {
    const el = document.createElement('script')
    el.setAttribute('data-apex-livechat', 'true')
    el.id = i === 0 ? SCRIPT_ID : `${SCRIPT_ID}-${i}`

    // Copy attributes (src, async, defer, type, etc.)
    Array.from(parsed.attributes).forEach(attr => {
      el.setAttribute(attr.name, attr.value)
    })

    if (parsed.src) {
      // External script — let the browser load it
      el.src = parsed.src
      el.async = parsed.async
    } else {
      el.textContent = parsed.textContent ?? ''
    }

    document.head.appendChild(el)
  })

  // Also pick up any <noscript> fallback blocks and append to body
  const noscriptEls = doc.head.querySelectorAll('noscript')
  noscriptEls.forEach((parsed, i) => {
    const el = document.createElement('noscript')
    el.setAttribute('data-apex-livechat', 'true')
    el.id = `${SCRIPT_ID}-noscript-${i}`
    el.innerHTML = parsed.innerHTML
    document.body.appendChild(el)
  })
}

export function LiveChatInjector() {
  const { pathname } = useLocation()

  // Show live chat on all pages EXCEPT admin and principal
  const isExcluded = pathname.startsWith('/admin') || pathname.startsWith('/principal')

  useEffect(() => {
    if (isExcluded) {
      removeInjected()
      return
    }
    injectScript(TAWK_SCRIPT)

    return () => {
      removeInjected()
    }
  }, [isExcluded])

  return null
}
