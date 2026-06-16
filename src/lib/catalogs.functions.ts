import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const pathSchema = z.object({ path: z.string().min(1).max(500) });
const idSchema = z.object({ id: z.string().uuid() });

export const getSignedPdfUrl = createServerFn({ method: "POST" })
  .inputValidator((d: { path: string }) => pathSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("catalogs")
      .createSignedUrl(data.path, 60 * 60);
    if (error || !signed) throw new Error(error?.message ?? "Failed to sign URL");
    return { url: signed.signedUrl };
  });

export const incrementCatalogView = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => idSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error: readErr } = await supabaseAdmin
      .from("catalogs")
      .select("view_count")
      .eq("id", data.id)
      .maybeSingle();
    if (readErr || !row) return;
    await supabaseAdmin
      .from("catalogs")
      .update({ view_count: (row.view_count ?? 0) + 1 })
      .eq("id", data.id);
  });
