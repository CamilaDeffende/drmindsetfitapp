import { useEffect, useMemo, useState } from "react";
import { useGlobalProfileStore } from "../store";
import { COUNTRIES, getCountry } from "../geo/countries";
import { REGIONS_BR } from "../geo/regions_BR";
import { searchCitiesBR } from "../geo/search";
import { resolveByCountry, resolveByCityBR } from "../geo/resolver";
import { nowFormatted } from "../tz";

type Props = {
  title?: string;
  showDeviceLocationHint?: boolean;
};

export function GlobalProfilePicker({
  title = "Localização, fuso e unidades",
  showDeviceLocationHint = true,
}: Props) {
  const { profile, setProfile } = useGlobalProfileStore();

  const [countryCode, setCountryCode] = useState<string>(
    profile.countryCode || "BR"
  );

  const [regionCode, setRegionCode] = useState<string>(
    profile.regionCode || ""
  );

  const [cityQuery, setCityQuery] = useState<string>(profile.city || "");
  const [citySelected, setCitySelected] = useState<string>(profile.city || "");
  const [openList, setOpenList] = useState(false);

  const isBR = countryCode.toUpperCase() === "BR";

  // Defaults baseados no país
  const countryDefaults = useMemo(
    () => resolveByCountry(countryCode),
    [countryCode]
  );

  // Timezone resolvido pela cidade/estado
  const tzFromCity = useMemo(() => {
    return isBR
      ? resolveByCityBR(citySelected, regionCode).timeZone
      : countryDefaults.timeZone;
  }, [isBR, citySelected, regionCode, countryDefaults.timeZone]);

  // Pré-visualização
  const previewProfile = useMemo(() => {
    const c = getCountry(countryCode);
    return {
      locale: countryDefaults.locale,
      units: countryDefaults.units,
      timeZone: tzFromCity,
      countryName: c?.name || countryCode,
    };
  }, [
    countryCode,
    countryDefaults.locale,
    countryDefaults.units,
    tzFromCity,
  ]);

  // Lista de cidades
  const cityOptions = useMemo(() => {
    if (!isBR) return [];
    if (cityQuery.trim().length < 2) return [];
    return searchCitiesBR(cityQuery.trim(), regionCode, 15);
  }, [isBR, cityQuery, regionCode]);

  // ==== Atualiza país ====
  useEffect(() => {
    const next = resolveByCountry(countryCode);
    setProfile({
      countryCode,
      locale: next.locale,
      units: next.units,
      timeZone: next.timeZone,
      updatedAt: Date.now(),
    });

    // Zera estado/cidade se não for BR
    if (countryCode !== "BR") {
      setRegionCode("");
      setCityQuery("");
      setCitySelected("");
      setOpenList(false);
    }
  }, [countryCode]);

  // ==== Atualiza timezone quando muda a cidade ====
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

  // ============================================================================
  // 🔥 AUTOLOCALIZAÇÃO — Reverse Geocoding via Nominatim (OpenStreetMap)
  // ============================================================================
  async function onUseDeviceSuggestion() {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        try {
          const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;

          const res = await fetch(url, {
            headers: { "User-Agent": "drmindsetfit-app" },
          });

          const data = await res.json();
          const addr = data.address || {};

          const country = (addr.country_code || "").toUpperCase();
          const stateName = addr.state || "";
          const cityName =
            addr.city || addr.town || addr.village || addr.suburb || "";

          // BR: mapear nome do estado -> UF
          let uf = "";
          if (country === "BR") {
            const match = REGIONS_BR.find((r) =>
              stateName?.toLowerCase().includes(r.name.toLowerCase())
            );
            uf = match?.code || "";
          }

          // Atualiza selects
          setCountryCode(country);
          setRegionCode(uf);
          setCityQuery(cityName);
          setCitySelected(cityName);

          // Atualiza store
          setProfile({
            countryCode: country,
            regionCode: uf,
            city: cityName,
            timeZone: resolveByCityBR(cityName, uf).timeZone,
            updatedAt: Date.now(),
          });
        } catch (err) {
          console.error("Erro ao detectar localização:", err);
        }
      },

      () => {
        console.warn("Geolocalização negada pelo usuário");
      },

      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  // ============================================================================
  // UI
  // ============================================================================

  return (
    <div className="w-full space-y-4">
      <div className="space-y-1">
        <div className="text-base font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">
          Personalize idioma, unidades e horário local.
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {/* ============================= País ============================= */}
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

        {/* ============================= Estado ============================= */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Estado</label>
          <select
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
            value={regionCode}
            onChange={(e) => setRegionCode(e.target.value)}
            disabled={!isBR}
          >
            <option value="">{isBR ? "Selecione" : "-"}</option>
            {isBR &&
              REGIONS_BR.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name} ({r.code})
                </option>
              ))}
          </select>
        </div>

        {/* ============================= Cidade ============================= */}
        <div className="space-y-1 relative">
          <label className="text-sm font-medium">Cidade</label>

          <input
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
            value={cityQuery}
            placeholder={
              isBR ? "Digite para buscar…" : "Disponível apenas no Brasil"
            }
            onChange={(e) => {
              setCityQuery(e.target.value);
              setOpenList(true);
            }}
            onFocus={() => setOpenList(true)}
            disabled={!isBR}
          />

          {/* Lista de sugestões */}
          {isBR && openList && cityOptions.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-xl border bg-background shadow-lg max-h-64 overflow-auto">
              {cityOptions.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  className="flex w-full justify-between px-3 py-2 text-sm hover:bg-muted"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onPickCity(c.name)}
                >
                  <span>{c.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {c.regionCode}
                  </span>
                </button>
              ))}
            </div>
          )}

          {isBR && cityQuery.length > 0 && cityOptions.length === 0 && (
            <div className="text-xs text-muted-foreground mt-1">
              Nenhuma cidade encontrada.
            </div>
          )}
        </div>
      </div>

      {/* ============================= Preview ============================= */}
      <div className="rounded-2xl border p-4 bg-card">
        <div className="text-sm font-semibold">Pré-visualização</div>

        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <div className="text-sm">
            <strong>Idioma:</strong> {previewProfile.locale}
          </div>
          <div className="text-sm">
            <strong>Unidades:</strong>{" "}
            {previewProfile.units === "metric" ? "Métrico" : "Imperial"}
          </div>
          <div className="text-sm">
            <strong>Timezone:</strong> {previewProfile.timeZone}
          </div>
          <div className="text-sm">
            <strong>Hora local:</strong>{" "}
            {nowFormatted({
              locale: previewProfile.locale,
              timeZone: previewProfile.timeZone,
            })}
          </div>
        </div>

        {showDeviceLocationHint && (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              className="rounded-xl border px-3 py-2 text-sm hover:bg-muted"
              onClick={onUseDeviceSuggestion}
            >
              Usar localização do dispositivo
            </button>

            <span className="text-xs text-muted-foreground">
              Nada de coordenadas fica salvo.
            </span>
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        Privacidade: salvamos apenas país, estado, cidade, timezone e unidades.
      </div>
    </div>
  );
}