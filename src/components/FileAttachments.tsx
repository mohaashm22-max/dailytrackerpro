import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Download, FileText, Loader2, Paperclip, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatBytes, isFileTypeAllowed, FREE_LIMITS } from "@/lib/subscription";

interface StoredFile {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
}

export default function FileAttachments({
  noteId,
  dayKey,
}: {
  noteId?: string | null;
  dayKey?: string | null;
}) {
  const { user } = useAuth();
  const { isPremium, limits } = useSubscription();
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<StoredFile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    let q = supabase
      .from("user_files")
      .select("id, file_name, file_type, file_size, storage_path")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (noteId) q = q.eq("note_id", noteId);
    else if (dayKey) q = q.eq("day_key", dayKey);
    const [{ data }, { count }] = await Promise.all([
      q,
      supabase
        .from("user_files")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);
    setFiles((data as StoredFile[]) ?? []);
    setTotalCount(count ?? 0);
  }, [user, noteId, dayKey]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (file: File) => {
    if (!user) return;
    if (!isFileTypeAllowed(file)) {
      toast.error(t("files.badType"));
      return;
    }
    if (file.size > limits.maxFileSize) {
      toast.error(t("files.tooLarge", { size: formatBytes(limits.maxFileSize) }));
      return;
    }
    if (!isPremium && totalCount >= FREE_LIMITS.maxFiles) {
      toast.error(t("files.limitReached"));
      return;
    }
    setBusy(true);
    const ext = file.name.split(".").pop() || "bin";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("attachments").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (upErr) {
      setBusy(false);
      toast.error(upErr.message);
      return;
    }
    const { error } = await supabase.from("user_files").insert({
      user_id: user.id,
      file_name: file.name,
      file_type: file.type || ext,
      file_size: file.size,
      storage_path: path,
      note_id: noteId ?? null,
      day_key: dayKey ?? null,
    });
    setBusy(false);
    if (error) {
      await supabase.storage.from("attachments").remove([path]);
      toast.error(error.message);
      return;
    }
    toast.success(t("files.uploaded"));
    await load();
  };

  const handleDownload = async (f: StoredFile) => {
    const { data, error } = await supabase.storage
      .from("attachments")
      .createSignedUrl(f.storage_path, 60);
    if (error || !data) {
      toast.error(t("files.downloadFailed"));
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const handleDelete = async (f: StoredFile) => {
    await supabase.storage.from("attachments").remove([f.storage_path]);
    const { error } = await supabase.from("user_files").delete().eq("id", f.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("files.deleted"));
    await load();
  };

  const atLimit = !isPremium && totalCount >= FREE_LIMITS.maxFiles;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Paperclip className="h-4 w-4" />
          {t("files.title")}
        </div>
        <div className="flex items-center gap-2">
          {!isPremium && (
            <span className="text-xs text-muted-foreground">
              {t("files.usage", { used: String(totalCount), max: String(FREE_LIMITS.maxFiles) })}
            </span>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            {t("files.attach")}
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.doc,.xlsx,.xls,.jpg,.jpeg,.png,.txt"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
            e.target.value = "";
          }}
        />
      </div>

      {atLimit && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/50 p-3 text-xs">
          <span>{t("files.limitReached")}</span>
          <Button asChild size="sm">
            <Link to="/upgrade">{t("upgrade.cta")}</Link>
          </Button>
        </div>
      )}

      {files.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("files.empty")}</p>
      ) : (
        <ul className="space-y-1.5">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
            >
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{f.file_name}</p>
                <p className="text-[11px] text-muted-foreground">{formatBytes(f.file_size)}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => handleDownload(f)}>
                <Download className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => handleDelete(f)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
