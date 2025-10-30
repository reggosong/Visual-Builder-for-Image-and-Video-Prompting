/**
 * Template Engine for processing prompt templates with variable substitution
 */

export interface TemplateVariable {
  name: string;
  value: any;
  type: "string" | "array" | "object";
}

/**
 * Extract variable names from a template string
 * e.g., "Hello {{name}}, your {{items}} are ready" -> ['name', 'items']
 */
export function extractVariableNames(template: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(template)) !== null) {
    const varName = match[1].trim();
    if (!variables.includes(varName)) {
      variables.push(varName);
    }
  }

  return variables;
}

/**
 * Format a value for insertion into template
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.filter((v) => v != null).join(", ");
  }

  if (typeof value === "object") {
    // For objects like ShotInfo, create a readable string
    const entries = Object.entries(value)
      .filter(([_, v]) => v != null && v !== "")
      .map(([k, v]) => `${k}: ${v}`);
    return entries.join(", ");
  }

  return String(value);
}

/**
 * Process a template with provided variables
 */
export function processTemplate(
  template: string,
  variables: Record<string, any>
): string {
  let result = template;

  // Replace all {{variable}} patterns
  const regex = /\{\{([^}]+)\}\}/g;

  result = result.replace(regex, (match, varName) => {
    const trimmedName = varName.trim();

    // Check if variable exists
    if (trimmedName in variables) {
      return formatValue(variables[trimmedName]);
    }

    // If variable doesn't exist, keep the placeholder
    return match;
  });

  return result;
}

/**
 * Validate if all required variables are provided
 */
export function validateTemplate(
  template: string,
  variables: Record<string, any>
): { valid: boolean; missing: string[] } {
  const required = extractVariableNames(template);
  const missing = required.filter(
    (name: string) => !(name in variables) || variables[name] == null
  );

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Get a preview of the template with current variables
 * Shows placeholder text for missing variables
 */
export function previewTemplate(
  template: string,
  variables: Record<string, any>
): string {
  let result = template;
  const regex = /\{\{([^}]+)\}\}/g;

  result = result.replace(regex, (_match: string, varName: string) => {
    const trimmedName = varName.trim();

    if (trimmedName in variables && variables[trimmedName] != null) {
      const formatted = formatValue(variables[trimmedName]);
      return formatted || `[empty ${trimmedName}]`;
    }

    return `[${trimmedName}]`;
  });

  return result;
}

/**
 * Merge multiple input values into a single context
 */
export function mergeInputs(inputs: Record<string, any>): Record<string, any> {
  const merged: Record<string, any> = {};

  for (const [key, value] of Object.entries(inputs)) {
    if (value === null || value === undefined) {
      continue;
    }

    // If value is an object with known structure, flatten it
    if (typeof value === "object" && !Array.isArray(value)) {
      Object.assign(merged, value);
    } else {
      merged[key] = value;
    }
  }

  return merged;
}

/**
 * Create a default template based on available variables
 */
export function createDefaultTemplate(variables: string[]): string {
  if (variables.length === 0) {
    return "Enter your template here...";
  }

  return variables.map((v: string) => `{{${v}}}`).join(" ");
}
