import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface PredictionScenario {
  title: string;
  scenario: 'optimistic' | 'realistic' | 'pessimistic';
  description: string;
  probability: number;
  confidence: number;
  timeline: string;
  keyFactors: string[];
  actionSteps: string[];
}

export interface PredictionResult {
  question: string;
  scenarios: PredictionScenario[];
  generatedAt: string;
}

export async function generatePredictions(question: string): Promise<PredictionResult> {
  const prompt = `Je bent een AI futurist die realistische toekomstvoorspellingen maakt. Een gebruiker heeft de volgende vraag:

"${question}"

Genereer 3 scenario's met verschillende uitkomsten:

1. OPTIMISTISCH scenario (beste case)
2. REALISTISCH scenario (meest waarschijnlijk)
3. PESSIMISTISCH scenario (slechtste case)

Voor elk scenario, geef:
- Een korte titel (max 60 tekens)
- Een gedetailleerde beschrijving (150-200 woorden)
- Waarschijnlijkheid percentage (0-100%)
- Confidence level (0-100%)
- Timeline (bijv: "3-6 maanden", "1-2 jaar")
- 3-5 key factors die dit scenario beïnvloeden
- 3-5 concrete action steps die de gebruiker kan nemen

Antwoord ALLEEN met valide JSON in dit formaat:
{
  "scenarios": [
    {
      "title": "string",
      "scenario": "optimistic" | "realistic" | "pessimistic",
      "description": "string",
      "probability": number,
      "confidence": number,
      "timeline": "string",
      "keyFactors": ["string"],
      "actionSteps": ["string"]
    }
  ]
}

BELANGRIJK:
- Wees specifiek en praktisch
- Gebruik Nederlandse taal
- Geef realistische percentages
- Timeline moet concreet zijn
- Action steps moeten actionable zijn
- GEEN markdown formatting, ALLEEN JSON`;

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse JSON response
    let responseText = content.text.trim();
    
    // Remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const parsed = JSON.parse(responseText);

    return {
      question,
      scenarios: parsed.scenarios,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Claude API error:', error);
    throw new Error('Failed to generate predictions');
  }
}
