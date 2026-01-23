import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ptBR from "@/locales/pt-BR.json";
import enUS from "@/locales/en-US.json";
import { flags } from "@/features/flags/flags";
import { useGlobalProfileStore } from "@/features/global-profile/store";

function detectLanguage(): string {
  // prioridade: profile.locale -> navigator.language -> pt-BR
  try {
    const p = useGlobalProfileStore.getState().profile;
    if (p?.locale) return p.locale;
  } catch {
    // ignore
  }
  if (typeof navigator !== "undefined" && navigator.language) return navigator.language;
  return "pt-BR";
}

export function initI18n() {
  if (i18n.isInitialized) return i18n;

  const initialLng = detectLanguage();

  i18n
    .use(initReactI18next)
    .init({
      resources: {
        "pt-BR": { translation: ptBR as any },
        "en-US": { translation: enUS as any }
      },
      lng: flags.I18N_ENABLED ? initialLng : "pt-BR",
      fallbackLng: "pt-BR",
      interpolation: { escapeValue: false }
    });

  // atualiza idioma quando profile.locale mudar (sem listeners globais pesados)
  try {
    const store = useGlobalProfileStore;
    let last = store.getState().profile.locale;
    store.subscribe((s) => {
      const next = s.profile.locale;
      if (!flags.I18N_ENABLED) return;
      if (next && next !== last) {
        last = next;
        void i18n.changeLanguage(next);
      }
    });
  } catch {
    // ignore
  }

  return i18n;
}
