/**
 * Unified AI Client Module (OpenRouter + Google AI Studio Gemini API)
 */

export const DEFAULT_MODEL = 'deepseek/deepseek-r1';

export const OPENROUTER_MODELS = [
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (OpenRouter Default)' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 (Fast Code)' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B' },
  { id: 'qwen/qwen-2.5-coder-32b-instruct', name: 'Qwen 2.5 Coder' }
];

export const GOOGLE_STUDIO_MODELS = [
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (Google Studio)' },
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (Google Studio)' },
  { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview (Google Studio)' },
  { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash Lite (Google Studio)' },
  { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite (Google Studio)' }
];

/**
 * Detects whether key or model belongs to Google AI Studio
 */
export function isGoogleStudioKeyOrModel(apiKey = '', model = '') {
  const cleanKey = apiKey.trim();
  const cleanModel = model.trim().toLowerCase();
  
  if (cleanKey.startsWith('AQ') || cleanKey.startsWith('AIza') || cleanKey.startsWith('AI')) {
    return true;
  }
  if (cleanModel.startsWith('gemini-3.') || cleanModel.startsWith('gemini-3.5') || cleanModel.startsWith('gemini-3.6') || cleanModel.startsWith('gemini-3.1')) {
    return true;
  }
  return false;
}

/**
 * Universal AI Request Dispatcher
 */
export async function sendOpenRouterRequest({
  apiKey,
  model = DEFAULT_MODEL,
  messages,
  temperature = 0.2,
  onChunk = null
}) {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('API Key is missing. Please set your API Key in extension settings.');
  }

  const useGoogleStudio = isGoogleStudioKeyOrModel(apiKey, model);

  if (useGoogleStudio) {
    return sendGoogleStudioRequest({ apiKey, model, messages, temperature, onChunk });
  } else {
    return sendOpenRouterDirect({ apiKey, model, messages, temperature, onChunk });
  }
}

/**
 * Direct OpenRouter API Fetch
 */
async function sendOpenRouterDirect({ apiKey, model, messages, temperature, onChunk }) {
  const payload = {
    model: model || DEFAULT_MODEL,
    messages: messages,
    temperature: temperature,
    stream: Boolean(onChunk)
  };

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/prhehegd/extension',
      'X-Title': 'LeetSensei'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let errorMsg = `OpenRouter HTTP ${response.status}`;
    try {
      const errData = await response.json();
      if (errData?.error?.message) errorMsg = errData.error.message;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  if (onChunk && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.slice(6);
          if (dataStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta?.content || '';
            if (delta) {
              fullText += delta;
              onChunk(delta, fullText);
            }
          } catch (_) {}
        }
      }
    }
    return fullText;
  } else {
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}

/**
 * Google AI Studio (Gemini API) Fetch with SSE streaming support
 */
async function sendGoogleStudioRequest({ apiKey, model, messages, temperature, onChunk }) {
  // Normalize model name for Google Studio (fallback to gemini-3.6-flash if generic)
  let targetModel = model.trim();
  if (!targetModel || targetModel.includes('/') || targetModel === 'deepseek/deepseek-r1') {
    targetModel = 'gemini-3.6-flash';
  }

  // Extract system prompt & user prompts
  let systemInstructionText = '';
  const contents = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemInstructionText += msg.content + '\n';
    } else {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }
  }

  const payload = {
    contents: contents.length > 0 ? contents : [{ role: 'user', parts: [{ text: 'Hello' }] }],
    generationConfig: {
      temperature: temperature
    }
  };

  if (systemInstructionText.trim()) {
    payload.systemInstruction = {
      parts: [{ text: systemInstructionText.trim() }]
    };
  }

  const endpoint = onChunk
    ? `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:streamGenerateContent?key=${apiKey.trim()}&alt=sse`
    : `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey.trim()}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let errorMsg = `Google Studio API HTTP ${response.status}`;
    try {
      const errData = await response.json();
      if (errData?.error?.message) errorMsg = errData.error.message;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  if (onChunk && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const dataStr = trimmed.slice(6);
          try {
            const parsed = JSON.parse(dataStr);
            const textPart = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (textPart) {
              fullText += textPart;
              onChunk(textPart, fullText);
            }
          } catch (_) {}
        }
      }
    }
    return fullText;
  } else {
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
}
