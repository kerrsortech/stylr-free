import { fetchWithTimeout } from './utils';
import { parseJSONRobust } from './json-repair';
import { logError, shouldRetry, getBackoffDelay } from './error-handler';

export interface LLMResponse {
  text: string;
  error?: string;
}

/**
 * Get the latest version hash for a Replicate model
 * Tries multiple approaches to get the version
 */
async function getModelVersion(modelName: string, apiToken: string): Promise<string | null> {
  // Try approach 1: Get model info first (includes latest_version - most reliable)
  try {
    const response = await fetchWithTimeout(
      `https://api.replicate.com/v1/models/${modelName}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Token ${apiToken}`,
          'Content-Type': 'application/json',
        },
      },
      15000
    );

    if (response.ok) {
      const data = await response.json();
      
      // Model has latest_version.id field
      if (data.latest_version && data.latest_version.id) {
        return data.latest_version.id;
      }
      // Some models have a default_version field
      if (data.default_version) {
        return data.default_version;
      }
    } else {
      const errorText = await response.text();
      logError(new Error(`Model info API returned ${response.status}: ${errorText.substring(0, 200)}`), 'get_model_version');
    }
  } catch (error: any) {
    logError(error, 'get_model_version');
  }

  // Try approach 2: Get versions list as fallback
  try {
    const response = await fetchWithTimeout(
      `https://api.replicate.com/v1/models/${modelName}/versions`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Token ${apiToken}`,
          'Content-Type': 'application/json',
        },
      },
      15000
    );

    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        // Return the latest version ID (hash)
        return data.results[0].id;
      }
    } else {
      const errorText = await response.text();
      logError(new Error(`Version API returned ${response.status}: ${errorText.substring(0, 200)}`), 'get_model_version_fallback');
    }
  } catch (error: any) {
    logError(error, 'get_model_version_fallback');
  }

  return null;
}

/**
 * Call AI prediction API
 * Handles async prediction polling
 */
async function callReplicatePredictionAPI(
  prompt: string,
  systemPrompt: string | undefined,
  modelName: string,
  apiToken: string,
  options: {
    maxTokens?: number;
    temperature?: number;
    jsonMode?: boolean;
  }
): Promise<string> {
  // Get the model version hash (required by API)
  const version = await getModelVersion(modelName, apiToken);
  
  if (!version) {
    const error = new Error('Failed to get model version. Service configuration error.');
    logError(error, 'call_prediction_api', { modelName });
    throw error;
  }

  // Prepare the request body according to API format
  // Accepts: prompt, messages, system_prompt, verbosity, reasoning_effort, max_completion_tokens
  
  let finalPrompt = prompt;
  // If JSON mode is requested, add explicit instruction to the prompt
  if (options.jsonMode) {
    finalPrompt = `${prompt}\n\nCRITICAL JSON FORMATTING REQUIREMENTS:
- You MUST return ONLY valid JSON
- Start with { and end with }
- NO markdown code blocks (no code fences)
- NO explanations before or after the JSON
- NO comments or notes
- Return pure, parseable JSON only
- The response must be valid JSON that can be directly parsed by JSON.parse()`;
  }
  
  const requestBody: any = {
    version: version,
    input: {
      system_prompt: systemPrompt || undefined,
      prompt: finalPrompt,
      max_completion_tokens: options.maxTokens || 4000,
      verbosity: 'medium',
      reasoning_effort: 'medium',
    },
  };

  // Create prediction
  // Initial prediction creation - allow 60 seconds timeout for initial request
  const createResponse = await fetchWithTimeout(
    'https://api.replicate.com/v1/predictions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    },
    60000 // 60 seconds for initial prediction creation
  );

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    throw new Error(`Failed to create prediction: ${errorText}`);
  }

  const prediction = await createResponse.json();
  const predictionId = prediction.id;

  if (!predictionId) {
    const error = new Error('Failed to get prediction ID from service');
    logError(error, 'call_prediction_api');
    throw error;
  }

  // Poll for result (Replicate predictions are async)
  let result: any = null;
  let attempts = 0;
  const maxAttempts = 300; // 5 minutes max (1 second per attempt, allows 4+ minutes for processing)

  while (!result && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

    const statusResponse = await fetchWithTimeout(
      `https://api.replicate.com/v1/predictions/${predictionId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Token ${apiToken}`,
        },
      },
      15000 // 15 second timeout for each status check
    );

    if (!statusResponse.ok) {
      throw new Error(`Failed to check prediction status: ${statusResponse.statusText}`);
    }

    const statusData = await statusResponse.json();

    if (statusData.status === 'succeeded') {
      result = statusData.output;
      break;
    } else if (statusData.status === 'failed') {
      throw new Error(`Prediction failed: ${statusData.error || 'Unknown error'}`);
    } else if (statusData.status === 'canceled') {
      throw new Error('Prediction was canceled');
    }

    attempts++;
    
    // Log progress every 30 seconds for long-running requests
    if (attempts % 30 === 0) {
      console.log(`[Replicate] Polling prediction ${predictionId}: ${attempts}s elapsed, status: ${statusData.status}`);
    }
  }

  if (!result) {
    throw new Error('Prediction timed out after 5 minutes');
  }

  // Extract text from result (returns array of strings/tokens)
  // Output is an array of strings that need to be concatenated
  if (Array.isArray(result) && result.length > 0) {
    // Returns array of token strings - join them together
    return result.map(item => typeof item === 'string' ? item : String(item)).join('');
  } else if (typeof result === 'string') {
    return result;
  } else if (result && typeof result === 'object') {
    // If result is an object, try to extract text or stringify
    if (result.text) {
      return result.text;
    } else if (result.content) {
      return result.content;
    } else if (result.output) {
      // Handle nested output
      if (Array.isArray(result.output)) {
        return result.output.map((item: any) => typeof item === 'string' ? item : String(item)).join('');
      }
      return typeof result.output === 'string' ? result.output : JSON.stringify(result.output);
    } else {
      // Return as JSON string
      return JSON.stringify(result);
    }
  } else {
    return String(result);
  }
}

/**
 * Call AI service API with retry logic and exponential backoff
 * Handles both product extraction and content enhancement
 */
export async function callReplicateLLM(
  prompt: string,
  systemPrompt?: string,
  options: {
    maxTokens?: number;
    temperature?: number;
    jsonMode?: boolean;
    maxRetries?: number;
  } = {}
): Promise<string> {
  const replicateApiToken = process.env.REPLICATE_API_TOKEN;
  
  if (!replicateApiToken) {
    const error = new Error('Service authentication not configured');
    logError(error, 'call_llm', { hasToken: false });
    throw error;
  }

  const {
    maxTokens = 4000,
    temperature = 0.7,
    jsonMode = false,
    maxRetries = 3,
  } = options;

  const modelName = process.env.REPLICATE_MODEL || 'openai/gpt-5';
  
  let lastError: any = null;
  
  // Retry logic with exponential backoff
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await callReplicatePredictionAPI(
        prompt,
        systemPrompt,
        modelName,
        replicateApiToken,
        { maxTokens, temperature, jsonMode }
      );
    } catch (error: any) {
      lastError = error;
      
      // Check if we should retry
      if (attempt < maxRetries && shouldRetry(error, attempt, maxRetries)) {
        const delay = getBackoffDelay(attempt);
        logError(error, 'call_llm_retry', { attempt: attempt + 1, maxRetries, delay });
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // Don't retry - log and throw
      logError(error, 'call_llm', { attempt: attempt + 1, maxRetries });
      throw new Error(`AI service call failed: ${error.message}`);
    }
  }
  
  // Should never reach here, but TypeScript needs it
  throw lastError || new Error('AI service call failed after retries');
}

/**
 * Enhance product content using AI
 * Optimized prompt to provide detailed enhancements with reasoning
 */
export async function enhanceContentWithLLM(
  productData: {
    title: string;
    description: string;
    features: string[];
    productType: string;
    category: string;
    metaTitle?: string;
    metaDescription?: string;
    h1?: string;
    ctaText?: string;
    images?: Array<{ src: string; alt: string }>;
  },
  url: string,
  technicalSEO?: any
): Promise<{
  summary: {
    overallAssessment: string;
    strengths: string[];
    weaknesses: string[];
    priorityRecommendations: string[];
  };
  title: { current: string; enhanced: string; reasoning: string; improvement: string };
  metaDescription: { current: string; enhanced: string; reasoning: string; improvement: string };
  description: { current: string; enhanced: string; reasoning: string; improvement: string };
  features: { current: string[]; enhanced: string[]; reasoning: string; improvement: string };
  contentQualityScore: number;
}> {
  const systemPrompt = `You are a production-grade e-commerce SEO and conversion optimization expert. Your task is to analyze REAL product pages and provide actionable, data-driven enhancements.

CRITICAL REQUIREMENTS:
1. Visit the provided URL and analyze the ACTUAL page content
2. Use the current content provided - these are REAL values from the page
3. Provide enhancements based on REAL analysis, not generic templates
4. Return ONLY valid JSON - no markdown, no explanations
5. All enhancements must be production-ready and implementable

ENHANCEMENT APPROACH:
- Base enhancements on the actual product, category, and target audience
- Use real SEO best practices (keyword optimization, search intent, CTR optimization)
- Apply real conversion psychology (benefits over features, trust signals, clarity)
- Provide specific, actionable improvements with measurable impact
- Ensure all enhanced content is ready to use immediately

For EVERY enhancement, provide ONLY:
- Enhanced content: Optimized version ready for production use
- Reasoning: A concise explanation (2-3 lines maximum) that clearly communicates:
  1. First line: How the writing is better - explain why this enhanced content is clearer, easier to understand, or more effective for users. Be specific about what makes it better based on the actual content you wrote.
  2. Second line: SEO improvement - directly state how this improves SEO (keyword optimization, search intent alignment, semantic relevance, ranking signals, etc.). Don't say "from an SEO perspective" - just state the SEO benefits directly.
- Improvement: Quantified impact (e.g., "+35% CTR potential", "+28% keyword coverage")

CRITICAL REASONING REQUIREMENTS:
- Keep it concise: Maximum 2-3 lines total (not a chunky paragraph)
- Be clear and humane: Use simple, easy-to-understand language
- Be specific: Base reasoning on the actual enhanced content you wrote, not generic statements
- Structure: First line = writing improvement (user-focused), Second line = SEO improvement (direct SEO points)
- Explain why: Clearly communicate why this specific content is better than the original

IMPORTANT: Do NOT return "current" content - we already have it from the page. Only return enhanced, reasoning, and improvement.`;

  // Optimize: Only send minimal essential context since AI can visit the URL
  const technicalSEOSection = technicalSEO ? `Ref: Title="${technicalSEO.metaTitle || ''}", Desc="${technicalSEO.metaDescription || ''}", H1="${technicalSEO.h1 || ''}" (${technicalSEO.h1Count}), Schema=${!!technicalSEO.schema}, Images=${technicalSEO.images?.length || 0}` : '';

  // Log full URL to confirm it's passed completely to GPT-5
  console.log('[GPT-5 Enhance] Full URL being analyzed (length:', url.length, 'chars):', url);
  console.log('[GPT-5 Enhance] GPT-5 will analyze the COMPLETE page for enhancements - no truncation');

  const userPrompt = `URL: ${url}
${technicalSEOSection ? `Context: ${technicalSEOSection}` : ''}
Product: ${productData.productType} | ${productData.category} | Title: "${productData.title}" | CTA: "${productData.ctaText || ''}"

CRITICAL: You MUST visit and analyze the COMPLETE, FULL page at the URL above.
- The URL may be long (300+ characters) - this is normal and expected
- Analyze the ENTIRE page content, ALL sections, ALL text
- Read through the complete product description, features, specifications
- Review ALL visible content on the page before providing enhancements

Analyze the COMPLETE URL and provide enhancements:

1. summary: overallAssessment (2-3 sentences), strengths (3-5), weaknesses (3-5), priorityRecommendations (3-5)
2. title: enhanced (50-60 chars, keyword-rich), reasoning (2-3 lines: first line = writing improvement, second line = SEO improvement), improvement (quantified impact)
3. metaDescription: enhanced (150-160 chars, CTA+benefits), reasoning (2-3 lines: first line = writing improvement, second line = SEO improvement), improvement (quantified)
4. description: enhanced (200-300 words, benefit-focused, SEO-optimized), reasoning (2-3 lines: first line = writing improvement, second line = SEO improvement), improvement (quantified)
5. features: enhanced (5-7 items, benefit-focused, trust signals), reasoning (2-3 lines: first line = writing improvement, second line = SEO improvement), improvement (quantified)
6. contentQualityScore: 0-100 (SEO, conversion, UX, completeness, trust)

REASONING WRITING STYLE - CRITICAL:
- Keep it concise: Maximum 2-3 lines total (not a chunky paragraph)
- Structure: First line explains how the writing is better (clearer, easier to understand, more effective for users). Second line states SEO improvements directly (keyword optimization, search intent, semantic relevance, ranking signals, etc.)
- Be specific: Base reasoning on the actual enhanced content you wrote - explain why THIS specific content is better, not generic statements
- Be clear and humane: Use simple, easy-to-understand language that anyone can grasp
- Don't use phrases like "from an SEO perspective" - just state SEO benefits directly
- Explain why: Clearly communicate why this specific enhanced content is better than the original

Principles: SEO (keywords, search intent, rich results), Conversion (benefits>features, trust signals, urgency), UX (scannable, clear, accessible).

Return ONLY valid JSON, no markdown, no "current" fields (we have them), no trailing commas:

{
  "summary": {
    "overallAssessment": "Comprehensive 2-3 sentence assessment of the page's current state",
    "strengths": ["Strength 1", "Strength 2", "Strength 3"],
    "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"],
    "priorityRecommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
  },
  "title": {
    "enhanced": "Optimized title (50-60 chars)",
    "reasoning": "Concise 2-3 line explanation: first line = writing improvement, second line = SEO improvement",
    "improvement": "+X% keyword coverage, +Y% CTR potential"
  },
  "metaDescription": {
    "enhanced": "Optimized meta description (150-160 chars)",
    "reasoning": "Concise 2-3 line explanation: first line = writing improvement, second line = SEO improvement",
    "improvement": "+X% CTR from search results"
  },
  "description": {
    "enhanced": "Rewritten optimized description (200-300 words with subheadings)",
    "reasoning": "Concise 2-3 line explanation: first line = writing improvement, second line = SEO improvement",
    "improvement": "+X% engagement, +Y% conversion, +Z% SEO value"
  },
  "features": {
    "enhanced": ["Enhanced feature 1 with benefit", "Enhanced feature 2 with trust signal", "New feature 3"],
    "reasoning": "Concise 2-3 line explanation: first line = writing improvement, second line = SEO improvement",
    "improvement": "+X% conversion rate, +Y% trust signals"
  },
  "contentQualityScore": 85
}`;

  try {
    const response = await callReplicateLLM(userPrompt, systemPrompt, {
      maxTokens: 5000,
      temperature: 0.3,
      jsonMode: true,
    });

    // Parse JSON response with robust error handling
    let parsedData;
    try {
      parsedData = parseJSONRobust(response);
      
      // Validate that we got an object with expected structure
      if (typeof parsedData !== 'object' || parsedData === null || Array.isArray(parsedData)) {
        throw new Error('Response is not a JSON object');
      }
      
      // Validate and create missing fields with defaults (don't throw, just log)
      if (!parsedData.summary) {
        console.warn('[Enhance] Missing summary field, creating default');
        parsedData.summary = {
          overallAssessment: 'Content analysis completed',
          strengths: [],
          weaknesses: [],
          priorityRecommendations: [],
        };
      }
      
      if (!parsedData.title) {
        console.warn('[Enhance] Missing title field, creating default');
        parsedData.title = { enhanced: productData.title || 'Product', reasoning: '', improvement: '' };
      }
      
      if (!parsedData.description) {
        console.warn('[Enhance] Missing description field, creating default');
        parsedData.description = { enhanced: productData.description || 'Product description', reasoning: '', improvement: '' };
      }
      
      if (!parsedData.features) {
        console.warn('[Enhance] Missing features field, creating default');
        parsedData.features = { enhanced: productData.features || [], reasoning: '', improvement: '' };
      }
      
      if (!parsedData.metaDescription) {
        console.warn('[Enhance] Missing metaDescription field, creating default');
        parsedData.metaDescription = { enhanced: productData.metaDescription || '', reasoning: '', improvement: '' };
      }
      
      // Ensure contentQualityScore exists
      if (typeof parsedData.contentQualityScore !== 'number') {
        console.warn('[Enhance] Missing or invalid contentQualityScore, using default');
        parsedData.contentQualityScore = 50;
      }
      
      // Merge scraped "current" content with enhanced content
      // AI service only returns enhanced + reasoning + improvement (saves tokens)
      // We use our scraped/extracted data as the "current" content
      
      // Title
      if (parsedData.title && !parsedData.title.current) {
        parsedData.title.current = productData.title || 'Not available';
      }
      
      // Description
      if (parsedData.description && !parsedData.description.current) {
        parsedData.description.current = productData.description || 'Not available';
      }
      
      // Features
      if (parsedData.features && !parsedData.features.current) {
        parsedData.features.current = productData.features && productData.features.length > 0 
          ? productData.features 
          : ['No features listed'];
      }
      
      // Meta Description
      if (parsedData.metaDescription && !parsedData.metaDescription.current) {
        parsedData.metaDescription.current = productData.metaDescription || 'Not available';
      }
      
    } catch (parseError: any) {
      logError(parseError, 'enhance_content_parse', {
        responseLength: response.length,
        responsePreview: response.substring(0, 500)
      });
      throw new Error(`Invalid data format from AI service: ${parseError.message}`);
    }

    return parsedData;
  } catch (error: any) {
    logError(error, 'enhance_content');
    throw new Error(`Content enhancement failed: ${error.message}`);
  }
}

