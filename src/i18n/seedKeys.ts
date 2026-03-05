import { TFunction } from 'i18next';

/**
 * Look up a translated string for a built-in seed entity (template, tool, consumable, task).
 * If a translation key exists for the given ID + field, return it.
 * Otherwise fall back to the DB value (works for user-created content).
 *
 * Usage: seedT(t, 'template_basil_windowsill', 'title', dbTitle)
 */
export function seedT(
    t: TFunction,
    id: string,
    field: 'title' | 'name' | 'description' | 'environment',
    fallback: string | null | undefined,
): string {
    const key = `seeds.${id}.${field}`;
    const translated = t(key, { defaultValue: '' });
    // If translation is empty or equals the key itself, use fallback
    if (!translated || translated === key) return fallback ?? '';
    return translated;
}
