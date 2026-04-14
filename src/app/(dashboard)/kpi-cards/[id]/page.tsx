interface KpiCardPageProps {
  params: Promise<{ id: string }>;
}

export default async function KpiCardPage({ params }: KpiCardPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">KPI-карта</h1>
      <p className="text-muted-foreground">
        ID: <span className="font-mono text-foreground">{id}</span>
      </p>
      <p className="text-muted-foreground">Детальный просмотр карты будет реализован в Stage 5.</p>
    </div>
  );
}
