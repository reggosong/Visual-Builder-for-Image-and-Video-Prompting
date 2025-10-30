import type { ExtractionResult, ShotInfo } from "../types/workflow.types";

// Extract characters from text
export function extractCharacters(text: string): ExtractionResult {
  const characters: string[] = [];

  // Common character indicators
  const patterns = [
    /characters?[:#]?\s*([^.]+)/i,
    /featuring\s+([^.]+)/i,
    /with\s+((?:a|an|the)\s+[^,]+(?:,\s*(?:a|an|the)\s+[^,]+)*)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const charText = match[1];
      const parts = charText
        .split(/,|and/i)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      characters.push(...parts);
    }
  }

  // Look for proper nouns (capitalized words)
  const properNouns = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
  const filteredNouns = properNouns.filter((noun) => {
    return ![
      "The",
      "A",
      "An",
      "In",
      "On",
      "At",
      "To",
      "For",
      "Of",
      "With",
    ].includes(noun);
  });

  if (filteredNouns.length > 0 && characters.length === 0) {
    characters.push(...filteredNouns.slice(0, 3)); // Limit to 3 most likely characters
  }

  return {
    success: characters.length > 0,
    value: characters.length > 0 ? characters : ["main character"],
    confidence: characters.length > 0 ? 0.7 : 0.3,
  };
}

// Extract style variants from text
export function extractVariants(text: string): ExtractionResult {
  const variants: string[] = [];
  const knownStyles = [
    "cinematic",
    "anime",
    "realistic",
    "stylized",
    "cartoon",
    "photorealistic",
    "3d",
    "2d",
    "hand-drawn",
    "digital art",
    "oil painting",
    "watercolor",
    "sketch",
    "comic book",
    "manga",
    "noir",
    "vintage",
    "modern",
    "futuristic",
    "retro",
  ];

  for (const style of knownStyles) {
    if (text.toLowerCase().includes(style)) {
      variants.push(style);
    }
  }

  // Look for "style" keyword
  const stylePattern = /(\w+)\s+style/gi;
  let match;
  while ((match = stylePattern.exec(text)) !== null) {
    const style = match[1].toLowerCase();
    if (!variants.includes(style)) {
      variants.push(style);
    }
  }

  return {
    success: variants.length > 0,
    value: variants.length > 0 ? variants : ["cinematic"],
    confidence: variants.length > 0 ? 0.8 : 0.3,
  };
}

// Extract shot information from text
export function extractShotInfo(text: string): ExtractionResult {
  const shotInfo: ShotInfo = {};

  // Lighting extraction
  const lightingKeywords = {
    "golden hour": /golden\s*hour|sunset|sunrise|warm\s*light/i,
    "harsh shadows": /harsh\s*shadow|strong\s*shadow|dramatic\s*shadow/i,
    "soft light": /soft\s*light|diffused|gentle\s*light/i,
    backlight: /backlight|backlighting|rim\s*light/i,
    "low light": /low\s*light|dim|dark\s*scene/i,
    bright: /bright|sunny|daylight|well[\s-]lit/i,
    neon: /neon|fluorescent|artificial\s*light/i,
    natural: /natural\s*light|window\s*light/i,
  };

  for (const [name, pattern] of Object.entries(lightingKeywords)) {
    if (pattern.test(text)) {
      shotInfo.lighting = name;
      break;
    }
  }

  // Mood extraction
  const moodKeywords = {
    tense: /tense|suspense|anxious|nervous/i,
    peaceful: /peaceful|calm|serene|tranquil/i,
    dramatic: /dramatic|intense|powerful/i,
    mysterious: /mysterious|enigmatic|cryptic/i,
    joyful: /joyful|happy|cheerful|upbeat/i,
    melancholic: /melancholic|sad|somber|moody/i,
    energetic: /energetic|dynamic|vibrant/i,
    romantic: /romantic|intimate|tender/i,
  };

  for (const [name, pattern] of Object.entries(moodKeywords)) {
    if (pattern.test(text)) {
      shotInfo.mood = name;
      break;
    }
  }

  // Actions extraction
  const actionPattern =
    /(running|walking|talking|fighting|dancing|jumping|sitting|standing|flying|driving|eating|drinking|working|sleeping|reading|writing)/gi;
  const actions = text.match(actionPattern);
  if (actions) {
    shotInfo.actions = [...new Set(actions.map((a) => a.toLowerCase()))].join(
      ", "
    );
  }

  // Shot angle extraction
  const angleKeywords = {
    "low angle": /low\s*angle|worm'?s[\s-]eye/i,
    "high angle": /high\s*angle|bird'?s[\s-]eye|overhead/i,
    "eye level": /eye\s*level|straight\s*on/i,
    "dutch angle": /dutch\s*angle|tilted|canted/i,
    "over the shoulder": /over[\s-]the[\s-]shoulder|OTS/i,
  };

  for (const [name, pattern] of Object.entries(angleKeywords)) {
    if (pattern.test(text)) {
      shotInfo.shotAngle = name;
      break;
    }
  }

  // Camera lens extraction
  const lensPattern = /(\d+)mm|wide\s*angle|telephoto|fisheye|macro/gi;
  const lensMatch = text.match(lensPattern);
  if (lensMatch) {
    shotInfo.cameraLens = lensMatch[0].toLowerCase();
  }

  // Camera movement extraction
  const movementKeywords = {
    "dolly zoom": /dolly\s*zoom|vertigo\s*effect/i,
    pan: /\bpan(?:ning)?\b|horizontal\s*movement/i,
    tilt: /\btilt(?:ing)?\b|vertical\s*movement/i,
    tracking: /tracking|dolly|moving\s*shot/i,
    handheld: /handheld|shaky|unstable/i,
    static: /static|fixed|stationary|tripod/i,
    crane: /crane|jib/i,
    steadicam: /steadicam|smooth\s*movement/i,
  };

  for (const [name, pattern] of Object.entries(movementKeywords)) {
    if (pattern.test(text)) {
      shotInfo.cameraMovement = name;
      break;
    }
  }

  const hasAnyInfo = Object.keys(shotInfo).length > 0;

  return {
    success: hasAnyInfo,
    value: hasAnyInfo
      ? shotInfo
      : {
          lighting: "natural",
          mood: "neutral",
          shotAngle: "eye level",
        },
    confidence: hasAnyInfo ? 0.8 : 0.3,
  };
}
