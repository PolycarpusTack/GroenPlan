import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, Sprout, Search, Map, Sparkles, CheckSquare, CalendarDays,
  Bean, Shovel, Bot, WifiOff, ShieldCheck, HelpCircle, PlusCircle,
} from "lucide-react";
import { PageContainer } from "../components/PageContainer";

interface SectieDef {
  id: string;
  icoon: typeof BookOpen;
  titel: string;
}

const SECTIES: SectieDef[] = [
  { id: "aan-de-slag", icoon: Sprout, titel: "Aan de slag" },
  { id: "ontdekken", icoon: Search, titel: "Planten ontdekken & matchscore" },
  { id: "handmatig", icoon: PlusCircle, titel: "Planten handmatig toevoegen" },
  { id: "tuinkaart", icoon: Map, titel: "Tuinkaart & Zone Designer" },
  { id: "architect", icoon: Sparkles, titel: "AI Tuin Architect" },
  { id: "taken", icoon: CheckSquare, titel: "Taken & herhaling" },
  { id: "overzichten", icoon: CalendarDays, titel: "Kalender, dagboek & bodem" },
  { id: "zaadbank", icoon: Bean, titel: "Zaadbank" },
  { id: "veldmodus", icoon: Shovel, titel: "Veld-modus" },
  { id: "ai-bronnen", icoon: Bot, titel: "AI-functies, bronnen & sleutels" },
  { id: "offline", icoon: WifiOff, titel: "Offline gebruik & installeren" },
  { id: "privacy", icoon: ShieldCheck, titel: "Privacy" },
  { id: "faq", icoon: HelpCircle, titel: "Veelgestelde vragen" },
];

function Sectie({ id, icoon: Icoon, titel, children }: SectieDef & { children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-moss-100 flex items-center justify-center shrink-0">
          <Icoon size={17} className="text-moss-700" aria-hidden />
        </div>
        <h2 className="font-display text-heading-lg text-moss-900">{titel}</h2>
      </div>
      <div className="gp-card-bordered space-y-3 text-body-sm text-moss-800 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function Stap({ children }: { children: ReactNode }) {
  return <li className="ml-4 list-decimal marker:text-moss-500">{children}</li>;
}

export function GidsPagina() {
  const navigate = useNavigate();

  return (
    <PageContainer maxWidth="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-11 h-11 rounded-xl bg-moss-600 flex items-center justify-center shrink-0">
          <BookOpen size={22} className="text-white" aria-hidden />
        </div>
        <div>
          <h1 className="font-display text-display-md text-moss-900 leading-tight">Gids</h1>
          <p className="text-body text-moss-500">Alles wat je met GroenPlan kunt doen, op één plek.</p>
        </div>
      </div>

      {/* Inhoudsopgave */}
      <nav aria-label="Inhoudsopgave" className="gp-card-bordered mb-8">
        <p className="text-caption text-[var(--gp-text-mute)] uppercase tracking-wide mb-2">Inhoud</p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
          {SECTIES.map(({ id, icoon: Icoon, titel }) => (
            <li key={id}>
              <a href={`#${id}`} className="flex items-center gap-2 text-body-sm text-moss-700 hover:text-moss-900 hover:underline">
                <Icoon size={14} className="text-moss-500 shrink-0" aria-hidden />
                {titel}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-10">
        <Sectie id="aan-de-slag" icoon={Sprout} titel="Aan de slag">
          <p>GroenPlan helpt je je tuin te beheren als een levend systeem: je verdeelt je tuin in <strong>zones</strong>, voegt <strong>planten</strong> toe en krijgt op maat gemaakte aanbevelingen en taken.</p>
          <p className="font-medium text-moss-900">In drie stappen:</p>
          <ol className="space-y-1.5">
            <Stap>Maak een tuinzone aan via <button className="text-moss-600 hover:underline" onClick={() => navigate("/tuinkaart")}>Tuinkaart</button> — geef grondsoort, zon, pH, drainage en (optioneel) je gemeente op.</Stap>
            <Stap>Voeg planten toe via <button className="text-moss-600 hover:underline" onClick={() => navigate("/ontdek")}>Ontdek</button> (op naam of foto) of handmatig via de catalogus.</Stap>
            <Stap>Bekijk je matchscores, plaats planten in zones en volg de automatisch gegenereerde onderhoudstaken op.</Stap>
          </ol>
          <p className="text-caption text-[var(--gp-text-mute)]">Tip: stel je <strong>actieve zone</strong> in (in Tuinkaart) — matchscores en aanbevelingen worden steeds voor die zone berekend.</p>
        </Sectie>

        <Sectie id="ontdekken" icoon={Search} titel="Planten ontdekken & matchscore">
          <p>Op de <strong>Ontdek</strong>-pagina zoek je planten op naam (Nederlands, Engels of wetenschappelijk) of via een foto. De gegevens worden automatisch ingevuld door AI; een foto wordt herkend via PlantNet.</p>
          <p>De <strong>matchscore</strong> (0–100%) geeft aan hoe goed een plant bij je actieve zone past. Hij combineert zes criteria met vaste gewichten:</p>
          <ul className="list-disc ml-5 space-y-0.5">
            <li>Grondsoort (25%) en zon (25%) — doorslaggevend</li>
            <li>pH (15%) en water/drainage (15%)</li>
            <li>Winterhardheid (10%) en bloeispreiding (10%)</li>
          </ul>
          <p>Ontbreekt er data voor een criterium? Dan wordt het gewicht herverdeeld — de score blijft betekenisvol. Planten worden getoond als <strong>aanbevolen</strong> en als <strong>gat-vullers</strong> (vullen een bloei-gat in je zone).</p>
        </Sectie>

        <Sectie id="handmatig" icoon={PlusCircle} titel="Planten handmatig toevoegen">
          <p>Geen AI-sleutel? Geen probleem. In de <button className="text-moss-600 hover:underline" onClick={() => navigate("/catalogus")}>Catalogus</button> kun je via <strong>"Handmatig toevoegen"</strong> zelf een plant invoeren.</p>
          <p>Vul minstens de wetenschappelijke naam in; de overige velden (zon, grondsoort, pH, drainage, water, hardheid, bloeimaanden, hoogte…) zijn optioneel. Wat je invult, wordt gebruikt voor de matchscore. Niet-ingevulde velden blijven leeg — er wordt <strong>niets gegokt</strong>. Zo bouw je je hele catalogus zonder enige AI op.</p>
        </Sectie>

        <Sectie id="tuinkaart" icoon={Map} titel="Tuinkaart & Zone Designer">
          <p>De <strong>Tuinkaart</strong> toont je zones met overlay-weergaven: Kaart, Zon &amp; schaduw, Irrigatie en Bodem. Klik een zone voor het detailpaneel.</p>
          <p>In het zone-detail vind je de <strong>Zone Designer</strong> met vijf tabbladen:</p>
          <ul className="list-disc ml-5 space-y-0.5">
            <li><strong>2D</strong> — sleep planten op hun eindbreedte-schaal</li>
            <li><strong>3D</strong> — isometrische weergave met hoogteprofiel (op volwassen hoogte)</li>
            <li><strong>Seizoenen</strong> — schuif door de maanden en zie wat bloeit</li>
            <li><strong>Companions</strong> — goede en slechte buren per plant</li>
            <li><strong>Analyse</strong> — bloeispreiding, biodiversiteit, onderhoudsdruk</li>
          </ul>
          <p>Daaronder vind je de bloeigantt, de companion-check en de AI Tuin Architect.</p>
        </Sectie>

        <Sectie id="architect" icoon={Sparkles} titel="AI Tuin Architect">
          <p>In het zone-detail beschrijf je je wensen (bv. "wilde border met veel kleur, aantrekkelijk voor bijen") en genereert de AI <strong>drie ontwerpvoorstellen</strong> met elk een andere stijl, plantenlijst en indicatoren (bloeidekking, companion-conflicten, biodiversiteit).</p>
          <p>Met <strong>"Pas toe op zone"</strong> worden de aanbevolen planten echt toegevoegd: ontbrekende planten worden opgehaald en er worden onderhoudstaken aangemaakt. Planten die al in de zone staan, worden overgeslagen.</p>
        </Sectie>

        <Sectie id="taken" icoon={CheckSquare} titel="Taken & herhaling">
          <p>Op de <button className="text-moss-600 hover:underline" onClick={() => navigate("/taken")}>Taken</button>-pagina beheer je al je tuintaken. Taken kunnen aan een zone gekoppeld zijn en een <strong>herhaling</strong> hebben (dagelijks, wekelijks, maandelijks of jaarlijks — in Outlook-stijl). Vink je een herhalende taak af, dan verschijnt automatisch de volgende.</p>
          <p>Achterstallige taken zie je als rode badge in de navigatie en op het dashboard.</p>
        </Sectie>

        <Sectie id="overzichten" icoon={CalendarDays} titel="Kalender, dagboek & bodem">
          <ul className="list-disc ml-5 space-y-1">
            <li><strong>Bloeikalender</strong> — wanneer welke planten in je tuin bloeien, over het hele jaar.</li>
            <li><strong>Groeidagboek</strong> — log observaties (bloei, groei, plaag, snoei…) met datum en type.</li>
            <li><strong>Bodem &amp; Metingen</strong> — houd pH-metingen per zone bij over de tijd (bv. na bekalking).</li>
          </ul>
        </Sectie>

        <Sectie id="zaadbank" icoon={Bean} titel="Zaadbank">
          <p>In de <button className="text-moss-600 hover:underline" onClick={() => navigate("/zaadbank")}>Zaadbank</button> houd je je zaadvoorraad bij: leverancier, aantal, <strong>zaaivenster</strong> (van/tot maand) en houdbaarheid. Je ziet meteen welke zaden je <strong>deze maand kunt zaaien</strong> en welke bijna verlopen zijn.</p>
          <p>Met <strong>"Zaai nu"</strong> markeer je een zaad als gezaaid en wordt automatisch een zaaitaak aangemaakt.</p>
        </Sectie>

        <Sectie id="veldmodus" icoon={Shovel} titel="Veld-modus">
          <p>De <button className="text-moss-600 hover:underline" onClick={() => navigate("/veld")}>Veld-modus</button> is gemaakt voor gebruik in de tuin, op je telefoon. Tegels:</p>
          <ul className="list-disc ml-5 space-y-0.5">
            <li><strong>Observatie</strong> — snel loggen wat je ziet</li>
            <li><strong>Taken</strong> — openstaande taken afvinken</li>
            <li><strong>Plant-ID</strong> — foto maken → herkenning, met daarna een optionele <strong>plagen- &amp; ziektecheck</strong> op dezelfde foto</li>
            <li><strong>Zoeken</strong> — een plant opzoeken</li>
            <li><strong>Mijn zone</strong> — vind via GPS de dichtstbijzijnde gemeente en je zones daar</li>
            <li><strong>Vraag AI</strong> — een tuincoach die je tuinvragen beantwoordt</li>
          </ul>
          <p>Bovenaan zie je een offline-indicator wanneer er geen verbinding is.</p>
        </Sectie>

        <Sectie id="ai-bronnen" icoon={Bot} titel="AI-functies, bronnen & sleutels">
          <p>GroenPlan gebruikt AI voor: auto-fill van plantgegevens, de Tuin Architect, plagen-detectie en de tuincoach. <strong>Elk AI-resultaat is eerlijk gelabeld</strong> met zijn bron:</p>
          <ul className="list-disc ml-5 space-y-0.5">
            <li><strong>AI</strong> — een echt antwoord van het taalmodel</li>
            <li><strong>Lokaal</strong> — een voorbeeld/heuristiek wanneer er geen verbinding of sleutel is (geen verzonnen, plant-specifieke data)</li>
          </ul>
          <p className="font-medium text-moss-900">Welke sleutel doet wat (in <code>.env</code>):</p>
          <ul className="list-disc ml-5 space-y-0.5">
            <li>Plant zoeken (Ontdek), Tuin Architect, plagen, coach → <code>ANTHROPIC_API_KEY</code></li>
            <li>Foto-herkenning → <code>PLANTNET_API_KEY</code></li>
            <li>Weer (Open-Meteo) → geen sleutel nodig</li>
          </ul>
          <p>Zonder sleutel blijven de functies werken in een duidelijk gelabelde lokale modus, en je kunt altijd planten <a href="#handmatig" className="text-moss-600 hover:underline">handmatig toevoegen</a>.</p>
        </Sectie>

        <Sectie id="offline" icoon={WifiOff} titel="Offline gebruik & installeren">
          <p>GroenPlan is een <strong>installeerbare web-app (PWA)</strong>. Je kunt hem via je browser "toevoegen aan beginscherm" en als losse app openen.</p>
          <p>Je tuin, zones, taken, dagboek en zaadbank worden lokaal op je toestel bewaard en blijven <strong>offline beschikbaar</strong>. Functies die het netwerk nodig hebben (AI, weer, foto-herkenning) wachten op verbinding; je ziet dan een offline-melding.</p>
        </Sectie>

        <Sectie id="privacy" icoon={ShieldCheck} titel="Privacy">
          <ul className="list-disc ml-5 space-y-1">
            <li>Foto's voor herkenning/plagen-analyse worden naar externe diensten (PlantNet, Anthropic) verzonden.</li>
            <li>Je GPS-locatie (Veld-modus → Mijn zone) wordt alleen lokaal gebruikt om de dichtstbijzijnde gemeente te bepalen — ze wordt niet opgeslagen of verzonden.</li>
            <li>Je tuindata staat lokaal in je browser, niet op een server.</li>
          </ul>
        </Sectie>

        <Sectie id="faq" icoon={HelpCircle} titel="Veelgestelde vragen">
          <div>
            <p className="font-medium text-moss-900">Waarom krijg ik een fout als ik een plant probeer te zoeken?</p>
            <p>Het zoeken op naam gebruikt AI auto-fill, en dat vereist een geldige <code>ANTHROPIC_API_KEY</code> in <code>.env</code> (en een herstart van de server). Foto-herkenning werkt los daarvan met de PlantNet-sleutel.</p>
          </div>
          <div>
            <p className="font-medium text-moss-900">Kan ik GroenPlan zonder AI gebruiken?</p>
            <p>Ja. Voeg planten <a href="#handmatig" className="text-moss-600 hover:underline">handmatig</a> toe; matchscore, zones, taken en alle overzichten werken volledig zonder AI-sleutel.</p>
          </div>
          <div>
            <p className="font-medium text-moss-900">Wat betekent het label "lokaal" bij een AI-resultaat?</p>
            <p>Dat er geen AI-verbinding was; je kreeg een algemeen voorbeeld in plaats van een op maat gegenereerd antwoord. Er wordt nooit plant-specifieke data verzonnen.</p>
          </div>
          <div>
            <p className="font-medium text-moss-900">Werkt de app op mijn telefoon?</p>
            <p>Ja — installeer hem als PWA en gebruik de Veld-modus in de tuin. Alle secties bereik je via het navigatiemenu.</p>
          </div>
        </Sectie>
      </div>

      <p className="text-caption text-[var(--gp-text-mute)] mt-10 text-center">
        Nog vragen of een idee? GroenPlan is in actieve ontwikkeling — feedback is welkom.
      </p>
    </PageContainer>
  );
}
