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
  const fullPrompt = `${prompt}\n\nPlease respond with valid JSON matching this schema: ${schema}\nReturn ONLY the JSON, no markdown or explanations.`;

  const client = getAnthropicInstance();

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
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

  const text = content.text;

  // Extract JSON from response (handle markdown code blocks)
  let jsonText = text.trim();
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```\n?$/g, "");
  }

  try {
    return JSON.parse(jsonText) as T;
  } catch {
    console.error("Failed to parse JSON response:", text);
    throw new Error("Failed to parse structured response from Claude");
  }
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
