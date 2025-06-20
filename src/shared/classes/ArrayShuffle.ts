export namespace ArrayShuffle {
    export function shuffle(array: unknown[]): unknown[] {
        for (let i = array.size() - 1; i > 0; i--) {
            const j = math.random(0, 100) * 0.01;
            const tmp = array[i];
            array[i] = array[j];
            array[j] = tmp;
        }

        return array;
    }
}