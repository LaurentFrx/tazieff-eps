type ParametresTableProps = {
  parametres: {
    series: string;
    repetitions: string;
    intensite: string;
    recuperation: string;
    duree?: string;
  };
  labels: {
    series: string;
    repetitions: string;
    intensite: string;
    recuperation: string;
    duree: string;
  };
};

export function ParametresTable({ parametres, labels }: ParametresTableProps) {
  const rows = [
    { label: labels.series, value: parametres.series },
    { label: labels.repetitions, value: parametres.repetitions },
    { label: labels.intensite, value: parametres.intensite },
    { label: labels.recuperation, value: parametres.recuperation },
    ...(parametres.duree
      ? [{ label: labels.duree, value: parametres.duree }]
      : []),
  ];

  return (
    <dl className="grid grid-cols-1 divide-y divide-[color:var(--border)]">
      {rows.map(({ label, value }) => (
        <div key={label} className="flex items-baseline justify-between gap-4 py-2.5">
          <dt className="text-xs text-[color:var(--muted)]">{label}</dt>
          <dd className="text-right text-sm font-semibold text-[color:var(--ink)]">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
