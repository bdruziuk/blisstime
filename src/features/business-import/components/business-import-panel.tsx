"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Check, ChevronDown, Loader2, MapPin, RefreshCw, Search, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateProgress } from "../services/progress";

type Category = { key: string; label: string; providerTypes: string[]; searchQueries: string[] };
type City = { externalId: string; name: string; formattedName: string };
type Job = {
  id: string;
  status: string;
  categories: string[];
  includeDetails: boolean;
  totalTasks: number;
  completedTasks: number;
  foundCount: number;
  createdCount: number;
  updatedCount: number;
  duplicateCount: number;
  failedCount: number;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  city: City & { countryCode: string };
  createdBy: { name: string | null; email: string | null } | null;
};
type Task = {
  id: string;
  category: string;
  searchQuery: string;
  status: string;
  south: number;
  west: number;
  north: number;
  east: number;
  depth: number;
  attempts: number;
  foundCount: number;
  errorMessage: string | null;
};
type ImportedBusiness = {
  id: string;
  name: string;
  formattedAddress: string;
  rating: number | null;
  userRatingCount: number | null;
  publicationStatus: string;
  manualReviewRequired: boolean;
  googleMapsUri: string | null;
  websiteUri: string | null;
  nationalPhone: string | null;
  internationalPhone: string | null;
  enrichmentStatus: string;
  enrichmentError: string | null;
  serviceDrafts: ServiceDraft[];
};
type ServiceDraft = { id: string; displayName: string; priceMinor: number; currencyCode: string; durationMinutes: number | null; sourceUrl: string; status: string };

const ACTIVE = new Set(["PENDING", "RUNNING"]);
const statusLabel: Record<string, string> = {
  PENDING: "Очікує",
  RUNNING: "Виконується",
  COMPLETED: "Завершено",
  COMPLETED_WITH_ERRORS: "Завершено з помилками",
  FAILED: "Помилка",
  CANCELLED: "Скасовано",
};
const dateFormatter = new Intl.DateTimeFormat("uk-UA", { dateStyle: "short", timeStyle: "short" });

async function responseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Помилка запиту");
  return payload;
}

export function BusinessImportPanel({ categories }: { categories: Category[] }) {
  const [countryCode, setCountryCode] = useState("UA");
  const [cityQuery, setCityQuery] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<(Job & { tasks: Task[] }) | null>(null);
  const [businesses, setBusinesses] = useState<ImportedBusiness[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    const data = await responseJson<{ jobs: Job[] }>(await fetch("/api/admin/business-import/jobs", { cache: "no-store" }));
    setJobs(data.jobs);
    return data.jobs;
  }, []);

  const loadDetails = useCallback(async (jobId: string) => {
    const data = await responseJson<{ job: Job & { tasks: Task[] }; businesses: ImportedBusiness[] }>(
      await fetch(`/api/admin/business-import/jobs/${jobId}`, { cache: "no-store" })
    );
    setSelectedJob(data.job);
    setBusinesses(data.businesses);
  }, []);

  useEffect(() => {
    loadJobs().catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Не вдалося завантажити імпорти"));
  }, [loadJobs]);

  useEffect(() => {
    if (selectedCity || cityQuery.trim().length < 2 || countryCode.length !== 2) {
      setCities([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ query: cityQuery.trim(), countryCode: countryCode.toLowerCase() });
        const data = await responseJson<{ cities: City[] }>(
          await fetch(`/api/admin/business-import/cities/search?${params}`, { signal: controller.signal })
        );
        setCities(data.cities);
      } catch (reason) {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) {
          setError(reason instanceof Error ? reason.message : "Помилка пошуку міста");
        }
      } finally {
        setSearching(false);
      }
    }, 450);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [cityQuery, countryCode, selectedCity]);

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const current = await loadJobs();
        const active = current.find((job) => ACTIVE.has(job.status));
        if (active) {
          await fetch(`/api/admin/business-import/jobs/${active.id}/process`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ limit: 3 }),
          });
          await loadJobs();
          if (selectedJob?.id === active.id) await loadDetails(active.id);
        }
      } catch {
        // A later poll retries; visible job/task errors come from the API data.
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [loadDetails, loadJobs, selectedJob?.id]);

  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.key, category.label])), [categories]);
  const activeJob = jobs.find((job) => ACTIVE.has(job.status));

  async function createJob() {
    if (!selectedCity || selectedCategories.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const data = await responseJson<{ job: Job }>(
        await fetch("/api/admin/business-import/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cityExternalId: selectedCity.externalId,
            categories: selectedCategories,
            includeDetails,
          }),
        })
      );
      await loadJobs();
      await loadDetails(data.job.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не вдалося створити імпорт");
    } finally {
      setLoading(false);
    }
  }

  async function cancelJob(jobId: string) {
    setLoading(true);
    try {
      await responseJson(await fetch(`/api/admin/business-import/jobs/${jobId}/cancel`, { method: "POST" }));
      await loadJobs();
      if (selectedJob?.id === jobId) await loadDetails(jobId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не вдалося скасувати імпорт");
    } finally {
      setLoading(false);
    }
  }

  async function moderateBusinesses(ids: string[], status: "PUBLISHED" | "REJECTED") {
    try {
      const result = await responseJson<{ updatedCount: number }>(await fetch("/api/admin/business-import/businesses/bulk-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status }),
      }));
      if (result.updatedCount === 0) throw new Error("Жоден із вибраних салонів не був оновлений");
      setBusinesses((current) => current.map((business) => ids.includes(business.id) ? { ...business, publicationStatus: status } : business));
      setNotice(status === "PUBLISHED" ? `Опубліковано салонів: ${result.updatedCount}. Вони доступні в пошуку для свого міста.` : `Відхилено салонів: ${result.updatedCount}.`);
      if (selectedJob) await loadDetails(selectedJob.id);
      return result.updatedCount;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не вдалося змінити статус вибраних закладів");
      throw reason;
    }
  }

  async function retryTask(taskId: string) {
    try {
      await responseJson(
        await fetch(`/api/admin/business-import/tasks/${taskId}/retry`, { method: "POST" })
      );
      await loadJobs();
      if (selectedJob) await loadDetails(selectedJob.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не вдалося повторити task");
    }
  }

  async function enrichBusiness(id: string) {
    setError(null);
    setBusinesses((current) => current.map((item) => item.id === id ? { ...item, enrichmentStatus: "PROCESSING", enrichmentError: null } : item));
    try {
      await responseJson(await fetch(`/api/admin/business-import/businesses/${id}/enrich`, { method: "POST" }));
      if (selectedJob) await loadDetails(selectedJob.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не вдалося імпортувати послуги");
      if (selectedJob) await loadDetails(selectedJob.id);
    }
  }

  async function moderateDraft(id: string, status: "APPROVED" | "REJECTED") {
    try {
      await responseJson(await fetch(`/api/admin/business-import/service-drafts/${id}/status`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }));
      if (selectedJob) await loadDetails(selectedJob.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не вдалося змінити статус послуги");
    }
  }

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
      <header>
        <Link href="/admin" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm">
          <ArrowLeft className="size-4" /> Адмін-панель
        </Link>
        <h1 className="font-heading mt-4 text-3xl font-bold">Імпорт салонів</h1>
        <p className="text-muted-foreground mt-1">Google Places API (New), географічна сітка та ручна модерація.</p>
      </header>

      {error && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-start justify-between rounded-xl border p-4 text-sm">
          <span>{error}</span><button onClick={() => setError(null)}><X className="size-4" /></button>
        </div>
      )}
      {notice && <div className="border-emerald-500/30 bg-emerald-500/10 text-emerald-800 flex items-start justify-between rounded-xl border p-4 text-sm dark:text-emerald-300"><span>{notice}</span><button onClick={() => setNotice(null)}><X className="size-4" /></button></div>}

      <section className="border-border bg-card rounded-2xl border p-5 shadow-sm">
        <h2 className="font-heading text-xl font-semibold">Новий імпорт</h2>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <label className="block text-sm font-medium">Країна (ISO-код)
              <Input
                list="business-import-country-codes"
                value={countryCode}
                maxLength={2}
                onChange={(event) => {
                  setCountryCode(event.target.value.toUpperCase().replace(/[^A-Z]/g, ""));
                  setSelectedCity(null);
                }}
                className="mt-1.5 uppercase"
                placeholder="UA"
              />
              <datalist id="business-import-country-codes">
                <option value="UA">Україна</option><option value="PL">Польща</option><option value="DE">Німеччина</option>
                <option value="CZ">Чехія</option><option value="SK">Словаччина</option><option value="RO">Румунія</option>
              </datalist>
            </label>
            <div className="relative">
              <label className="block text-sm font-medium">Місто</label>
              <div className="relative mt-1.5">
                <Search className="text-muted-foreground absolute top-2 left-2.5 size-4" />
                <Input value={selectedCity?.formattedName ?? cityQuery} onChange={(event) => { setSelectedCity(null); setCityQuery(event.target.value); }} placeholder="Почніть вводити назву міста" className="pl-8" />
                {searching && <Loader2 className="text-muted-foreground absolute top-2 right-2.5 size-4 animate-spin" />}
              </div>
              {cities.length > 0 && (
                <div className="border-border bg-popover absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border p-1 shadow-lg">
                  {cities.map((city) => <button key={city.externalId} onClick={() => { setSelectedCity(city); setCities([]); }} className="hover:bg-accent flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm"><MapPin className="mt-0.5 size-4 shrink-0" /><span><strong>{city.name}</strong><span className="text-muted-foreground block text-xs">{city.formattedName}</span></span></button>)}
                </div>
              )}
            </div>
            {selectedCity && <div className="border-primary/20 bg-primary/5 rounded-xl border p-3 text-sm"><strong>{selectedCity.name}</strong><p className="text-muted-foreground">{selectedCity.formattedName}</p><p className="text-muted-foreground mt-1 text-xs">Google Place ID: {selectedCity.externalId}</p></div>}
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={includeDetails} onChange={(event) => setIncludeDetails(event.target.checked)} className="mt-1" /><span>Отримувати телефони, сайт, рейтинг і години роботи через Place Details</span></label>
          </div>
          <div>
            <div className="flex items-center justify-between"><span className="text-sm font-medium">Категорії</span><div className="flex gap-2"><Button variant="ghost" size="sm" onClick={() => setSelectedCategories(categories.map((item) => item.key))}>Вибрати всі</Button><Button variant="ghost" size="sm" onClick={() => setSelectedCategories([])}>Очистити</Button></div></div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">{categories.map((category) => <label key={category.key} className="border-border hover:bg-accent/30 flex cursor-pointer gap-2 rounded-lg border p-2.5 text-sm"><input type="checkbox" checked={selectedCategories.includes(category.key)} onChange={(event) => setSelectedCategories((current) => event.target.checked ? [...current, category.key] : current.filter((key) => key !== category.key))} /><span>{category.label}</span></label>)}</div>
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground max-w-2xl text-xs">Google Places API є платним. Кількість і вартість запитів залежать від міста, категорій, дроблення сітки та field mask. Точна оцінка наперед неможлива.</p>
          <Button size="lg" disabled={!selectedCity || selectedCategories.length === 0 || loading || Boolean(activeJob)} onClick={createJob}>{loading ? <Loader2 className="animate-spin" /> : <Building2 />}Почати імпорт</Button>
        </div>
      </section>

      {activeJob && <JobProgress job={activeJob} onCancel={() => cancelJob(activeJob.id)} onOpen={() => loadDetails(activeJob.id)} />}

      <section className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm">
        <div className="flex items-center justify-between p-5"><h2 className="font-heading text-xl font-semibold">Історія</h2><Button variant="outline" size="sm" onClick={() => loadJobs()}><RefreshCw />Оновити</Button></div>
        <div className="overflow-x-auto border-t"><table className="w-full min-w-[960px] text-left text-sm"><thead className="bg-muted/50 text-muted-foreground text-xs"><tr>{["Дата", "Місто", "Категорії", "Статус", "Знайдено", "Створено", "Оновлено", "Помилки", "Автор", ""].map((heading) => <th key={heading} className="px-4 py-3 font-medium">{heading}</th>)}</tr></thead><tbody className="divide-border divide-y">{jobs.map((job) => <tr key={job.id} className="hover:bg-accent/20"><td className="px-4 py-3">{dateFormatter.format(new Date(job.createdAt))}</td><td className="px-4 py-3 font-medium">{job.city.name}<span className="text-muted-foreground block text-xs">{job.city.countryCode}</span></td><td className="px-4 py-3 text-xs">{job.categories.map((key) => categoryMap.get(key) ?? key).join(", ")}</td><td className="px-4 py-3">{statusLabel[job.status] ?? job.status}</td><td className="px-4 py-3">{job.foundCount}</td><td className="px-4 py-3">{job.createdCount}</td><td className="px-4 py-3">{job.updatedCount}</td><td className="px-4 py-3">{job.failedCount}</td><td className="px-4 py-3 text-xs">{job.createdBy?.email ?? "—"}</td><td className="px-4 py-3"><div className="flex"><Button variant="ghost" size="sm" onClick={() => loadDetails(job.id)}>Деталі <ChevronDown /></Button><Button variant="ghost" size="sm" disabled={Boolean(activeJob)} onClick={() => { setSelectedCity(job.city); setCityQuery(""); setCountryCode(job.city.countryCode); setSelectedCategories(job.categories); setIncludeDetails(job.includeDetails); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Повторити</Button></div></td></tr>)}</tbody></table>{jobs.length === 0 && <p className="text-muted-foreground p-10 text-center text-sm">Імпортів ще немає.</p>}</div>
      </section>

      {selectedJob && <JobDetails job={selectedJob} businesses={businesses} categoryMap={categoryMap} onClose={() => setSelectedJob(null)} onModerateMany={moderateBusinesses} onRetryTask={retryTask} onEnrich={enrichBusiness} onModerateDraft={moderateDraft} />}
      <p className="text-muted-foreground text-center text-xs">Дані про заклади: Google Places. Перевірте вимоги атрибуції Google Maps Platform перед production-публікацією.</p>
    </main>
  );
}

function JobProgress({ job, onCancel, onOpen }: { job: Job; onCancel: () => void; onOpen: () => void }) {
  const progress = calculateProgress(job.totalTasks, job.completedTasks);
  return <section className="border-primary/20 bg-card rounded-2xl border p-5 shadow-sm"><div className="flex items-start justify-between"><div><p className="text-primary text-xs font-semibold uppercase">Активний імпорт</p><h2 className="font-heading mt-1 text-xl font-semibold">{job.city.formattedName}</h2><p className="text-muted-foreground text-sm">{statusLabel[job.status]} · {job.completedTasks}/{job.totalTasks} tasks</p></div><Button variant="destructive" onClick={onCancel}><Square />Скасувати</Button></div><div className="bg-muted mt-4 h-2 overflow-hidden rounded-full"><div className="bg-primary h-full transition-all" style={{ width: `${progress}%` }} /></div><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5"><Metric label="Прогрес" value={`${progress}%`} /><Metric label="Знайдено" value={job.foundCount} /><Metric label="Створено" value={job.createdCount} /><Metric label="Оновлено" value={job.updatedCount} /><Metric label="Помилки" value={job.failedCount} /></div><Button variant="link" className="mt-2 px-0" onClick={onOpen}>Переглянути tasks</Button></section>;
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div><p className="text-muted-foreground text-xs">{label}</p><p className="text-lg font-bold">{value}</p></div>; }

function JobDetails({ job, businesses, categoryMap, onClose, onModerateMany, onRetryTask, onEnrich, onModerateDraft }: { job: Job & { tasks: Task[] }; businesses: ImportedBusiness[]; categoryMap: Map<string, string>; onClose: () => void; onModerateMany: (ids: string[], status: "PUBLISHED" | "REJECTED") => Promise<number>; onRetryTask: (id: string) => void; onEnrich: (id: string) => void; onModerateDraft: (id: string, status: "APPROVED" | "REJECTED") => void }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const allSelected = businesses.length > 0 && businesses.every((business) => selectedIds.has(business.id));

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function moderateSelected(status: "PUBLISHED" | "REJECTED") {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      await onModerateMany([...selectedIds], status);
      setSelectedIds(new Set());
    } finally {
      setBulkLoading(false);
    }
  }
  return <section className="border-border bg-card rounded-2xl border shadow-sm"><div className="flex items-start justify-between p-5"><div><h2 className="font-heading text-xl font-semibold">Деталі: {job.city.name}</h2><p className="text-muted-foreground text-sm">{statusLabel[job.status]} · {job.id}</p></div><Button variant="ghost" size="icon" onClick={onClose}><X /></Button></div><details open className="border-t"><summary className="cursor-pointer px-5 py-3 font-semibold">Tasks ({job.tasks.length})</summary><div className="max-h-96 overflow-auto border-t"><table className="w-full min-w-[960px] text-left text-xs"><thead className="bg-muted/50"><tr>{["Категорія", "Запит", "Статус", "Bounds", "Depth", "Attempts", "Знайдено", "Помилка", ""].map((heading, index) => <th key={`${heading}-${index}`} className="px-3 py-2">{heading}</th>)}</tr></thead><tbody className="divide-border divide-y">{job.tasks.map((task) => <tr key={task.id}><td className="px-3 py-2">{categoryMap.get(task.category) ?? task.category}</td><td className="px-3 py-2">{task.searchQuery}</td><td className="px-3 py-2">{statusLabel[task.status] ?? task.status}</td><td className="px-3 py-2 font-mono">{task.south.toFixed(3)},{task.west.toFixed(3)} — {task.north.toFixed(3)},{task.east.toFixed(3)}</td><td className="px-3 py-2">{task.depth}</td><td className="px-3 py-2">{task.attempts}</td><td className="px-3 py-2">{task.foundCount}</td><td className="text-destructive max-w-xs px-3 py-2">{task.errorMessage ?? "—"}</td><td className="px-3 py-2">{task.status === "FAILED" && <Button size="xs" variant="outline" onClick={() => onRetryTask(task.id)}>Повторити</Button>}</td></tr>)}</tbody></table></div></details><details open className="border-t"><summary className="cursor-pointer px-5 py-3 font-semibold">Результати на модерації ({businesses.length})</summary><div className="flex flex-wrap items-center gap-3 border-t px-4 py-3"><label className="flex cursor-pointer items-center gap-2 text-sm font-medium"><input type="checkbox" checked={allSelected} onChange={() => setSelectedIds(allSelected ? new Set() : new Set(businesses.map((business) => business.id)))} />Вибрати всі</label><span className="text-muted-foreground text-xs">Вибрано: {selectedIds.size}</span><Button size="sm" disabled={selectedIds.size === 0 || bulkLoading} onClick={() => moderateSelected("PUBLISHED")}>{bulkLoading ? <Loader2 className="animate-spin" /> : <Check />}Імпортувати вибрані</Button><Button size="sm" variant="destructive" disabled={selectedIds.size === 0 || bulkLoading} onClick={() => moderateSelected("REJECTED")}><X />Відхилити вибрані</Button></div><div className="grid gap-2 border-t p-4 sm:grid-cols-2">{businesses.map((business) => <BusinessCard key={business.id} business={business} selected={selectedIds.has(business.id)} onToggle={() => toggleSelected(business.id)} onEnrich={onEnrich} onModerateDraft={onModerateDraft} />)}</div></details></section>;
}

function BusinessCard({ business, selected, onToggle, onEnrich, onModerateDraft }: { business: ImportedBusiness; selected: boolean; onToggle: () => void; onEnrich: (id: string) => void; onModerateDraft: (id: string, status: "APPROVED" | "REJECTED") => void }) {
  const validWebsite = (() => { try { const url = new URL(business.websiteUri ?? ""); return ["http:", "https:"].includes(url.protocol); } catch { return false; } })();
  const processing = ["QUEUED", "PROCESSING"].includes(business.enrichmentStatus);
  const badge = !validWebsite ? "Недоступно: немає сайту" : business.enrichmentStatus === "NOT_STARTED" ? "Можна імпортувати" : business.enrichmentStatus === "COMPLETED" ? `Знайдено: ${business.serviceDrafts.length}` : business.enrichmentStatus === "NO_PRICES_FOUND" ? "Ціни не знайдено" : business.enrichmentStatus === "FAILED" ? "Помилка імпорту" : "Імпорт виконується";
  return <article className={`rounded-xl border p-3 ${selected ? "border-primary bg-primary/5" : "border-border"}`}><div className="flex justify-between gap-2"><label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={selected} onChange={onToggle} className="mt-1 size-4" aria-label={`Вибрати ${business.name}`} /><div><h3 className="font-semibold">{business.name}</h3><p className="text-muted-foreground text-xs">{business.formattedAddress}</p></div></label><span className={`h-fit rounded-full px-2 py-0.5 text-xs ${validWebsite ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"}`}>{badge}</span></div><p className="text-muted-foreground mt-2 text-xs">Рейтинг: {business.rating ?? "—"} ({business.userRatingCount ?? 0}) · {business.publicationStatus}</p>{business.enrichmentError && <p className="text-destructive mt-2 text-xs">{business.enrichmentError}</p>}{business.googleMapsUri && <a href={business.googleMapsUri} target="_blank" rel="noreferrer" className="text-primary mt-2 inline-block text-xs hover:underline">Google Maps</a>}<Button size="sm" variant="outline" disabled={!validWebsite || processing} className="mt-2 w-full" onClick={() => onEnrich(business.id)}>{processing && <Loader2 className="animate-spin" />}{business.enrichmentStatus === "NOT_STARTED" ? "Знайти послуги та ціни" : "Повторити пошук послуг і цін"}</Button>{business.serviceDrafts.length > 0 && <div className="mt-3 space-y-2 border-t pt-3">{business.serviceDrafts.map((draft) => <div key={draft.id} className="bg-muted/40 rounded-lg p-2 text-xs"><div className="flex items-start justify-between gap-2"><div><strong>{draft.displayName}</strong><p>{(draft.priceMinor / 100).toLocaleString("uk-UA", { style: "currency", currency: draft.currencyCode })}{draft.durationMinutes ? ` · ${draft.durationMinutes} хв` : ""}</p></div><span>{draft.status}</span></div>{draft.status === "PENDING_REVIEW" && <div className="mt-2 flex gap-2"><Button size="xs" onClick={() => onModerateDraft(draft.id, "APPROVED")}><Check />Підтвердити</Button><Button size="xs" variant="outline" onClick={() => onModerateDraft(draft.id, "REJECTED")}><X />Відхилити</Button><a className="text-primary ml-auto self-center hover:underline" href={draft.sourceUrl} target="_blank" rel="noreferrer">Джерело</a></div>}</div>)}</div>}</article>;
}
