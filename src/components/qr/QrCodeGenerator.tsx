'use client';

import { useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const BASE_URL = 'https://muscu-eps.fr';

interface Exercise {
  slug: string;
  title: string;
  muscles: string[];
  equipment: string[];
}

interface QrCodeGeneratorProps {
  exercises: Exercise[];
}

export function QrCodeGenerator({ exercises }: QrCodeGeneratorProps) {
  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(new Set());

  const allEquipment = useMemo(() => {
    const set = new Set<string>();
    for (const ex of exercises) {
      for (const eq of ex.equipment) set.add(eq);
    }
    return [...set].sort();
  }, [exercises]);

  const filtered = useMemo(() => {
    if (selectedEquipment.size === 0) return exercises;
    return exercises.filter((ex) =>
      ex.equipment.some((eq) => selectedEquipment.has(eq)),
    );
  }, [exercises, selectedEquipment]);

  const toggleEquipment = (eq: string) => {
    setSelectedEquipment((prev) => {
      const next = new Set(prev);
      if (next.has(eq)) next.delete(eq);
      else next.add(eq);
      return next;
    });
  };

  return (
    <div>
      {/* Filters — hidden in print */}
      <div className="mb-6 print:hidden">
        <p className="text-sm text-[color:var(--muted)] mb-3">
          Sélectionner les équipements de votre salle :
        </p>
        <div className="flex flex-wrap gap-2">
          {allEquipment.map((eq) => (
            <button
              key={eq}
              type="button"
              onClick={() => toggleEquipment(eq)}
              className={`px-3 py-2 min-h-[44px] rounded-full text-xs font-medium border cursor-pointer transition-colors ${
                selectedEquipment.has(eq)
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              {eq}
            </button>
          ))}
          {selectedEquipment.size > 0 && (
            <button
              type="button"
              onClick={() => setSelectedEquipment(new Set())}
              className="px-3 py-2 min-h-[44px] rounded-full text-xs font-medium border border-red-500/30 text-red-400 bg-red-500/10 cursor-pointer hover:bg-red-500/20 transition-colors"
            >
              Tout afficher
            </button>
          )}
        </div>
        <p className="text-xs text-[color:var(--muted)] mt-2">
          {filtered.length} exercice{filtered.length > 1 ? 's' : ''} sélectionné{filtered.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Print button */}
      <button
        type="button"
        onClick={() => window.print()}
        className="mb-6 px-6 py-3 min-h-[44px] rounded-xl bg-cyan-500 text-white font-semibold text-sm border-none cursor-pointer hover:bg-cyan-600 transition-colors print:hidden"
      >
        Imprimer la sélection
      </button>

      {/* QR grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-3 print:gap-2">
        {filtered.map((ex) => (
          <div
            key={ex.slug}
            className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 print:border-dashed print:border-gray-300 print:bg-white print:p-3 print:break-inside-avoid"
          >
            <QRCodeSVG
              value={`${BASE_URL}/exercices/${ex.slug}?source=qr`}
              size={150}
              level="M"
              bgColor="transparent"
              fgColor="currentColor"
              className="text-white print:text-black w-[120px] h-[120px] sm:w-[150px] sm:h-[150px] print:w-[80px] print:h-[80px]"
            />
            <div className="text-center">
              <p className="font-bold text-sm text-white print:text-black leading-tight">
                {ex.title}
              </p>
              <p className="text-[10px] text-white/50 print:text-gray-500 mt-0.5">
                {ex.muscles.slice(0, 2).join(' · ')}
              </p>
              {ex.equipment.length > 0 && (
                <p className="text-[10px] text-cyan-400/70 print:text-gray-400 mt-0.5">
                  {ex.equipment.slice(0, 2).join(' · ')}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
