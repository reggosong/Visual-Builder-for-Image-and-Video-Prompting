import type {
  WorkflowNode,
  WorkflowEdge,
  StartFrameNodeData,
  SceneCollectionNodeData,
  SceneShotPlannerNodeData,
  ShotPlan,
} from "../types/workflow.types";
import { processTemplate } from "./templateEngine";
import { generateImage } from "../services/fal";

/**
 * Data Flow Engine - Processes workflow nodes in topological order
 */

interface ProcessedData {
  nodeId: string;
  output: unknown;
  success: boolean;
  error?: string;
}

/**
 * Perform topological sort on nodes based on edges
 */
export function topologicalSort(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): WorkflowNode[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const inDegree = new Map<string, number>();
  const adjacencyList = new Map<string, string[]>();

  // Initialize
  nodes.forEach((node) => {
    inDegree.set(node.id, 0);
    adjacencyList.set(node.id, []);
  });

  // Build graph
  edges.forEach((edge) => {
    const from = edge.source;
    const to = edge.target;
    adjacencyList.get(from)?.push(to);
    inDegree.set(to, (inDegree.get(to) || 0) + 1);
  });

  // Find nodes with no incoming edges
  const queue: string[] = [];
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId);
    }
  });

  const sorted: WorkflowNode[] = [];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const node = nodeMap.get(nodeId);
    if (node) {
      sorted.push(node);
    }

    const neighbors = adjacencyList.get(nodeId) || [];
    neighbors.forEach((neighbor) => {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    });
  }

  // Check for cycles
  if (sorted.length !== nodes.length) {
    console.warn("Cycle detected in workflow graph");
    return nodes; // Return original order if cycle detected
  }

  return sorted;
}

/**
 * Get incoming edges for a node
 */
function getIncomingEdges(
  nodeId: string,
  edges: WorkflowEdge[]
): WorkflowEdge[] {
  return edges.filter((edge) => edge.target === nodeId);
}

/**
 * Process a single node based on its type and inputs
 */
async function processNode(
  node: WorkflowNode,
  inputs: Map<string, unknown>,
  edges: WorkflowEdge[],
  nodes: WorkflowNode[],
  useAI: boolean = false
): Promise<ProcessedData> {
  const nodeData = node.data;

  try {
    switch (nodeData.type) {
      case "input": {
        return {
          nodeId: node.id,
          output: nodeData.prompt || "",
          success: true,
        };
      }

      case "sceneCollection": {
        const collectionData = node.data as SceneCollectionNodeData;
        const scenes = collectionData.scenes || [];
        const activeSceneId =
          collectionData.activeSceneId || scenes[0]?.id || null;
        const activeScene =
          scenes.find((scene) => scene.id === activeSceneId) || null;

        return {
          nodeId: node.id,
          output: {
            scenes,
            activeSceneId,
            activeScene,
            activeScenePrompt: activeScene?.prompt || "",
            activeSceneTitle: activeScene?.title || "",
            sceneCount: scenes.length,
          },
          success: true,
        };
      }

      case "sceneShotPlanner": {
        const plannerData = node.data as SceneShotPlannerNodeData;
        const incomingEdges = getIncomingEdges(node.id, edges);

        let sceneInput = (plannerData.sceneOverride || "").trim();
        let sceneTitle: string | undefined;
        let sceneId: string | undefined;

        if (!sceneInput) {
          for (const edge of incomingEdges) {
            const value = inputs.get(edge.source);
            if (!value) continue;

            if (typeof value === "string" && value.trim()) {
              sceneInput = value.trim();
              const sourceNode = nodes.find((n) => n.id === edge.source);
              if (sourceNode?.data?.label) {
                sceneTitle = sourceNode.data.label as string;
              }
              break;
            }

            if (typeof value === "object" && value !== null) {
              const candidate = value as {
                activeScenePrompt?: string;
                activeSceneTitle?: string;
                activeSceneId?: string;
                prompt?: string;
                title?: string;
                id?: string;
              };

              if (candidate.activeScenePrompt) {
                sceneInput = String(candidate.activeScenePrompt).trim();
                sceneTitle = candidate.activeSceneTitle || sceneTitle;
                sceneId = candidate.activeSceneId || sceneId;
                if (sceneInput) break;
              }

              if (candidate.prompt) {
                sceneInput = String(candidate.prompt).trim();
                sceneTitle = candidate.title || sceneTitle;
                sceneId = candidate.id || sceneId;
                if (sceneInput) break;
              }
            }
          }
        }

        if (!sceneInput) {
          return {
            nodeId: node.id,
            output: {
              shotPlan: [],
              summary: "",
              totalDurationSeconds: 0,
              lastSceneTitle: sceneTitle || "",
              lastSceneId: sceneId || "",
              lastScenePrompt: "",
            },
            success: false,
            error: "No scene input received",
          };
        }

        const planningStyle = plannerData.planStrategy || "balanced";
        const includeTransitions = plannerData.includeTransitions !== false;

        if (!useAI) {
          const fallbackShot: ShotPlan = {
            id: "manual-shot-1",
            title: "Single Shot",
            description:
              "Fallback plan generated without AI. Enable AI to get full coverage.",
            startFramePrompt: sceneInput,
            endFramePrompt: sceneInput,
            videoPrompt: sceneInput,
            durationSeconds: 6,
          };

          return {
            nodeId: node.id,
            output: {
              shotPlan: [fallbackShot],
              summary:
                "AI disabled: provided a single-shot plan mirroring the scene description.",
              totalDurationSeconds: fallbackShot.durationSeconds,
              lastSceneTitle: sceneTitle || "Scene",
              lastSceneId: sceneId || "",
              lastScenePrompt: sceneInput,
            },
            success: true,
          };
        }

        try {
          const { callClaudeStructured } = await import(
            "../services/anthropic"
          );

          const planningPrompt = `You are a senior film director tasked with creating a shot plan for a single scene.

Scene description:
"""
${sceneInput}
"""

Planning style: ${planningStyle}.
Include transitional bridge shots between major beats: ${
            includeTransitions ? "yes" : "no"
          }.

Produce a cinematic shot breakdown that covers the full arc of the scene. Each shot needs:
1. A descriptive title (avoid generic names)
2. A vivid description of the visual moment
3. Estimated duration in seconds (4-12 seconds typical)
4. A start frame prompt suitable for photorealistic image generation
5. An end frame prompt that resolves the shot
6. A video diffusion prompt summarizing motion and continuity for that shot
7. Optional camera notes (movement, lens, transitions)

Plan just enough shots to cover the entire scene without redundancy. Make sure the prompts stay consistent with characters, setting, and tone.`;

          const planningSchema = `{
  "summary": "string",
  "totalDurationSeconds": 120,
  "shots": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "durationSeconds": 8,
      "startFramePrompt": "string",
      "endFramePrompt": "string",
      "videoPrompt": "string",
      "cameraNotes": "string"
    }
  ]
}`;

          const planResult = await callClaudeStructured<{
            summary?: string;
            totalDurationSeconds?: number | string;
            shots?: Array<{
              id?: string;
              title?: string;
              description?: string;
              durationSeconds?: number | string;
              startFramePrompt?: string;
              endFramePrompt?: string;
              videoPrompt?: string;
              cameraNotes?: string;
            }>;
          }>(planningPrompt, planningSchema);

          const rawShots = Array.isArray(planResult.shots)
            ? planResult.shots
            : [];

          const normalizedShots: ShotPlan[] = rawShots.map((shot, index) => {
            const numericDuration = (() => {
              if (typeof shot.durationSeconds === "number") {
                return shot.durationSeconds;
              }
              const parsed = parseFloat(String(shot.durationSeconds || ""));
              return Number.isFinite(parsed) ? parsed : undefined;
            })();

            return {
              id: shot.id?.trim() || `shot-${index + 1}`,
              title: shot.title?.trim() || `Shot ${index + 1}`,
              description: shot.description?.trim() || "",
              durationSeconds: numericDuration,
              startFramePrompt: shot.startFramePrompt?.trim() || "",
              endFramePrompt: shot.endFramePrompt?.trim() || "",
              videoPrompt: shot.videoPrompt?.trim() || "",
              cameraNotes: shot.cameraNotes?.trim() || undefined,
            };
          });

          const totalDuration = (() => {
            if (typeof planResult.totalDurationSeconds === "number") {
              return planResult.totalDurationSeconds;
            }
            const parsed = parseFloat(
              String(planResult.totalDurationSeconds || "")
            );
            if (Number.isFinite(parsed)) {
              return parsed;
            }
            const sum = normalizedShots.reduce((acc, shot) => {
              return acc + (shot.durationSeconds || 0);
            }, 0);
            return sum || normalizedShots.length * 6;
          })();

          return {
            nodeId: node.id,
            output: {
              shotPlan: normalizedShots,
              summary:
                planResult.summary?.trim() ||
                `Planned ${normalizedShots.length} shot${
                  normalizedShots.length === 1 ? "" : "s"
                } covering the full scene.`,
              totalDurationSeconds: totalDuration,
              lastSceneTitle: sceneTitle || "Scene",
              lastSceneId: sceneId || "",
              lastScenePrompt: sceneInput,
            },
            success: true,
          };
        } catch (error) {
          console.error("❌ Scene shot planning failed:", error);
          return {
            nodeId: node.id,
            output: {
              shotPlan: [],
              summary: "",
              totalDurationSeconds: 0,
              lastSceneTitle: sceneTitle || "Scene",
              lastSceneId: sceneId || "",
              lastScenePrompt: sceneInput,
            },
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Scene shot planning failed",
          };
        }
      }

      case "startFrame": {
        const incomingEdges = getIncomingEdges(node.id, edges);
        const inputText =
          incomingEdges.length > 0
            ? inputs.get(incomingEdges[0].source) || ""
            : "";

        if (!inputText) {
          return {
            nodeId: node.id,
            output: {
              prompt: "",
              image: null,
              characterImages: [],
            },
            success: false,
            error: "No input connected",
          };
        }

        try {
          const { callClaude, callClaudeStructured } = await import(
            "../services/anthropic"
          );
          const { useWorkflowStore } = await import("../store/workflowStore");

          // Step 1: Extract characters with detailed descriptions
          console.log(
            "👥 Extracting characters with descriptions from prompt..."
          );
          const characterExtractionPrompt = `Analyze this video prompt and extract all characters with detailed visual descriptions: "${inputText}"

For each character, provide:
- name: A short name/identifier
- description: A detailed physical description including appearance, clothing, features, build, hair, age, distinctive characteristics, etc.

Return as JSON array. Be very specific and detailed in descriptions to ensure visual consistency.`;

          const charactersResult = await callClaudeStructured<{
            characters: Array<{ name: string; description: string }>;
          }>(
            characterExtractionPrompt,
            '{"characters": [{"name": "string", "description": "string"}]}'
          );

          const characters = charactersResult.characters || [];
          console.log("✅ Extracted characters with descriptions:", characters);

          // Step 2: Generate each character on green screen using detailed descriptions
          const characterImages: Array<{
            name: string;
            url: string;
            description: string;
          }> = [];

          for (const character of characters) {
            console.log(`🎭 Generating character: ${character.name}`);

            const characterPrompt = `A full body portrait of a character on a pure green screen background (#00FF00). Character description: ${character.description}. The character should be in a neutral standing pose, facing forward, with clear details. Professional studio lighting. The entire background must be solid green for chroma keying. Photorealistic style.`;

            const charImageUrls = await generateImage(characterPrompt, {
              width: 768,
              height: 1024,
              numberOfImages: 1,
            });

            const charImageUrl = charImageUrls[0];
            characterImages.push({
              name: character.name,
              url: charImageUrl,
              description: character.description,
            });

            // Add to media gallery
            useWorkflowStore.getState().addMediaItem({
              id: `char-${Date.now()}-${Math.random()}`,
              type: "character",
              url: charImageUrl,
              name: character.name,
              prompt: characterPrompt,
              timestamp: Date.now(),
            });

            console.log(`✅ Generated character: ${character.name}`);
          }

          // Step 3: Generate optimal start frame prompt using Claude WITH detailed character descriptions
          console.log(
            "🎨 Generating start frame prompt with character descriptions..."
          );

          const characterContext =
            characterImages.length > 0
              ? `\n\nCharacters in this scene:\n${characterImages
                  .map((c, i) => `${i + 1}. ${c.name}: ${c.description}`)
                  .join(
                    "\n"
                  )}\n\nIMPORTANT: Include these characters in the start frame with their exact descriptions to maintain visual consistency.`
              : "";

          const startFramePromptRequest = `Given this video prompt, create an optimal image generation prompt for the FIRST FRAME (start frame) of this video sequence. The start frame should capture the initial moment, setting, or establishing shot.

Video Prompt: "${inputText}"${characterContext}

Generate a detailed image prompt that describes what the start frame should look like. Focus on:
- Initial composition and framing
- Include ALL characters mentioned above with their EXACT physical descriptions
- Starting position and pose of each character
- Environmental setup matching the video prompt
- Initial lighting and atmosphere from the video prompt
- Camera angle and perspective
- Photorealistic cinematic style

CRITICAL: Make sure to include the detailed character descriptions in your prompt so they appear correctly in the image.

Return ONLY the complete image generation prompt, no explanations.`;

          const generatedPrompt = await callClaude(startFramePromptRequest);
          console.log("✅ Generated start frame prompt:", generatedPrompt);

          // Step 4: Generate the start frame image using FAL with character references
          console.log(
            "🖼️ Generating start frame image with FAL using character references..."
          );
          const { generateImageWithReferences } = await import(
            "../services/fal"
          );

          // Extract character image URLs for reference
          const characterImageUrls = characterImages.map((c) => c.url);

          const imageUrls = await generateImageWithReferences(
            generatedPrompt,
            characterImageUrls, // Pass character reference images
            {
              width: 1024,
              height: 576, // 16:9 aspect ratio for video
              numberOfImages: 1,
            }
          );

          const imageUrl = imageUrls[0];
          console.log(
            "✅ Generated start frame image with character references:",
            imageUrl
          );

          // Add start frame to media gallery
          useWorkflowStore.getState().addMediaItem({
            id: `startframe-${Date.now()}`,
            type: "startFrame",
            url: imageUrl,
            name: "Start Frame",
            prompt: generatedPrompt,
            timestamp: Date.now(),
          });

          // Filter output based on selection settings
          const nodeData = node.data as StartFrameNodeData;
          const selectedCharacters = nodeData.selectedCharacters || [];
          const outputStartFrame = nodeData.outputStartFrame !== false; // Default to true

          // Filter character images based on selection
          const outputCharacters =
            selectedCharacters.length > 0
              ? characterImages.filter((char) =>
                  selectedCharacters.includes(char.name)
                )
              : characterImages; // If nothing selected, output all

          return {
            nodeId: node.id,
            output: {
              prompt: generatedPrompt,
              image: outputStartFrame ? imageUrl : null,
              characterImages: outputCharacters,
            },
            success: true,
          };
        } catch (error) {
          console.error("❌ Start frame generation failed:", error);
          return {
            nodeId: node.id,
            output: {
              prompt: "",
              image: null,
              characterImages: [],
            },
            success: false,
            error: `Failed to generate start frame: ${error}`,
          };
        }
      }

      case "endFrame": {
        const incomingEdges = getIncomingEdges(node.id, edges);
        const rawInput =
          incomingEdges.length > 0 ? inputs.get(incomingEdges[0].source) : "";
        const inputText = typeof rawInput === "string" ? rawInput : "";

        if (!inputText) {
          return {
            nodeId: node.id,
            output: {
              prompt: "",
              image: null,
              variantImages: [],
            },
            success: false,
            error: "No input connected",
          };
        }

        try {
          const { callClaude, callClaudeStructured } = await import(
            "../services/anthropic"
          );
          const { generateImageWithReferences } = await import(
            "../services/fal"
          );
          const { useWorkflowStore } = await import("../store/workflowStore");

          // Step 1: Extract style variants for the end frame
          console.log("🎨 Extracting style variants for end frame...");
          const variantExtractionPrompt = `Analyze this video prompt and suggest 3 creative style variations for the FINAL FRAME (end frame): "${inputText}"

For each variant, provide:
- name: A short descriptive name (e.g., "dramatic sunset", "noir style", "vibrant colors")
- description: A detailed description of how this variant should look

Return as JSON array. Be creative and diverse in style suggestions.`;

          const variantsResult = await callClaudeStructured<{
            variants: Array<{ name: string; description: string }>;
          }>(
            variantExtractionPrompt,
            '{"variants": [{"name": "string", "description": "string"}]}'
          );

          const variants = variantsResult.variants || [];
          console.log("✅ Extracted variants:", variants);

          // Step 2: Generate each variant image
          const variantImages: Array<{
            name: string;
            url: string;
            prompt: string;
          }> = [];

          for (const variant of variants) {
            console.log(`🖼️ Generating variant: ${variant.name}`);

            const variantPrompt = `A cinematic end frame / final shot for a video sequence. ${variant.description}. Based on this video concept: ${inputText}. High quality, cinematic composition, photorealistic style.`;

            const varImageUrls = await generateImageWithReferences(
              variantPrompt,
              [], // No character references for variants
              {
                width: 1024,
                height: 576,
                numberOfImages: 1,
              }
            );

            const varImageUrl = varImageUrls[0];
            variantImages.push({
              name: variant.name,
              url: varImageUrl,
              prompt: variantPrompt,
            });

            // Add to media gallery
            useWorkflowStore.getState().addMediaItem({
              id: `variant-${Date.now()}-${Math.random()}`,
              type: "generated",
              url: varImageUrl,
              name: `Variant: ${variant.name}`,
              prompt: variantPrompt,
              timestamp: Date.now(),
            });

            console.log(`✅ Generated variant: ${variant.name}`);
          }

          // Step 3: Generate optimal end frame prompt using Claude
          console.log("🎬 Generating end frame prompt...");

          const endFramePromptRequest = `Given this video prompt, create an optimal image generation prompt for the FINAL FRAME (end frame) of this video sequence. The end frame should capture the concluding moment, resolution, or final shot.

Video Prompt: "${inputText}"

Generated style variants for reference:
${variantImages.map((v, i) => `${i + 1}. ${v.name}: ${v.prompt}`).join("\n")}

Generate a detailed image prompt that describes what the end frame should look like. Focus on:
- Final composition and framing
- Ending position of subjects
- Resolution or conclusion of the action
- Final lighting and atmosphere
- Any text or credits that might appear
- Emotional impact and closure
- Photorealistic cinematic style

Return ONLY the complete image generation prompt, no explanations.`;

          const generatedPrompt = await callClaude(endFramePromptRequest);
          console.log("✅ Generated end frame prompt:", generatedPrompt);

          // Step 4: Generate the end frame image using FAL
          console.log("🖼️ Generating end frame image with FAL...");

          const imageUrls = await generateImageWithReferences(
            generatedPrompt,
            [], // Could reference start frame or characters if needed
            {
              width: 1024,
              height: 576, // 16:9 aspect ratio for video
              numberOfImages: 1,
            }
          );

          const imageUrl = imageUrls[0];
          console.log("✅ Generated end frame image:", imageUrl);

          // Add end frame to media gallery
          useWorkflowStore.getState().addMediaItem({
            id: `endframe-${Date.now()}`,
            type: "endFrame",
            url: imageUrl,
            name: "End Frame",
            prompt: generatedPrompt,
            timestamp: Date.now(),
          });

          return {
            nodeId: node.id,
            output: {
              prompt: generatedPrompt,
              image: imageUrl,
              variantImages: variantImages,
            },
            success: true,
          };
        } catch (error) {
          console.error("❌ End frame generation failed:", error);
          return {
            nodeId: node.id,
            output: {
              prompt: "",
              image: null,
              variantImages: [],
            },
            success: false,
            error: `Failed to generate end frame: ${error}`,
          };
        }
      }

      case "continuityPlanner": {
        const incomingEdges = getIncomingEdges(node.id, edges);
        const rawInput =
          incomingEdges.length > 0 ? inputs.get(incomingEdges[0].source) : "";
        const inputText = typeof rawInput === "string" ? rawInput : "";

        if (!useAI || !inputText) {
          return {
            nodeId: node.id,
            output: {
              characters: nodeData.characters || [],
              shotInfo: nodeData.shotInfo || [],
              variants: nodeData.variants || [],
              objects: nodeData.objects || [],
            },
            success: true,
          };
        }

        try {
          const { callClaudeStructured } = await import(
            "../services/anthropic"
          );

          console.log("🎬 Analyzing continuity for later shots...");

          // Build prompt based on selected categories
          const categoriesToExtract = [];
          if (nodeData.extractCharacters)
            categoriesToExtract.push(
              "1. Characters - All people/beings that should appear consistently"
            );
          if (nodeData.extractShotInfo)
            categoriesToExtract.push(
              "2. Shot Information - Key cinematography details (lighting, mood, angles, movement)"
            );
          if (nodeData.extractVariants)
            categoriesToExtract.push(
              "3. Visual Variants - Style keywords and artistic directions"
            );
          if (nodeData.extractObjects)
            categoriesToExtract.push(
              "4. Objects - Important props, set pieces, or environmental elements"
            );

          if (categoriesToExtract.length === 0) {
            return {
              nodeId: node.id,
              output: {
                characters: [],
                shotInfo: [],
                variants: [],
                objects: [],
              },
              success: true,
            };
          }

          const continuityPrompt = `Analyze this video scene prompt and extract key continuity elements that MUST be maintained in later shots of the same scene:

"${inputText}"

Extract:
${categoriesToExtract.join("\n")}

For each category, provide detailed descriptions to ensure consistency across shots.`;

          // Build schema dynamically based on selected categories
          const schemaFields = [];
          if (nodeData.extractCharacters)
            schemaFields.push(
              '"characters": [{"name": "string", "description": "detailed physical description"}]'
            );
          if (nodeData.extractShotInfo)
            schemaFields.push(
              '"shotInfo": [{"key": "string (e.g. lighting, mood, angle)", "value": "string description"}]'
            );
          if (nodeData.extractVariants)
            schemaFields.push(
              '"variants": [{"name": "string", "description": "style/artistic description"}]'
            );
          if (nodeData.extractObjects)
            schemaFields.push(
              '"objects": [{"name": "string", "description": "detailed object description"}]'
            );

          const schema = `{\n  ${schemaFields.join(",\n  ")}\n}`;

          const result = await callClaudeStructured<{
            characters?: Array<{ name: string; description: string }>;
            shotInfo?: Array<{ key: string; value: string }>;
            variants?: Array<{ name: string; description: string }>;
            objects?: Array<{ name: string; description: string }>;
          }>(continuityPrompt, schema);

          // Add selected: true to all items by default
          const output = {
            characters: nodeData.extractCharacters
              ? (result.characters || []).map((c) => ({
                  ...c,
                  selected: true,
                }))
              : [],
            shotInfo: nodeData.extractShotInfo
              ? (result.shotInfo || []).map((s) => ({ ...s, selected: true }))
              : [],
            variants: nodeData.extractVariants
              ? (result.variants || []).map((v) => ({ ...v, selected: true }))
              : [],
            objects: nodeData.extractObjects
              ? (result.objects || []).map((o) => ({ ...o, selected: true }))
              : [],
          };

          console.log(
            `✅ Continuity analysis complete: ${output.characters.length} chars, ${output.shotInfo.length} shot details, ${output.variants.length} variants, ${output.objects.length} objects`
          );

          return {
            nodeId: node.id,
            output,
            success: true,
          };
        } catch (error) {
          console.error("❌ Continuity analysis failed:", error);
          return {
            nodeId: node.id,
            output: {
              characters: [],
              shotInfo: [],
              variants: [],
              objects: [],
            },
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Continuity analysis failed",
          };
        }
      }

      case "contextPrompt": {
        const incomingEdges = getIncomingEdges(node.id, edges);
        const contextInputs: Record<string, unknown> = {};

        // Gather all inputs and map them to proper variable names
        incomingEdges.forEach((edge) => {
          const value = inputs.get(edge.source);
          const sourceNode = nodes.find((n) => n.id === edge.source);

          if (value !== undefined && sourceNode) {
            // Map node outputs to template variable names based on node type
            switch (sourceNode.data.type) {
              case "continuityPlanner":
                // Extract selected items from continuity planner
                if (typeof value === "object" && value !== null) {
                  const cpValue = value as {
                    characters?: Array<{
                      name: string;
                      description: string;
                      selected: boolean;
                    }>;
                    shotInfo?: Array<{
                      key: string;
                      value: string;
                      selected: boolean;
                    }>;
                    variants?: Array<{
                      name: string;
                      description: string;
                      selected: boolean;
                    }>;
                    objects?: Array<{
                      name: string;
                      description: string;
                      selected: boolean;
                    }>;
                  };

                  // Only include selected items
                  if (cpValue.characters) {
                    contextInputs.characters = cpValue.characters
                      .filter((c) => c.selected)
                      .map((c) => `${c.name}: ${c.description}`)
                      .join(", ");
                  }
                  if (cpValue.shotInfo) {
                    cpValue.shotInfo
                      .filter((s) => s.selected)
                      .forEach((s) => {
                        contextInputs[s.key] = s.value;
                      });
                  }
                  if (cpValue.variants) {
                    contextInputs.variants = cpValue.variants
                      .filter((v) => v.selected)
                      .map((v) => `${v.name}: ${v.description}`)
                      .join(", ");
                  }
                  if (cpValue.objects) {
                    contextInputs.objects = cpValue.objects
                      .filter((o) => o.selected)
                      .map((o) => `${o.name}: ${o.description}`)
                      .join(", ");
                  }
                }
                break;
              case "startFrame":
                contextInputs.startFrame = value;
                break;
              case "endFrame":
                contextInputs.endFrame = value;
                break;
              case "input":
                contextInputs.input = value;
                break;
              case "contextPrompt":
                contextInputs.context = value;
                break;
              default:
                // For unknown types, use node ID as key
                contextInputs[edge.source] = value;
            }
          }
        });

        // Process template
        console.log("📝 Template inputs:", contextInputs);
        const processed = processTemplate(nodeData.template, contextInputs);
        console.log("✅ Template output:", processed);

        return {
          nodeId: node.id,
          output: processed,
          success: true,
        };
      }

      case "imageGen": {
        const incomingEdges = getIncomingEdges(node.id, edges);
        const rawInput =
          incomingEdges.length > 0 ? inputs.get(incomingEdges[0].source) : "";
        const inputPrompt = typeof rawInput === "string" ? rawInput : "";

        try {
          const images = await generateImage(inputPrompt, {
            width: nodeData.width,
            height: nodeData.height,
            numberOfImages: nodeData.numberOfImages,
          });

          return {
            nodeId: node.id,
            output: images,
            success: true,
          };
        } catch (error) {
          return {
            nodeId: node.id,
            output: [],
            success: false,
            error:
              error instanceof Error
                ? error.message
                : "Image generation failed",
          };
        }
      }

      case "llm": {
        const incomingEdges = getIncomingEdges(node.id, edges);
        const llmInputs: Record<string, unknown> = {};

        // Collect all inputs from connected nodes
        incomingEdges.forEach((edge) => {
          const sourceNode = nodes.find((n) => n.id === edge.source);
          const value = inputs.get(edge.source);

          if (sourceNode && value !== undefined) {
            const nodeType = sourceNode.data.type;

            // Map node types to variable names
            switch (nodeType) {
              case "input":
                llmInputs.input = value;
                break;
              case "continuityPlanner":
                // Extract selected items from continuity planner
                if (typeof value === "object" && value !== null) {
                  const cpValue = value as {
                    characters?: Array<{
                      name: string;
                      description: string;
                      selected: boolean;
                    }>;
                    shotInfo?: Array<{
                      key: string;
                      value: string;
                      selected: boolean;
                    }>;
                    variants?: Array<{
                      name: string;
                      description: string;
                      selected: boolean;
                    }>;
                    objects?: Array<{
                      name: string;
                      description: string;
                      selected: boolean;
                    }>;
                  };

                  // Only include selected items
                  if (cpValue.characters) {
                    llmInputs.characters = cpValue.characters
                      .filter((c) => c.selected)
                      .map((c) => `${c.name}: ${c.description}`)
                      .join(", ");
                  }
                  if (cpValue.shotInfo) {
                    cpValue.shotInfo
                      .filter((s) => s.selected)
                      .forEach((s) => {
                        llmInputs[s.key] = s.value;
                      });
                  }
                  if (cpValue.variants) {
                    llmInputs.variants = cpValue.variants
                      .filter((v) => v.selected)
                      .map((v) => `${v.name}: ${v.description}`)
                      .join(", ");
                  }
                  if (cpValue.objects) {
                    llmInputs.objects = cpValue.objects
                      .filter((o) => o.selected)
                      .map((o) => `${o.name}: ${o.description}`)
                      .join(", ");
                  }
                }
                break;
              case "contextPrompt":
              case "llm":
                llmInputs[edge.source] = value;
                break;
              default:
                llmInputs[edge.source] = value;
            }
          }
        });

        // Process template with variables
        const processed = processTemplate(nodeData.template, llmInputs);

        if (!useAI) {
          return {
            nodeId: node.id,
            output: processed,
            success: true,
          };
        }

        try {
          // Make LLM call based on selected model
          let response: string;

          if (nodeData.model === "claude") {
            const { callClaude } = await import("../services/anthropic");
            response = await callClaude(processed);
          } else {
            // Llama model
            const { callFalText } = await import("../services/fal");
            response = await callFalText(processed);
          }

          console.log(
            "✅ LLM response received:",
            response.substring(0, 100) + "..."
          );

          return {
            nodeId: node.id,
            output: response,
            success: true,
          };
        } catch (error) {
          console.error("❌ LLM call failed:", error);
          return {
            nodeId: node.id,
            output: "",
            success: false,
            error: error instanceof Error ? error.message : "LLM call failed",
          };
        }
      }

      case "output": {
        const incomingEdges = getIncomingEdges(node.id, edges);

        // Collect all inputs
        const allInputs: string[] = [];

        incomingEdges.forEach((edge) => {
          const value = inputs.get(edge.source);

          if (typeof value === "string") {
            allInputs.push(value);
          } else if (value && typeof value === "object") {
            // Handle complex objects from startFrame/endFrame nodes
            if ("prompt" in value && typeof value.prompt === "string") {
              allInputs.push(`Prompt: ${value.prompt}`);
            }
            if ("image" in value && value.image) {
              allInputs.push(`Image: ${value.image}`);
            }
            if (
              "characterImages" in value &&
              Array.isArray(value.characterImages)
            ) {
              const chars = value.characterImages
                .map(
                  (c: { name: string; url: string }) => `${c.name}: ${c.url}`
                )
                .join("\n");
              if (chars) {
                allInputs.push(`Characters:\n${chars}`);
              }
            }
            if (
              "variantImages" in value &&
              Array.isArray(value.variantImages)
            ) {
              const variants = value.variantImages
                .map(
                  (v: { name: string; url: string }) => `${v.name}: ${v.url}`
                )
                .join("\n");
              if (variants) {
                allInputs.push(`Variants:\n${variants}`);
              }
            }
          }
        });

        const finalOutput =
          allInputs.length > 0 ? allInputs.join("\n\n---\n\n") : "";

        return {
          nodeId: node.id,
          output: finalOutput,
          success: true,
        };
      }

      default:
        return {
          nodeId: node.id,
          output: null,
          success: false,
          error: "Unknown node type",
        };
    }
  } catch (error) {
    return {
      nodeId: node.id,
      output: null,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Execute the entire workflow
 */
export async function executeWorkflow(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  useAI: boolean = false
): Promise<Map<string, unknown>> {
  const sortedNodes = topologicalSort(nodes, edges);
  const results = new Map<string, unknown>();

  for (const node of sortedNodes) {
    const processed = await processNode(node, results, edges, nodes, useAI);
    if (processed.success) {
      results.set(node.id, processed.output);
    } else {
      console.error(`Error processing node ${node.id}:`, processed.error);
      results.set(node.id, null);
    }
  }

  return results;
}

/**
 * Validate workflow for errors
 */
export function validateWorkflow(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for at least one input node
  const hasInput = nodes.some((n) => n.data.type === "input");
  if (!hasInput) {
    errors.push("Workflow must have at least one Input node");
  }

  // Check for disconnected nodes (except input)
  nodes.forEach((node) => {
    if (node.data.type !== "input") {
      const hasIncoming = edges.some((e) => e.target === node.id);
      if (!hasIncoming) {
        errors.push(`Node "${node.data.label}" has no input connections`);
      }
    }
  });

  // Check for cycles
  const sorted = topologicalSort(nodes, edges);
  if (sorted.length !== nodes.length) {
    errors.push("Workflow contains circular dependencies");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
