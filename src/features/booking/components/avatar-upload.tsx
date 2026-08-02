"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AvatarUpload({ username, initialAvatarUrl }: { username: string; initialAvatarUrl: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("avatar", file);
      const response = await fetch("/api/profile/avatar", { method: "POST", body: formData });
      const result = await response.json() as { avatarUrl?: string; error?: string };
      if (!response.ok || !result.avatarUrl) throw new Error(result.error || "Не вдалося завантажити фото");
      setAvatarUrl(result.avatarUrl);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Не вдалося завантажити фото");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/profile/avatar", { method: "DELETE" });
      if (!response.ok) throw new Error("Не вдалося видалити фото");
      setAvatarUrl(null);
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "Не вдалося видалити фото");
    } finally {
      setLoading(false);
    }
  }

  const initials = username.slice(0, 2).toUpperCase();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div className="bg-accent text-accent-foreground relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-full text-xl font-bold">
          {avatarUrl ? <Image src={avatarUrl} alt="Фото профілю" fill sizes="96px" unoptimized className="object-cover" /> : initials}
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} />
          <Button type="button" variant="outline" disabled={loading} onClick={() => inputRef.current?.click()}>
            {loading ? <Loader2 className="animate-spin" /> : <Camera />}Завантажити фото
          </Button>
          {avatarUrl && <Button type="button" variant="outline" disabled={loading} onClick={() => void remove()}><Trash2 />Видалити</Button>}
        </div>
      </div>
      <p className="text-muted-foreground text-xs">JPG, PNG, WebP або AVIF до 5 МБ. Фото буде обрізано до квадрата.</p>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
