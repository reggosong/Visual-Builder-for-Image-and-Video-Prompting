import * as fal from "@fal-ai/serverless-client";

// Type definitions for FAL responses
interface FalTextResponse {
  output?: string;
  [key: string]: unknown;
}

interface FalImageResponse {
  images?: Array<{ url: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

let isInitialized = false;

export function initializeFal(apiKey: string) {
  fal.config({
    credentials: apiKey,
  });
  isInitialized = true;
}

export function isFalInitialized(): boolean {
  return isInitialized;
}

/**
 * Call FAL for text generation using Llama
 */
export async function callFalText(prompt: string): Promise<string> {
  if (!isInitialized) {
    throw new Error(
      "FAL not initialized. Please provide an API key in settings."
    );
  }

  try {
    const result = (await fal.subscribe("fal-ai/llama-3-3-70b-instruct", {
      input: {
        prompt: prompt,
        max_tokens: 1000,
      },
    })) as FalTextResponse;

    return result.output || "";
  } catch (error) {
    console.error("FAL text generation error:", error);
    throw error;
  }
}

/**
 * Call FAL with structured output (JSON)
 */
export async function callFalStructured<T>(
  prompt: string,
  schema: string
): Promise<T> {
  if (!isInitialized) {
    throw new Error(
      "FAL not initialized. Please provide an API key in settings."
    );
  }

  const fullPrompt = `${prompt}\n\nPlease respond with valid JSON matching this schema: ${schema}\nReturn ONLY the JSON, no markdown or explanations.`;

  try {
    const result = (await fal.subscribe("fal-ai/llama-3-3-70b-instruct", {
      input: {
        prompt: fullPrompt,
        max_tokens: 1000,
      },
    })) as FalTextResponse;

    const text = result.output || "";

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```\n?$/g, "");
    }

    try {
      return JSON.parse(jsonText) as T;
    } catch {
      console.error("Failed to parse JSON response:", text);
      throw new Error("Failed to parse structured response from FAL");
    }
  } catch (error) {
    console.error("FAL structured generation error:", error);
    throw error;
  }
}

/**
 * Generate image using FAL (Flux or SDXL)
 */
export async function generateImage(
  prompt: string,
  options?: {
    width?: number;
    height?: number;
    numberOfImages?: number;
  }
): Promise<string[]> {
  if (!isInitialized) {
    throw new Error(
      "FAL not initialized. Please provide an API key in settings."
    );
  }

  try {
    const result = (await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: prompt,
        image_size: {
          width: options?.width || 1024,
          height: options?.height || 1024,
        },
        num_images: options?.numberOfImages || 1,
      },
    })) as FalImageResponse;

    // Extract image URLs from result
    const images = result.images || [];
    return images.map((img) => img.url);
  } catch (error) {
    console.error("FAL image generation error:", error);
    throw error;
  }
}

/**
 * Generate image with reference images using FAL
 * Uses multiple strategies for better character consistency
 */
export async function generateImageWithReferences(
  prompt: string,
  referenceImageUrls: string[],
  options?: {
    width?: number;
    height?: number;
    numberOfImages?: number;
    strength?: number; // How much to follow the reference (0.0-1.0)
  }
): Promise<string[]> {
  if (!isInitialized) {
    throw new Error(
      "FAL not initialized. Please provide an API key in settings."
    );
  }

  // Try multiple approaches for reference image support
  try {
    console.log(
      "🎨 Attempting reference-based generation with",
      referenceImageUrls.length,
      "reference images"
    );

    // Strategy 1: Try Flux with ControlNet/IP-Adapter if available
    if (referenceImageUrls.length > 0) {
      try {
        console.log("📸 Trying Flux LoRA with reference image support...");
        const result = (await fal.subscribe("fal-ai/flux-lora", {
          input: {
            prompt: prompt,
            image_size: {
              width: options?.width || 1024,
              height: options?.height || 1024,
            },
            num_images: options?.numberOfImages || 1,
            // Include reference images in the prompt structure
            reference_images: referenceImageUrls,
            guidance_scale: 4.0, // Higher guidance for better consistency
            num_inference_steps: 28,
          },
        })) as FalImageResponse;

        const images = result.images || [];
        if (images.length > 0) {
          console.log("✅ Successfully generated with Flux LoRA references");
          return images.map((img) => img.url);
        }
      } catch (error) {
        console.log("⚠️ Flux LoRA not available, trying alternative...");
      }
    }

    // Strategy 2: Enhanced prompt with detailed description
    console.log("📝 Using Flux Dev with enhanced prompt...");
    const enhancedPrompt = `${prompt}\n\nSTYLE AND CONSISTENCY NOTES: Generate this image with the same visual style, character appearances, and artistic quality as shown in these reference images: ${referenceImageUrls.join(
      ", "
    )}`;

    const result = (await fal.subscribe("fal-ai/flux/dev", {
      input: {
        prompt: enhancedPrompt,
        image_size: {
          width: options?.width || 1024,
          height: options?.height || 1024,
        },
        num_inference_steps: 28, // Higher quality
        num_images: options?.numberOfImages || 1,
        guidance_scale: 4.0, // Stronger adherence to prompt
      },
    })) as FalImageResponse;

    const images = result.images || [];
    console.log("✅ Generated with Flux Dev (enhanced prompt)");
    return images.map((img) => img.url);
  } catch (error) {
    console.error("FAL image generation with references error:", error);
    // Fallback to regular generation
    console.log("⚠️ Falling back to regular Flux Schnell generation");
    return generateImage(prompt, options);
  }
}

/**
 * Call FAL for video prompt analysis
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
- startFrame: Starting frame number (extract or infer, default to 0)
- endFrame: Ending frame number (extract or infer, default to 100)
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

  return callFalStructured(analysisPrompt, schema);
}
