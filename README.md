# autoflip

Auto's flippen met Lenno — een web-app om de auto's die we kopen, opknappen en verkopen bij te houden.

## Functies

- **Overzicht** — gerealiseerde winst, kapitaal in voorraad, verwachte winst, gemiddelde winst en doorlooptijd per auto.
- **Auto's** — per auto aankoopprijs, kosten (reparaties, APK, poetsen…), vraag-/verkoopprijs, status en notities.
- **Calculator** — bereken vóór aankoop of een auto de moeite waard is en wat je maximaal kunt bieden.
- **Exporteren / importeren** — gegevens als JSON-bestand opslaan of overzetten naar een ander apparaat.

> De gegevens worden lokaal in de browser opgeslagen. Wil je samen dezelfde lijst gebruiken,
> exporteer dan het bestand en importeer het bij de ander (of voeg later een gedeelde database toe).

## Lokaal draaien

```bash
npm install
npm run dev
```

## Online zetten

Bij een push naar `main` bouwt de workflow in `.github/workflows/deploy.yml` de site en zet hem op GitHub Pages.
Zet hiervoor eenmalig in de repo-instellingen **Settings → Pages → Source** op **GitHub Actions**.
