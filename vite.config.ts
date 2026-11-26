import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import {defineConfig, type Plugin} from 'vite';

function problemFinderApiPlugin(): Plugin {
  const attachMiddleware = (middlewares: { use: (path: string, handler: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void }) => {
    middlewares.use('/api/problem-finder', async (req, res, next) => {
      if (req.method !== 'POST') {
        next();
        return;
      }

      const sendJson = (statusCode: number, payload: unknown) => {
        res.statusCode = statusCode;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(payload));
      };

      const apiKey = process.env.GEMINI_API_KEY?.trim();
      if (!apiKey) {
        sendJson(200, { fallbackRequired: true });
        return;
      }

      try {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const rawBody = Buffer.concat(chunks).toString('utf8');
        const body = rawBody ? JSON.parse(rawBody) : {};
        const description = String(body?.description || '').trim();
        const categories = Array.isArray(body?.categories) ? body.categories : [];
        const lang = body?.lang === 'ur' ? 'ur' : 'en';
        const imageBase64 = typeof body?.imageBase64 === 'string' ? body.imageBase64 : '';
        const imageMimeType = typeof body?.imageMimeType === 'string' ? body.imageMimeType : 'image/jpeg';

        if (!description && !imageBase64) {
          sendJson(400, { error: 'Problem description or photo is required.' });
          return;
        }

        const { GoogleGenAI, Type } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });

        const catalogPrompt = categories
          .slice(0, 70)
          .map((c: any) => `${c.slug} | ${c.name} (${c.group}) | PKR ${c.minPkr}-${c.maxPkr}`)
          .join('\n');

        const promptText = `You are a practical Pakistani home-services triage helper for Karigar Connect.
Analyze the user's issue (which may be in English, Urdu script, or Roman Urdu like "AC thanda nahi kar raha" or "geyser leak ho raha hai").
Select the SINGLE best matching categorySlug from the allowed list below.
Allowed categories:
${catalogPrompt}

User problem description: "${description || 'See attached problem image'}"
Preferred response language: ${lang === 'ur' ? 'Urdu (with clear simple wording)' : 'English'}.
Remember: provide practical homeowner guidance and indicate this is an estimate only.`;

        const contents: any[] = [];
        if (imageBase64) {
          contents.push({
            inlineData: {
              data: imageBase64,
              mimeType: imageMimeType,
            },
          });
        }
        contents.push({ text: promptText });

        const response = await ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents,
          config: {
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                categorySlug: { type: Type.STRING },
                urgency: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'] },
                likelyCause: { type: Type.STRING },
                likelyCauseUrdu: { type: Type.STRING },
                roughMinPkr: { type: Type.NUMBER },
                roughMaxPkr: { type: Type.NUMBER },
                safetyTip: { type: Type.STRING },
                safetyTipUrdu: { type: Type.STRING },
              },
              required: [
                'categorySlug',
                'urgency',
                'likelyCause',
                'likelyCauseUrdu',
                'roughMinPkr',
                'roughMaxPkr',
                'safetyTip',
                'safetyTipUrdu',
              ],
            },
          },
        });

        const parsed = JSON.parse(response.text || '{}');
        sendJson(200, { fallbackRequired: false, source: 'gemini', result: parsed });
      } catch (err) {
        sendJson(200, { fallbackRequired: true, reason: err instanceof Error ? err.message : 'Fallback' });
      }
    });
  };

  return {
    name: 'api-problem-finder',
    configureServer(server) {
      attachMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      attachMiddleware(server.middlewares);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      problemFinderApiPlugin(),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      allowedHosts: true as const,
    },
  };
});
