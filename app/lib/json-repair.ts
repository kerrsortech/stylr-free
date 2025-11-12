/**
 * Robust JSON parsing with repair logic for AI responses
 * Handles common JSON issues like trailing commas, unescaped quotes, etc.
 */

/**
 * Attempt to repair common JSON issues
 */
function repairJSON(jsonString: string): string {
  let repaired = jsonString;

  // CRITICAL: Fix double colons (::) - GPT-5 sometimes outputs "key":: instead of "key":
  repaired = repaired.replace(/::/g, ':');
  
  // Remove trailing commas before closing brackets/braces (most common issue)
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');
  
  // Remove comments (single line and multi-line)
  repaired = repaired.replace(/\/\/.*$/gm, '');
  repaired = repaired.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // Fix multiple consecutive commas
  repaired = repaired.replace(/,+/g, ',');
  
  // Remove commas before closing brackets in arrays (more aggressive)
  repaired = repaired.replace(/,(\s*\])/g, '$1');
  
  // Remove commas before closing braces in objects
  repaired = repaired.replace(/,(\s*\})/g, '$1');
  
  return repaired;
}

/**
 * Extract JSON from text that might contain extra content
 */
function extractJSON(text: string): string {
  // Log the input for debugging (NOTE: This is the GPT-5 JSON response, NOT the URL)
  // The URL is passed in full to GPT-5 - this logging is just for debugging the JSON response
  console.log('[JSON Extract] GPT-5 JSON response length:', text.length, 'chars');
  console.log('[JSON Extract] First 200 chars of JSON (for debugging):', text.substring(0, 200));
  console.log('[JSON Extract] Last 200 chars of JSON (for debugging):', text.substring(Math.max(0, text.length - 200)));
  
  // First, try to find the JSON object
  const firstBrace = text.indexOf('{');
  if (firstBrace === -1) {
    // Try to find if there's any JSON-like structure
    const hasQuotes = text.includes('"');
    const hasBrackets = text.includes('[');
    console.error('[JSON Extract] No opening brace found');
    console.error('[JSON Extract] Has quotes:', hasQuotes);
    console.error('[JSON Extract] Has brackets:', hasBrackets);
    console.error('[JSON Extract] Full response:', text);
    throw new Error('No JSON object found in response - no opening brace {');
  }

  console.log('[JSON Extract] Found opening brace at position:', firstBrace);

  // Find the matching closing brace
  let braceCount = 0;
  let lastBrace = -1;
  
  for (let i = firstBrace; i < text.length; i++) {
    if (text[i] === '{') {
      braceCount++;
    } else if (text[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        lastBrace = i;
        break;
      }
    }
  }

  if (lastBrace === -1 || lastBrace <= firstBrace) {
    console.error('[JSON Extract] Unmatched braces');
    console.error('[JSON Extract] Opening brace at:', firstBrace);
    console.error('[JSON Extract] Closing brace at:', lastBrace);
    console.error('[JSON Extract] Final brace count:', braceCount);
    console.error('[JSON Extract] Text around opening brace:', text.substring(Math.max(0, firstBrace - 50), Math.min(text.length, firstBrace + 200)));
    throw new Error(`Invalid JSON structure: unmatched braces (opening at ${firstBrace}, closing at ${lastBrace}, count: ${braceCount})`);
  }

  const extracted = text.substring(firstBrace, lastBrace + 1);
  console.log('[JSON Extract] Successfully extracted JSON, length:', extracted.length);
  return extracted;
}

/**
 * Parse JSON with multiple repair attempts
 */
export function parseJSONRobust(response: string): any {
  // Step 1: Clean basic markdown and whitespace
  let cleaned = response.trim();
  cleaned = cleaned.replace(/```json\s*/gi, '');
  cleaned = cleaned.replace(/```\s*/g, '');
  cleaned = cleaned.trim();

  // Step 2: Extract JSON object
  let jsonString: string;
  try {
    jsonString = extractJSON(cleaned);
  } catch (e: any) {
    // Log the extraction failure with context
    console.error('[JSON Repair] extractJSON failed:', e.message);
    console.error('[JSON Repair] Response length:', cleaned.length);
    console.error('[JSON Repair] First 500 chars:', cleaned.substring(0, 500));
    console.error('[JSON Repair] Last 500 chars:', cleaned.substring(Math.max(0, cleaned.length - 500)));
    
    // Fallback 1: try regex match (greedy)
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      console.log('[JSON Repair] Using regex fallback (greedy match)');
      jsonString = jsonMatch[0];
    } else {
      // Fallback 2: try to find JSON-like structure with non-greedy match
      const jsonMatchNonGreedy = cleaned.match(/\{[\s\S]*?\}/);
      if (jsonMatchNonGreedy) {
        console.log('[JSON Repair] Using regex fallback (non-greedy match)');
        jsonString = jsonMatchNonGreedy[0];
      } else {
        // Fallback 3: try to find any structure that looks like JSON
        const hasBraces = cleaned.includes('{') && cleaned.includes('}');
        const hasQuotes = cleaned.includes('"');
        console.error('[JSON Repair] All extraction methods failed');
        console.error('[JSON Repair] Has braces:', hasBraces);
        console.error('[JSON Repair] Has quotes:', hasQuotes);
        console.error('[JSON Repair] Full cleaned response (first 2000 chars):', cleaned.substring(0, 2000));
        if (cleaned.length > 2000) {
          console.error('[JSON Repair] Full cleaned response (last 2000 chars):', cleaned.substring(cleaned.length - 2000));
        }
        throw new Error(`Could not extract JSON from response. Original error: ${e.message}`);
      }
    }
  }

  // Step 3: Try parsing with multiple repair strategies
  const strategies = [
    // Strategy 1: Direct parse (best case)
    (str: string) => {
      try {
        return JSON.parse(str);
      } catch (e) {
        return null;
      }
    },
    
    // Strategy 2: Repair common issues (including double colons)
    (str: string) => {
      try {
        const repaired = repairJSON(str);
        return JSON.parse(repaired);
      } catch (e) {
        return null;
      }
    },
    
    // Strategy 2b: Fix double colons first, then repair
    (str: string) => {
      try {
        // Fix double colons BEFORE other repairs
        let fixed = str.replace(/::/g, ':');
        const repaired = repairJSON(fixed);
        return JSON.parse(repaired);
      } catch (e) {
        return null;
      }
    },
    
    // Strategy 3: Fix trailing commas more aggressively (multiple passes) + double colons
    (str: string) => {
      try {
        let fixed = str.replace(/::/g, ':'); // Fix double colons first
        // Multiple passes to catch all trailing commas
        for (let i = 0; i < 5; i++) {
          fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
        }
        // Remove commas before closing brackets specifically
        fixed = fixed.replace(/,(\s*\])/g, '$1');
        fixed = fixed.replace(/,(\s*\})/g, '$1');
        return JSON.parse(fixed);
      } catch (e) {
        return null;
      }
    },
    
    // Strategy 4: Aggressive trailing comma removal (array-specific) + double colons
    (str: string) => {
      try {
        let fixed = str.replace(/::/g, ':'); // Fix double colons first
        // Remove trailing commas (multiple passes, up to 10)
        for (let i = 0; i < 10; i++) {
          fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
          fixed = fixed.replace(/,(\s*\n\s*[}\]])/g, '$1');
        }
        return JSON.parse(fixed);
      } catch (e) {
        return null;
      }
    },
    
    // Strategy 5: Last resort - try to extract and fix just the problematic array + double colons
    (str: string) => {
      try {
        // This is a more complex repair - try to identify and fix array issues
        let fixed = str.replace(/::/g, ':'); // Fix double colons first
        // Remove all trailing commas aggressively
        let previous = '';
        for (let i = 0; i < 20 && fixed !== previous; i++) {
          previous = fixed;
          fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
          fixed = fixed.replace(/,(\s*\n\s*[}\]])/g, '$1');
        }
        return JSON.parse(fixed);
      } catch (e) {
        return null;
      }
    },
  ];

  // Try each strategy
  for (let i = 0; i < strategies.length; i++) {
    const result = strategies[i](jsonString);
    if (result !== null) {
      console.log(`[JSON Repair] Successfully parsed using strategy ${i + 1}`);
      return result;
    }
  }

  // If all strategies fail, try to extract error position from last parse attempt
  let errorPosition = -1;
  let lastError: any = null;
  
  // Try one more time to get the actual error position
  try {
    JSON.parse(jsonString);
  } catch (e: any) {
    lastError = e;
    // Try to extract position from error message
    const posMatch = e.message?.match(/position (\d+)/);
    if (posMatch) {
      errorPosition = parseInt(posMatch[1], 10);
    }
  }

  // Provide detailed error info
  console.error('[JSON Repair] All parsing strategies failed');
  console.error(`[JSON Repair] Full JSON length: ${jsonString.length}`);
  
  if (errorPosition > 0 && errorPosition < jsonString.length) {
    const startPos = Math.max(0, errorPosition - 300);
    const endPos = Math.min(jsonString.length, errorPosition + 300);
    const context = jsonString.substring(startPos, endPos);
    
    console.error(`[JSON Repair] Error around position ${errorPosition}:`);
    console.error(`[JSON Repair] Context (600 chars): ...${context}...`);
    
    // Log the problematic line
    const lineStart = jsonString.lastIndexOf('\n', errorPosition);
    const lineEnd = jsonString.indexOf('\n', errorPosition);
    const line = jsonString.substring(lineStart + 1, lineEnd === -1 ? jsonString.length : lineEnd);
    console.error(`[JSON Repair] Problematic line: ${line}`);
    console.error(`[JSON Repair] Character at error: "${jsonString[errorPosition]}" (char code: ${jsonString.charCodeAt(errorPosition)})`);
    
    // Try to identify the issue
    const beforeError = jsonString.substring(Math.max(0, errorPosition - 50), errorPosition);
    const afterError = jsonString.substring(errorPosition, Math.min(jsonString.length, errorPosition + 50));
    console.error(`[JSON Repair] Before error: ...${beforeError}`);
    console.error(`[JSON Repair] After error: ${afterError}...`);
  } else {
    // Log first and last parts of JSON for debugging
    console.error(`[JSON Repair] First 1000 chars: ${jsonString.substring(0, 1000)}`);
    console.error(`[JSON Repair] Last 1000 chars: ${jsonString.substring(Math.max(0, jsonString.length - 1000))}`);
    console.error(`[JSON Repair] Full response length: ${cleaned.length}`);
    console.error(`[JSON Repair] Full response (first 2000 chars): ${cleaned.substring(0, 2000)}`);
  }

  throw new Error(
    `Failed to parse JSON after ${strategies.length} repair attempts. ` +
    (errorPosition > 0 ? `Error at position ${errorPosition}. ` : '') +
    `Check server logs for detailed context. Original error: ${lastError?.message || 'Unknown'}`
  );
}

