import Anthropic from "@anthropic-ai/sdk";

let anthropicClient: Anthropic | null = null;

export function initializeAnthropic(apiKey: string) {
  anthropicClient = new Anthropic({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true, // Required for browser usage
  });
  console.log("✅ Anthropic Claude initialized successfully");
}

export function getAnthropicInstance(): Anthropic {
  if (!anthropicClient) {
    throw new Error(
      "Anthropic not initialized. Please provide an API key in settings."
    );
  }
  return anthropicClient;
}

export function isAnthropicInitialized(): boolean {
  return anthropicClient !== null;
}

/**
 * Call Anthropic Claude for text generation
 */
export async function callClaude(prompt: string): Promise<string> {
  const client = getAnthropicInstance();

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === "text") {
    return content.text;
  }

  return "";
}

/**
 * Call Anthropic Claude with structured output (JSON)
 */
export async function callClaudeStructured<T>(
  prompt: string,
  schema: string
): Promise<T> {
  const fullPrompt = `${prompt}

Please respond with a single JSON object that matches this specification:
${schema}

Output must be valid JSON (double-quoted keys and strings, no trailing commas) with no commentary, prose, or code fences.`;

  const client = getAnthropicInstance();

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 16384,
    messages: [
      {
        role: "user",
        content: fullPrompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Expected text response from Claude");
  }

  try {
    const text = content.text.trim();
    return parseJsonResponse<T>(text);
  } catch (error) {
    console.error("Failed to parse JSON response:", content.text);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to parse structured response from Claude"
    );
  }
}

function parseJsonResponse<T>(text: string): T {
  let normalized = text.trim();

  if (normalized.startsWith("```")) {
    normalized = normalized.replace(/```json?\n?/gi, "").replace(/```$/gi, "");
  }

  normalized = normalized.trim();

  try {
    return JSON.parse(normalized) as T;
  } catch (error) {
    console.warn("Initial JSON parse failed, trying to extract {...} block");
    const firstBrace = normalized.indexOf("{");
    const lastBrace = normalized.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      const sliced = normalized.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(sliced) as T;
      } catch (sliceError) {
        console.warn("Sliced JSON parse failed, attempting repair...");
        const repaired = repairIncompleteJson(sliced);
        return JSON.parse(repaired) as T;
      }
    }
    throw error instanceof Error
      ? error
      : new Error("Failed to parse structured response from Claude");
  }
}

function repairIncompleteJson(text: string): string {
  let repaired = text.trim();

  // Close unclosed strings
  const unclosedStrings = (repaired.match(/"/g) || []).length % 2 !== 0;
  if (unclosedStrings) {
    repaired += '"';
  }

  // Close unclosed braces
  const openBraces = (repaired.match(/{/g) || []).length;
  const closeBraces = (repaired.match(/}/g) || []).length;
  const bracesDiff = openBraces - closeBraces;
  if (bracesDiff > 0) {
    repaired += "  ".repeat(bracesDiff) + "}".repeat(bracesDiff);
  }

  // Close unclosed brackets
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/\]/g) || []).length;
  const bracketsDiff = openBrackets - closeBrackets;
  if (bracketsDiff > 0) {
    repaired += "]".repeat(bracketsDiff);
  }

  // Remove trailing commas
  repaired = repaired.replace(/,(\s*[}\]])/g, "$1");

  return repaired;
}

/**
 * Call Claude for video prompt analysis
 */
export async function analyzeVideoPrompt(prompt: string): Promise<{
  characters: string[];
  lighting: string;
  mood: string;
  actions: string;
  shotAngle: string;
  cameraLens: string;
  cameraMovement: string;
  startFrame: string;
  endFrame: string;
  styleVariants: string[];
}> {
  const analysisPrompt = `Analyze this video prompt and extract structured information: "${prompt}"

Extract the following details:
- characters: List of character names or descriptions
- lighting: Type of lighting (e.g., golden hour, harsh shadows, soft light, natural)
- mood: Overall mood (e.g., tense, peaceful, dramatic, mysterious)
- actions: What actions are happening (e.g., running, talking, fighting)
- shotAngle: Camera angle (e.g., low angle, high angle, eye level, dutch angle)
- cameraLens: Lens specification (e.g., 35mm, wide angle, telephoto)
- cameraMovement: Camera movement (e.g., dolly zoom, pan, tilt, static, tracking)
- startFrame: Starting frame number (extract or infer, default to "0")
- endFrame: Ending frame number (extract or infer, default to "100")
- styleVariants: Style keywords (e.g., cinematic, anime, realistic, photorealistic)`;

  const schema = `{
    "characters": ["string"],
    "lighting": "string",
    "mood": "string",
    "actions": "string",
    "shotAngle": "string",
    "cameraLens": "string",
    "cameraMovement": "string",
    "startFrame": "string",
    "endFrame": "string",
    "styleVariants": ["string"]
  }`;

  return callClaudeStructured(analysisPrompt, schema);
}
