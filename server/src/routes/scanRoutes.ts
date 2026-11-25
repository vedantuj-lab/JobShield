import express from 'express';
import multer from 'multer';
import { dbStore } from '../config/store';
import { rateLimit, requireAuth, type AuthenticatedRequest } from '../middleware/auth';
import {
  ALLOWED_DOCUMENT_MIMES,
  ALLOWED_IMAGE_MIMES,
  extractPdfTextSafely,
  validateMagicBytes,
} from '../services/document/fileProcessor';
import { extractTextWithGeminiOcr } from '../services/scanner/geminiAnalyzer';
import { runScanPipeline } from '../services/scanner/scanPipeline';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit
  },
});

router.use(requireAuth);

// 1. Offer Letter Scanner
router.post(
  '/offer-letter',
  rateLimit(25, 60_000, 'scan_offer'),
  upload.single('file'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.authUser!.id;
      const pastedText = typeof req.body.text === 'string' ? req.body.text.trim() : '';
      const scanTitle = typeof req.body.scanName === 'string' ? req.body.scanName.trim() : '';
      const file = req.file;

      let rawText = pastedText;
      let inputReference = 'Pasted Offer Letter Text';
      let imageBuffer: Buffer | undefined;
      let imageMime: string | undefined;

      if (file) {
        if (!ALLOWED_DOCUMENT_MIMES.has(file.mimetype)) {
          res.status(400).json({
            error: 'Unsupported file type. Upload a PDF, PNG, JPEG, WEBP, or TXT offer letter (max 5 MB).',
          });
          return;
        }
        if (!validateMagicBytes(file.buffer, file.mimetype)) {
          res.status(400).json({
            error: 'File content does not match its declared file signature.',
          });
          return;
        }
        inputReference = `Uploaded file: ${file.originalname.slice(0, 100)}`;
        if (file.mimetype === 'application/pdf') {
          const pdfResult = await extractPdfTextSafely(file.buffer);
          if (!pdfResult.ok) {
            res.status(422).json({
              error:
                pdfResult.error ||
                'We could not reliably extract the document text. Please upload a clearer file or paste the offer text.',
            });
            return;
          }
          rawText = [pdfResult.text, pastedText].filter(Boolean).join('\n\n');
        } else if (ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
          imageBuffer = file.buffer;
          imageMime = file.mimetype;
          const ocr = await extractTextWithGeminiOcr(file.buffer, file.mimetype);
          rawText = [ocr.text, pastedText].filter(Boolean).join('\n\n');
          if (!rawText && ocr.error) {
            res.status(422).json({ error: ocr.error });
            return;
          }
        } else {
          rawText = [file.buffer.toString('utf8').slice(0, 20000), pastedText].filter(Boolean).join('\n\n');
        }
      }

      if (!rawText || rawText.trim().length < 25) {
        res.status(400).json({
          error: 'Please upload an offer letter document or paste sufficient offer letter text (minimum 25 characters).',
        });
        return;
      }

      const scan = await runScanPipeline({
        userId,
        isDemo: Boolean(req.authUser!.isDemo),
        scanType: 'offer_letter',
        scanName: scanTitle || file?.originalname || 'Offer Letter Verification',
        rawText,
        inputReference,
        imageBuffer,
        imageMime,
      });

      res.status(201).json({ scan });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Offer letter scan failed.',
      });
    }
  }
);

// 2. Email Scanner
router.post(
  '/email',
  rateLimit(25, 60_000, 'scan_email'),
  upload.single('file'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.authUser!.id;
      let bodyText = typeof req.body.body === 'string' ? req.body.body.trim() : '';
      const senderEmail = typeof req.body.senderEmail === 'string' ? req.body.senderEmail.trim() : '';
      const subject = typeof req.body.subject === 'string' ? req.body.subject.trim() : '';
      const rawHeaders = typeof req.body.rawHeaders === 'string' ? req.body.rawHeaders.trim() : '';
      const file = req.file;
      let inputReference = subject || senderEmail || 'Submitted Email Content';
      let imageBuffer: Buffer | undefined;
      let imageMime: string | undefined;

      if (file) {
        if (!ALLOWED_DOCUMENT_MIMES.has(file.mimetype)) {
          res.status(400).json({ error: 'Unsupported email attachment format.' });
          return;
        }
        if (!validateMagicBytes(file.buffer, file.mimetype)) {
          res.status(400).json({ error: 'Uploaded file failed signature validation.' });
          return;
        }
        inputReference = `Email file: ${file.originalname.slice(0, 100)}`;
        if (ALLOWED_IMAGE_MIMES.has(file.mimetype)) {
          imageBuffer = file.buffer;
          imageMime = file.mimetype;
          const ocr = await extractTextWithGeminiOcr(file.buffer, file.mimetype);
          bodyText = [ocr.text, bodyText].filter(Boolean).join('\n\n');
        } else {
          bodyText = [file.buffer.toString('utf8').slice(0, 20000), bodyText].filter(Boolean).join('\n\n');
        }
      }

      if (!bodyText || bodyText.length < 20) {
        res.status(400).json({
          error: 'Please paste the recruitment email content or upload an email file/screenshot.',
        });
        return;
      }

      const scan = await runScanPipeline({
        userId,
        isDemo: Boolean(req.authUser!.isDemo),
        scanType: 'email',
        scanName: subject ? `Email: ${subject.slice(0, 60)}` : 'Recruitment Email Analysis',
        rawText: bodyText,
        inputReference,
        senderEmail,
        subject,
        rawHeaders,
        imageBuffer,
        imageMime,
      });

      res.status(201).json({ scan });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Email scan failed.' });
    }
  }
);

// 3. URL Scanner
router.post('/url', rateLimit(25, 60_000, 'scan_url'), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.authUser!.id;
    const { url, claimedCompany } = req.body as Record<string, unknown>;
    if (typeof url !== 'string' || !url.trim()) {
      res.status(400).json({ error: 'Please enter a website URL to scan.' });
      return;
    }

    const cleanedClaimedCompany =
      typeof claimedCompany === 'string' && claimedCompany.trim() ? claimedCompany.trim() : undefined;

    const rawText = [
      `Target Recruitment URL: ${url.trim()}`,
      cleanedClaimedCompany ? `Claimed Company: ${cleanedClaimedCompany}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const scan = await runScanPipeline({
      userId,
      isDemo: Boolean(req.authUser!.isDemo),
      scanType: 'url',
      scanName: `URL: ${url.trim().slice(0, 70)}`,
      rawText,
      inputReference: url.trim(),
      url: url.trim(),
      claimedCompany: cleanedClaimedCompany,
    });

    res.status(201).json({ scan });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'URL scan failed.' });
  }
});

// 4. Job Description Scanner
router.post(
  '/job-description',
  rateLimit(25, 60_000, 'scan_jd'),
  upload.single('file'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.authUser!.id;
      let text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
      const jobTitle = typeof req.body.jobTitle === 'string' ? req.body.jobTitle.trim() : '';
      const file = req.file;
      let inputReference = jobTitle || 'Pasted Job Description';

      if (file) {
        if (!ALLOWED_DOCUMENT_MIMES.has(file.mimetype) || !validateMagicBytes(file.buffer, file.mimetype)) {
          res.status(400).json({ error: 'Invalid or unsupported job description file.' });
          return;
        }
        inputReference = `Uploaded JD: ${file.originalname.slice(0, 100)}`;
        if (file.mimetype === 'application/pdf') {
          const pdf = await extractPdfTextSafely(file.buffer);
          if (!pdf.ok) {
            res.status(422).json({ error: pdf.error || 'Could not read PDF text.' });
            return;
          }
          text = [pdf.text, text].filter(Boolean).join('\n\n');
        } else {
          text = [file.buffer.toString('utf8').slice(0, 20000), text].filter(Boolean).join('\n\n');
        }
      }

      if (!text || text.length < 30) {
        res.status(400).json({
          error: 'Please enter a job description (at least 30 characters) or upload a PDF/TXT file.',
        });
        return;
      }

      const scan = await runScanPipeline({
        userId,
        isDemo: Boolean(req.authUser!.isDemo),
        scanType: 'job_description',
        scanName: jobTitle ? `JD: ${jobTitle.slice(0, 60)}` : 'Job Description Analysis',
        rawText: text,
        inputReference,
        jobTitle: jobTitle || undefined,
      });

      res.status(201).json({ scan });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Job description scan failed.' });
    }
  }
);

// 5A. Screenshot OCR Pre-Extraction (lets user verify and correct OCR text before final scoring)
router.post(
  '/screenshot-ocr',
  rateLimit(20, 60_000, 'scan_ocr'),
  upload.single('file'),
  async (req: AuthenticatedRequest, res) => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'Please select a screenshot image (PNG, JPEG, or WEBP).' });
      return;
    }
    if (!ALLOWED_IMAGE_MIMES.has(file.mimetype) || !validateMagicBytes(file.buffer, file.mimetype)) {
      res.status(400).json({ error: 'Invalid image file. Upload PNG, JPEG, or WEBP (max 5 MB).' });
      return;
    }
    const ocr = await extractTextWithGeminiOcr(file.buffer, file.mimetype);
    res.json({
      ocrStatus: ocr.status,
      extractedText: ocr.text,
      error: ocr.error,
      fileName: file.originalname,
    });
  }
);

// 5B. Screenshot & Message Final Verification
router.post(
  '/screenshot',
  rateLimit(25, 60_000, 'scan_screenshot'),
  upload.single('file'),
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.authUser!.id;
      const correctedText = typeof req.body.text === 'string' ? req.body.text.trim() : '';
      const sourceChannel = typeof req.body.channel === 'string' ? req.body.channel.trim() : 'Message / Screenshot';
      const file = req.file;

      if (file) {
        if (!ALLOWED_IMAGE_MIMES.has(file.mimetype) || !validateMagicBytes(file.buffer, file.mimetype)) {
          res.status(400).json({ error: 'Invalid screenshot image signature.' });
          return;
        }
      }

      if (!correctedText || correctedText.length < 20) {
        res.status(400).json({
          error: 'Please review or enter the extracted message text (at least 20 characters) before running verification.',
        });
        return;
      }

      const scan = await runScanPipeline({
        userId,
        isDemo: Boolean(req.authUser!.isDemo),
        scanType: 'screenshot',
        scanName: `${sourceChannel} Verification`,
        rawText: correctedText,
        inputReference: file ? `Screenshot (${sourceChannel}): ${file.originalname}` : `${sourceChannel} Text`,
        imageBuffer: file?.buffer,
        imageMime: file?.mimetype,
      });

      res.status(201).json({ scan });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Screenshot scan failed.' });
    }
  }
);

// List user's own scans
router.get('/', (req: AuthenticatedRequest, res) => {
  const scans = dbStore.listScansByUser(req.authUser!.id);
  res.json({ scans });
});

// Get single scan (strict ownership check; admins can view via admin routes)
router.get('/:id', (req: AuthenticatedRequest, res) => {
  const scan = dbStore.getScanById(req.params.id);
  if (!scan || Boolean(scan.isDemo) !== Boolean(req.authUser!.isDemo)) {
    res.status(404).json({ error: 'Scan record not found.' });
    return;
  }
  if (scan.userId !== req.authUser!.id && req.authUser!.role !== 'ADMIN') {
    res.status(403).json({ error: 'You do not have permission to view this scan.' });
    return;
  }
  res.json({ scan });
});

router.delete('/:id', (req: AuthenticatedRequest, res) => {
  const deleted = dbStore.deleteScan(req.params.id, req.authUser!.id);
  if (!deleted) {
    res.status(404).json({ error: 'Scan record not found or access denied.' });
    return;
  }
  res.json({ deleted: true });
});

export default router;
