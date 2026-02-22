import { useEffect, useMemo, useState } from "react";
import { useGlobalProfileStore } from "../store";
import { COUNTRIES, getCountry } from "../geo/countries";
import { REGIONS_BR } from "../geo/regions_BR";
import { REGIONS_US } from "../geo/regions_US";
import { resolveByCountry, resolveByCityBR } from "../geo/resolver";
import { nowFormatted } from "../tz";
import { searchCitiesByCountry } from "../geo/search";

type Props = {
  title?: string;
  showDeviceLocationHint?: boolean; // botão existe, mas só preenche sugestão simples
};

export function GlobalProfilePicker({
  title = "Localização e preferências",
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
  const [cityOptions, setCityOptions] = useState<
    { name: string; regionCode?: string; timeZone?: string }[]
  >([]);

  const isBR = (countryCode || "").toUpperCase() === "BR";
  const isUS = (countryCode || "").toUpperCase() === "US";

  const countryDefaults = useMemo(
    () => resolveByCountry(countryCode),
    [countryCode]
  );

  const tzFromCity = useMemo(
    () =>
      isBR
        ? resolveByCityBR(citySelected, regionCode).timeZone
        : countryDefaults.timeZone,
    [isBR, citySelected, regionCode, countryDefaults.timeZone]
  );

  const previewProfile = useMemo(() => {
    const c = getCountry(countryCode);
    return {
      locale: countryDefaults.locale,
      units: countryDefaults.units,
      timeZone: tzFromCity,
      countryName: c?.name || countryCode,
    };
  }, [countryCode, countryDefaults.locale, countryDefaults.units, tzFromCity]);

  // Busca de cidades para BR/US (único search)
  useEffect(() => {
    const q = cityQuery.trim();
    if (!q || q.length < 2) {
      setCityOptions([]);
      return;
    }

    if (!isBR && !isUS) {
      setCityOptions([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const results = await searchCitiesByCountry(
          countryCode,
          q,
          regionCode,
          10
        );
        if (!cancelled) {
          setCityOptions(
            results.map((c: any) => ({
              name: c.name,
              regionCode: c.regionCode,
              timeZone: (c as any).timeZone,
            }))
          );
        }
      } catch (e) {
        console.warn("[GlobalProfilePicker] erro ao buscar cidades:", e);
        if (!cancelled) setCityOptions([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cityQuery, regionCode, countryCode, isBR, isUS]);

  // Quando troca o país, mantém defaults coerentes
  useEffect(() => {
    const next = resolveByCountry(countryCode);
    setProfile({
      countryCode,
      locale: next.locale,
      units: next.units,
      timeZone: next.timeZone,
      updatedAt: Date.now(),
    });

    // Reset de UF/cidade se sair de BR/US
    setRegionCode((prev) =>
      countryCode.toUpperCase() === "BR" || countryCode.toUpperCase() === "US"
        ? prev
        : ""
    );
    if (countryCode.toUpperCase() !== "BR" && countryCode.toUpperCase() !== "US") {
      setCityQuery("");
      setCitySelected("");
      setOpenList(false);
    }
  }, [countryCode, setProfile]);

  // Quando selecionar cidade/UF (BR), atualiza timezone específica
  useEffect(() => {
    if (!isBR) return;
    if (!citySelected && !regionCode) return;

    const tz = resolveByCityBR(citySelected, regionCode).timeZone;
    if (tz) {
      setProfile({
        regionCode: regionCode || undefined,
        city: citySelected || undefined,
        timeZone: tz,
        updatedAt: Date.now(),
      });
    }
  }, [citySelected, regionCode, isBR, setProfile]);

  function onPickCity(name: string) {
    setCitySelected(name);
    setCityQuery(name);
    setOpenList(false);
  }

  async function onUseDeviceSuggestion() {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;

          const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`;
          const resp = await fetch(url);
          if (!resp.ok) {
            console.warn("[GlobalProfilePicker] reverse geocode falhou");
            return;
          }
          const data: any = await resp.json();

          const cc = String(data.countryCode || "BR").toUpperCase();

          let region = "";
          const psCode = data.principalSubdivisionCode as string | undefined;
          if (psCode && psCode.includes("-")) {
            // ex: BR-RJ, US-CA
            region = psCode.split("-").pop() || "";
          }

          // Fallback por nome de estado, separado por país
          if (!region && data.principalSubdivision) {
            const nameLower = String(data.principalSubdivision).toLowerCase();
            if (cc === "BR") {
              const matchRegion = REGIONS_BR.find(
                (r) => r.name.toLowerCase() === nameLower
              );
              if (matchRegion) region = matchRegion.code;
            } else if (cc === "US") {
              const matchRegion = REGIONS_US.find(
                (r) => r.name.toLowerCase() === nameLower
              );
              if (matchRegion) region = matchRegion.code;
            }
          }

          const cityFromApi =
            data.city ||
            data.locality ||
            data.localityInfo?.locality?.[0]?.name ||
            "";

          const cityName = String(cityFromApi || "").trim();

          setCountryCode(cc);
          setRegionCode(region);
          setCitySelected(cityName);
          setCityQuery(cityName);
          setOpenList(false);

          const nextCountry = resolveByCountry(cc);

          let timeZone = nextCountry.timeZone;

          if (cc === "BR" && cityName && region) {
            const resCity = resolveByCityBR(cityName, region);
            if (resCity.timeZone) timeZone = resCity.timeZone;
          }

          setProfile({
            countryCode: cc,
            regionCode: region || undefined,
            city: cityName || undefined,
            locale: nextCountry.locale,
            units: nextCountry.units,
            timeZone,
            updatedAt: Date.now(),
          });
        } catch (e) {
          console.error(
            "[GlobalProfilePicker] erro ao usar localização do dispositivo:",
            e
          );
        }
      },
      (err) => {
        console.warn(
          "[GlobalProfilePicker] geolocalização negada/falhou:",
          err
        );
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

        {/* Estado/Região */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Estado/Região</label>
          <select
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm disabled:opacity-60"
            value={regionCode}
            onChange={(e) => setRegionCode(e.target.value)}
            disabled={!isBR && !isUS}
          >
            <option value="">
              {isBR || isUS ? "Selecione" : "Disponível em breve"}
            </option>
            {isBR &&
              REGIONS_BR.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.name} ({r.code})
                </option>
              ))}
            {isUS &&
              REGIONS_US.map((r) => (
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
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm disabled:opacity-60"
            value={cityQuery}
            onChange={(e) => {
              setCityQuery(e.target.value);
              setOpenList(true);
            }}
            onFocus={() => setOpenList(true)}
            placeholder={
              isBR
                ? "Digite para buscar (ex: São Paulo)"
                : isUS
                ? "Digite para buscar (ex: New York)"
                : "Disponível em breve"
            }
            disabled={!isBR && !isUS}
          />

          {(isBR || isUS) && openList && cityOptions.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-xl border bg-background shadow-lg max-h-64 overflow-auto">
              {cityOptions.map((c) => (
                <button
                  type="button"
                  key={`${c.name}-${c.regionCode || "XX"}`}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onPickCity(c.name)}
                >
                  <span className="font-medium">{c.name}</span>
                  {c.regionCode && (
                    <span className="text-xs text-muted-foreground">
                      {c.regionCode}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {(isBR || isUS) &&
            cityQuery.trim().length > 0 &&
            cityOptions.length === 0 && (
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
              {previewProfile.units === "metric"
                ? "Métrico (km)"
                : "Imperial (mi)"}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Timezone (IANA): </span>
            <span className="font-medium">{previewProfile.timeZone}</span>
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
              Usar localização do dispositivo (sugestão)
            </button>
            <div className="text-xs text-muted-foreground">
              A localização é usada só para preencher país/estado/cidade e fuso.
              Nenhuma coordenada é enviada para o servidor do app.
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        Privacidade: salvamos apenas país/estado/cidade/timezone/locale/unidades.
      </div>
    </div>
  );
}