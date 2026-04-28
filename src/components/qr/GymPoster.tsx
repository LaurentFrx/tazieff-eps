'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { resolveEnv } from '@/lib/env';

interface PosterParams {
  sets: string;
  reps: string;
  charge: string;
  repos: string;
}

interface PosterConfig {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  params: PosterParams;
  qrPath: string;
  accent: string;
}

const POSTERS: PosterConfig[] = [
  {
    id: 'tonification',
    title: 'OBJECTIF TONIFICATION',
    subtitle: 'Endurance de force — Séries longues, charges légères',
    description:
      'Conduire un développement physique en relation avec des objectifs de forme et de prévention des accidents',
    params: { sets: '4', reps: '15-20', charge: '55-65% RM', repos: '= durée effort' },
    qrPath: '/exercices?objectif=tonification',
    accent: '#00E5FF',
  },
  {
    id: 'volume',
    title: 'OBJECTIF VOLUME',
    subtitle: 'Hypertrophie — Séries moyennes, charges modérées',
    description:
      'Solliciter la musculature pour la développer en fonction d\'objectifs esthétiques personnalisés',
    params: { sets: '5', reps: '10-12', charge: '75-80% RM', repos: '1\'30-2\'00' },
    qrPath: '/exercices?objectif=volume',
    accent: '#FF006E',
  },
  {
    id: 'puissance',
    title: 'OBJECTIF PUISSANCE',
    subtitle: 'Force explosive — Séries courtes, charges lourdes',
    description:
      'Accompagner un projet sportif — recherche d\'un gain de puissance musculaire',
    params: { sets: '5-6', reps: '3-6', charge: '85-95% RM', repos: '3\'-5\'' },
    qrPath: '/exercices?objectif=puissance',
    accent: '#7B2FFF',
  },
];

function PosterCard({ poster }: { poster: PosterConfig }) {
  const { title, subtitle, description, params, qrPath, accent } = poster;
  const baseUrl = resolveEnv().baseUrl.eleve;
  const paramItems = [
    { label: 'Séries', value: params.sets },
    { label: 'Reps', value: params.reps },
    { label: 'Charge', value: params.charge },
    { label: 'Repos', value: params.repos },
  ];

  return (
    <div
      className="poster-page bg-white text-black flex flex-col items-center px-8 py-6"
      style={{ pageBreakAfter: 'always', minHeight: '297mm', width: '210mm', margin: '0 auto' }}
    >
      {/* Accent bar */}
      <div className="w-full h-3 rounded-full mb-6" style={{ background: accent }} />

      {/* Title */}
      <h1
        className="font-[var(--font-bebas)] text-[60px] leading-none tracking-wide text-center"
        style={{ color: accent }}
      >
        {title}
      </h1>
      <p className="text-lg text-gray-600 text-center mt-2 font-medium">{subtitle}</p>

      {/* Params grid */}
      <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-[400px]">
        {paramItems.map((item) => (
          <div
            key={item.label}
            className="flex flex-col items-center rounded-xl border-2 py-4 px-3"
            style={{ borderColor: accent }}
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              {item.label}
            </span>
            <span className="font-[var(--font-bebas)] text-[36px] leading-tight font-bold">
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* QR code */}
      <div className="mt-8 flex flex-col items-center">
        <QRCodeSVG
          value={`${baseUrl}${qrPath}`}
          size={180}
          level="M"
          bgColor="#ffffff"
          fgColor="#000000"
        />
        <p className="text-sm text-gray-500 mt-3 text-center">
          Scannez pour voir les exercices
        </p>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 text-center mt-6 max-w-[360px] leading-relaxed italic">
        {description}
      </p>

      {/* Footer */}
      <div className="mt-auto pt-6 flex items-center gap-2 text-gray-400 text-xs">
        <span className="font-bold text-sm" style={{ color: accent }}>Tazieff EPS</span>
        <span>·</span>
        <span>muscu-eps.fr</span>
      </div>
    </div>
  );
}

interface GymPostersProps {
  selected?: Set<string>;
}

export function GymPosters({ selected }: GymPostersProps) {
  const posters = selected && selected.size > 0
    ? POSTERS.filter((p) => selected.has(p.id))
    : POSTERS;

  return (
    <div className="print:p-0">
      {posters.map((poster) => (
        <PosterCard key={poster.id} poster={poster} />
      ))}
    </div>
  );
}

export function PosterSelector() {
  const [selected, setSelected] = useState<Set<string>>(new Set(POSTERS.map((p) => p.id)));

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      {/* Selection — hidden in print */}
      <div className="mb-6 print:hidden">
        <p className="text-sm text-[color:var(--muted)] mb-3">Sélectionnez les posters à imprimer :</p>
        <div className="flex flex-wrap gap-3">
          {POSTERS.map((p) => (
            <label
              key={p.id}
              className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border cursor-pointer transition-colors text-sm font-medium ${
                selected.has(p.id)
                  ? 'border-white/30 bg-white/10 text-white'
                  : 'border-white/10 bg-white/5 text-white/40'
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(p.id)}
                onChange={() => toggle(p.id)}
                className="accent-cyan-400"
              />
              <span style={{ color: selected.has(p.id) ? p.accent : undefined }}>{p.title}</span>
            </label>
          ))}
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          disabled={selected.size === 0}
          className="mt-4 px-6 py-3 min-h-[44px] rounded-xl bg-cyan-500 text-white font-semibold text-sm border-none cursor-pointer hover:bg-cyan-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Imprimer {selected.size} poster{selected.size > 1 ? 's' : ''}
        </button>
      </div>

      {/* Preview / print content */}
      <div className="screen:space-y-6">
        <GymPosters selected={selected} />
      </div>
    </div>
  );
}
