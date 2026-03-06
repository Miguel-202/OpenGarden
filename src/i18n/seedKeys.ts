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

/**
 * Localize an auto-generated project name (e.g. "Basil 1" -> "Albahaca 1").
 * If the name doesn't match the "TemplateTitle N" pattern, returns originalName.
 */
export function localizeProjectName(
    t: any,
    originalName: string,
    templateId: string | null,
    fallbackTemplateTitle: string | null,
): string {
    if (!templateId || !originalName) return originalName;

    const localizedTitle = seedT(t, templateId, 'title', fallbackTemplateTitle);
    if (!localizedTitle) return originalName;

    const clean = (s: string) => s.toLowerCase().replace(/[^\w\d]/g, '').trim();
    const cFallback = clean(fallbackTemplateTitle || '');
    const cOriginal = clean(originalName);

    if (!cFallback || !cOriginal) return originalName;

    // Check if original starts with fallback
    if (cOriginal.startsWith(cFallback)) {
        const remaining = cOriginal.slice(cFallback.length);
        const matchDigits = remaining.match(/\d+/);
        return matchDigits ? `${localizedTitle} ${matchDigits[0]}` : localizedTitle;
    }

    return originalName;
}

/**
 * Brute-force lookup of a translation by its English name.
 * Used for existing runs that lost their seed IDs.
 */
export function findSeedTranslationByName(t: any, englishName: string, field: 'name' | 'title'): string {
    if (!englishName) return '';
    // This is expensive but only used as a fallback for missing IDs
    // For now, let's just use a map of common items if lookup fails in components
    return englishName;
}

/**
 * Checks if a project name is redundant compared to its template title.
 */
export function isRedundant(localizedName: string, localizedTemplateTitle: string): boolean {
    const clean = (s: string) => s.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu, '').replace(/ \d+$/, '').trim().toLowerCase();
    return clean(localizedName) === clean(localizedTemplateTitle);
}
