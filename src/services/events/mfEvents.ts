/**
 * MF Events Bus (SSOT)
 * - Tipado
 * - Sem depender de libs
 * - Sem usar `Function` (lint)
 * - Handlers isolados por evento
 */

export type MFEventMap = {
  nutrition_plan_set: {
    kcal: number;
    hasAudit: boolean;
    ts: string; // ISO
  };
  workout_added: {
    ts: string; // ISO
  };
};

type Handler<K extends keyof MFEventMap> = (payload: MFEventMap[K]) => void;
type AnyHandler = (payload: unknown) => void;

class MFEventsBus {
  private handlers = new Map<keyof MFEventMap, Set<AnyHandler>>();

  on<K extends keyof MFEventMap>(event: K, cb: Handler<K>): () => void {
    const set = this.handlers.get(event) ?? new Set<AnyHandler>();
    set.add(cb as unknown as AnyHandler);
    this.handlers.set(event, set);

    return () => {
      try {
        const curr = this.handlers.get(event);
        if (!curr) return;
        curr.delete(cb as unknown as AnyHandler);
        if (curr.size === 0) this.handlers.delete(event);
      } catch {}
    };
  }

  emit<K extends keyof MFEventMap>(event: K, payload: MFEventMap[K]): void {
    const set = this.handlers.get(event);
    if (!set || set.size === 0) return;

    // Copia para evitar efeitos colaterais se handler remover/registrar outros handlers.
    for (const fn of Array.from(set)) {
      try {
        (fn as unknown as Handler<K>)(payload);
      } catch {}
    }
  }

  clear(event?: keyof MFEventMap): void {
    try {
      if (event) this.handlers.delete(event);
      else this.handlers.clear();
    } catch {}
  }
}

// singleton SSOT
export const mfEvents = new MFEventsBus();
