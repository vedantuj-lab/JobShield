import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { seedDemoData } from './server/src/config/demoSeed';
import { getDatabaseHealth, initDatabase } from './server/src/config/store';
import adminRoutes from './server/src/routes/adminRoutes';
import authRoutes from './server/src/routes/authRoutes';
import scanRoutes from './server/src/routes/scanRoutes';
import studentRoutes from './server/src/routes/studentRoutes';
import aiChatRoutes from './server/src/routes/aiChatRoutes';
import { isGoogleAuthConfigured } from './server/src/services/auth/authService';
import { getGeminiIntegrationStatus } from './server/src/services/scanner/geminiAnalyzer';

async function startServer() {
  await initDatabase();
  seedDemoData(false);

  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Public integration status summary (never exposes keys or secrets)
  app.get('/api/status', (_req, res) => {
    res.json({
      service: 'JOBSHIELD API',
      database: getDatabaseHealth(),
      gemini: getGeminiIntegrationStatus(),
      webRiskConfigured: Boolean(process.env.WEB_RISK_API_KEY?.trim()),
      googleOAuthConfigured: isGoogleAuthConfigured(),
    });
  });

  // Contact form endpoint (validates and acknowledges inquiries)
  app.post('/api/contact', (req, res) => {
    const { name, email, subject, message } = req.body as Record<string, unknown>;
    if (
      typeof name !== 'string' ||
      name.trim().length < 2 ||
      typeof email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof message !== 'string' ||
      message.trim().length < 15
    ) {
      res.status(400).json({ error: 'Please complete all required fields with a valid email and detailed message.' });
      return;
    }
    res.json({
      submitted: true,
      subject: typeof subject === 'string' ? subject.trim() : 'General Inquiry',
      message: 'Your inquiry has been received by the JOBSHIELD team.',
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/scans', scanRoutes);
  app.use('/api', studentRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/ai', aiChatRoutes);

  // Error handler for Multer / JSON parsing errors
  app.use(
    (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      if (err.message?.includes('File too large')) {
        res.status(413).json({ error: 'Uploaded file exceeds the 5 MB maximum limit.' });
        return;
      }
      res.status(500).json({ error: 'An unexpected server error occurred.' });
    }
  );

  // Unknown API route fallback
  app.use('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
        watch: null,
      },
      appType: 'spa',
    });

    // HMR and WebSockets are disabled in this preview runtime; serve a clean
    // Vite client runtime shim so style injection and import.meta.hot stubs work
    // without opening failing WebSocket connections or throwing unhandled rejections.
    app.get('/@vite/client', (_req, res) => {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.send(`
import "/@vite/env";
const sheetsMap = new Map();
const linkSheetsMap = new Map();
if (typeof document !== "undefined") {
  document.querySelectorAll("style[data-vite-dev-id]").forEach((el) => {
    sheetsMap.set(el.getAttribute("data-vite-dev-id"), el);
  });
  document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id]').forEach((el) => {
    linkSheetsMap.set(el.getAttribute("data-vite-dev-id"), el);
  });
}
let lastInsertedStyle;
export function updateStyle(id, content) {
  if (linkSheetsMap.has(id) || typeof document === "undefined") return;
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement("style");
    style.setAttribute("type", "text/css");
    style.setAttribute("data-vite-dev-id", id);
    style.textContent = content;
    if (!lastInsertedStyle) {
      document.head.appendChild(style);
      setTimeout(() => { lastInsertedStyle = undefined; }, 0);
    } else {
      lastInsertedStyle.insertAdjacentElement("afterend", style);
    }
    lastInsertedStyle = style;
  } else if (style.textContent !== content) {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}
export function removeStyle(id) {
  if (typeof document === "undefined") return;
  if (linkSheetsMap.has(id)) {
    document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id="' + CSS.escape(id) + '"]').forEach((el) => el.remove());
    linkSheetsMap.delete(id);
  }
  const style = sheetsMap.get(id);
  if (style) {
    style.remove();
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  return {
    data: {},
    accept() {},
    prune() {},
    dispose() {},
    invalidate() {},
    decline() {},
    on() {},
    off() {},
    send() {},
  };
}
export function injectQuery(url, queryToInject) {
  if (!url || (url[0] !== "." && url[0] !== "/")) return url;
  const pathname = url.replace(/[?#].*$/, "");
  const parsed = new URL(url, "http://vite.dev");
  return pathname + "?" + queryToInject + (parsed.search ? "&" + parsed.search.slice(1) : "") + (parsed.hash || "");
}
export class ErrorOverlay {}
`);
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JOBSHIELD server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start JOBSHIELD server:', err);
  process.exit(1);
});
