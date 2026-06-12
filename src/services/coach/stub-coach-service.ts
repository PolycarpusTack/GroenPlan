import type { ICoachService } from "./coach-port";
import type { CoachAntwoord } from "./types";

// Lokale reserve voor wanneer er geen AI-verbinding is (offline / geen sleutel).
// Geeft eerlijke, algemene begeleiding op basis van trefwoorden — verzint geen
// specifieke feiten. De UI markeert dit duidelijk als lokaal antwoord.
const TIPS: { sleutels: string[]; tekst: string }[] = [
  {
    sleutels: ["water", "gieten", "droog", "droogte"],
    tekst: "Geef bij voorkeur 's ochtends of 's avonds water, diep en minder vaak, rechtstreeks op de wortelzone. Mulch houdt vocht vast en beperkt verdamping.",
  },
  {
    sleutels: ["snoei", "snoeien", "knippen"],
    tekst: "Snoei de meeste vaste planten en heesters na de bloei; verwijder dood, ziek of kruisend hout eerst. Werk met schoon, scherp gereedschap om infecties te vermijden.",
  },
  {
    sleutels: ["luis", "luizen", "plaag", "bladluis", "insect"],
    tekst: "Spuit bladluizen af met water of een milde zeepoplossing en trek natuurlijke vijanden aan (lieveheersbeestjes, gaasvliegen). Vermijd breedwerkende insecticiden.",
  },
  {
    sleutels: ["mest", "bemesten", "voeding", "compost"],
    tekst: "Werk in het voorjaar gecomposteerde mest of compost licht in de bodem. Organisch en mondjesmaat voorkomt overbemesting en uitspoeling.",
  },
  {
    sleutels: ["vorst", "winter", "overwinter", "koud"],
    tekst: "Bescherm vorstgevoelige planten met een laag mulch, bladeren of doek vóór de eerste nachtvorst. Potplanten zet je tegen een muur of binnen.",
  },
  {
    sleutels: ["zaai", "zaaien", "zaad"],
    tekst: "Zaai op de juiste diepte (vuistregel: 2× de zaaddikte) in vochtige grond en houd het zaaibed gelijkmatig vochtig tot kieming. Voorzaaien binnen geeft een voorsprong.",
  },
];

const ALGEMEEN =
  "Algemene tip: kies planten die passen bij je grondsoort, zon en het Belgische klimaat, en geef ze na het planten regelmatig water tot ze goed geworteld zijn.";

export class StubCoachService implements ICoachService {
  async vraag(vraag: string): Promise<CoachAntwoord> {
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
    const v = vraag.toLowerCase();
    const treffer = TIPS.find((t) => t.sleutels.some((s) => v.includes(s)));
    const kern = treffer ? treffer.tekst : ALGEMEEN;
    return {
      antwoord: `Je bent offline of er is geen AI-verbinding, dus dit is algemene begeleiding (geen op maat gemaakt AI-antwoord):\n\n${kern}`,
    };
  }
}
