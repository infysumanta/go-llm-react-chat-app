import type { Model } from "@/types";

export interface ModelGroup {
  provider: string;
  models: Model[];
}

export function groupModelsByProvider(models: Model[]): ModelGroup[] {
  const groups = new Map<string, Model[]>();

  for (const model of models) {
    const provider = model.provider || "Unknown";
    const existing = groups.get(provider);
    if (existing) {
      existing.push(model);
    } else {
      groups.set(provider, [model]);
    }
  }

  return Array.from(groups.entries()).map(([provider, models]) => ({
    provider,
    models,
  }));
}
