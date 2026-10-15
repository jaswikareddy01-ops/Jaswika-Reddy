import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowRight, ShieldCheck, ChevronLeft } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { useAction } from '@/lib/actions'
import { getIdentity, saveProfile } from '@/server/profile'
import { normalizePhone, requiredText } from '@/lib/validation'
import { Orb } from '@/components/Orb'

export const Route = createFileRoute('/login')({ loader: () => getIdentity(), component: Login })
function Login() {
  const identity = Route.useLoaderData()
  const navigate = useNavigate()
  const [register, setRegister] = useState(false)
  const [name, setName] = useState(identity?.profile?.name ?? identity?.user.name ?? '')
  const [phone, setPhone] = useState(identity?.profile?.phone ?? '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const signout = useAction(() => authClient.signOut())
  const submit = useAction(async () => {
    if (identity) {
      await saveProfile({ data: { name, phone, accent: 'cyan', reducedMotion: false } })
      return { ok: true }
    }
    if (register) {
      requiredText(name, 'Name', 80)
      normalizePhone(phone)
      const result = await authClient.signUp.email({ name: name.trim(), email, password })
      if (result.error) return result
      await saveProfile({ data: { name, phone, accent: 'cyan', reducedMotion: false } })
      return { ok: true }
    }
    return authClient.signIn.email({ email, password })
  }, { onSuccess: () => navigate({ to: '/' }) })
  return <main className="auth-page"><Link to="/" className="back-link"><ChevronLeft size={16}/> Back to command center</Link><div className="auth-layout"><section className="auth-intro"><div className="brand-mark">J<span>Λ</span>RVIS<span className="brand-dot">.</span></div><div className="eyebrow">YOUR PERSONAL INTELLIGENCE</div><Orb/><h2>A little less chaos.<br/><span className="accent">A lot more clarity.</span></h2><p>Your tasks, thoughts, and plans. One private workspace, always within reach.</p><div className="secure-line"><ShieldCheck size={15}/> Private by design · No external AI services</div></section><section className="panel auth-card"><div className="eyebrow">INITIALIZE YOUR WORKSPACE</div><h1>{identity ? 'Welcome back.' : register ? 'Meet your new assistant.' : 'Welcome back, human.'}</h1><p className="muted">{identity ? `Signed in as ${identity.user.email}` : register ? 'Create your profile to bring everything together.' : 'Sign in to reconnect with your personal workspace.'}</p>{identity?.profile ? <div className="stack"><Link to="/" className="btn-primary">Open command center <ArrowRight size={16}/></Link><button className="btn-secondary" onClick={() => signout.run()}>{signout.pending ? 'Signing out…' : 'Sign out / switch account'}</button><p className="error">{signout.error}</p></div> : <form onSubmit={event => { event.preventDefault(); submit.run() }}><fieldset disabled={!submit.ready} className="stack">{(register || identity) && <><label>Your name<input required maxLength={80} value={name} onChange={event => setName(event.target.value)} placeholder="Alex Morgan" autoComplete="name"/></label><label>Phone number<input required type="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder="+1 202 555 0148" autoComplete="tel"/></label><p className="hint">8–15 digits, optionally starting with +. This is contact information, not identity verification.</p></>}{!identity && <><label>Email address<input required type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email"/></label><label>Password<input required type="password" minLength={8} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 8 characters" autoComplete={register ? 'new-password' : 'current-password'}/></label></>}<p className="error" role="alert">{submit.error}</p><button className="btn-primary" type="submit">{submit.pending ? 'Connecting…' : identity ? 'Save profile & continue' : register ? 'Create my workspace' : 'Access workspace'}<ArrowRight size={17}/></button></fieldset></form>}{!identity && <p className="auth-switch">{register ? 'Already have a workspace?' : 'New to JARVIS?'} <button onClick={() => { setRegister(!register); submit.clearError() }}>{register ? 'Sign in' : 'Create an account'}</button></p>}{identity && !identity.profile && <button className="text-button" onClick={() => signout.run()}>{signout.pending ? 'Signing out…' : 'Sign out / switch account'}</button>}<div className="auth-foot"><ShieldCheck size={14}/> Your workspace is private to your account.</div></section></div><footer className="auth-footer">JARVIS PERSONAL ASSISTANT <span>DESIGNED TO KEEP YOU AHEAD.</span></footer></main>
}
