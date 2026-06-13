import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { AiService } from '../services/aiService';

export class AiController {
  // Classify Complaint endpoint
  static async classify(req: AuthenticatedRequest, res: Response) {
    try {
      const { description } = req.body;
      if (!description) return res.status(400).json({ error: 'Description is required.' });

      const classification = AiService.classifyComplaint(description);
      return res.json({ classification });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Chat interface endpoint
  static async chat(req: AuthenticatedRequest, res: Response) {
    try {
      const { message } = req.body;
      if (!message) return res.status(400).json({ error: 'Message is required.' });

      const { userId, role } = req.user!;
      const response = await AiService.handleChat(userId, role, message);
      return res.json({ response });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Predictive analytics reports endpoint
  static async predictions(req: AuthenticatedRequest, res: Response) {
    try {
      const report = await AiService.getPredictions();
      return res.json({ report });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
}
