"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, LocateFixed, MapPin } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { slugify } from "@/lib/slugify";
import { canonicalCityName } from "@/features/business-import/services/city-normalizer";

type City = { city: string; lat: number; lng: number; regionalCenter: string; isRegionalCenter: boolean };
const COOKIE = "catalog_city";

function distanceSquared(lat: number, lng: number, city: City) {
  const lngScale = Math.cos((lat * Math.PI) / 180);
  return (city.lat - lat) ** 2 + ((city.lng - lng) * lngScale) ** 2;
}

export function CitySelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [cities, setCities] = useState<City[]>([]);
  const [selected, setSelected] = useState("");
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cookieCity = decodeURIComponent(document.cookie.split("; ").find((item) => item.startsWith(`${COOKIE}=`))?.split("=")[1] ?? "");
    const queryCity = searchParams.get("city") ?? "";
    setSelected(canonicalCityName(queryCity || cookieCity, "UA"));
    fetch("/api/catalog/cities", { cache: "no-store" }).then((response) => response.json()).then((data: { cities: City[] }) => setCities(data.cities)).catch(() => setCities([]));
  }, [searchParams]);

  useEffect(() => {
    if (selected || cities.length === 0 || !navigator.geolocation || sessionStorage.getItem("catalog_location_requested")) return;
    sessionStorage.setItem("catalog_location_requested", "1");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const nearest = [...cities].sort((a, b) => distanceSquared(coords.latitude, coords.longitude, a) - distanceSquared(coords.latitude, coords.longitude, b))[0];
      if (nearest) choose(nearest.city);
      setLocating(false);
    }, () => setLocating(false), { enableHighAccuracy: false, timeout: 10_000, maximumAge: 3_600_000 });
    // choose intentionally uses the current route/search params for navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cities, selected]);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  function choose(city: string) {
    setSelected(city);
    setOpen(false);
    document.cookie = `${COOKIE}=${encodeURIComponent(city)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent("catalog-city-change", { detail: city }));
    const segments = pathname.split("/").filter(Boolean);
    if (pathname === "/search") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("city"); params.delete("district"); params.delete("category");
      router.push(city ? city === "Київ" ? `/${slugify(city)}/all/all${params.size ? `?${params}` : ""}` : `/${slugify(city)}/all${params.size ? `?${params}` : ""}` : "/search");
    } else if ((segments.length === 2 || segments.length === 3) && city) {
      const service = segments.at(-1) ?? "all";
      router.push(city === "Київ" ? `/${slugify(city)}/all/${service}${searchParams.size ? `?${searchParams}` : ""}` : `/${slugify(city)}/${service}${searchParams.size ? `?${searchParams}` : ""}`);
    } else router.refresh();
  }

  function locate() {
    if (!navigator.geolocation || cities.length === 0) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const nearest = [...cities].sort((a, b) => distanceSquared(coords.latitude, coords.longitude, a) - distanceSquared(coords.latitude, coords.longitude, b))[0];
      if (nearest) choose(nearest.city);
      setLocating(false);
    }, () => setLocating(false), { enableHighAccuracy: false, timeout: 10_000, maximumAge: 3_600_000 });
  }

  const visibleCities = cities.filter((city) => city.city !== "Донецьк" && city.regionalCenter !== "Донецьк");
  const groups = [...new Set(visibleCities.map((city) => city.regionalCenter))]
    .sort((a, b) => a.localeCompare(b, "uk"))
    .map((regionalCenter) => ({
      regionalCenter,
      center: visibleCities.find((city) => city.city === regionalCenter),
      children: visibleCities.filter((city) => city.regionalCenter === regionalCenter && city.city !== regionalCenter).sort((a, b) => a.city.localeCompare(b.city, "uk")),
    }));

  return <div ref={ref} className="relative"><button type="button" onClick={() => setOpen((value) => !value)} className="text-muted-foreground hover:text-foreground flex max-w-44 items-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium"><MapPin className="size-4 shrink-0" /><span className="truncate">{selected || "Оберіть місто"}</span><ChevronDown className="size-3.5 shrink-0" /></button>{open && <div className="border-border bg-popover fixed left-1/2 top-20 z-50 w-[calc(100vw-2rem)] max-w-5xl -translate-x-1/2 rounded-xl border p-3 shadow-xl"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold">Оберіть місто</p><p className="text-muted-foreground text-xs">Обласні центри та міста області</p></div><button type="button" onClick={locate} disabled={locating || cities.length === 0} className="hover:bg-accent flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium"><LocateFixed className={`size-4 ${locating ? "animate-pulse" : ""}`} />{locating ? "Визначаємо…" : "Моє місто"}</button></div><div className="border-border mt-2 max-h-[min(65vh,34rem)] overflow-y-auto border-t pt-3"><div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">{groups.map((group) => <section key={group.regionalCenter} className="min-w-0"><button type="button" onClick={() => choose(group.regionalCenter)} className="hover:text-primary flex w-full items-center justify-between gap-2 text-left text-sm font-bold"><span>{group.regionalCenter}</span>{selected === group.regionalCenter && <Check className="text-primary size-4 shrink-0" />}</button>{group.children.length > 0 && <div className="border-border mt-1.5 space-y-0.5 border-l pl-2">{group.children.map((item) => <button key={item.city} type="button" onClick={() => choose(item.city)} className="text-muted-foreground hover:bg-accent hover:text-foreground flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs"><span className="truncate">{item.city}</span>{selected === item.city && <Check className="text-primary size-3.5 shrink-0" />}</button>)}</div>}</section>)}</div></div></div>}</div>;
}
