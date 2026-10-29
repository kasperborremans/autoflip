/**
 * Ingebouwde kennis over veelgeflipte occasions: hoe snel ze verkopen en welke mankementen vaak
 * voorkomen. Dit is een vuistregel-lijst, geen garantie — controleer de auto altijd zelf.
 */

export type Brandstof = 'benzine' | 'diesel' | 'hybride' | 'elektrisch' | 'lpg'
export type Verkoop = 'snel' | 'normaal' | 'traag'

export interface Probleem {
  wat: string
  /** Waar je bij bezichtiging of proefrit op let. */
  check: string
  ernst: 'hoog' | 'middel'
  /** Ruwe reparatiekosten als het mis is. */
  kosten?: number
  /** Bouwjaren waarin het speelt. */
  van?: number
  tot?: number
  brandstof?: Brandstof
  /** Speelt alleen bij een automaat. */
  automaat?: boolean
}

export interface ModelInfo {
  merk: string
  model: string
  aliassen?: string[]
  verkoop: Verkoop
  waarom: string
  problemen: Probleem[]
}

// Mankementen die bij meerdere merken voorkomen (zelfde motor of versnellingsbak).
const DSG7: Probleem = {
  wat: '7-traps DSG (DQ200): mechatronic en koppelingen gaan vaak stuk',
  check: 'Proefrit koud én warm: schokken bij optrekken of terugschakelen, of een knipperend D-lampje = fors lager bieden of laten staan.',
  ernst: 'hoog', kosten: 2000, automaat: true, van: 2008,
}
const TSI_KETTING: Probleem = {
  wat: '1.2/1.4 TSI (tot ca. 2012): distributieketting rekt',
  check: 'Luister bij een koude start naar ratelen in de eerste seconden en vraag of de ketting al vervangen is.',
  ernst: 'hoog', kosten: 1200, van: 2006, tot: 2012, brandstof: 'benzine',
}
const DIESEL_DPF: Probleem = {
  wat: 'Roetfilter (DPF) en EGR-klep raken verstopt, vooral bij veel korte ritten',
  check: 'Let op storingslampjes en vermogensverlies tijdens de proefrit; vraag naar het ritprofiel van de vorige eigenaar.',
  ernst: 'middel', kosten: 1000, brandstof: 'diesel',
}
const PURETECH: Probleem = {
  wat: '1.0/1.2 PureTech: natte distributieriem brokkelt af en verstopt de oliepomp → motorschade',
  check: 'Vraag facturen van riemvervanging. Olielampje, oliedruk-melding of hoog olieverbruik = niet kopen.',
  ernst: 'hoog', kosten: 1500, van: 2013, brandstof: 'benzine',
}
const TCE12: Probleem = {
  wat: '1.2 TCe / DIG-T (2012–2016): hoog olieverbruik, kan tot motorschade leiden',
  check: 'Check het oliepeil en vraag hoeveel olie hij gebruikt; blauwe rook bij gasgeven = weglopen.',
  ernst: 'hoog', kosten: 2500, van: 2012, tot: 2016, brandstof: 'benzine',
}
const ECOBOOST: Probleem = {
  wat: '1.0 EcoBoost (2012–2018): koelvloeistoflek en oververhitting, natte distributieriem',
  check: 'Check of het koelvloeistofreservoir vol is en houd de temperatuurmeter in de gaten tijdens de proefrit.',
  ernst: 'hoog', kosten: 2000, van: 2012, tot: 2018, brandstof: 'benzine',
}
const POWERSHIFT: Probleem = {
  wat: 'Powershift-automaat: koppelingen en schakelunit falen vaak',
  check: 'Haperen, trillen of schokken bij langzaam optrekken (file) = probleem.',
  ernst: 'hoog', kosten: 1800, automaat: true, van: 2010,
}
const ROBOTBAK: Probleem = {
  wat: 'Geautomatiseerde handbak (robotbak): schokkerig en storingsgevoelig',
  check: 'Rijd er wat langer mee; trage of schokkende schakelingen en foutmeldingen zijn duur.',
  ernst: 'middel', kosten: 1200, automaat: true,
}
const CVT: Probleem = {
  wat: 'CVT-automaat: slijtage, slippen of jankend geluid',
  check: 'Lopen de toeren op zonder dat je sneller gaat, of hoor je gejank? Vraag of de olie ververst is.',
  ernst: 'middel', kosten: 2500, automaat: true,
}
const N47: Probleem = {
  wat: '2.0 diesel N47 (2007–2011): distributieketting achterop de motor rekt',
  check: 'Ratelend geluid achter de motor (warm, stationair) = ketting; reparatie is duur omdat de motor eruit moet.',
  ernst: 'hoog', kosten: 2500, van: 2007, tot: 2011, brandstof: 'diesel',
}
const ROEST = (waar: string): Probleem => ({
  wat: `Roest ${waar}`,
  check: 'Kijk onder de auto en achter de wielkasten; doorroesten kost je de APK.',
  ernst: 'middel', kosten: 600,
})
const KOPPELING: Probleem = {
  wat: 'Koppeling slijt relatief snel',
  check: 'Hoog aangrijpende koppeling of slippen bij optrekken in een hoge versnelling.',
  ernst: 'middel', kosten: 600,
}

export const MODELLEN: ModelInfo[] = [
  // Volkswagen-groep
  { merk: 'Volkswagen', model: 'Polo', verkoop: 'snel', waarom: 'Populaire, betaalbare beginnersauto.', problemen: [TSI_KETTING, DSG7, DIESEL_DPF] },
  { merk: 'Volkswagen', model: 'Golf', verkoop: 'snel', waarom: 'Altijd veel vraag, ook als ouder exemplaar.', problemen: [TSI_KETTING, DSG7, DIESEL_DPF] },
  { merk: 'Volkswagen', model: 'Up', aliassen: ['up!'], verkoop: 'snel', waarom: 'Goedkope, zuinige stadsauto; jonge kopers en tweede auto.', problemen: [{ ...ROBOTBAK, wat: 'ASG-robotbak: schokkerig, kopers haken vaak af' }, ROEST('rond de achterklep')] },
  { merk: 'Volkswagen', model: 'Passat', verkoop: 'normaal', waarom: 'Vooral gewild als (jonge) stationwagon; oude diesels lopen trager.', problemen: [DIESEL_DPF, DSG7, TSI_KETTING] },
  { merk: 'Volkswagen', model: 'Touran', verkoop: 'normaal', waarom: 'Gezinsauto met een kleinere doelgroep.', problemen: [TSI_KETTING, DSG7, DIESEL_DPF] },
  { merk: 'Audi', model: 'A3', verkoop: 'normaal', waarom: 'Premium uitstraling, maar kopers letten scherp op onderhoud.', problemen: [TSI_KETTING, DSG7, DIESEL_DPF] },
  { merk: 'Audi', model: 'A4', verkoop: 'normaal', waarom: 'Vaak hoge km-standen en dure reparaties.', problemen: [{ wat: '2.0 TFSI (2008–2012): extreem olieverbruik door zuigerveren', check: 'Vraag hoeveel olie hij gebruikt; aanslag in de uitlaat of olielampje = probleem.', ernst: 'hoog', kosten: 3000, van: 2008, tot: 2012, brandstof: 'benzine' }, { ...CVT, wat: 'Multitronic-automaat: bekend storingsgevoelig' }, DIESEL_DPF] },
  { merk: 'Seat', model: 'Ibiza', verkoop: 'snel', waarom: 'Sportieve, betaalbare hatchback.', problemen: [TSI_KETTING, DSG7, DIESEL_DPF] },
  { merk: 'Seat', model: 'Leon', verkoop: 'snel', waarom: 'Golf-techniek voor minder geld.', problemen: [TSI_KETTING, DSG7, DIESEL_DPF] },
  { merk: 'Skoda', model: 'Fabia', verkoop: 'snel', waarom: 'Ruim, nuchter en betrouwbaar imago.', problemen: [{ wat: '1.2 driecilinder (HTP, tot 2010): distributieketting en kleppen', check: 'Onrustig stationair of ratelen bij koude start.', ernst: 'middel', kosten: 1000, tot: 2010, brandstof: 'benzine' }, TSI_KETTING, DSG7] },
  { merk: 'Skoda', model: 'Octavia', verkoop: 'snel', waarom: 'Zeer gewild (ook bij taxi en zakelijk) — maar check km-stand.', problemen: [TSI_KETTING, DSG7, DIESEL_DPF] },

  // Opel
  { merk: 'Opel', model: 'Corsa', verkoop: 'snel', waarom: 'Goedkope, bekende stadsauto met veel onderdelen.', problemen: [{ wat: '1.2/1.4 (Corsa D): distributieketting en kettingspanner', check: 'Ratelen bij een koude start.', ernst: 'middel', kosten: 800, van: 2006, tot: 2014, brandstof: 'benzine' }, { ...ROBOTBAK, wat: 'Easytronic-robotbak: storingsgevoelig' }, KOPPELING] },
  { merk: 'Opel', model: 'Astra', verkoop: 'normaal', waarom: 'Veel aanbod, dus prijs is scherp.', problemen: [{ wat: '1.4 Turbo: koelvloeistoflekkage en turbo', check: 'Koelvloeistofpeil, zoete geur en witte rook.', ernst: 'middel', kosten: 900, van: 2010, brandstof: 'benzine' }, { ...ROBOTBAK, wat: 'Easytronic-robotbak (Astra H): storingsgevoelig' }, DIESEL_DPF] },
  { merk: 'Opel', model: 'Zafira', verkoop: 'normaal', waarom: '7-zitter, kleine maar vaste doelgroep.', problemen: [{ wat: 'Zafira B: kachelweerstand/ventilatie kan doorbranden (terugroepactie)', check: 'Werkt de kachel op alle standen? Vraag of de terugroepactie is uitgevoerd.', ernst: 'middel', kosten: 300, van: 2005, tot: 2014 }, DIESEL_DPF] },
  { merk: 'Opel', model: 'Insignia', verkoop: 'traag', waarom: 'Grote ex-lease auto met veel aanbod en hoge km-standen.', problemen: [DIESEL_DPF, { wat: 'Diesel: dubbelmassa-vliegwiel en koppeling', check: 'Gerammel bij stationair of trillen bij optrekken.', ernst: 'middel', kosten: 1200, brandstof: 'diesel' }] },

  // PSA / Stellantis
  { merk: 'Peugeot', model: '107', verkoop: 'snel', waarom: 'Goedkoop en zuinig; altijd kopers.', problemen: [KOPPELING, ROEST('in de achterwielkasten'), { ...ROBOTBAK, wat: '2-Tronic robotbak: schokkerig' }] },
  { merk: 'Peugeot', model: '108', verkoop: 'snel', waarom: 'Goedkoop en zuinig; altijd kopers.', problemen: [KOPPELING, ROBOTBAK] },
  { merk: 'Peugeot', model: '207', verkoop: 'normaal', waarom: 'Veel aanbod en wisselende betrouwbaarheid.', problemen: [{ wat: '1.6 THP / VTi: distributieketting rekt en olieverbruik', check: 'Ratelen bij koude start, olieverbruik navragen.', ernst: 'hoog', kosten: 1200, van: 2007, tot: 2013, brandstof: 'benzine' }, DIESEL_DPF] },
  { merk: 'Peugeot', model: '208', verkoop: 'snel', waarom: 'Populair, maar kopers kennen het PureTech-verhaal.', problemen: [PURETECH, DIESEL_DPF] },
  { merk: 'Peugeot', model: '308', verkoop: 'normaal', waarom: 'Veel ex-lease aanbod.', problemen: [PURETECH, DIESEL_DPF] },
  { merk: 'Peugeot', model: '2008', verkoop: 'snel', waarom: 'Kleine SUV, gewild.', problemen: [PURETECH] },
  { merk: 'Peugeot', model: '3008', verkoop: 'normaal', waarom: 'Gewilde SUV, maar duurder in te kopen.', problemen: [PURETECH, DIESEL_DPF] },
  { merk: 'Citroën', model: 'C1', verkoop: 'snel', waarom: 'Goedkoop en zuinig; altijd kopers.', problemen: [KOPPELING, ROEST('in de achterwielkasten'), ROBOTBAK] },
  { merk: 'Citroën', model: 'C3', verkoop: 'normaal', waarom: 'Comfortabel, maar lage restwaarde.', problemen: [PURETECH, DIESEL_DPF] },
  { merk: 'Citroën', model: 'C4 Picasso', aliassen: ['c4picasso', 'grand c4 picasso'], verkoop: 'traag', waarom: 'MPV’s zijn uit de mode; kleine doelgroep.', problemen: [PURETECH, { ...ROBOTBAK, wat: 'ETG6/EGS robotbak: schokkerig en storingsgevoelig' }, DIESEL_DPF] },

  // Renault / Dacia / Nissan
  { merk: 'Renault', model: 'Clio', verkoop: 'snel', waarom: 'Een van de best verkopende occasions.', problemen: [TCE12, { wat: 'EDC-automaat: koppelingsproblemen', check: 'Schokken bij optrekken en foutmeldingen.', ernst: 'middel', kosten: 1500, automaat: true }, DIESEL_DPF] },
  { merk: 'Renault', model: 'Twingo', verkoop: 'snel', waarom: 'Goedkope stadsauto.', problemen: [ROEST('rond dorpels en achterklep'), KOPPELING] },
  { merk: 'Renault', model: 'Megane', aliassen: ['mégane'], verkoop: 'normaal', waarom: 'Veel aanbod, lage restwaarde.', problemen: [TCE12, { wat: 'Kaartlezer/elektronica en handremmodule', check: 'Test start met de kaart en de elektrische handrem.', ernst: 'middel', kosten: 500 }, DIESEL_DPF] },
  { merk: 'Renault', model: 'Scenic', aliassen: ['scénic', 'grand scenic'], verkoop: 'traag', waarom: 'MPV met elektronicakwaaltjes; kopers zijn voorzichtig.', problemen: [TCE12, { wat: 'Elektrische handrem en kaartlezer vallen uit', check: 'Test start met de kaart en de handrem meerdere keren.', ernst: 'middel', kosten: 600 }, DIESEL_DPF] },
  { merk: 'Renault', model: 'Captur', verkoop: 'snel', waarom: 'Kleine SUV, gewild.', problemen: [TCE12, { wat: 'EDC-automaat: koppelingsproblemen', check: 'Schokken bij optrekken en foutmeldingen.', ernst: 'middel', kosten: 1500, automaat: true }] },
  { merk: 'Dacia', model: 'Sandero', verkoop: 'snel', waarom: 'Goedkoop en ruim; veel vraag.', problemen: [ROEST('aan de onderkant'), { ...ROBOTBAK, wat: 'Easy-R robotbak: schokkerig' }] },
  { merk: 'Dacia', model: 'Duster', verkoop: 'snel', waarom: 'Betaalbare SUV, houdt waarde goed.', problemen: [TCE12, ROEST('aan de ondervloer en subframe'), DIESEL_DPF] },
  { merk: 'Dacia', model: 'Logan', verkoop: 'normaal', waarom: 'Praktisch, maar weinig gewild imago.', problemen: [ROEST('aan de onderkant')] },
  { merk: 'Nissan', model: 'Micra', verkoop: 'snel', waarom: 'Simpele, betrouwbare stadsauto.', problemen: [{ wat: 'Distributieketting (K12, 1.2/1.4) kan gaan ratelen', check: 'Ratelen bij een koude start.', ernst: 'middel', kosten: 700, tot: 2010, brandstof: 'benzine' }, CVT] },
  { merk: 'Nissan', model: 'Qashqai', verkoop: 'normaal', waarom: 'Gewilde SUV, maar veel aanbod.', problemen: [TCE12, CVT, DIESEL_DPF] },
  { merk: 'Nissan', model: 'Juke', verkoop: 'normaal', waarom: 'Opvallend design, wisselende vraag.', problemen: [TCE12, CVT, { wat: '1.6 DIG-T turbo: turbo en olieverbruik', check: 'Rook bij gasgeven, fluitende turbo.', ernst: 'middel', kosten: 1500, brandstof: 'benzine' }] },

  // Ford
  { merk: 'Ford', model: 'Fiesta', verkoop: 'snel', waarom: 'Populair en goed rijdend.', problemen: [ECOBOOST, POWERSHIFT, DIESEL_DPF] },
  { merk: 'Ford', model: 'Focus', verkoop: 'normaal', waarom: 'Veel aanbod, dus scherpe prijzen.', problemen: [ECOBOOST, POWERSHIFT, DIESEL_DPF] },
  { merk: 'Ford', model: 'Ka', aliassen: ['ka+'], verkoop: 'snel', waarom: 'Goedkope stadsauto.', problemen: [ROEST('aan dorpels en wielkasten'), KOPPELING] },
  { merk: 'Ford', model: 'C-Max', aliassen: ['cmax', 'grand c-max'], verkoop: 'traag', waarom: 'MPV met kleine doelgroep.', problemen: [ECOBOOST, POWERSHIFT, DIESEL_DPF] },
  { merk: 'Ford', model: 'Mondeo', verkoop: 'traag', waarom: 'Grote ex-lease auto, veel aanbod en hoge km-standen.', problemen: [DIESEL_DPF, POWERSHIFT, ECOBOOST] },

  // Fiat / Alfa
  { merk: 'Fiat', model: '500', verkoop: 'snel', waarom: 'Hip en goedkoop; vooral bij jonge kopers.', problemen: [{ ...ROBOTBAK, wat: 'Dualogic-robotbak: storingsgevoelig en duur' }, { wat: '0.9 TwinAir: MultiAir-unit en onrustig lopen', check: 'Stotteren, storingslampje of slecht aanslaan.', ernst: 'middel', kosten: 1000, van: 2010, brandstof: 'benzine' }, ROEST('aan de onderkant')] },
  { merk: 'Fiat', model: 'Panda', verkoop: 'snel', waarom: 'Goedkope, praktische stadsauto.', problemen: [ROEST('aan de onderkant'), { ...ROBOTBAK, wat: 'Dualogic-robotbak: storingsgevoelig' }] },
  { merk: 'Fiat', model: 'Punto', verkoop: 'normaal', waarom: 'Lage restwaarde, matige vraag.', problemen: [ROEST('aan de onderkant'), { ...ROBOTBAK, wat: 'Dualogic-robotbak: storingsgevoelig' }] },
  { merk: 'Alfa Romeo', model: 'Giulietta', verkoop: 'traag', waarom: 'Liefhebbersmerk met kleine doelgroep en angst voor reparaties.', problemen: [{ wat: 'MultiAir-unit (1.4 TB MultiAir) faalt', check: 'Onrustig lopen, storingslampje, vermogensverlies.', ernst: 'hoog', kosten: 1200, brandstof: 'benzine' }, { ...ROBOTBAK, wat: 'TCT-automaat: storingsgevoelig' }] },
  { merk: 'Alfa Romeo', model: 'MiTo', aliassen: ['mito'], verkoop: 'traag', waarom: 'Liefhebbersmerk met kleine doelgroep.', problemen: [{ wat: 'MultiAir-unit faalt', check: 'Onrustig lopen, storingslampje, vermogensverlies.', ernst: 'hoog', kosten: 1200, brandstof: 'benzine' }] },

  // Japan / Korea
  { merk: 'Toyota', model: 'Aygo', verkoop: 'snel', waarom: 'Goedkoop, zuinig en betrouwbaar.', problemen: [KOPPELING, ROEST('in de achterwielkasten'), { ...ROBOTBAK, wat: 'x-shift robotbak: schokkerig' }] },
  { merk: 'Toyota', model: 'Yaris', verkoop: 'snel', waarom: 'Bekend om betrouwbaarheid; houdt waarde goed.', problemen: [{ ...ROBOTBAK, wat: 'MMT-robotbak (oudere Yaris): koppelingsactuator' }] },
  { merk: 'Toyota', model: 'Auris', verkoop: 'snel', waarom: 'Betrouwbaar, hybride is gewild.', problemen: [{ wat: 'Oudere hybride: accu-conditie', check: 'Vraag een hybride-accutest bij Toyota of een specialist.', ernst: 'middel', kosten: 1500, brandstof: 'hybride' }] },
  { merk: 'Toyota', model: 'Prius', verkoop: 'snel', waarom: 'Betrouwbaar; gewild bij taxi en veelrijders.', problemen: [{ wat: 'Hybride-accu verliest capaciteit op oudere exemplaren', check: 'Vraag een hybride-accutest; let op waarschuwingsdriehoek op het dashboard.', ernst: 'hoog', kosten: 1500, brandstof: 'hybride' }] },
  { merk: 'Toyota', model: 'Corolla', verkoop: 'snel', waarom: 'Betrouwbaar, altijd vraag.', problemen: [] },
  { merk: 'Kia', model: 'Picanto', verkoop: 'snel', waarom: 'Goedkoop en betrouwbaar; vaak nog fabrieksgarantie.', problemen: [] },
  { merk: 'Kia', model: 'Rio', verkoop: 'snel', waarom: 'Betrouwbaar met lange garantie.', problemen: [] },
  { merk: 'Kia', model: 'Ceed', aliassen: ["cee'd", 'ceed sw'], verkoop: 'snel', waarom: 'Betrouwbaar met lange garantie.', problemen: [DIESEL_DPF] },
  { merk: 'Hyundai', model: 'i10', verkoop: 'snel', waarom: 'Goedkoop en betrouwbaar.', problemen: [] },
  { merk: 'Hyundai', model: 'i20', verkoop: 'snel', waarom: 'Betrouwbaar, veel ruimte voor het geld.', problemen: [] },
  { merk: 'Hyundai', model: 'i30', verkoop: 'snel', waarom: 'Betrouwbaar met lange garantie.', problemen: [DIESEL_DPF] },
  { merk: 'Suzuki', model: 'Swift', verkoop: 'snel', waarom: 'Betrouwbaar en leuk om te rijden.', problemen: [ROEST('aan dorpels en onderkant')] },
  { merk: 'Suzuki', model: 'Alto', verkoop: 'snel', waarom: 'Goedkoopste vervoer; altijd kopers.', problemen: [ROEST('aan de onderkant')] },
  { merk: 'Mazda', model: '2', aliassen: ['mazda2'], verkoop: 'snel', waarom: 'Betrouwbaar en zuinig.', problemen: [ROEST('aan de achterwielkasten en dorpels')] },
  { merk: 'Mazda', model: '3', aliassen: ['mazda3'], verkoop: 'normaal', waarom: 'Betrouwbaar, maar roestgevoelig.', problemen: [ROEST('aan de achterwielkasten en subframe'), { wat: '2.2 Skyactiv-D: olieverdunning door roetfilter-regeneratie', check: 'Oliepeil boven max of naar diesel ruikende olie.', ernst: 'middel', kosten: 1500, brandstof: 'diesel' }] },
  { merk: 'Honda', model: 'Jazz', verkoop: 'snel', waarom: 'Zeer betrouwbaar en ruim; populair bij oudere kopers.', problemen: [{ ...CVT, tot: 2008 }] },
  { merk: 'Honda', model: 'Civic', verkoop: 'normaal', waarom: 'Betrouwbaar, maar kleinere doelgroep.', problemen: [{ ...ROBOTBAK, wat: 'i-Shift robotbak: schokkerig' }] },

  // Premium
  { merk: 'BMW', model: '1-serie', aliassen: ['1 serie', '116', '118', '120'], verkoop: 'normaal', waarom: 'Gewild merk, maar kopers zijn bang voor dure reparaties.', problemen: [N47, { wat: 'N43/N45 benzine: injectoren, bobines en kettingspanner', check: 'Onrustig stationair of storingslampje motor.', ernst: 'middel', kosten: 1000, brandstof: 'benzine' }] },
  { merk: 'BMW', model: '3-serie', aliassen: ['3 serie', '316', '318', '320'], verkoop: 'normaal', waarom: 'Altijd interesse, maar vaak hoge km-standen.', problemen: [N47, DIESEL_DPF] },
  { merk: 'Mercedes-Benz', model: 'A-klasse', aliassen: ['a klasse', 'a-class', 'a160', 'a170', 'a180'], verkoop: 'normaal', waarom: 'Populair bij oudere kopers.', problemen: [{ ...CVT, wat: 'Autotronic CVT (W169): slijtage' }, ROEST('aan dorpels en achterklep')] },
  { merk: 'Mercedes-Benz', model: 'C-klasse', aliassen: ['c klasse', 'c-class'], verkoop: 'normaal', waarom: 'Gewild, maar duur in onderhoud.', problemen: [DIESEL_DPF, ROEST('aan de wielkasten')] },
  { merk: 'Mini', model: 'Cooper', aliassen: ['one', 'mini'], verkoop: 'normaal', waarom: 'Gewild, maar R56 (2006–2013) heeft een slechte reputatie.', problemen: [{ wat: '1.6 benzine (R56, 2006–2013): distributieketting, olieverbruik en waterpomp', check: 'Ratelen bij koude start, olieverbruik en lekkages navragen.', ernst: 'hoog', kosten: 1500, van: 2006, tot: 2013, brandstof: 'benzine' }] },
  { merk: 'Volvo', model: 'V40', verkoop: 'normaal', waarom: 'Veilig en comfortabel; vraag is stabiel.', problemen: [DIESEL_DPF] },
  { merk: 'Smart', model: 'Fortwo', aliassen: ['for two', 'fortwo coupe'], verkoop: 'normaal', waarom: 'Stadsauto met specifieke doelgroep.', problemen: [{ ...ROBOTBAK, wat: 'Robotbak: koppelingsactuator' }, { wat: '1.0 benzine (451): olieverbruik en motorschade bij slecht onderhoud', check: 'Olieverbruik en rook bij gasgeven.', ernst: 'middel', kosten: 1500, brandstof: 'benzine' }] },

  // Merken met lage restwaarde
  { merk: 'Chevrolet', model: 'Spark', verkoop: 'traag', waarom: 'Merk is uit Europa vertrokken; lage restwaarde.', problemen: [ROEST('aan de onderkant')] },
  { merk: 'Chevrolet', model: 'Aveo', verkoop: 'traag', waarom: 'Merk is uit Europa vertrokken; lage restwaarde.', problemen: [ROEST('aan de onderkant')] },
  { merk: 'Chevrolet', model: 'Matiz', verkoop: 'traag', waarom: 'Oud en weinig gewild.', problemen: [ROEST('aan de onderkant')] },
]

export const MERKEN = [...new Set(MODELLEN.map((m) => m.merk))].sort()

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9+]/g, '')

const MERK_ALIASSEN: Record<string, string> = { vw: 'volkswagen', mercedes: 'mercedesbenz', alfa: 'alfaromeo' }

export const zelfdeMerk = (a: string, b: string) => {
  const x = MERK_ALIASSEN[norm(a)] ?? norm(a)
  const y = MERK_ALIASSEN[norm(b)] ?? norm(b)
  return x !== '' && x === y
}

/** Zoekt het model; "Golf 1.4 TSI Highline" vindt ook de Golf. */
export function zoekModel(merk: string, model: string): ModelInfo | undefined {
  const m = norm(model)
  if (!m) return undefined
  const kandidaten = MODELLEN.filter((info) => zelfdeMerk(info.merk, merk))
  // Langste naam eerst, zodat "C4 Picasso" voor een eventuele "C4" gaat.
  const namen = kandidaten
    .flatMap((info) => [info.model, ...(info.aliassen ?? [])].map((naam) => ({ info, naam: norm(naam) })))
    .sort((a, b) => b.naam.length - a.naam.length)
  return namen.find(({ naam }) => m === naam || m.startsWith(naam))?.info
}

export const modellenVan = (merk: string) => MODELLEN.filter((m) => zelfdeMerk(m.merk, merk)).map((m) => m.model)
