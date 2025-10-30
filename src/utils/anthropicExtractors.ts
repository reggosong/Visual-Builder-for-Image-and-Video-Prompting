import type { ExtractionResult, ShotInfo } from "../types/workflow.types";
import {
  callClaudeStructured,
  isAnthropicInitialized,
  analyzeVideoPrompt,
} from "../services/anthropic";
import {
  extractCharacters as fallbackExtractCharacters,
  extractVariants as fallbackExtractVariants,
  extractShotInfo as fallbackExtractShotInfo,
} from "./extractors";

/**
 * Extract characters using Claude AI
 */
export async function extractCharactersWithAI(
  text: string
): Promise<ExtractionResult> {
  if (!isAnthropicInitialized()) {
    console.warn(
      "Anthropic not initialized - using regex fallback for character extraction"
    );
    return fallbackExtractCharacters(text);
  }

  try {
    console.log(
      "🤖 Using Claude AI for character extraction from:",
      text.substring(0, 50) + "..."
    );
    const prompt = `Extract all characters mentioned in this video prompt: "${text}"
    
Return a list of character names or descriptions. Be specific and include all mentioned characters.
If no specific characters are mentioned, infer from context (e.g., "hero character" or "warrior").`;

    const result = await callClaudeStructured<{ characters: string[] }>(
      prompt,
      '{"characters": ["string"]}'
    );

    console.log("Claude extraction result:", result);
    return {
      success: true,
      value:
        result.characters && result.characters.length > 0
          ? result.characters
          : ["main character"],
      confidence: 0.9,
    };
  } catch (error) {
    console.error("Claude extraction failed, using fallback:", error);
    return fallbackExtractCharacters(text);
  }
}

/**
 * Extract style variants using Claude AI
 */
export async function extractVariantsWithAI(
  text: string
): Promise<ExtractionResult> {
  if (!isAnthropicInitialized()) {
    console.warn(
      "Anthropic not initialized - using regex fallback for variant extraction"
    );
    return fallbackExtractVariants(text);
  }

  try {
    console.log(
      "🤖 Using Claude AI for style variant extraction from:",
      text.substring(0, 50) + "..."
    );
    const prompt = `Extract style keywords from this video prompt: "${text}"
    
Return a list of style variants like: cinematic, anime, realistic, photorealistic, stylized, etc.`;

    const result = await callClaudeStructured<{ variants: string[] }>(
      prompt,
      '{"variants": ["string"]}'
    );

    return {
      success: true,
      value: result.variants || [],
      confidence: 0.85,
    };
  } catch (error) {
    console.error("Claude extraction failed, using fallback:", error);
    return fallbackExtractVariants(text);
  }
}

/**
 * Extract shot information using Claude AI
 */
export async function extractShotInfoWithAI(
  text: string
): Promise<ExtractionResult> {
  if (!isAnthropicInitialized()) {
    console.warn(
      "Anthropic not initialized - using regex fallback for shot info extraction"
    );
    return fallbackExtractShotInfo(text);
  }

  try {
    console.log(
      "🤖 Using Claude AI for shot info extraction from:",
      text.substring(0, 50) + "..."
    );
    const analysis = await analyzeVideoPrompt(text);

    const shotInfo: ShotInfo = {
      lighting: analysis.lighting,
      mood: analysis.mood,
      actions: analysis.actions,
      shotAngle: analysis.shotAngle,
      cameraLens: analysis.cameraLens,
      cameraMovement: analysis.cameraMovement,
    };

    return {
      success: true,
      value: shotInfo,
      confidence: 0.9,
    };
  } catch (error) {
    console.error("Claude extraction failed, using fallback:", error);
    return fallbackExtractShotInfo(text);
  }
}

/**
 * Comprehensive analysis using Claude AI
 * This can be used to process an entire prompt at once
 */
export async function comprehensiveAnalysis(text: string): Promise<{
  startFrame: string;
  endFrame: string;
  characters: string[];
  variants: string[];
  shotInfo: ShotInfo;
}> {
  if (!isAnthropicInitialized()) {
    throw new Error("Anthropic AI not initialized");
  }

  const analysis = await analyzeVideoPrompt(text);

  return {
    startFrame: analysis.startFrame,
    endFrame: analysis.endFrame,
    characters: analysis.characters,
    variants: analysis.styleVariants,
    shotInfo: {
      lighting: analysis.lighting,
      mood: analysis.mood,
      actions: analysis.actions,
      shotAngle: analysis.shotAngle,
      cameraLens: analysis.cameraLens,
      cameraMovement: analysis.cameraMovement,
    },
  };
}
