/**
 * Unified AI Client Module (OpenRouter + Google AI Studio Gemini API)
 */

export const DEFAULT_MODEL = 'deepseek/deepseek-r1';
export const OLLAMA_DEFAULT_MODEL = 'qwen3';

/**
 * Detects whether key or model belongs to Google AI Studio
 */
export function isGoogleStudioKeyOrModel(apiKey = '', model = '') {
  const cleanKey = apiKey.trim();
  const cleanModel = model.trim().toLowerCase();
  
  if (cleanKey.startsWith('AQ') || cleanKey.startsWith('AIza') || cleanKey.startsWith('AI')) {
    return true;
  }
  if (cleanModel.startsWith('gemini-3.')) {
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
  provider = 'auto',
  messages,
  temperature = 0.2,
  onChunk = null
}) {
  if (provider === 'ollama') {
    return sendOllamaRequest({ model, messages, temperature, onChunk });
  }
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

async function sendOllamaRequest({ model, messages, temperature, onChunk }) {
  const response = await fetch('http://localhost:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || OLLAMA_DEFAULT_MODEL,
      messages,
      stream: false,
      options: { temperature }
    })
  });
  if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
  const data = await response.json();
  const text = data.message?.content || '';
  if (onChunk && text) onChunk(text, text);
  return text;
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
    return readSse(response, dataStr => {
      try {
        return JSON.parse(dataStr).choices?.[0]?.delta?.content || '';
      } catch (_) {
        return '';
      }
    }, onChunk);
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
    return readSse(response, dataStr => {
      try {
        return JSON.parse(dataStr).candidates?.[0]?.content?.parts?.[0]?.text || '';
      } catch (_) {
        return '';
      }
    }, onChunk);
  } else {
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }
}

async function readSse(response, parseChunk, onChunk) {
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
      if (!trimmed.startsWith('data: ')) continue;
      const dataStr = trimmed.slice(6);
      if (dataStr === '[DONE]') return fullText;
      const chunk = parseChunk(dataStr);
      if (chunk) {
        fullText += chunk;
        onChunk(chunk, fullText);
      }
    }
  }
  return fullText;
}
