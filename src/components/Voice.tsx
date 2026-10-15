import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation, Link } from '@tanstack/react-router'
import { Volume2, VolumeX, Square, X } from 'lucide-react'
import { useOptimisticAction } from '@/lib/actions'
import { setSpokenReplies } from '@/server/voice'
import type { Workspace } from './AppShell'

type VoiceState = {
  supported: boolean; voices: SpeechSynthesisVoice[]; selected: string; choose: (uri: string) => void
  speaking: boolean; message: string; speak: (text: string, enabled?: boolean) => void; stop: () => void
}
const VoiceContext = createContext<VoiceState | null>(null)
export function VoiceProvider({ children }: { children: ReactNode }) {
  const [supported, setSupported] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selected, choose] = useState('')
  const [speaking, setSpeaking] = useState(false)
  const [message, setMessage] = useState('')
  const utterance = useRef<SpeechSynthesisUtterance | null>(null)
  const path = useLocation({ select: location => location.pathname })
  const stop = useCallback(() => {
    utterance.current = null
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])
  useEffect(() => {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return
    setSupported(true)
    const load = () => setVoices(window.speechSynthesis.getVoices().filter(voice => voice.localService))
    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () => { window.speechSynthesis.removeEventListener('voiceschanged', load); stop() }
  }, [stop])
  useEffect(() => { if (path === '/login') stop() }, [path, stop])
  const speak = useCallback((text: string, enabled = true) => {
    if (!enabled) return
    stop()
    if (!supported) { setMessage('Spoken replies are not supported in this browser. Typed replies still work.'); return }
    const voice = voices.find(item => item.voiceURI === selected) ?? voices.find(item => item.lang.startsWith('en-GB')) ?? voices.find(item => item.lang.startsWith('en')) ?? voices[0]
    if (!voice) { setMessage('No on-device voice is available yet. Install an English voice in your device’s speech settings, then reopen this page. Typed replies still work.'); return }
    const speech = new SpeechSynthesisUtterance(text)
    speech.voice = voice
    speech.lang = voice.lang
    speech.rate = 0.95
    speech.pitch = 0.9
    utterance.current = speech
    speech.onstart = () => { if (utterance.current === speech) { setSpeaking(true); setMessage('JARVIS is speaking…') } }
    speech.onend = () => { if (utterance.current === speech) { utterance.current = null; setSpeaking(false); setMessage('Playback finished.') } }
    speech.onerror = () => { if (utterance.current === speech) { utterance.current = null; setSpeaking(false); setMessage('Voice playback was blocked or unavailable. Try Preview voice, check your volume, or continue with typed replies.') } }
    setMessage('Preparing voice…')
    try { window.speechSynthesis.speak(speech) } catch { utterance.current = null; setSpeaking(false); setMessage('Voice playback is unavailable. Typed replies still work.') }
  }, [supported, voices, selected, stop])
  return <VoiceContext.Provider value={{ supported, voices, selected, choose, speaking, message, speak, stop }}>{children}</VoiceContext.Provider>
}
export function useVoice() {
  const value = useContext(VoiceContext)
  if (!value) throw new Error('Voice controls require VoiceProvider.')
  return value
}
export function VoiceControls({ workspace }: { workspace: Workspace | null }) {
  const [open, setOpen] = useState(false)
  const voice = useVoice()
  const preference = useOptimisticAction({
    value: workspace?.profile?.spokenReplies ?? false,
    update: (_current: boolean, enabled: boolean) => enabled,
    action: (enabled: boolean) => setSpokenReplies({ data: { enabled } }),
  })
  return <div className="relative">
    <button type="button" className="icon-button" aria-label="JARVIS voice controls" title="JARVIS voice" aria-expanded={open} onClick={() => setOpen(!open)}>{preference.value ? <Volume2 size={18}/> : <VolumeX size={18}/>}</button>
    {open && <section aria-label="JARVIS voice" className="absolute right-0 top-11 z-50 w-[min(320px,calc(100vw-32px))] rounded-xl border border-slate-700 bg-[#101b29] p-5 text-slate-100 shadow-2xl">
      <div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-semibold">JARVIS voice</h2><button className="icon-button" aria-label="Close voice controls" onClick={() => setOpen(false)}><X size={16}/></button></div>
      <p className="mb-4 text-xs leading-relaxed text-slate-300">Spoken replies using your device’s installed voices, not Siri’s voice. To speak a command, use the opt-in microphone beside the command box where on-device recognition is supported.</p>
      {!voice.supported ? <p role="status" className="hint">This browser does not support spoken replies. You can still type commands and read responses.</p> : <div className="stack">
        {voice.voices.length ? <label>On-device voice<select value={voice.selected} onChange={event => { voice.stop(); voice.choose(event.target.value) }}><option value="">Automatic English voice</option>{voice.voices.map(item => <option key={item.voiceURI} value={item.voiceURI}>{item.name} · {item.lang}</option>)}</select></label> : <p className="hint">No on-device voices found. Enable an installed voice in your device’s speech settings and reload. Typed commands still work.</p>}
        <div className="flex flex-wrap gap-2"><button type="button" className="btn-secondary" onClick={() => voice.speak('Hello. I am JARVIS, your personal assistant. At your service.')}><Volume2 size={14}/> Preview voice</button><button type="button" className="btn-secondary" onClick={() => { voice.stop() }}><Square size={13}/> Stop</button></div>
        {workspace?.profile ? <label className="setting-choice"><span>Speak assistant replies<span className="hint block">{preference.pending ? 'Saving preference…' : preference.value ? 'On — replies are read aloud' : 'Off — typed replies only'}</span></span><input type="checkbox" checked={preference.value} onChange={event => { if (!event.target.checked) voice.stop(); preference.run(event.target.checked) }}/></label> : <p className="hint"><Link to="/login" className="text-link">Sign in and complete your profile</Link> to save spoken reply preferences.</p>}
      </div>}
      <p className="error" role="alert">{preference.error}</p><p className="hint mt-3" role="status">{voice.speaking ? 'JARVIS is speaking…' : voice.message}</p>
    </section>}
  </div>
}
