import express from 'express';
import { processChatAssistantRequest } from '../services/ai/chatAssistant';
import { rateLimit } from '../middleware/auth';
import { verifySessionToken } from '../services/auth/authService';
import type { AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Extract auth token if provided (optional auth so both guest visitors and logged-in users can use chat)
function optionalAuth(req: AuthenticatedRequest, _res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const verified = verifySessionToken(token);
    if (verified && verified.user && verified.user.accountStatus === 'ACTIVE') {
      req.authUser = verified.user;
    }
  }
  next();
}

router.post('/chat', rateLimit(60, 60_000, 'ai_chat'), optionalAuth, async (req: AuthenticatedRequest, res) => {
  const { message, conversationHistory, preferredLanguage, currentRoute } = req.body as Record<string, unknown>;

  if (typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'Message text is required.' });
    return;
  }

  try {
    const historyArray = Array.isArray(conversationHistory) ? conversationHistory : [];
    const response = await processChatAssistantRequest(
      {
        message: message.trim(),
        conversationHistory: historyArray as any,
        preferredLanguage: typeof preferredLanguage === 'string' ? preferredLanguage : 'auto',
        currentRoute: typeof currentRoute === 'string' ? currentRoute : undefined,
      },
      req.authUser
    );

    res.json(response);
  } catch (err) {
    res.status(500).json({
      error: 'The AI Chat Assistant encountered an error processing your message. Please try again.',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
