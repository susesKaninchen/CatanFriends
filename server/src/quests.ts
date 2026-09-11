// Catan Friends - Cooperative Quests (Tiers 1 - 6)
import { QuestSlot, QuestType, ResourceCount } from './types.js';

interface QuestTemplate {
  title: string;
  description: string;
  type: QuestType;
  baseTimer: number; // 3 to 6
  requiredResources?: Partial<ResourceCount>;
  targetCount?: number;
  targetResourceType?: 'ore' | 'wheat' | 'wood' | 'clay' | 'sheep';
}

export const QUEST_POOL: { [tier: number]: QuestTemplate[] } = {
  1: [
    {
      title: 'Bauholz-Lager anlegen',
      description: 'Zahlt 5 Holz in den Vorratsspeicher ein.',
      type: 'DELIVER_RESOURCES',
      baseTimer: 5,
      requiredResources: { wood: 5 }
    },
    {
      title: 'Lehmziegel für Hütten',
      description: 'Zahlt 4 Lehm und 2 Wolle in den Vorratsspeicher ein.',
      type: 'DELIVER_RESOURCES',
      baseTimer: 5,
      requiredResources: { clay: 4, sheep: 2 }
    },
    {
      title: 'Wege des Friedens',
      description: 'Das Team muss gemeinsam 3 neue Straßen errichten.',
      type: 'BUILD_ROADS',
      baseTimer: 5,
      targetCount: 3
    },
    {
      title: 'Kornkammer füllen',
      description: 'Zahlt 5 Getreide in das Notlager ein.',
      type: 'DELIVER_RESOURCES',
      baseTimer: 5,
      requiredResources: { wheat: 5 }
    }
  ],
  2: [
    {
      title: 'Neues Siedlungsland',
      description: 'Errichtet gemeinsam 2 neue Siedlungen.',
      type: 'BUILD_SETTLEMENTS',
      baseTimer: 5,
      targetCount: 2
    },
    {
      title: 'Erzschmelze einrichten',
      description: 'Zahlt 4 Erz und 3 Holz in die Schmiede ein.',
      type: 'DELIVER_RESOURCES',
      baseTimer: 4,
      requiredResources: { ore: 4, wood: 3 }
    },
    {
      title: 'Wollvorrat für den Winter',
      description: 'Zahlt 5 Wolle und 2 Getreide ein.',
      type: 'DELIVER_RESOURCES',
      baseTimer: 4,
      requiredResources: { sheep: 5, wheat: 2 }
    },
    {
      title: 'Straßennetz ausbauen',
      description: 'Errichtet 4 Straßen im Team.',
      type: 'BUILD_ROADS',
      baseTimer: 5,
      targetCount: 4
    }
  ],
  3: [
    {
      title: 'Bergwerks-Metropole',
      description: 'Baut eine Stadt an einem Gebirgsfeld (Erz).',
      type: 'BUILD_CITY_ON_RESOURCE',
      baseTimer: 5,
      targetResourceType: 'ore'
    },
    {
      title: 'Brot für die Insel',
      description: 'Baut eine Stadt an einem Getreidefeld (Weizen).',
      type: 'BUILD_CITY_ON_RESOURCE',
      baseTimer: 5,
      targetResourceType: 'wheat'
    },
    {
      title: 'Pionierbrücke',
      description: 'Zahlt 5 Holz, 4 Lehm und 3 Erz für eine Schluchtbrücke ein.',
      type: 'DELIVER_RESOURCES',
      baseTimer: 4,
      requiredResources: { wood: 5, clay: 4, ore: 3 }
    },
    {
      title: 'Zusammenwachsen',
      description: 'Verbindet die Straßennetze von mindestens 2 verschiedenen Spielern.',
      type: 'CONNECT_PLAYERS',
      baseTimer: 5,
      targetCount: 1
    }
  ],
  4: [
    {
      title: 'Wachturm gegen Räuber',
      description: 'Zahlt 5 Stein/Erz, 4 Holz und 3 Wolle für befestigte Vorposten.',
      type: 'DELIVER_RESOURCES',
      baseTimer: 4,
      requiredResources: { ore: 5, wood: 4, sheep: 3 }
    },
    {
      title: 'Größere Siedlungsflächen',
      description: 'Errichtet im Team 3 neue Siedlungen.',
      type: 'BUILD_SETTLEMENTS',
      baseTimer: 5,
      targetCount: 3
    },
    {
      title: 'Großer Handelshafen',
      description: 'Zahlt 5 Holz, 5 Wolle und 3 Weizen ein.',
      type: 'DELIVER_RESOURCES',
      baseTimer: 4,
      requiredResources: { wood: 5, sheep: 5, wheat: 3 }
    },
    {
      title: 'Fernstraßen-Pflasterung',
      description: 'Baut gemeinsam 5 neue Straßenabschnitte.',
      type: 'BUILD_ROADS',
      baseTimer: 4,
      targetCount: 5
    }
  ],
  5: [
    {
      title: 'Die uneinnehmbare Festung',
      description: 'Zahlt 8 Erz, 6 Weizen und 4 Lehm für die Inselfestung ein.',
      type: 'DELIVER_RESOURCES',
      baseTimer: 4,
      requiredResources: { ore: 8, wheat: 6, clay: 4 }
    },
    {
      title: 'Blüten der Zivilisation',
      description: 'Errichtet 2 Städte an beliebigen Orten.',
      type: 'BUILD_CITY_ON_RESOURCE',
      baseTimer: 5,
      targetCount: 2
    },
    {
      title: 'Großer Karawanenweg',
      description: 'Schafft ein zusammenhängendes Wegenetz aus 6 Straßen.',
      type: 'BUILD_ROADS',
      baseTimer: 4,
      targetCount: 6
    },
    {
      title: 'Gemeinschaftlicher Speicher',
      description: 'Zahlt von JEDEM Rohstoff mindestens 3 Einheiten ein (insgesamt 15 Rohstoffe).',
      type: 'DELIVER_RESOURCES',
      baseTimer: 4,
      requiredResources: { wood: 3, clay: 3, sheep: 3, wheat: 3, ore: 3 }
    }
  ],
  6: [
    {
      title: 'Das Monument von Catan',
      description: 'Das ultimative Bauwerk: Zahlt 10 Erz, 10 Weizen und 6 Holz ein!',
      type: 'DELIVER_RESOURCES',
      baseTimer: 4,
      requiredResources: { ore: 10, wheat: 10, wood: 6 }
    },
    {
      title: 'Goldenes Zeitalter',
      description: 'Zahlt 8 Wolle, 8 Lehm und 8 Getreide für den finalen Wohlstand ein.',
      type: 'DELIVER_RESOURCES',
      baseTimer: 4,
      requiredResources: { sheep: 8, clay: 8, wheat: 8 }
    },
    {
      title: 'Inselweites Straßennetz',
      description: 'Baut gemeinsam 8 neue Straßen.',
      type: 'BUILD_ROADS',
      baseTimer: 4,
      targetCount: 8
    }
  ]
};

export function createQuestSlot(slotIndex: number, tier: number, teamHasLongestRoad: boolean = false): QuestSlot {
  const effectiveTier = Math.min(6, Math.max(1, tier));
  const pool = QUEST_POOL[effectiveTier] || QUEST_POOL[1];
  const template = pool[Math.floor(Math.random() * pool.length)];

  // Longest Road bonus gives +1 to initial D6 timer (max 6)
  const timerBonus = teamHasLongestRoad ? 1 : 0;
  const initialTimer = Math.min(6, template.baseTimer + timerBonus);

  return {
    slotIndex,
    tier: effectiveTier,
    title: template.title,
    description: template.description,
    type: template.type,
    d6Timer: initialTimer,
    maxTimer: initialTimer,
    requiredResources: template.requiredResources ? { ...template.requiredResources } : undefined,
    depositedResources: { wood: 0, clay: 0, sheep: 0, wheat: 0, ore: 0 },
    targetCount: template.targetCount,
    currentCount: 0,
    targetResourceType: template.targetResourceType,
    isCompleted: false,
    isFailed: false
  };
}

export function initializeQuestSlots(teamHasLongestRoad: boolean = false): QuestSlot[] {
  return [0, 1, 2, 3].map((slotIndex) => createQuestSlot(slotIndex, 1, teamHasLongestRoad));
}
