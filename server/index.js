import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app  = express();
app.use(express.json({ limit: '12mb' }));
app.use(cors());

const PORT   = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY || API_KEY === 'your_key_here') {
  console.error('\n❌ ANTHROPIC_API_KEY is not set.\n   Copy .env.example to .env and add your real key.\n');
  process.exit(1);
}

async function callClaude(messages, maxTokens = 1000) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: maxTokens, messages }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err}`);
  }
  const data = await response.json();
  return data.content?.find((b) => b.type === 'text')?.text || '';
}

// ── POST /scan — OCR a label image ───────────────────────────────────────────
app.post('/scan', async (req, res) => {
  const { imageBase64, mediaType, profile } = req.body || {};
  if (!imageBase64) return res.status(400).json({ error: 'imageBase64 is required' });

  try {
    // Step 1: OCR
    const ocrText = await callClaude([{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 },
        },
        {
          type: 'text',
          text: 'You are a medical label scanner. Extract ALL text visible in this image (food label, medicine box, menu, or ingredient list). Return ONLY the raw extracted text, no commentary. If no readable text is found, return "NO_TEXT".',
        },
      ],
    }]);

    if (!ocrText || ocrText.trim() === 'NO_TEXT') {
      return res.json({ extractedText: 'NO_TEXT', aiAnalysis: null });
    }

    // Step 2: AI allergen analysis (if profile provided)
    let aiAnalysis = null;
    if (profile) {
      const allergies = [
        ...profile.foodAllergies.map(a => `food: ${a}`),
        ...profile.drugAllergies.map(a => `drug: ${a}`),
      ].join(', ');
      const meds = profile.medications.join(', ');

      const prompt = `You are a medical safety assistant. A user has the following health profile:
- Allergies: ${allergies || 'none listed'}
- Current medications: ${meds || 'none listed'}
- Medical conditions: ${profile.conditions?.join(', ') || 'none listed'}

Here is the text extracted from a product label:
"""
${ocrText}
"""

Analyse this label for:
1. Any ingredients that match or are related to the user's allergies (including alternate names, derivatives, hidden sources)
2. Any ingredients that could interact with the user's current medications
3. Any "may contain traces of" warnings relevant to their allergies

Respond in 2-4 sentences. Be direct. If safe, say so briefly. If there are concerns, highlight the specific ingredient and why it is a risk.`;

      aiAnalysis = await callClaude([{ role: 'user', content: prompt }], 400);
    }

    res.json({ extractedText: ocrText, aiAnalysis });
  } catch (err) {
    console.error('Scan error:', err);
    res.status(500).json({ error: 'Could not process the image' });
  }
});

// ── POST /analyse — AI analysis of pasted ingredient text (web fallback) ─────
app.post('/analyse', async (req, res) => {
  const { text, profile } = req.body || {};
  if (!text) return res.status(400).json({ error: 'text is required' });

  try {
    const allergies = [
      ...(profile?.foodAllergies || []).map(a => `food: ${a}`),
      ...(profile?.drugAllergies || []).map(a => `drug: ${a}`),
    ].join(', ');

    const prompt = `You are a medical safety assistant. A user has the following health profile:
- Allergies: ${allergies || 'none listed'}
- Current medications: ${profile?.medications?.join(', ') || 'none listed'}
- Medical conditions: ${profile?.conditions?.join(', ') || 'none listed'}

Here is the ingredient list they want you to check:
"""
${text}
"""

Analyse this for any allergen risks or medication interactions. Respond in 2-4 sentences. Be direct and specific.`;

    const summary = await callClaude([{ role: 'user', content: prompt }], 400);
    res.json({ summary });
  } catch (err) {
    console.error('Analyse error:', err);
    res.status(500).json({ error: 'Could not analyse the text' });
  }
});

// ── GET /health ───────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`✅ MediScan server running on http://localhost:${PORT}`));
