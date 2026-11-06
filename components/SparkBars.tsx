type SparkBarsProps = {
  values: Array<number | null>;
  labels?: Array<string | null>;
  max?: number;
  className?: string;
};

export function SparkBars({ values, labels, max = 5, className }: SparkBarsProps) {
  return (
    <div className={`spark-bars ${className ?? ""}`} role="img" aria-label="Trend chart">
      {values.map((value, index) => {
        const height = value === null ? 0 : Math.max(8, (value / max) * 100);
        const missing = value === null;
        return (
          <div key={index} className="spark-bar-slot">
            <div
              className={`spark-bar ${missing ? "is-missing" : ""}`}
              style={{ height: missing ? "12%" : `${height}%` }}
              title={labels?.[index] ?? (value === null ? "No report" : String(value))}
            />
          </div>
        );
      })}
    </div>
  );
}
