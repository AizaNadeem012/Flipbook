import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getCatalogs, getCategories } from "@/lib/store";
import { Book, FolderTree, Eye, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => {
      const catalogs = getCatalogs();
      const categories = getCategories();
      const totalViews = catalogs.reduce((s, c) => s + (c.view_count ?? 0), 0);
      return {
        categories: categories.length,
        catalogs: catalogs.length,
        totalViews,
        recent: catalogs.slice(0, 5),
      };
    },
  });

  const stats = [
    { label: "Total catalogs", value: data?.catalogs ?? 0, icon: Book },
    { label: "Categories", value: data?.categories ?? 0, icon: FolderTree },
    { label: "Total views", value: data?.totalViews ?? 0, icon: Eye },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl">Welcome back</h2>
        <p className="mt-1 text-sm text-muted-foreground">Overview of your catalog platform.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
              <s.icon className="h-4 w-4 text-primary/60" />
            </div>
            <p className="mt-3 font-display text-4xl">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h3 className="font-display text-lg mb-4 flex items-center gap-2"><Clock className="h-4 w-4" />Recent uploads</h3>
        <div className="space-y-2">
          {data?.recent.length === 0 && <p className="text-sm text-muted-foreground">No catalogs yet.</p>}
          {data?.recent.map((r) => (
            <div key={r.id} className="flex justify-between rounded-lg px-3 py-2 hover:bg-secondary/60">
              <span className="text-sm font-medium">{r.title}</span>
              <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
