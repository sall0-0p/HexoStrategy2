export namespace TextUtils {
    /**
     * Pluralizes any word by adding “s” (or a custom plural form).
     * e.g. pluralize(1, "Division")  → "1 Division"
     *      pluralize(2, "Division")  → "2 Divisions"
     *      pluralize(5, "Person", "People") → "5 People"
     */
    export function pluralize(
        count: number,
        singular: string,
        pluralForm?: string,
    ): string {
        const word = count === 1
            ? singular
            : (pluralForm ?? `${singular}s`);
        return `${count} ${word}`;
    }
}