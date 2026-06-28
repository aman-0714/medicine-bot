import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();

// Photos as base64 inflate ~33% over raw bytes, so give some headroom over
// a typical compressed phone-camera JPEG.
app.use(express.json({ limit: '12mb' }));
app.use(cors());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY || API_KEY === 'your_key_here') {
  console.error(
    '\n❌ ANTHROPIC_API_KEY is not set.\n' +
    '   Copy .env.example to .env and add your real key from https://console.anthropic.com\n'
  );
  process.exit(1);
}

const OCR_PROMPT =
  'You are a medical label scanner. Extract ALL text visible in this image ' +
  '(food label, medicine box, menu, or ingredient list). Return ONLY the raw ' +
  'extracted text, no commentary. If no readable text is found, return "NO_TEXT".';

app.post('/scan', async (req, res) => {
  const { imageBase64, mediaType } = req.body || {};

  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 is required' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType || 'image/jpeg',
                  data: imageBase64,
                },
              },
              { type: 'text', text: OCR_PROMPT },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Anthropic API error:', response.status, errBody);
      return res.status(502).json({ error: 'Upstream API error', status: response.status });
    }

    const data = await response.json();
    const extractedText =
      data.content?.find((block) => block.type === 'text')?.text || 'NO_TEXT';

    res.json({ extractedText });
  } catch (err) {
    console.error('Scan request failed:', err);
    res.status(500).json({ error: 'Could not process the image' });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`✅ medicine_bot server running on http://localhost:${PORT}`);
});
