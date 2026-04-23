import { useState, useRef, useEffect } from 'react'
import { Globe, Search, Check } from 'lucide-react'

// ─── Language list ────────────────────────────────────────────────────────────
// Google Translate language codes
const LANGUAGES = [
  { code: 'af',    name: 'Afrikaans' },
  { code: 'sq',    name: 'Albanian' },
  { code: 'am',    name: 'Amharic' },
  { code: 'ar',    name: 'Arabic' },
  { code: 'hy',    name: 'Armenian' },
  { code: 'as',    name: 'Assamese' },
  { code: 'ay',    name: 'Aymara' },
  { code: 'az',    name: 'Azerbaijani' },
  { code: 'bm',    name: 'Bambara' },
  { code: 'eu',    name: 'Basque' },
  { code: 'be',    name: 'Belarusian' },
  { code: 'bn',    name: 'Bengali' },
  { code: 'bho',   name: 'Bhojpuri' },
  { code: 'bs',    name: 'Bosnian' },
  { code: 'bg',    name: 'Bulgarian' },
  { code: 'ca',    name: 'Catalan' },
  { code: 'ceb',   name: 'Cebuano' },
  { code: 'ny',    name: 'Chichewa' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'co',    name: 'Corsican' },
  { code: 'hr',    name: 'Croatian' },
  { code: 'cs',    name: 'Czech' },
  { code: 'da',    name: 'Danish' },
  { code: 'dv',    name: 'Dhivehi' },
  { code: 'doi',   name: 'Dogri' },
  { code: 'nl',    name: 'Dutch' },
  { code: 'en',    name: 'English' },
  { code: 'eo',    name: 'Esperanto' },
  { code: 'et',    name: 'Estonian' },
  { code: 'ee',    name: 'Ewe' },
  { code: 'tl',    name: 'Filipino' },
  { code: 'fi',    name: 'Finnish' },
  { code: 'fr',    name: 'French' },
  { code: 'fy',    name: 'Frisian' },
  { code: 'gl',    name: 'Galician' },
  { code: 'ka',    name: 'Georgian' },
  { code: 'de',    name: 'German' },
  { code: 'el',    name: 'Greek' },
  { code: 'gn',    name: 'Guarani' },
  { code: 'gu',    name: 'Gujarati' },
  { code: 'ht',    name: 'Haitian Creole' },
  { code: 'ha',    name: 'Hausa' },
  { code: 'haw',   name: 'Hawaiian' },
  { code: 'iw',    name: 'Hebrew' },
  { code: 'hi',    name: 'Hindi' },
  { code: 'hmn',   name: 'Hmong' },
  { code: 'hu',    name: 'Hungarian' },
  { code: 'is',    name: 'Icelandic' },
  { code: 'ig',    name: 'Igbo' },
  { code: 'ilo',   name: 'Ilocano' },
  { code: 'id',    name: 'Indonesian' },
  { code: 'ga',    name: 'Irish' },
  { code: 'it',    name: 'Italian' },
  { code: 'ja',    name: 'Japanese' },
  { code: 'jw',    name: 'Javanese' },
  { code: 'kn',    name: 'Kannada' },
  { code: 'kk',    name: 'Kazakh' },
  { code: 'km',    name: 'Khmer' },
  { code: 'rw',    name: 'Kinyarwanda' },
  { code: 'gom',   name: 'Konkani' },
  { code: 'ko',    name: 'Korean' },
  { code: 'kri',   name: 'Krio' },
  { code: 'ku',    name: 'Kurdish (Kurmanji)' },
  { code: 'ckb',   name: 'Kurdish (Sorani)' },
  { code: 'ky',    name: 'Kyrgyz' },
  { code: 'lo',    name: 'Lao' },
  { code: 'la',    name: 'Latin' },
  { code: 'lv',    name: 'Latvian' },
  { code: 'ln',    name: 'Lingala' },
  { code: 'lt',    name: 'Lithuanian' },
  { code: 'lg',    name: 'Luganda' },
  { code: 'lb',    name: 'Luxembourgish' },
  { code: 'mk',    name: 'Macedonian' },
  { code: 'mai',   name: 'Maithili' },
  { code: 'mg',    name: 'Malagasy' },
  { code: 'ms',    name: 'Malay' },
  { code: 'ml',    name: 'Malayalam' },
  { code: 'mt',    name: 'Maltese' },
  { code: 'mi',    name: 'Maori' },
  { code: 'mr',    name: 'Marathi' },
  { code: 'mni-Mtei', name: 'Meitei (Manipuri)' },
  { code: 'lus',   name: 'Mizo' },
  { code: 'mn',    name: 'Mongolian' },
  { code: 'my',    name: 'Myanmar (Burmese)' },
  { code: 'ne',    name: 'Nepali' },
  { code: 'no',    name: 'Norwegian' },
  { code: 'or',    name: 'Odia (Oriya)' },
  { code: 'om',    name: 'Oromo' },
  { code: 'ps',    name: 'Pashto' },
  { code: 'fa',    name: 'Persian' },
  { code: 'pl',    name: 'Polish' },
  { code: 'pt',    name: 'Portuguese' },
  { code: 'pa',    name: 'Punjabi' },
  { code: 'qu',    name: 'Quechua' },
  { code: 'ro',    name: 'Romanian' },
  { code: 'ru',    name: 'Russian' },
  { code: 'sm',    name: 'Samoan' },
  { code: 'sa',    name: 'Sanskrit' },
  { code: 'gd',    name: 'Scots Gaelic' },
  { code: 'nso',   name: 'Sepedi' },
  { code: 'sr',    name: 'Serbian' },
  { code: 'st',    name: 'Sesotho' },
  { code: 'sn',    name: 'Shona' },
  { code: 'sd',    name: 'Sindhi' },
  { code: 'si',    name: 'Sinhala' },
  { code: 'sk',    name: 'Slovak' },
  { code: 'sl',    name: 'Slovenian' },
  { code: 'so',    name: 'Somali' },
  { code: 'es',    name: 'Spanish' },
  { code: 'su',    name: 'Sundanese' },
  { code: 'sw',    name: 'Swahili' },
  { code: 'sv',    name: 'Swedish' },
  { code: 'tg',    name: 'Tajik' },
  { code: 'ta',    name: 'Tamil' },
  { code: 'tt',    name: 'Tatar' },
  { code: 'te',    name: 'Telugu' },
  { code: 'th',    name: 'Thai' },
  { code: 'ti',    name: 'Tigrinya' },
  { code: 'ts',    name: 'Tsonga' },
  { code: 'tr',    name: 'Turkish' },
  { code: 'tk',    name: 'Turkmen' },
  { code: 'ak',    name: 'Twi' },
  { code: 'uk',    name: 'Ukrainian' },
  { code: 'ur',    name: 'Urdu' },
  { code: 'ug',    name: 'Uyghur' },
  { code: 'uz',    name: 'Uzbek' },
  { code: 'vi',    name: 'Vietnamese' },
  { code: 'cy',    name: 'Welsh' },
  { code: 'xh',    name: 'Xhosa' },
  { code: 'yi',    name: 'Yiddish' },
  { code: 'yo',    name: 'Yoruba' },
  { code: 'zu',    name: 'Zulu' },
]

// ─── Helper: trigger Google Translate ────────────────────────────────────────
function applyGoogleTranslate(langCode: string) {
  // Attempt 1: use the hidden combo select
  const sel = document.querySelector('.goog-te-combo') as HTMLSelectElement | null
  if (sel) {
    sel.value = langCode
    sel.dispatchEvent(new Event('change'))
    return
  }

  // Attempt 2: use the cookie approach (fallback)
  // Google Translate reads a cookie named "googtrans" formatted as /en/<lang>
  document.cookie = `googtrans=/en/${langCode}; path=/`
  document.cookie = `googtrans=/en/${langCode}; domain=${window.location.hostname}; path=/`
  window.location.reload()
}

// ─── Component ────────────────────────────────────────────────────────────────
export function LanguageSwitcher() {
  const [open,     setOpen]     = useState(false)
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState<string>(() => {
    return localStorage.getItem('apex_lang') ?? 'en'
  })
  const dropRef    = useRef<HTMLDivElement>(null)
  const searchRef  = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Auto-focus search when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 60)
  }, [open])

  function selectLang(code: string) {
    setSelected(code)
    localStorage.setItem('apex_lang', code)
    setOpen(false)
    setSearch('')
    applyGoogleTranslate(code)
  }

  const filtered = search.trim()
    ? LANGUAGES.filter(l => l.name.toLowerCase().includes(search.toLowerCase()))
    : LANGUAGES

  const currentLang = LANGUAGES.find(l => l.code === selected)

  return (
    <div ref={dropRef} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="Change language"
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '6px 10px', borderRadius: 8,
          background: open ? 'rgba(255,255,255,0.08)' : 'transparent',
          border: open ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
          cursor: 'pointer',
          color: 'hsl(240 5% 65%)',
          fontSize: 12, fontWeight: 500,
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => {
          if (!open) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
            e.currentTarget.style.color = 'hsl(40 6% 90%)'
          }
        }}
        onMouseLeave={e => {
          if (!open) {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'hsl(240 5% 65%)'
          }
        }}
      >
        <Globe size={15} />
        <span style={{ display: 'none' }} className="sm:inline">
          {currentLang?.name.split(' ')[0] ?? 'Language'}
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 'min(280px, calc(100vw - 24px))',
          borderRadius: 12, zIndex: 300,
          background: 'hsl(260 87% 5%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          animation: 'langDropIn 0.15s ease',
        }}>
          <style>{`
            @keyframes langDropIn {
              from { opacity: 0; transform: translateY(-6px) scale(0.97); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>

          {/* Header */}
          <div style={{
            padding: '12px 12px 8px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'hsl(240 5% 45%)', marginBottom: 8 }}>
              SELECT LANGUAGE
            </p>
            {/* Search */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'rgba(255,255,255,0.06)', borderRadius: 8,
              padding: '6px 10px',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <Search size={13} style={{ color: 'hsl(240 5% 45%)', flexShrink: 0 }} />
              <input
                ref={searchRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search languages…"
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  fontSize: 12, color: 'hsl(40 6% 88%)',
                  caretColor: '#a78bfa',
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(240 5% 45%)', padding: 0, fontSize: 14, lineHeight: 1 }}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Language list */}
          <div style={{ maxHeight: 260, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: 'hsl(240 5% 45%)' }}>No languages found</p>
              </div>
            ) : (
              filtered.map((lang, i) => {
                const isSelected = lang.code === selected
                return (
                  <button
                    key={lang.code}
                    onClick={() => selectLang(lang.code)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px',
                      background: isSelected ? 'rgba(167,139,250,0.1)' : 'transparent',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                  >
                    <span style={{ flex: 1, fontSize: 12.5, fontWeight: isSelected ? 600 : 400, color: isSelected ? '#c4b5fd' : 'hsl(40 6% 78%)' }}>
                      {lang.name}
                    </span>
                    {isSelected && <Check size={13} style={{ color: '#a78bfa', flexShrink: 0 }} />}
                  </button>
                )
              })
            )}
          </div>

          {/* Footer note */}
          <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: 10, color: 'hsl(240 5% 38%)', textAlign: 'center' }}>
              Powered by Google Translate · {LANGUAGES.length} languages
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
