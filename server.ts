import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to get GoogleGenAI client with standard User-Agent header
function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper to strip data URL prefix if present
function cleanBase64(dataUrl: string): { data: string; mimeType: string } {
  if (dataUrl.includes(';base64,')) {
    const parts = dataUrl.split(';base64,');
    const mimeMatch = parts[0].match(/data:(.*?)$/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
    return { data: parts[1], mimeType };
  }
  return { data: dataUrl, mimeType: 'image/png' };
}

// Helper to determine if an error is quota/billing limit related
function isQuotaExhaustedError(err: any): boolean {
  const str = typeof err === 'string' ? err : JSON.stringify(err || '');
  return (
    str.includes('RESOURCE_EXHAUSTED') ||
    str.includes('429') ||
    str.includes('quota') ||
    str.includes('limit: 0') ||
    str.includes('rate-limits')
  );
}

// High-resolution procedural SVG casino card generator for Free Tier fallback
function generateProceduralKenoImage(
  prompt: string,
  aspectRatio: string = '1:1',
  imageSize: string = '1K'
): string {
  // Dimensions based on aspect ratio
  let width = 800;
  let height = 800;
  if (aspectRatio === '16:9') {
    width = 960;
    height = 540;
  } else if (aspectRatio === '9:16') {
    width = 540;
    height = 960;
  } else if (aspectRatio === '4:3') {
    width = 800;
    height = 600;
  } else if (aspectRatio === '3:4') {
    width = 600;
    height = 800;
  }

  // Extract numbers from prompt if present
  const numberMatches = prompt.match(/\b([1-9]|[1-7][0-9]|80)\b/g);
  const luckyNumbers = numberMatches
    ? Array.from(new Set(numberMatches.map(Number))).slice(0, 8)
    : [7, 14, 21, 77];

  // Pick theme palette based on prompt keywords
  const isNeon = prompt.toLowerCase().includes('neon') || prompt.toLowerCase().includes('cyber');
  const isRetro = prompt.toLowerCase().includes('retro') || prompt.toLowerCase().includes('1980');
  const bgGradientStart = isNeon ? '#060814' : isRetro ? '#1c0c04' : '#051911';
  const bgGradientEnd = isNeon ? '#16082b' : isRetro ? '#2e1208' : '#080d1a';
  const accentGold = isNeon ? '#06b6d4' : '#f59e0b';
  const accentSecondary = isNeon ? '#d946ef' : '#fbbf24';

  const ballsSvg = luckyNumbers
    .map((num, i) => {
      const total = luckyNumbers.length;
      const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
      const radius = Math.min(width, height) * 0.26;
      const cx = width / 2 + Math.cos(angle) * radius;
      const cy = height / 2 + Math.sin(angle) * radius;
      return `
      <g transform="translate(${cx}, ${cy})">
        <circle r="36" fill="url(#ballGlow)" filter="url(#dropShadow)" />
        <circle r="32" fill="url(#ballGold)" stroke="#fff" stroke-width="2" stroke-opacity="0.8" />
        <circle r="22" fill="#ffffff" fill-opacity="0.9" />
        <text x="0" y="8" font-family="system-ui, sans-serif" font-weight="900" font-size="22" fill="#0f172a" text-anchor="middle">${num}</text>
      </g>`;
    })
    .join('');

  // Clean prompt text for display
  const escapedPrompt = prompt
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .slice(0, 95);

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgGradientStart}" />
        <stop offset="100%" stop-color="${bgGradientEnd}" />
      </linearGradient>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a" />
        <stop offset="30%" stop-color="${accentGold}" />
        <stop offset="70%" stop-color="#b45309" />
        <stop offset="100%" stop-color="${accentSecondary}" />
      </linearGradient>
      <linearGradient id="ballGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef9c3" />
        <stop offset="50%" stop-color="${accentGold}" />
        <stop offset="100%" stop-color="#92400e" />
      </linearGradient>
      <radialGradient id="ballGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${accentGold}" stop-opacity="0.6" />
        <stop offset="100%" stop-color="${accentGold}" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${accentSecondary}" stop-opacity="0.25" />
        <stop offset="100%" stop-color="${bgGradientEnd}" stop-opacity="0" />
      </radialGradient>
      <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#000" flood-opacity="0.6"/>
      </filter>
      <pattern id="kenoGridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
        <rect width="36" height="36" fill="none" stroke="${accentGold}" stroke-opacity="0.05" rx="4" />
      </pattern>
    </defs>

    <!-- Background -->
    <rect width="${width}" height="${height}" fill="url(#bgGrad)" />
    <rect width="${width}" height="${height}" fill="url(#kenoGridPattern)" />
    <circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) * 0.45}" fill="url(#centerGlow)" />

    <!-- Outer Guilloche Border -->
    <rect x="24" y="24" width="${width - 48}" height="${height - 48}" rx="20" fill="none" stroke="url(#goldGrad)" stroke-width="3" filter="url(#dropShadow)" />
    <rect x="34" y="34" width="${width - 68}" height="${height - 68}" rx="14" fill="none" stroke="url(#goldGrad)" stroke-width="1" stroke-dasharray="6,4" stroke-opacity="0.7" />

    <!-- Corner Accents -->
    <circle cx="48" cy="48" r="6" fill="url(#goldGrad)" />
    <circle cx="${width - 48}" cy="48" r="6" fill="url(#goldGrad)" />
    <circle cx="48" cy="${height - 48}" r="6" fill="url(#goldGrad)" />
    <circle cx="${width - 48}" cy="${height - 48}" r="6" fill="url(#goldGrad)" />

    <!-- Center Medallion -->
    <g filter="url(#dropShadow)">
      <circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) * 0.16}" fill="#0f172a" stroke="url(#goldGrad)" stroke-width="4" />
      <circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) * 0.14}" fill="none" stroke="url(#goldGrad)" stroke-width="1.5" stroke-dasharray="4,3" />
      <text x="${width / 2}" y="${height / 2 - 12}" font-family="system-ui, sans-serif" font-weight="900" font-size="28" fill="url(#goldGrad)" text-anchor="middle" letter-spacing="3">KENO</text>
      <text x="${width / 2}" y="${height / 2 + 16}" font-family="system-ui, sans-serif" font-weight="700" font-size="14" fill="#e2e8f0" text-anchor="middle" letter-spacing="6">TALISMAN</text>
      <text x="${width / 2}" y="${height / 2 + 34}" font-family="system-ui, sans-serif" font-weight="500" font-size="10" fill="${accentGold}" text-anchor="middle">80 BALL HARMONY</text>
    </g>

    <!-- Balls around perimeter -->
    ${ballsSvg}

    <!-- Inscription Ribbon -->
    <g transform="translate(${width / 2}, ${height - 70})">
      <rect x="-240" y="-18" width="480" height="36" rx="18" fill="#020617" fill-opacity="0.85" stroke="url(#goldGrad)" stroke-width="1.5" />
      <text x="0" y="5" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#f8fafc" text-anchor="middle">
        "${escapedPrompt}..."
      </text>
    </g>

    <!-- Top Badge -->
    <g transform="translate(${width / 2}, 62)">
      <rect x="-140" y="-12" width="280" height="24" rx="12" fill="#0f172a" stroke="url(#goldGrad)" stroke-width="1" />
      <text x="0" y="4" font-family="system-ui, sans-serif" font-size="10" font-weight="800" fill="url(#goldGrad)" text-anchor="middle" letter-spacing="2">
        ★ OFFICIAL KENOSTATS ART ★
      </text>
    </g>
  </svg>`;

  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

// Procedural Image Editor for Free Tier fallback
function generateProceduralEditedImage(
  prompt: string,
  sourceImageBase64: string,
  aspectRatio: string = '1:1'
): string {
  const width = 800;
  const height = 800;
  const escapedPrompt = prompt
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .slice(0, 90);

  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="goldBorder" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a" />
        <stop offset="50%" stop-color="#f59e0b" />
        <stop offset="100%" stop-color="#78350f" />
      </linearGradient>
      <filter id="editGlow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    <!-- Embed source image -->
    <image href="${sourceImageBase64}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" />

    <!-- Overlay Tint Filter -->
    <rect width="${width}" height="${height}" fill="#0f172a" fill-opacity="0.2" />

    <!-- Ornate Frame -->
    <rect x="20" y="20" width="${width - 40}" height="${height - 40}" rx="16" fill="none" stroke="url(#goldBorder)" stroke-width="4" />
    <rect x="30" y="30" width="${width - 60}" height="${height - 60}" rx="10" fill="none" stroke="#ffffff" stroke-opacity="0.3" stroke-width="1" stroke-dasharray="8,6" />

    <!-- Edit Seal Stamp -->
    <g transform="translate(${width - 110}, 110)" filter="url(#editGlow)">
      <circle r="45" fill="#991b1b" stroke="#fef08a" stroke-width="3" fill-opacity="0.9" />
      <circle r="38" fill="none" stroke="#fef08a" stroke-width="1.5" stroke-dasharray="4,2" />
      <text x="0" y="-8" font-family="system-ui, sans-serif" font-weight="900" font-size="11" fill="#fef08a" text-anchor="middle" letter-spacing="1">VERIFIED</text>
      <text x="0" y="10" font-family="system-ui, sans-serif" font-weight="900" font-size="14" fill="#ffffff" text-anchor="middle">KENO</text>
      <text x="0" y="24" font-family="system-ui, sans-serif" font-weight="700" font-size="9" fill="#fef08a" text-anchor="middle">EDITION</text>
    </g>

    <!-- Inscription Bar -->
    <g transform="translate(${width / 2}, ${height - 55})">
      <rect x="-260" y="-18" width="520" height="36" rx="18" fill="#090d16" fill-opacity="0.92" stroke="url(#goldBorder)" stroke-width="1.5" />
      <text x="0" y="5" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#f8fafc" text-anchor="middle">
        Edit: "${escapedPrompt}"
      </text>
    </g>
  </svg>`;

  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    preferredModel: 'gemini-nano-banana-2.1',
  });
});

// Generate Image Endpoint
app.post('/api/generate-image', async (req, res) => {
  const { prompt, aspectRatio = '1:1', imageSize = '1K', model = 'gemini-nano-banana-2.1' } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required.' });
  }

  let targetModel = model || 'gemini-nano-banana-2.1';
  let neuralImageSucceeded = false;
  let imageUrl: string | null = null;
  let textResponse = '';
  let quotaExhausted = false;

  try {
    const ai = getAIClient();

    try {
      const response = await ai.models.generateContent({
        model: targetModel,
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio,
            imageSize: ['1K', '2K', '4K'].includes(imageSize) ? imageSize : '1K',
          },
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const base64EncodeString: string = part.inlineData.data;
          const mime = part.inlineData.mimeType ?? 'image/png';
          imageUrl = `data:${mime};base64,${base64EncodeString}`;
          neuralImageSucceeded = true;
        } else if (part.text) {
          textResponse += part.text;
        }
      }
    } catch (primaryErr: any) {
      if (isQuotaExhaustedError(primaryErr)) {
        quotaExhausted = true;
      } else {
        // Try fallback to gemini-3.1-flash-lite-image
        try {
          targetModel = 'gemini-3.1-flash-lite-image';
          const fallbackResp = await ai.models.generateContent({
            model: targetModel,
            contents: {
              parts: [{ text: prompt }],
            },
          });
          for (const part of fallbackResp.candidates?.[0]?.content?.parts ?? []) {
            if (part.inlineData?.data) {
              const base64EncodeString: string = part.inlineData.data;
              const mime = part.inlineData.mimeType ?? 'image/png';
              imageUrl = `data:${mime};base64,${base64EncodeString}`;
              neuralImageSucceeded = true;
            } else if (part.text) {
              textResponse += part.text;
            }
          }
        } catch (secondaryErr: any) {
          if (isQuotaExhaustedError(secondaryErr)) {
            quotaExhausted = true;
          }
        }
      }
    }
  } catch (clientErr: any) {
    if (isQuotaExhaustedError(clientErr)) {
      quotaExhausted = true;
    }
  }

  // If Gemini produced an image, return it directly!
  if (neuralImageSucceeded && imageUrl) {
    return res.json({
      success: true,
      imageUrl,
      modelUsed: targetModel,
      prompt,
      aspectRatio,
      imageSize,
      textNote: textResponse,
      timestamp: new Date().toISOString(),
    });
  }

  // If quota was exhausted (0 limit on free tier) or neural model was not available,
  // generate our stunning high-resolution procedural Keno Talisman card artwork seamlessly!
  const fallbackUrl = generateProceduralKenoImage(prompt, aspectRatio, imageSize);

  return res.json({
    success: true,
    imageUrl: fallbackUrl,
    modelUsed: 'KenoStudio High-Res Vector (Free Tier Artwork)',
    isFallback: true,
    quotaNotice: quotaExhausted
      ? 'Gemini image generation models require a billing-enabled API key (Free Tier has 0 quota for image models). Generated high-resolution vector talisman card artwork instead. Connect a billing-enabled key in Settings > Secrets to enable neural image generation.'
      : undefined,
    prompt,
    aspectRatio,
    imageSize,
    timestamp: new Date().toISOString(),
  });
});

// Edit Image Endpoint
app.post('/api/edit-image', async (req, res) => {
  const { prompt, image, aspectRatio = '1:1', imageSize = '1K', model = 'gemini-nano-banana-2.1' } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Instruction prompt is required.' });
  }
  if (!image || typeof image !== 'string') {
    return res.status(400).json({ error: 'Source image is required.' });
  }

  let targetModel = model || 'gemini-nano-banana-2.1';
  let neuralImageSucceeded = false;
  let imageUrl: string | null = null;
  let textResponse = '';
  let quotaExhausted = false;

  try {
    const { data: base64Data, mimeType } = cleanBase64(image);
    const ai = getAIClient();

    try {
      const response = await ai.models.generateContent({
        model: targetModel,
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio,
            imageSize: ['1K', '2K', '4K'].includes(imageSize) ? imageSize : '1K',
          },
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const base64EncodeString: string = part.inlineData.data;
          const mime = part.inlineData.mimeType ?? 'image/png';
          imageUrl = `data:${mime};base64,${base64EncodeString}`;
          neuralImageSucceeded = true;
        } else if (part.text) {
          textResponse += part.text;
        }
      }
    } catch (primaryErr: any) {
      if (isQuotaExhaustedError(primaryErr)) {
        quotaExhausted = true;
      }
    }
  } catch (err: any) {
    if (isQuotaExhaustedError(err)) {
      quotaExhausted = true;
    }
  }

  if (neuralImageSucceeded && imageUrl) {
    return res.json({
      success: true,
      imageUrl,
      modelUsed: targetModel,
      prompt,
      textNote: textResponse,
      timestamp: new Date().toISOString(),
    });
  }

  // Graceful visual edit composite fallback
  const editedUrl = generateProceduralEditedImage(prompt, image, aspectRatio);

  return res.json({
    success: true,
    imageUrl: editedUrl,
    modelUsed: 'KenoStudio High-Res Vector (Free Tier Edit)',
    isFallback: true,
    quotaNotice: quotaExhausted
      ? 'Gemini image editing models require a billing-enabled API key (Free Tier has 0 quota for image models). Generated high-resolution composite artwork instead. Connect a billing-enabled key in Settings > Secrets to enable neural image editing.'
      : undefined,
    prompt,
    timestamp: new Date().toISOString(),
  });
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KenoStats server running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
