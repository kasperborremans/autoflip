import { createClient } from '@supabase/supabase-js'
import type { Auto, Betaler } from '../types'
import { newId } from '../util'
import { normaliseer, type Backend } from './types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// Login bewaren in de browser en automatisch verlengen, zodat je ingelogd blijft tot je zelf uitlogt.
export const supabase =
  url && anonKey
    ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } })
    : null

const BUCKET = 'fotos'

/** Een rij in de tabel autos zoals Postgres hem teruggeeft (lege velden zijn null). */
interface Rij {
  id: string
  merk: string
  model: string
  bouwjaar: number | null
  kilometerstand: number | null
  kenteken: string | null
  status: Auto['status']
  aankoopprijs: number
  aankoopdatum: string
  kosten: Auto['kosten']
  vraagprijs: number | null
  verkoopprijs: number | null
  verkoopdatum: string | null
  notities: string
  fotos: string[]
  betaald_door: Betaler | null
  ontvangen_door: Betaler | null
  verrekend: boolean
  link: string | null
}

const vanRij = (r: Rij): Auto =>
  normaliseer({
    id: r.id,
    merk: r.merk,
    model: r.model,
    bouwjaar: r.bouwjaar ?? undefined,
    kilometerstand: r.kilometerstand ?? undefined,
    kenteken: r.kenteken ?? undefined,
    status: r.status,
    aankoopprijs: Number(r.aankoopprijs),
    aankoopdatum: r.aankoopdatum,
    kosten: r.kosten,
    vraagprijs: r.vraagprijs ?? undefined,
    verkoopprijs: r.verkoopprijs ?? undefined,
    verkoopdatum: r.verkoopdatum ?? undefined,
    notities: r.notities,
    fotos: r.fotos,
    betaaldDoor: r.betaald_door ?? undefined,
    ontvangenDoor: r.ontvangen_door ?? undefined,
    verrekend: r.verrekend,
    link: r.link ?? undefined,
  })

// Expliciet null meesturen zodat een leeggemaakt veld ook in de database leeg wordt.
const naarRij = (a: Auto): Rij => ({
  id: a.id,
  merk: a.merk,
  model: a.model,
  bouwjaar: a.bouwjaar ?? null,
  kilometerstand: a.kilometerstand ?? null,
  kenteken: a.kenteken || null,
  status: a.status,
  aankoopprijs: a.aankoopprijs,
  aankoopdatum: a.aankoopdatum,
  kosten: a.kosten,
  vraagprijs: a.vraagprijs ?? null,
  verkoopprijs: a.verkoopprijs ?? null,
  verkoopdatum: a.verkoopdatum || null,
  notities: a.notities,
  fotos: a.fotos,
  betaald_door: a.betaaldDoor ?? null,
  ontvangen_door: a.ontvangenDoor ?? null,
  verrekend: a.verrekend,
  link: a.link || null,
})

function check<T>({ data, error }: { data: T; error: { message: string } | null }): T {
  if (error) throw new Error(error.message)
  return data
}

const signedUrls = new Map<string, { url: string; verloopt: number }>()

export function supabaseBackend(): Backend {
  const sb = supabase!
  return {
    mode: 'gedeeld',
    async list() {
      const rows = check(await sb.from('autos').select('*'))
      return (rows as Rij[]).map(vanRij)
    },
    async save(auto) {
      check(await sb.from('autos').upsert({ ...naarRij(auto), bijgewerkt_op: new Date().toISOString() }))
    },
    async saveAll(autos) {
      if (autos.length) check(await sb.from('autos').upsert(autos.map(normaliseer).map(naarRij)))
    },
    async remove(auto) {
      check(await sb.from('autos').delete().eq('id', auto.id))
      await this.deleteFotos(auto.fotos)
    },
    async uploadFoto(autoId, foto) {
      const path = `${autoId}/${newId()}.jpg`
      check(await sb.storage.from(BUCKET).upload(path, foto, { contentType: 'image/jpeg' }))
      return path
    },
    async deleteFotos(paths) {
      if (paths.length) check(await sb.storage.from(BUCKET).remove(paths))
      paths.forEach((p) => signedUrls.delete(p))
    },
    async fotoUrl(path) {
      const cached = signedUrls.get(path)
      if (cached && cached.verloopt > Date.now()) return cached.url
      const signedUrl = check(await sb.storage.from(BUCKET).createSignedUrl(path, 3600))!.signedUrl
      signedUrls.set(path, { url: signedUrl, verloopt: Date.now() + 3500_000 })
      return signedUrl
    },
    subscribe(onChange) {
      const channel = sb
        .channel('autos')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'autos' }, onChange)
        .subscribe()
      return () => void sb.removeChannel(channel)
    },
  }
}
