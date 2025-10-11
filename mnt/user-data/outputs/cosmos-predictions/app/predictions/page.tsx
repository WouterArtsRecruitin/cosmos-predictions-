'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import GlobularCluster from '@/components/GlobularCluster';
import type { PredictionResult, PredictionScenario } from '@/lib/claude';

function PredictionsContent() {
  const searchParams = useSearchParams();
  const question = searchParams.get('q');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [showNewsletter, setShowNewsletter] = useState(false);

  useEffect(() => {
    if (!question) {
      setError('Geen vraag opgegeven');
      setLoading(false);
      return;
    }

    async function fetchPredictions() {
      try {
        const response = await fetch('/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question })
        });

        if (!response.ok) {
          throw new Error('Failed to generate predictions');
        }

        const data = await response.json();
        setResult(data);
        
        // Show newsletter after 2 seconds
        setTimeout(() => setShowNewsletter(true), 2000);
      } catch (err) {
        setError('Er ging iets mis bij het genereren van voorspellingen');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchPredictions();
  }, [question]);

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-50">
        <div className="text-center space-y-6">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 border-4 border-white/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-white rounded-full animate-spin"></div>
          </div>
          <div className="space-y-2">
            <p className="text-xl text-white font-light">
              De kosmos analyseert jouw vraag...
            </p>
            <p className="text-sm text-white/50">
              Dit kan 10-15 seconden duren
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-50">
        <div className="max-w-md text-center space-y-4 px-6">
          <div className="text-red-400 text-5xl">⚠️</div>
          <h2 className="text-2xl text-white font-light">{error}</h2>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all"
          >
            Probeer opnieuw
          </a>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const getScenarioColor = (scenario: string) => {
    switch (scenario) {
      case 'optimistic': return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      case 'realistic': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
      case 'pessimistic': return 'from-orange-500/20 to-red-500/20 border-orange-500/30';
      default: return 'from-white/10 to-white/5 border-white/20';
    }
  };

  const getScenarioIcon = (scenario: string) => {
    switch (scenario) {
      case 'optimistic': return '🌟';
      case 'realistic': return '🎯';
      case 'pessimistic': return '⚡';
      default: return '•';
    }
  };

  return (
    <div className="absolute inset-0 overflow-y-auto z-50 py-12 px-6">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-light text-white">
            Jouw toekomstscenario&apos;s
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto">
            {result.question}
          </p>
        </div>

        {/* Scenarios */}
        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
          {result.scenarios.map((scenario, index) => (
            <ScenarioCard key={index} scenario={scenario} getColor={getScenarioColor} getIcon={getScenarioIcon} />
          ))}
        </div>

        {/* Newsletter CTA */}
        {showNewsletter && (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-8 space-y-6 animate-fade-in">
            <div className="text-center space-y-3">
              <div className="text-4xl">📬</div>
              <h2 className="text-2xl font-light text-white">
                Ontvang wekelijkse future insights
              </h2>
              <p className="text-white/60">
                Blijf op de hoogte van trends, voorspellingen en AI-analyses
              </p>
            </div>
            
            {/* Jotform embed will go here */}
            <div className="text-center">
              <a
                href="#newsletter"
                className="inline-block px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/30 rounded-xl text-white font-light hover:bg-white/20 transition-all"
              >
                Schrijf je in voor de nieuwsbrief
              </a>
            </div>
          </div>
        )}

        {/* Back button */}
        <div className="text-center">
          <a
            href="/"
            className="inline-block px-6 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl text-white/80 hover:bg-white/10 transition-all"
          >
            ← Nieuwe vraag stellen
          </a>
        </div>
      </div>
    </div>
  );
}

function ScenarioCard({ 
  scenario, 
  getColor, 
  getIcon 
}: { 
  scenario: PredictionScenario;
  getColor: (s: string) => string;
  getIcon: (s: string) => string;
}) {
  return (
    <div className={`bg-gradient-to-br ${getColor(scenario.scenario)} backdrop-blur-xl border rounded-2xl p-6 space-y-4 transition-all hover:scale-105`}>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-2xl">{getIcon(scenario.scenario)}</span>
          <span className="text-xs text-white/60 uppercase tracking-wider">
            {scenario.scenario}
          </span>
        </div>
        <h3 className="text-xl font-light text-white">
          {scenario.title}
        </h3>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="text-xs text-white/50">Waarschijnlijkheid</div>
          <div className="text-2xl font-light text-white">
            {scenario.probability}%
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-white/50">Confidence</div>
          <div className="text-2xl font-light text-white">
            {scenario.confidence}%
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-1">
        <div className="text-xs text-white/50">Timeline</div>
        <div className="text-sm text-white/80">{scenario.timeline}</div>
      </div>

      {/* Description */}
      <p className="text-sm text-white/70 leading-relaxed">
        {scenario.description}
      </p>

      {/* Key Factors */}
      <div className="space-y-2">
        <div className="text-xs text-white/50 uppercase tracking-wider">
          Key Factors
        </div>
        <ul className="space-y-1">
          {scenario.keyFactors.map((factor, i) => (
            <li key={i} className="text-xs text-white/60 flex items-start">
              <span className="mr-2 mt-1">•</span>
              <span>{factor}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Steps */}
      <div className="space-y-2">
        <div className="text-xs text-white/50 uppercase tracking-wider">
          Action Steps
        </div>
        <ul className="space-y-1">
          {scenario.actionSteps.map((step, i) => (
            <li key={i} className="text-xs text-white/60 flex items-start">
              <span className="mr-2 mt-1">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function PredictionsPage() {
  return (
    <main className="relative w-screen min-h-screen overflow-hidden">
      {/* Globular Cluster Background */}
      <div className="fixed inset-0">
        <GlobularCluster />
      </div>

      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="text-white">Laden...</div>
        </div>
      }>
        <PredictionsContent />
      </Suspense>
    </main>
  );
}
