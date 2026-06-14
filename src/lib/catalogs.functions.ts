import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const idSchema = z.object({ path: z.string().min(1).max(500) });

export const getSignedPdfUrl = createServerFn({ method: "POST" })
  .inputValidator((d: { path: string }) => idSchema.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("catalogs")
      .createSignedUrl(data.path, 60 * 60); // 1 hour
    if (error || !signed) throw new Error(error?.message ?? "Failed to sign URL");
    return { url: signed.signedUrl };
  });
