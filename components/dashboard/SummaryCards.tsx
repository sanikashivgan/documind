type SummaryCard = {
  label: string;
  value: string;
  hint: string;
};

const demoStats: SummaryCard[] = [
  {
    label: "Total Documents",
    value: "12",
    hint: "Demo sample value",
  },
  {
    label: "Questions Asked",
    value: "48",
    hint: "Demo sample value",
  },
  {
    label: "Recent Activity",
    value: "6 today",
    hint: "Demo sample value",
  },
];

export default function SummaryCards() {
  return (
    <section aria-labelledby="summary-heading">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2
          id="summary-heading"
          className="text-base font-semibold text-foreground"
        >
          Overview
        </h2>
        <span className="rounded-md border border-border bg-slate-50 px-2 py-1 text-xs text-muted">
          Demo data
        </span>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {demoStats.map((stat) => (
          <li
            key={stat.label}
            className="rounded-xl border border-border bg-surface p-5"
          >
            <p className="text-sm font-medium text-muted">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {stat.value}
            </p>
            <p className="mt-2 text-xs text-muted">{stat.hint}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
