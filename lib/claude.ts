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
  // Validate API key
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const prompt = `Analyseer deze vraag en genereer 3 toekomstscenario's:

"${question}"

Geef exact 3 scenario's:
1. OPTIMISTISCH (beste uitkomst)
2. REALISTISCH (waarschijnlijke uitkomst)  
3. PESSIMISTISCH (moeilijke uitkomst)

Antwoord met ALLEEN deze JSON structuur:
{
  "scenarios": [
    {
      "title": "Korte titel",
      "scenario": "optimistic",
      "description": "Uitgebreide beschrijving van dit scenario",
      "probability": 30,
      "confidence": 75,
      "timeline": "6-12 maanden",
      "keyFactors": ["Factor 1", "Factor 2", "Factor 3"],
      "actionSteps": ["Stap 1", "Stap 2", "Stap 3"]
    }
  ]
}`;

  try {
    console.log('Making API call to Claude...');
    
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      temperature: 0.6,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Invalid response format from Claude API');
    }

    // Clean response
    let responseText = content.text.trim();
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    console.log('Claude response:', responseText.substring(0, 200) + '...');
    
    const parsed = JSON.parse(responseText);
    
    // Validate response structure
    if (!parsed.scenarios || !Array.isArray(parsed.scenarios)) {
      throw new Error('Invalid response structure from Claude');
    }

    return {
      question,
      scenarios: parsed.scenarios,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Prediction generation failed:', error);
    
    // Return fallback scenarios
    return {
      question,
      scenarios: [
        {
          title: "Optimistische uitkomst",
          scenario: "optimistic" as const,
          description: "In dit scenario verloopt alles volgens plan en bereik je je doelen sneller dan verwacht.",
          probability: 25,
          confidence: 70,
          timeline: "3-6 maanden",
          keyFactors: ["Gunstige omstandigheden", "Goede timing", "Sterke motivatie"],
          actionSteps: ["Focus op je sterke punten", "Neem initiatief", "Blijf positief"]
        },
        {
          title: "Realistische uitkomst",
          scenario: "realistic" as const,
          description: "Dit is het meest waarschijnlijke scenario met normale ups en downs onderweg naar je doel.",
          probability: 50,
          confidence: 85,
          timeline: "6-12 maanden",
          keyFactors: ["Normale marktomstandigheden", "Gemiddelde vooruitgang", "Standaard uitdagingen"],
          actionSteps: ["Maak een concrete planning", "Blijf consistent", "Zoek ondersteuning"]
        },
        {
          title: "Uitdagende uitkomst",
          scenario: "pessimistic" as const,
          description: "In dit scenario kom je meer obstakels tegen dan verwacht, maar met doorzettingsvermogen kun je alsnog slagen.",
          probability: 25,
          confidence: 75,
          timeline: "12-18 maanden",
          keyFactors: ["Onvoorziene obstakels", "Langere leercurve", "Extra geduld vereist"],
          actionSteps: ["Bereid je voor op uitdagingen", "Zoek alternatieven", "Houd vol"]
        }
      ],
      generatedAt: new Date().toISOString()
    };
  }
}
