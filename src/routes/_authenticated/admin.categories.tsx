import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Folder } from "lucide-react";
import { toast } from "sonner";
import { getCategories, addCategory, deleteCategory, type LocalCategory } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: CategoriesAdmin,
});

function CategoriesAdmin() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [parent, setParent] = useState<string>("none");

  const { data: cats } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: getCategories,
  });

  function create() {
    if (!name.trim()) return;
    addCategory(name.trim(), parent === "none" ? null : parent)
      .then(() => {
        toast.success("Category added");
        setName("");
        qc.invalidateQueries({ queryKey: ["admin-categories"] });
        qc.invalidateQueries({ queryKey: ["categories"] });
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed"));
  }

  function remove(id: string) {
    if (!confirm("Delete this category and all subcategories?")) return;
    deleteCategory(id)
      .then(() => {
        toast.success("Deleted");
        qc.invalidateQueries({ queryKey: ["admin-categories"] });
        qc.invalidateQueries({ queryKey: ["categories"] });
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Failed"));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h3 className="font-display text-lg">New category</h3>
        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="cn">Name</Label>
            <Input id="cn" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="e.g. Tools, Screwdrivers…" />
          </div>
          <div className="space-y-1.5">
            <Label>Parent (optional)</Label>
            <Select value={parent} onValueChange={setParent}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None (top level)</SelectItem>
                {cats?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={create} className="w-full rounded-full"><Plus className="mr-1 h-4 w-4" />Add category</Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h3 className="font-display text-lg mb-4">All categories</h3>
        <div className="space-y-1">
          {cats?.length === 0 && <p className="text-sm text-muted-foreground">No categories yet.</p>}
          {cats?.map((c) => {
            const parentName = cats.find((p) => p.id === c.parent_id)?.name;
            return (
              <div key={c.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-secondary/60">
                <div className="flex items-center gap-2 text-sm">
                  <Folder className="h-3.5 w-3.5 text-primary/60" />
                  <span className="font-medium">{c.name}</span>
                  {parentName && <span className="text-xs text-muted-foreground">in {parentName}</span>}
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
