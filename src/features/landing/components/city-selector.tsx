"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, LocateFixed, MapPin } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { slugify } from "@/lib/slugify";
import { canonicalCityName } from "@/features/business-import/services/city-normalizer";

type City = { city: string; lat: number; lng: number };
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

  return <div ref={ref} className="relative"><button type="button" onClick={() => setOpen((value) => !value)} className="text-muted-foreground hover:text-foreground flex max-w-44 items-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium"><MapPin className="size-4 shrink-0" /><span className="truncate">{selected || "Оберіть місто"}</span><ChevronDown className="size-3.5 shrink-0" /></button>{open && <div className="border-border bg-popover absolute left-0 z-50 mt-1 w-64 rounded-xl border p-2 shadow-lg"><button type="button" onClick={locate} disabled={locating || cities.length === 0} className="hover:bg-accent flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium"><LocateFixed className={`size-4 ${locating ? "animate-pulse" : ""}`} />{locating ? "Визначаємо місто…" : "Визначити автоматично"}</button><div className="border-border my-1 border-t" /><div className="max-h-64 overflow-auto">{cities.map((item) => <button key={item.city} type="button" onClick={() => choose(item.city)} className="hover:bg-accent flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm"><span>{item.city}</span>{selected === item.city && <Check className="text-primary size-4" />}</button>)}</div></div>}</div>;
}
