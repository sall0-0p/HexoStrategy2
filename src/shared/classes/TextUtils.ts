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
        includeNumber = true,
    ): string {
        const word = count === 1
            ? singular
            : (pluralForm ?? `${singular}s`);
        return includeNumber ? `${count} ${word}` : word;
    }

    /**
     * Returns a string of `num` trimmed to at most `decimals` places after the dot.
     * Does NOT round—just cuts extra digits.
     */
    export function trimDecimals(num: number, decimals: number): string {
        const s = tostring(num);
        const parts = s.split(".");
        if (decimals <= 0 || parts.size() === 1) {
            return parts[0];
        }
        const intPart = parts[0];
        const decPart = parts[1].sub(0, decimals);
        return `${intPart}.${decPart}`;
    }
}