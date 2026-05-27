import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config/database.js';
import { config } from '../config/index.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../utils/errors.js';

const router = Router();

// Ensure upload directory exists
if (!fs.existsSync(config.upload.dir)) {
  fs.mkdirSync(config.upload.dir, { recursive: true });
}

function sanitizeFilename(name: string): string {
  return path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.upload.dir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxFileSize },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, PNG, and JPG files are allowed'));
    }
  },
});

// POST /api/uploads/:complaintId
router.post('/:complaintId', authenticate, upload.array('files', 5), async (req: Request, res: Response, next: NextFunction) => {
  const uploadedFiles = req.files as Express.Multer.File[] | undefined;

  try {
    const complaint = await prisma.complaint.findUnique({ where: { id: req.params.complaintId as string } });
    if (!complaint) {
      throw new AppError(404, 'Complaint not found');
    }

    if (req.user!.role === 'citizen' && complaint.citizenId !== req.user!.sub) {
      throw new AppError(403, 'Access denied');
    }

    if (!uploadedFiles || uploadedFiles.length === 0) {
      throw new AppError(400, 'No files uploaded');
    }

    const documents = await Promise.all(
      uploadedFiles.map((file) =>
        prisma.complaintDocument.create({
          data: {
            complaintId: complaint.id,
            fileName: sanitizeFilename(file.originalname),
            filePath: file.path,
            fileSize: file.size,
            mimeType: file.mimetype,
            uploadedById: req.user!.sub,
          },
        })
      )
    );

    res.status(201).json({
      documents: documents.map((d) => ({
        id: d.id,
        fileName: d.fileName,
        fileSize: d.fileSize,
        mimeType: d.mimeType,
        createdAt: d.createdAt,
      })),
    });
  } catch (err) {
    // Clean up uploaded files on failure
    if (uploadedFiles) {
      for (const file of uploadedFiles) {
        fs.unlink(file.path, () => {});
      }
    }
    next(err);
  }
});

// GET /api/uploads/:documentId/download
router.get('/:documentId/download', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doc = await prisma.complaintDocument.findUnique({
      where: { id: req.params.documentId as string },
      include: { complaint: { select: { citizenId: true } } },
    });

    if (!doc) {
      throw new AppError(404, 'Document not found');
    }

    if (req.user!.role === 'citizen' && doc.complaint.citizenId !== req.user!.sub) {
      throw new AppError(403, 'Access denied');
    }

    if (!fs.existsSync(doc.filePath)) {
      throw new AppError(404, 'File not found on server');
    }

    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.fileName}"`);
    const fileStream = fs.createReadStream(doc.filePath);
    fileStream.pipe(res);
  } catch (err) {
    next(err);
  }
});

export default router;
