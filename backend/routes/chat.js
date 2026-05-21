const express = require('express');
const router = express.Router();

const SYSTEM_PROMPT = `You are Pardhu, an AI assistant for ShowTime Consulting's Indian Election Dashboard.

Your scope:
- Indian elections (Lok Sabha and state Vidhan Sabha)
- Political parties: BJP, INC, SP, TMC, DMK, AIADMK, BJD, TDP, YSRCP, AAP, JDU, RJD, JMM, NCP, Shiv Sena (both factions), CPI(M), CPI, BSP, regional parties and others
- Alliances: NDA (BJP-led), INDIA (opposition coalition), unaligned parties
- States, constituencies, vote shares, seat counts, swings, alliance maths
- Historical context and informed predictions about future elections
- Demographics including caste composition where relevant

Tone:
- Conversational and direct — keep most replies to 2–4 short sentences
- Use specific numbers when the [DATA] block provides them
- For predictions, base reasoning on observed trends; be explicit about uncertainty
- Stick to Indian politics; politely redirect off-topic queries
- Do not fabricate seat counts or vote shares. If a number isn't in the [DATA] block or your knowledge, say so and offer to look up something the user can find on the dashboard
- Plain prose only — no markdown headers, no bullet points unless the user explicitly asks for a list
- Address the user as someone analysing election results, not as a layperson

Identity: You are Pardhu. If asked who you are, say so briefly. You are not GPT, not Claude — you are Pardhu, named after the ShowTime Consulting team member who built this dashboard.`;

// ----- Provider: Groq (preferred — Llama 3.3 70B, fast, high quality) -----
async function tryGroq(messages) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        max_tokens: 600,
        top_p: 0.95,
      }),
    });
    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      throw new Error(`Groq HTTP ${resp.status}: ${text.slice(0, 200)}`);
    }
    const data = await resp.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error('Groq returned empty content');
    return { provider: `Llama 3.3 70B (Groq)`, reply };
  } catch (err) {
    console.warn('[chat] Groq failed:', err.message);
    return null;
  }
}

// ----- Provider: Pollinations (free, no key) ------------------------------
// Uses the anonymous GET endpoint that Pollinations explicitly say will
// continue to work. We collapse the chat into a single prompt string.
async function tryPollinations(messages) {
  try {
    const sys = messages.find(m => m.role === 'system')?.content || '';
    const turns = messages.filter(m => m.role !== 'system')
      .map(m => `${m.role === 'user' ? 'User' : 'Pardhu'}: ${m.content}`)
      .join('\n\n');
    const prompt = `${sys}\n\n${turns}\n\nPardhu:`;
    const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}` +
                `?model=openai&seed=${Math.floor(Math.random() * 1_000_000)}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Pollinations HTTP ${resp.status}`);
    const text = (await resp.text()).trim();
    if (!text) throw new Error('Empty response');
    // Skip the deprecation notice Pollinations now serves on /openai
    if (/IMPORTANT NOTICE|deprecated|legacy text API/i.test(text)) {
      throw new Error('Pollinations returned deprecation notice');
    }
    return { provider: 'Pollinations', reply: text };
  } catch (err) {
    console.warn('[chat] Pollinations failed:', err.message);
    return null;
  }
}

// ----- Main route ---------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { messages, grounding } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }
    // Cap history to avoid huge prompts (last 12 turns)
    const trimmed = messages.slice(-12);

    // Inject the system prompt + any grounding facts
    const fullMessages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT + (grounding
          ? `\n\n[DATA from the dashboard's database — use these numbers]:\n${grounding}`
          : ''),
      },
      ...trimmed,
    ];

    for (const provider of [tryGroq, tryPollinations]) {
      const result = await provider(fullMessages);
      if (result) return res.json(result);
    }

    res.json({
      provider: 'fallback',
      reply: "I can't reach an AI service right now. The dashboard data is still live in the panels above — please try again in a minute, or ask the admin to set GROQ_API_KEY in the backend .env for a production-grade response.",
    });
  } catch (err) {
    console.error('[chat] route error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
