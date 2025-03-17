// lib/utils/search-params.ts

/**
 * Utility-Funktionen für den sicheren Umgang mit URL-Suchparametern
 * Diese Funktionen helfen dabei, URL-Parameter sicher zu extrahieren, ohne direkt
 * auf die Eigenschaften von searchParams zuzugreifen, was zu App Router Fehlern führen kann
 */

/**
 * Extrahiert einen String-Parameter aus searchParams ohne direkten Property-Zugriff
 *
 * @param searchParams Die searchParams aus der Page-Komponente
 * @param paramName Der Name des Parameters, den wir extrahieren wollen
 * @param defaultValue Ein Standardwert, falls der Parameter nicht existiert
 * @returns Den Parameterwert oder den Standardwert
 */
export function getStringParam(
    searchParams: Record<string, string | string[] | undefined>,
    paramName: string,
    defaultValue: string = ""
): string {
    if (!searchParams) return defaultValue;

    // Sicherer Zugriff ohne direkte Property-Referenzierung
    const param = Object.hasOwnProperty.call(searchParams, paramName)
        ? searchParams[paramName]
        : undefined;

    if (typeof param === 'string') {
        return param;
    } else if (Array.isArray(param) && param.length > 0 && typeof param[0] === 'string') {
        return param[0];
    }

    return defaultValue;
}

/**
 * Extrahiert einen Number-Parameter aus searchParams
 *
 * @param searchParams Die searchParams aus der Page-Komponente
 * @param paramName Der Name des Parameters, den wir extrahieren wollen
 * @param defaultValue Ein Standardwert, falls der Parameter nicht existiert oder keine Zahl ist
 * @returns Den Parameterwert als Zahl oder den Standardwert
 */
export function getNumberParam(
    searchParams: Record<string, string | string[] | undefined>,
    paramName: string,
    defaultValue: number
): number {
    const strValue = getStringParam(searchParams, paramName, String(defaultValue));
    const numValue = Number(strValue);

    return isNaN(numValue) ? defaultValue : numValue;
}

/**
 * Extrahiert einen Boolean-Parameter aus searchParams
 *
 * @param searchParams Die searchParams aus der Page-Komponente
 * @param paramName Der Name des Parameters, den wir extrahieren wollen
 * @param defaultValue Ein Standardwert, falls der Parameter nicht existiert
 * @returns Den Parameterwert als Boolean oder den Standardwert
 */
export function getBooleanParam(
    searchParams: Record<string, string | string[] | undefined>,
    paramName: string,
    defaultValue: boolean = false
): boolean {
    const strValue = getStringParam(searchParams, paramName, String(defaultValue));
    return strValue === 'true' || strValue === '1';
}

/**
 * Extrahiert alle Parameter aus searchParams sicher
 *
 * @param searchParams Die searchParams aus der Page-Komponente
 * @returns Ein Objekt mit allen Parametern, sicher extrahiert
 */
export function extractAllParams(
    searchParams: Record<string, string | string[] | undefined>
): Record<string, string> {
    if (!searchParams) return {};

    const result: Record<string, string> = {};

    // Sicherer Zugriff auf Eigenschaften ohne Object.entries
    for (const key in searchParams) {
        if (Object.prototype.hasOwnProperty.call(searchParams, key)) {
            result[key] = getStringParam(searchParams, key);
        }
    }

    return result;
}