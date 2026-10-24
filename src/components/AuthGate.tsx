import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../backend'

/** Toont het inlogscherm totdat een lid is ingelogd. Zonder Supabase (lokale modus) wordt er niet ingelogd. */
export default function AuthGate({ children }: { children: (email: string | null) => React.ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(supabase ? undefined : null)
  const [isLid, setIsLid] = useState<boolean | undefined>()

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const email = session?.user.email
  useEffect(() => {
    if (!supabase || !email) return setIsLid(undefined)
    supabase.rpc('is_lid').then(({ data, error }) => setIsLid(!error && data === true))
  }, [email])

  if (!supabase) return <>{children(null)}</>
  if (session === undefined || (session && isLid === undefined)) return <div className="center muted">Laden…</div>
  if (!session) return <Login />
  if (!isLid)
    return (
      <div className="center">
        <div className="card stack narrow">
          <h2>Geen toegang</h2>
          <p className="muted">{email} staat niet op de ledenlijst. Vraag om toegevoegd te worden aan de tabel <code>leden</code> in Supabase.</p>
          <button className="ghost" onClick={() => supabase!.auth.signOut()}>Uitloggen</button>
        </div>
      </div>
    )
  return <>{children(email ?? null)}</>
}

function Login() {
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [fout, setFout] = useState<string | null>(null)
  const [bezig, setBezig] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBezig(true)
    const { error } = await supabase!.auth.signInWithPassword({ email, password: wachtwoord })
    setBezig(false)
    if (error) setFout(error.message === 'Invalid login credentials' ? 'Onjuist e-mailadres of wachtwoord.' : error.message)
  }

  return (
    <div className="center">
      <form className="card stack narrow" onSubmit={submit}>
        <h1>🚗 Autoflip</h1>
        <label className="field"><span>E-mailadres</span><input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="field"><span>Wachtwoord</span><input type="password" required autoComplete="current-password" value={wachtwoord} onChange={(e) => setWachtwoord(e.target.value)} /></label>
        {fout && <p className="neg">{fout}</p>}
        <button type="submit" disabled={bezig}>{bezig ? 'Inloggen…' : 'Inloggen'}</button>
      </form>
    </div>
  )
}
