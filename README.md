# autoflip

Auto's flippen met Lenno — een web-app om de auto's die we kopen, opknappen en verkopen bij te houden.

## Functies

- **Overzicht** — gerealiseerde winst, kapitaal in voorraad, verwachte winst, gemiddelde winst en doorlooptijd per auto.
- **Auto's** — per auto aankoopprijs, kosten (reparaties, APK, poetsen…), vraag-/verkoopprijs, status, notities en foto's.
- **Foto's** — meerdere foto's per auto (ook direct met je telefooncamera), automatisch verkleind; kies zelf de hoofdfoto.
- **Calculator** — bereken vóór aankoop of een auto de moeite waard is en wat je maximaal kunt bieden.
- **Gedeelde database met login** — jij en Lenno zien dezelfde gegevens, en wijzigingen van de ander verschijnen meteen.
- **Exporteren / importeren** — reservekopie als JSON-bestand.

Zonder Supabase-instellingen werkt de app ook, maar dan alleen lokaal in je browser en zonder login.

## Supabase instellen (eenmalig, gratis)

1. Maak een account en een nieuw project aan op [supabase.com](https://supabase.com).
2. Ga naar **SQL Editor**, plak de inhoud van [`supabase/schema.sql`](supabase/schema.sql) en klik **Run**.
3. Zet jullie e-mailadressen op de ledenlijst (ook in de SQL Editor):
   ```sql
   insert into public.leden (email) values ('jij@voorbeeld.nl'), ('lenno@voorbeeld.nl');
   ```
4. Maak de accounts aan via **Authentication → Users → Add user → Create new user**
   (vul e-mail en wachtwoord in en vink **Auto Confirm User** aan).
5. Zet onder **Authentication → Sign In / Providers** de optie **Allow new users to sign up** uit.
   Alleen mensen op de ledenlijst kunnen de gegevens zien, maar zo kan ook niemand anders een account aanmaken.
6. Kopieer onder **Project Settings → API** de **Project URL** en de **anon public key**.

## Lokaal draaien

```bash
npm install
cp .env.example .env.local   # vul de Supabase-gegevens in (of laat leeg voor lokale modus)
npm run dev
```

## Online zetten

Bij een push naar `main` bouwt de workflow in `.github/workflows/deploy.yml` de site en zet hem op GitHub Pages.

1. **Settings → Pages → Source**: kies **GitHub Actions**.
2. **Settings → Secrets and variables → Actions → Variables**: voeg `VITE_SUPABASE_URL` en `VITE_SUPABASE_ANON_KEY` toe.
   (De anon key mag openbaar zijn; de toegang wordt in de database afgeschermd via de ledenlijst.)
