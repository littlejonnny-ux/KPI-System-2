import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  description?: string;
  className?: string;
}

export function MetricCard({ label, value, description, className }: MetricCardProps) {
  return (
    <Card className={cn("bg-muted/50", className)}>
      <CardContent className="pt-5 pb-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
        <p className="font-mono text-2xl font-bold text-foreground">{value}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
