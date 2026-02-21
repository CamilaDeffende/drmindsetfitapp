import { useEffect, useMemo, useState } from "react";
import { useGlobalProfileStore } from "../store";
import { COUNTRIES, getCountry } from "../geo/countries";
import { REGIONS_BR } from "../geo/regions_BR";
import { searchCitiesBR } from "../geo/search";
import { resolveByCountry, resolveByCityBR } from "../geo/resolver";
import { nowFormatted } from "../tz";

const TIMEZONE_API_KEY = import.meta.env.VITE_TIMEZONEDB_KEY;

/** Busca timezone real pelo TimeZoneDB usando lat/lon */
async function fetchTimeZoneByCoords(lat: number, lon: number) {
  if (!TIMEZONE_API_KEY) return null;

  const url = `https://api.timezonedb.com/v2.1/get-time-zone?key=${TIMEZONE_API_KEY}&format=json&by=position&lat=${lat}&lng=${lon}`;

  try {
    const r = await fetch(url);
    const data = await r.json();

    if (data.status === "OK" && data.zoneName) {
      return data.zoneName;
    }
  } catch (err) {
    console.warn("Erro TimeZoneDB:", err);
  }

  return null;
}

export function GlobalProfilePicker({
  title = "Localização, fuso e unidades",
  showDeviceLocationHint = true,
}) {
  const { profile, setProfile } = useGlobalProfileStore();

  const [countryCode, setCountryCode] = useState(profile.countryCode || "BR");
  const [regionCode, setRegionCode] = useState(profile.regionCode || "");
  const [cityQuery, setCityQuery] = useState(profile.city || "");
  const [citySelected, setCitySelected] = useState(profile.city || "");
  const [openList, setOpenList] = useState(false);

  const isBR = countryCode.toUpperCase() === "BR";

  /** Defaults ao trocar país */
  const countryDefaults = useMemo(
    () => resolveByCountry(countryCode),
    [countryCode]
  );

  /** Timezone baseada na cidade ou país */
  const tzFromCity = useMemo(() => {
    if (isBR) {
      return resolveByCityBR(citySelected, regionCode).timeZone;
    }
    return countryDefaults.timeZone;
  }, [isBR, citySelected, regionCode, countryDefaults.timeZone]);

  const previewProfile = useMemo(() => {
    const c = getCountry(countryCode);
    return {
      locale: countryDefaults.locale,
      units: countryDefaults.units,
      timeZone: tzFromCity,
      countryName: c?.name || countryCode,
    };
  }, [countryCode, countryDefaults.locale, countryDefaults.units, tzFromCity]);

  /** Busca de cidades */
  const cityOptions = useMemo(() => {
    if (!isBR) return [];
    const q = cityQuery.trim();
    if (q.length < 2) return [];
    return searchCitiesBR(q, regionCode, 20);
  }, [cityQuery, regionCode, isBR]);

  /** Ao trocar país */
  useEffect(() => {
    const next = resolveByCountry(countryCode);
    setProfile({
      countryCode,
      locale: next.locale,
      units: next.units,
      timeZone: next.timeZone,
      updatedAt: Date.now(),
    });

    setRegionCode((prev) => (countryCode === "BR" ? prev : ""));
    if (countryCode !== "BR") {
      setCityQuery("");
      setCitySelected("");
      setOpenList(false);
    }
  }, [countryCode]);

  /** Atualizar timezone quando selecionar cidade */
  useEffect(() => {
    if (!isBR) return;

    const tz = resolveByCityBR(citySelected, regionCode).timeZone;
    setProfile({
      regionCode: regionCode || undefined,
      city: citySelected || undefined,
      timeZone: tz,
      updatedAt: Date.now(),
    });
  }, [citySelected, regionCode, isBR]);

  function onPickCity(name: string) {
    setCitySelected(name);
    setCityQuery(name);
    setOpenList(false);
  }

  /** Usar localização real com API */
  async function onUseDeviceSuggestion() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        const tz = await fetchTimeZoneByCoords(latitude, longitude);

        const finalTimeZone = tz || countryDefaults.timeZone;

        setProfile({
          countryCode: "BR",
          timeZone: finalTimeZone,
          updatedAt: Date.now(),
        });

        // Não tentamos adivinhar cidade pelo MVP
      },
      (err) => {
        console.warn("Erro geolocalização:", err);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="space-y-1">
        <div className="text-base font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">
          Personalize idioma, unidades e horário local. Você pode mudar depois.
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {/* País */}
        <div className="space-y-1">
          <label className="text-sm font-medium">País</label>
          <select
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>

        {/* Estado */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Estado/Região</label>
          <select
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
            value={regionCode}
            onChange={(e) => setRegionCode(e.target.value)}
            disabled={!isBR}
          >
            <option value="">Selecione</option>
            {isBR &&
              REGIONS_BR.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name} ({r.code})
                </option>
              ))}
          </select>
        </div>

        {/* Cidade */}
        <div className="space-y-1 relative">
          <label className="text-sm font-medium">Cidade</label>

          <input
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
            value={cityQuery}
            onChange={(e) => {
              setCityQuery(e.target.value);
              setOpenList(true);
            }}
            onFocus={() => setOpenList(true)}
            placeholder="Digite para buscar..."
            disabled={!isBR}
          />

          {isBR && openList && cityOptions.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-xl border bg-background shadow-lg max-h-60 overflow-auto">
              {cityOptions.map((c) => (
                <button
                  type="button"
                  key={`${c.name}-${c.regionCode}`}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onPickCity(c.name)}
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="text-xs text-muted-foreground">{c.regionCode}</span>
                </button>
              ))}
            </div>
          )}

          {isBR && cityQuery.trim().length > 0 && cityOptions.length === 0 && (
            <div className="mt-1 text-xs text-muted-foreground">
              Sem resultados (tente outra grafia).
            </div>
          )}
        </div>
      </div>

      {/* Pré-visualização */}
      <div className="rounded-2xl border bg-card p-4">
        <div className="text-sm font-semibold">Pré-visualização</div>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <div className="text-sm">
            <span className="text-muted-foreground">Idioma/Locale: </span>
            <span className="font-medium">{previewProfile.locale}</span>
          </div>

          <div className="text-sm">
            <span className="text-muted-foreground">Unidades: </span>
            <span className="font-medium">
              {previewProfile.units === "metric" ? "Métrico" : "Imperial"}
            </span>
          </div>

          <div className="text-sm">
            <span className="text-muted-foreground">Timezone (IANA): </span>
            <span className="font-medium">
              {citySelected && regionCode
                ? `${citySelected} (${regionCode}) — ${previewProfile.timeZone}`
                : previewProfile.timeZone}
            </span>
          </div>

          <div className="text-sm">
            <span className="text-muted-foreground">Hora local agora: </span>
            <span className="font-medium">
              {nowFormatted({
                locale: previewProfile.locale,
                timeZone: previewProfile.timeZone,
              })}
            </span>
          </div>
        </div>

        {showDeviceLocationHint && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-xl border px-3 py-2 text-sm hover:bg-muted disabled:opacity-60"
              onClick={onUseDeviceSuggestion}
            >
              Usar localização do dispositivo
            </button>
            <div className="text-xs text-muted-foreground">
              Nada de coordenadas é salvo.
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        Salvamos apenas país, estado, cidade, timezone e unidades.
      </div>
    </div>
  );
}