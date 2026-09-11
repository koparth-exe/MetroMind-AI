/** Canonical transport-mode values shared by frontend application state. */
export const TRANSPORT_MODES = ['RAILWAY', 'BUS'] as const;

export type TransportMode = (typeof TRANSPORT_MODES)[number];

/**
 * Converts storage and UI-boundary input to the canonical API representation.
 * Only canonical names are accepted; aliases such as "train" are rejected.
 */
export function normalizeTransportMode(value: string | null): TransportMode | null {
  const normalized = value?.trim().toUpperCase();
  return normalized === 'RAILWAY' || normalized === 'BUS' ? normalized : null;
}
