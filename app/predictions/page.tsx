'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import CosmosBackground from '@/components/CosmosBackground';
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
    <div className="absolute inset-0 overflow-y-auto z-30 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Subtle Header */}
        <div className="text-center space-y-2 mb-12">
          <h1 className="text-xl md:text-2xl font-light text-white/80">
            Toekomstscenario&apos;s
          </h1>
          <p className="text-white/40 text-sm max-w-2xl mx-auto">
            {result.question}
          </p>
        </div>

        {/* Floating Scenario Cards */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          {result.scenarios.map((scenario, index) => (
            <ScenarioCard 
              key={index} 
              scenario={scenario} 
              getColor={getScenarioColor} 
              getIcon={getScenarioIcon} 
              index={index}
            />
          ))}
        </div>

        {/* Subtle Back Navigation */}
        <div className="text-center pt-8">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-black/20 backdrop-blur-lg border border-white/10 rounded-lg text-white/60 text-sm hover:bg-black/30 hover:text-white/80 transition-all"
          >
            <span>←</span>
            <span>Nieuwe voorspelling</span>
          </a>
        </div>
      </div>
    </div>
  );
}

function ScenarioCard({ 
  scenario, 
  getColor, 
  getIcon,
  index
}: { 
  scenario: PredictionScenario;
  getColor: (s: string) => string;
  getIcon: (s: string) => string;
  index: number;
}) {
  return (
    <div 
      className={`bg-gradient-to-br ${getColor(scenario.scenario)} backdrop-blur-lg border rounded-xl p-5 space-y-3 transition-all duration-500 hover:scale-[1.02] hover:backdrop-blur-xl`}
      style={{
        animationDelay: `${index * 0.2}s`,
        animation: 'fadeInUp 0.8s ease-out forwards',
        opacity: 0,
        transform: 'translateY(20px)'
      }}
    >
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">{getIcon(scenario.scenario)}</span>
          <h3 className="text-lg font-light text-white">
            {scenario.title}
          </h3>
        </div>
        <span className="text-xs text-white/40 uppercase tracking-wider">
          {scenario.scenario}
        </span>
      </div>

      {/* Compact Stats */}
      <div className="flex gap-4 text-center">
        <div className="flex-1">
          <div className="text-lg font-light text-white">{scenario.probability}%</div>
          <div className="text-xs text-white/40">Kans</div>
        </div>
        <div className="flex-1">
          <div className="text-lg font-light text-white">{scenario.confidence}%</div>
          <div className="text-xs text-white/40">Zekerheid</div>
        </div>
        <div className="flex-1">
          <div className="text-sm font-light text-white">{scenario.timeline}</div>
          <div className="text-xs text-white/40">Tijdlijn</div>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-white/60 leading-relaxed">
        {scenario.description}
      </p>

      {/* Compact Action Steps */}
      <div className="space-y-1">
        <div className="text-xs text-white/40 uppercase tracking-wider">Actie</div>
        <ul className="space-y-0.5">
          {scenario.actionSteps.slice(0, 3).map((step, i) => (
            <li key={i} className="text-xs text-white/50 flex items-start">
              <span className="mr-2 text-white/30">{i + 1}.</span>
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
    <main className="relative w-screen min-h-screen overflow-hidden bg-black">
      {/* Cosmos Background */}
      <div className="fixed inset-0">
        <CosmosBackground />
      </div>

      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="text-white/80 text-sm">Sterren analyseren...</div>
        </div>
      }>
        <PredictionsContent />
      </Suspense>

      {/* CSS for fade in animation */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}
