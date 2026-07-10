import { NextRequest, NextResponse } from 'next/server';
import { callGeminiJSON, geminiConfigured } from '@/lib/gemini';

const CATEGORIES = [
  'Roof Repair & Installation',
  'Storm & Emergency',
  'Leaks & Weatherproofing',
  'Maintenance',
  'Ventilation',
  'General',
];

export async function POST(req: NextRequest) {
  if (!geminiConfigured()) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not set. Add it to .env.local and Vercel env vars.' },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => null);
  if (!body?.mode) {
    return NextResponse.json({ error: 'Missing "mode" in request body.' }, { status: 400 });
  }

  try {
    if (body.mode === 'enrich_business') {
      const { name, description } = body;
      if (!name) return NextResponse.json({ error: 'Business name is required.' }, { status: 400 });

      const prompt = `You are helping a small local service business (likely a home-services contractor, e.g. roofing, plumbing, HVAC) build a website.

Business name: "${name}"
Description (may be empty): "${description || '(none provided)'}"

Return ONLY a JSON object with this exact shape, no markdown, no commentary:
{
  "tagline": "a punchy 4-8 word tagline for the hero section, no quotation marks inside it",
  "primaryColor": "a hex color like #E2A23B that fits this business's industry and feels premium, used as the main accent",
  "secondaryColor": "a complementary hex color used as a secondary accent",
  "colorRationale": "one short sentence explaining why these colors fit this type of business"
}

Pick colors grounded in the actual trade/material/environment of the business (e.g. a roofing company might use steel/slate/amber tones evoking shingles and storm-readiness; a landscaping company might use greens and earth tones; a plumbing company might use blues). Avoid generic default "corporate blue" unless it's genuinely the best fit. Keep hex colors readable on a dark background.`;

      const result = await callGeminiJSON<{
        tagline: string;
        primaryColor: string;
        secondaryColor: string;
        colorRationale: string;
      }>(prompt);

      return NextResponse.json(result);
    }

    if (body.mode === 'categorize_services') {
      const { services } = body as { services: string[] };
      if (!Array.isArray(services) || services.length === 0) {
        return NextResponse.json({ error: 'services array is required.' }, { status: 400 });
      }

      const prompt = `Categorize each of these home-services business offerings into exactly one of these categories:
${CATEGORIES.map((c) => `- ${c}`).join('\n')}

Services to categorize:
${services.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Return ONLY a JSON object with this exact shape, no markdown, no commentary:
{
  "categorized": [
    { "name": "exact service name as given", "category": "one of the categories above, exactly as written" }
  ]
}

Return one entry per input service, in the same order, using the exact category strings listed above (case-sensitive match required). If nothing fits well, use "General".`;

      const result = await callGeminiJSON<{ categorized: { name: string; category: string }[] }>(prompt);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: `Unknown mode "${body.mode}".` }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'AI request failed.' }, { status: 500 });
  }
}
