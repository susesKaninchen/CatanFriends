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
      title: 'Erste Holzlieferung',
      description: 'Zahlt 2 Holz in den Vorratsspeicher ein.',
      type: 'DELIVER_RESOURCES',
      baseTimer: 6,
      requiredResources: { wood: 2 }
    },
    {
      title: 'Lehm für einfache Hütten',
      description: 'Zahlt 2 Lehm in den Vorratsspeicher ein.',
      type: 'DELIVER_RESOURCES',
      baseTimer: 6,
      requiredResources: { clay: 2 }
    },
    {
      title: 'Erste Weizenernte',
      description: 'Zahlt 2 Getreide in das Notlager ein.',
      type: 'DELIVER_RESOURCES',
      baseTimer: 6,
      requiredResources: { wheat: 2 }
    },
    {
      title: 'Wollspende der Hirten',
      description: 'Zahlt 2 Wolle für wärmende Decken ein.',
      type: 'DELIVER_RESOURCES',
      baseTimer: 6,
      requiredResources: { sheep: 2 }
    },
    {
      title: 'Erster Schürfversuch',
      description: 'Zahlt 2 Erz in die Werkstatt ein.',
      type: 'DELIVER_RESOURCES',
      baseTimer: 6,
      requiredResources: { ore: 2 }
    },
    {
      title: 'Gemeinsamer Pfad',
      description: 'Das Team muss gemeinsam 2 neue Straßen errichten.',
      type: 'BUILD_ROADS',
      baseTimer: 6,
      targetCount: 2
    }
  ],
  2: [
    {
      title: 'Bauholz-Lager anlegen',
      description: 'Zahlt 3 Holz in den Vorratsspeicher ein.',
      type: 'DELIVER_RESOURCES',
      baseTimer: 6,
      requiredResources: { wood: 3 }
    },
    {
      title: 'Ziegeldächer brennen',
      description: 'Zahlt 2 Lehm und 1 Wolle in den Speicher ein.',
      type: 'DELIVER_RESOURCES',
      baseTimer: 6,
      requiredResources: { clay: 2, sheep: 1 }
    },
    {
      title: 'Kornspeicher errichten',
      description: 'Zahlt 3 Getreide in das Magazin ein.',
      type: 'DELIVER_RESOURCES',
      baseTimer: 6,
      requiredResources: { wheat: 3 }
    },
    {
      title: 'Wege des Friedens',
      description: 'Errichtet gemeinsam 3 neue Straßen.',
      type: 'BUILD_ROADS',
      baseTimer: 6,
      targetCount: 3
    },
    {
      title: 'Neues Siedlungsland',
      description: 'Errichtet gemeinsam 1 neue Siedlung.',
      type: 'BUILD_SETTLEMENTS',
      baseTimer: 6,
      targetCount: 1
    },
    {
      title: 'Werkzeuge schmieden',
      description: 'Zahlt 2 Erz und 1 Holz für Werkzeuge ein.',
      type: 'DELIVER_RESOURCES',
      baseTimer: 6,
      requiredResources: { ore: 2, wood: 1 }
    }
  ],
  3: [
    {
      title: 'Erzschmelze einrichten',
      description: 'Zahlt 3 Erz und 2 Holz in die Schmiede ein.',
      type: 'DELIVER_RESOURCES',
      baseTimer: 6,
      requiredResources: { ore: 3, wood: 2 }
    },
    {
      title: 'Wollvorrat für den Winter',
      description: 'Zahlt 3 Wolle und 2 Getreide ein.',
      type: 'DELIVER_RESOURCES',
      baseTimer: 6,
      requiredResources: { sheep: 3, wheat: 2 }
    },
    {
      title: 'Straßennetz ausbauen',
      description: 'Errichtet 3 Straßen im Team.',
      type: 'BUILD_ROADS',
      baseTimer: 6,
      targetCount: 3
    },
    {
      title: 'Siedlungsgemeinschaft',
      description: 'Errichtet im Team 1 neue Siedlung.',
      type: 'BUILD_SETTLEMENTS',
      baseTimer: 6,
      targetCount: 1
    },
    {
      title: 'Brot für die Insel',
      description: 'Baut eine Stadt an einem Getreidefeld (Weizen).',
      type: 'BUILD_CITY_ON_RESOURCE',
      baseTimer: 6,
      targetResourceType: 'wheat'
    },
    {
      title: 'Bergwerks-Metropole',
      description: 'Baut eine Stadt an einem Gebirgsfeld (Erz).',
      type: 'BUILD_CITY_ON_RESOURCE',
      baseTimer: 6,
      targetResourceType: 'ore'
    }
  ],
  4: [
    {
      title: 'Wachturm gegen Räuber',
      description: 'Zahlt 3 Erz, 2 Holz und 1 Wolle für Vorposten ein.',
      type: 'DELIVER_RESOURCES',
      baseTimer: 5,
      requiredResources: { ore: 3, wood: 2, sheep: 1 }
    },
    {
      title: 'Größere Siedlungsflächen',
      description: 'Errichtet im Team 2 neue Siedlungen.',
      type: 'BUILD_SETTLEMENTS',
      baseTimer: 5,
      targetCount: 2
    },
    {
      title: 'Großer Handelshafen',
      description: 'Zahlt 3 Holz, 2 Wolle und 1 Weizen ein.',
      type: 'DELIVER_RESOURCES',
      baseTimer: 5,
      requiredResources: { wood: 3, sheep: 2, wheat: 1 }
    },
    {
      title: 'Fernstraßen-Pflasterung',
      description: 'Baut gemeinsam 4 neue Straßenabschnitte.',
      type: 'BUILD_ROADS',
      baseTimer: 5,
      targetCount: 4
    }
  ],
  5: [
    {
      title: 'Die uneinnehmbare Festung',
      description: 'Zahlt 4 Erz, 3 Weizen und 2 Lehm für die Inselfestung ein.',
      type: 'DELIVER_RESOURCES',
      baseTimer: 5,
      requiredResources: { ore: 4, wheat: 3, clay: 2 }
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
      description: 'Schafft ein zusammenhängendes Wegenetz aus 5 Straßen.',
      type: 'BUILD_ROADS',
      baseTimer: 5,
      targetCount: 5
    },
    {
      title: 'Gemeinschaftlicher Speicher',
      description: 'Zahlt von jedem Rohstoff mindestens 2 Einheiten ein (insgesamt 10 Rohstoffe).',
      type: 'DELIVER_RESOURCES',
      baseTimer: 5,
      requiredResources: { wood: 2, clay: 2, sheep: 2, wheat: 2, ore: 2 }
    }
  ],
  6: [
    {
      title: 'Das Monument von Catan',
      description: 'Das ultimative Bauwerk: Zahlt 4 Erz, 4 Weizen und 3 Holz ein!',
      type: 'DELIVER_RESOURCES',
      baseTimer: 5,
      requiredResources: { ore: 4, wheat: 4, wood: 3 }
    },
    {
      title: 'Goldenes Zeitalter',
      description: 'Zahlt 4 Wolle, 4 Lehm und 4 Getreide für den finalen Wohlstand ein.',
      type: 'DELIVER_RESOURCES',
      baseTimer: 5,
      requiredResources: { sheep: 4, clay: 4, wheat: 4 }
    },
    {
      title: 'Inselweites Straßennetz',
      description: 'Baut gemeinsam 6 neue Straßen.',
      type: 'BUILD_ROADS',
      baseTimer: 5,
      targetCount: 6
    }
  ]
};

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createQuestSlot(
  slotIndex: number,
  tier: number,
  teamHasLongestRoad: boolean = false,
  activeTitles: string[] = []
): QuestSlot {
  const effectiveTier = Math.min(6, Math.max(1, tier));
  const pool = QUEST_POOL[effectiveTier] || QUEST_POOL[1];

  // Draw from templates that are not currently active
  let available = pool.filter(t => !activeTitles.includes(t.title));
  if (available.length === 0) {
    // If all in this tier are active, check all tiers for any non-active quest
    const allTemplates = Object.values(QUEST_POOL).flat();
    available = allTemplates.filter(t => !activeTitles.includes(t.title));
    if (available.length === 0) {
      available = pool;
    }
  }

  const template = available[Math.floor(Math.random() * available.length)];

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
  // Draw 4 distinct Tier 1 quests from the set
  const shuffledTier1 = shuffleArray([...QUEST_POOL[1]]);
  return [0, 1, 2, 3].map((slotIndex) => {
    const template = shuffledTier1[slotIndex] || shuffledTier1[0];
    const timerBonus = teamHasLongestRoad ? 1 : 0;
    const initialTimer = Math.min(6, template.baseTimer + timerBonus);

    return {
      slotIndex,
      tier: 1,
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
  });
}
