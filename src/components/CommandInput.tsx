import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Mic, Square, Terminal } from 'lucide-react'
import { useVoice } from './Voice'

type RecognitionResult = { isFinal: boolean; 0: { transcript: string } }
type Recognition = {
  processLocally: boolean; lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number
  onresult: ((event: { results: ArrayLike<RecognitionResult> }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void; stop: () => void; abort: () => void
}
type RecognitionConstructor = {
  new(): Recognition
  prototype: Recognition
  available?: (options: { langs: string[]; processLocally: boolean }) => Promise<string>
  install?: (options: { langs: string[]; processLocally: boolean }) => Promise<boolean>
}
function localRecognition() {
  const browser = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }
  const constructor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition
  return constructor && 'processLocally' in constructor.prototype && constructor.available ? constructor : null
}

/** Local-only dictation; never silently fall back to a browser's remote speech service. */
export function CommandInput({ value, onChange, onSend, pending, ready = true }: {
  value: string; onChange: (value: string) => void; onSend: (value: string) => void; pending: boolean; ready?: boolean
}) {
  const voice = useVoice()
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [busy, setBusy] = useState(false)
  const [needsPack, setNeedsPack] = useState(false)
  const [message, setMessage] = useState('Checking on-device microphone support…')
  const recognition = useRef<Recognition | null>(null)
  const active = useRef(true)
  const operation = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const latest = useRef(value)
  latest.current = value
  const clearTimer = () => { if (timer.current) clearTimeout(timer.current); timer.current = null }
  const cancel = () => {
    operation.current += 1
    const current = recognition.current
    recognition.current = null
    if (current) { current.onresult = null; current.onerror = null; current.onend = null; current.abort() }
    clearTimer()
    setListening(false)
    setBusy(false)
  }
  useEffect(() => {
    active.current = true
    const supportedHere = window.isSecureContext && !!localRecognition()
    setSupported(supportedHere)
    setMessage(supportedHere ? 'Tap the microphone to speak in English. Review the text, then send.' : 'On-device voice input is unavailable here. Try an up-to-date Chrome browser with local speech support, or type your command.')
    return () => {
      active.current = false
      operation.current += 1
      const current = recognition.current
      recognition.current = null
      if (current) { current.onresult = null; current.onerror = null; current.onend = null; current.abort() }
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])
  async function start() {
    if (busy || listening) return
    const Constructor = localRecognition()
    if (!Constructor?.available) return
    const token = ++operation.current
    setBusy(true)
    setMessage('Checking the English on-device speech pack…')
    try {
      const availability = await Constructor.available({ langs: ['en-US'], processLocally: true })
      if (!active.current || operation.current !== token) return
      if (availability !== 'available') {
        setNeedsPack(availability === 'downloadable' || availability === 'downloading')
        setMessage(availability === 'downloadable' ? 'Download the English speech pack to enable on-device recognition. Your speech will not be sent to a speech service.' : availability === 'downloading' ? 'The speech pack is downloading. Try the microphone again when it finishes.' : 'Local English speech recognition is unavailable on this device. You can still type commands.')
        return
      }
      setNeedsPack(false)
      voice.stop()
      const current = new Constructor()
      current.processLocally = true
      current.lang = 'en-US'
      current.continuous = false
      current.interimResults = true
      current.maxAlternatives = 1
      const prefix = latest.current.trim()
      recognition.current = current
      current.onresult = event => {
        if (recognition.current !== current) return
        const transcript = Array.from(event.results).map(result => result[0].transcript).join(' ').trim()
        const text = [prefix, transcript].filter(Boolean).join(' ')
        latest.current = text.slice(0, 500)
        onChange(latest.current)
        setMessage(text.length > 500 ? 'Command limited to 500 characters. Review and edit before sending.' : 'Speech captured. Review or edit the command, then send.')
      }
      current.onerror = event => {
        if (recognition.current !== current) return
        setMessage(event.error === 'not-allowed' || event.error === 'service-not-allowed' ? 'Microphone access was denied or blocked. Allow it in browser site settings, then try again, or type.' : event.error === 'audio-capture' ? 'No microphone is available. Check your device microphone, or type.' : event.error === 'no-speech' ? 'No speech was heard. Tap the microphone to try again, or type.' : 'On-device speech recognition could not finish. Try again, or type your command.')
      }
      current.onend = () => {
        if (recognition.current !== current) return
        recognition.current = null
        clearTimer()
        setListening(false)
        input.current?.focus()
      }
      current.start()
      setListening(true)
      setMessage('Listening… speak your command. Tap Stop when finished. Nothing is sent automatically.')
      timer.current = setTimeout(() => { if (recognition.current === current) { current.stop(); setMessage('Listening stopped. Review the command, then send.') } }, 30000)
    } catch {
      cancel()
      if (active.current) setMessage('Local speech access was blocked or unavailable. Check microphone permissions or type your command.')
    } finally { if (active.current && operation.current === token) setBusy(false) }
  }
  async function install() {
    if (busy) return
    const Constructor = localRecognition()
    if (!Constructor?.install) { setMessage('Install an English on-device speech pack in your browser settings, then reload. Typing still works.'); return }
    const token = ++operation.current
    setBusy(true)
    setMessage('Downloading the English speech pack. This needs an internet connection; speech recognition stays on-device.')
    try {
      const installed = await Constructor.install({ langs: ['en-US'], processLocally: true })
      if (!active.current || operation.current !== token) return
      setNeedsPack(!installed)
      setMessage(installed ? 'Speech pack ready. Tap the microphone to speak.' : 'The speech pack could not be installed. Try again later, or type.')
    } catch { if (active.current && operation.current === token) setMessage('Speech pack download was blocked or failed. Try again later, or type.') }
    finally { if (active.current && operation.current === token) setBusy(false) }
  }
  return <form onSubmit={event => { event.preventDefault(); const command = latest.current; cancel(); onSend(command) }}>
    <fieldset disabled={!ready}>
      <div className="command-input"><Terminal size={16}/><input ref={input} aria-label="Assistant command" value={value} maxLength={500} required onChange={event => { cancel(); latest.current = event.target.value; onChange(event.target.value) }} placeholder="Tell JARVIS what you need…"/>
        {supported && <button type="button" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${listening ? 'border-cyan-400 bg-cyan-950 text-cyan-100' : 'border-slate-600 bg-slate-800 text-slate-100 hover:bg-slate-700'}`} aria-label={listening ? 'Stop listening' : busy ? 'Preparing microphone' : 'Speak command'} aria-pressed={listening} title={listening ? 'Stop listening' : 'Speak command'} onClick={() => { if (listening) { recognition.current?.stop(); setMessage('Listening stopped. Review the command, then send.') } else void start() }}>{listening ? <Square size={14}/> : busy ? <span>…</span> : <Mic size={16}/>}</button>}
        <button className="send-button" type="submit" aria-label={pending ? 'Working' : 'Send command'}>{pending ? <span>…</span> : <ArrowUp size={16}/>}</button>
      </div>
      <p className="hint mt-2" role="status" aria-live="polite">{message}</p>
      {needsPack && <button type="button" className="btn-secondary mt-2" onClick={() => void install()}>{busy ? 'Preparing speech pack…' : 'Download English speech pack'}</button>}
      <p className="hint mt-1">Microphone is opt-in, English only, and on-device. No wake word or automatic sending.</p>
    </fieldset>
  </form>
}
