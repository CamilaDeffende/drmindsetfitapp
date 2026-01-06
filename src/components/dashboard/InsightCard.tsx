export function InsightCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl p-4 bg-black text-white">
      <h4 className="text-sm opacity-70">{title}</h4>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
