import { Router, Request, Response } from 'express';
import { AiVoiceService } from './ai.service';

export const aiRoutes = Router();

aiRoutes.post('/voice-parse', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({
        success: false,
        error: { message: 'Text query is required for voice parsing.' }
      });
      return;
    }

    const result = await AiVoiceService.parseVoiceQuery(text);
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to process voice query.' }
    });
  }
});
