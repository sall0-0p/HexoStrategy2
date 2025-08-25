// roblox-ts — minimal rich text parser with nesting + modular tag registry

// ---- Public types -----------------------------------------------------------

/** Visual style snapshot you can extend with whatever you need. */
export interface Style {
    bold?: boolean;
    color?: Color3 | undefined;
    // add italic, font, underline, etc. as needed
}

/** Emitted tokens in document order. */
export type Token =
    | { kind: "text"; text: string; style: Style }
    | { kind: "inline"; name: string; attributes: Map<string, string>; style: Style }
    | { kind: "flag"; name: string; attributes: Map<string, string>; style: Style }
    | { kind: "break" };

/** Tag handler hooks. Implement any that you need. */
export interface TagHandler {
    /** Called on <tag ...>. Return a *style delta* to apply until the matching </tag>. */
    onOpen?: (attrs: Map<string, string>, style: Style) => Partial<Style> | undefined;

    /** Called on </tag>. Usually restore happens automatically by the style stack. */
    onClose?: (style: Style) => void;

    /** Called on <tag .../>. Can emit inline tokens (e.g., an icon). */
    onSelf?: (attrs: Map<string, string>, style: Style, emit: (t: Token) => void) => void;
}

/** Registry of supported tags. Keys are lowercase tag names. */
export type TagRegistry = Map<string, TagHandler>;

function trim(s: string): string {
    const [res] = string.gsub(s, "^[%s]*(.-)[%s]*$", "%1");
    return res;
}

function cloneStyle(s: Style): Style {
    return { bold: s.bold, color: s.color };
}

function cur(styleStack: Style[]): Style {
    return styleStack[styleStack.size() - 1];
}

function pushWith(styleStack: Style[], delta?: Partial<Style>) {
    const nextt = cloneStyle(cur(styleStack));
    if (delta) {
        for (const [k, v] of pairs(delta as object)) (nextt as any)[k as string] = v as never;
    }
    styleStack.push(nextt);
}

function emitText(s: string, style: Style, emit: (t: Token) => void) {
    const parts = string.split(s, " "); // pseudo, you'd do manual scan
    for (let i = 0; i < parts.size(); i++) {
        const word = parts[i];
        if (word !== "") emit({ kind: "text", text: word, style: cloneStyle(style) });
        if (i < parts.size() - 1) emit({ kind: "text", text: " ", style: cloneStyle(style) });
    }
}

function popUntil(openTags: string[], styleStack: Style[], registry: TagRegistry, tagName: string) {
    for (let k = openTags.size() - 1; k >= 0; k--) {
        const name = openTags[k];
        styleStack.pop();
        openTags.remove(k);
        const h = registry.get(name);
        if (h && h.onClose) h.onClose(cur(styleStack));
        if (name === tagName) return;
    }
}

function handleTag(openTags: string[], styleStack: Style[], registry: TagRegistry, rawInside: string, reg: TagRegistry, emitFn: (t: Token) => void) {
    if (rawInside.size() === 0) return;

    // Close tag?
    if (string.sub(rawInside, 1, 1) === "/") {
        const name = string.lower(trim(rawInside.sub(2)));
        popUntil(openTags, styleStack, registry, name);
        return;
    }

    // Self-closing?
    const selfClosing = string.sub(rawInside, -1) === "/";
    const inner = selfClosing ? trim(rawInside.sub(1, rawInside.size() - 1)) : rawInside;

    // Parse name + attrs
    const { name, attrs } = parseTagOpen(inner);
    const lname = string.lower(name);
    const handler = reg.get(lname);

    if (selfClosing) {
        if (handler && handler.onSelf) handler.onSelf(attrs, cur(styleStack), emitFn);
        // Unknown self tag = ignored
        return;
    }

    // Open tag
    if (handler && handler.onOpen) {
        const delta = handler.onOpen(attrs, cur(styleStack));
        pushWith(styleStack, delta);
        openTags.push(lname);
    } else if (handler) {
        // tag known but no onOpen: still keep stack to pair close
        pushWith(styleStack);
        openTags.push(lname);
    } else {
        // unknown tag: ignore but still push a stack frame so nested known tags work
        pushWith(styleStack);
        openTags.push(lname);
    }
}

function parseTagOpen(s: string): { name: string; attrs: Map<string, string> } {
    // Read tag name (letters, digits, _ -)
    let j = 1;
    while (j <= s.size()) {
        const ch = s.sub(j, j);
        if (!isNameChar(ch)) break;
        j++;
    }
    const name = s.sub(1, j - 1);
    const attrs = parseAttrs(trim(s.sub(j)));
    return { name, attrs };
}

function isNameChar(ch: string) {
    const byte = string.byte(ch);
    return (
        (byte[0] >= 48 && byte[0] <= 57) ||
        (byte[0] >= 65 && byte[0] <= 90) ||
        (byte[0] >= 97 && byte[0] <= 122) ||
        ch === "_" ||
        ch === "-"
    );
}

function parseAttrs(s: string): Map<string, string> {
    const out = new Map<string, string>();
    let k = 1;
    while (k <= s.size()) {
        // skip whitespace
        while (k <= s.size() && isSpace(s.sub(k, k))) k++;
        if (k > s.size()) break;

        // read key
        const start = k;
        while (k <= s.size() && isNameChar(s.sub(k, k))) k++;
        const key = s.sub(start, k - 1);
        // skip whitespace
        while (k <= s.size() && isSpace(s.sub(k, k))) k++;

        // optional = value
        let value = "true";
        if (k <= s.size() && s.sub(k, k) === "=") {
            k++;
            while (k <= s.size() && isSpace(s.sub(k, k))) k++;

            if (k <= s.size() && (s.sub(k, k) === '"' || s.sub(k, k) === "'")) {
                const quote = s.sub(k, k);
                k++;
                const vstart = k;
                while (k <= s.size() && s.sub(k, k) !== quote) k++;
                value = s.sub(vstart, math.max(vstart, k) - 1);
                if (k <= s.size() && s.sub(k, k) === quote) k++;
            } else {
                const vstart = k;
                while (k <= s.size() && !isSpace(s.sub(k, k))) k++;
                value = s.sub(vstart, k - 1);
            }
        }
        out.set(string.lower(key), value);
    }
    return out;
}

function isSpace(ch: string) {
    return ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
}

/** Parse input and return a flat token stream in chronological order. */
export function parseRich(input: string, registry: TagRegistry, base: Style = {}): Token[] {
    const out: Token[] = [];
    const emit = (t: Token) => out.push(t);

    // Style stack: push a *snapshot* on open, pop on close
    const styleStack: Style[] = [cloneStyle(base)];

    // Tag stack (for matching close tags)
    const openTags = new Array<string>();

    let i = 0;
    const n = input.size();

    while (i < n) {
        const lt = string.find(input, "<", i + 1)[0]; // next '<'
        if (!lt) {
            // trailing text
            const text = input.sub(i + 1);
            if (text !== "") emitText(text, cur(styleStack), emit);
            break;
        }

        // text before the tag
        if (lt > i + 1) {
            const text = input.sub(i + 1, lt - 1);
            if (text !== "") emitText(text, cur(styleStack), emit);
        }

        // find matching '>'
        const gt = string.find(input, ">", lt + 1)[0];
        if (!gt) {
            // malformed: treat '<' as literal
            const text = input.sub(lt, lt);
            if (text !== "") emitText(text, cur(styleStack), emit);
            i = lt; // continue past '<'
            continue;
        }

        const raw = input.sub(lt + 1, gt - 1); // inside < ... >
        handleTag(openTags, styleStack, registry, raw, registry, emit);
        i = gt; // continue after '>'
    }

    return out;

    // --- helpers -------------------------------------------------------------
}

// ---- Default handlers you can reuse -----------------------------------------

export function defaultRegistry(): TagRegistry {
    const reg = new Map<string, TagHandler>();

    // <b> ... </b>
    reg.set("b", {
        onOpen: () => ({ bold: true }),
    });

    // <bold> ... </bold> alias
    reg.set("bold", {
        onOpen: () => ({ bold: true }),
    });

    // <color value="#RRGGBB"> ... </color>
    // also supports <color="#RRGGBB"> or <color r=255 g=200 b=0>
    reg.set("color", {
        onOpen: (attrs) => {
            const hex = attrs.get("value") ?? attrs.get("color") ?? attrs.get("") ?? attrs.get("0");
            if (hex) return { color: parseColor(hex) };
            const r = tonumber(attrs.get("r") ?? "");
            const g = tonumber(attrs.get("g") ?? "");
            const b = tonumber(attrs.get("b") ?? "");
            if (r && g && b) return { color: new Color3(r / 255, g / 255, b / 255) };
        },
    });

    // <br/> → line break token
    reg.set("br", {
        onSelf: (_attrs, _style, emit) => emit({ kind: "break" }),
    });

    // <icon name="civ_factory"/> → inline token; you decide how to render it
    reg.set("icon", {
        onSelf: (attributes, style, emit) => {
            emit({
                kind: "inline",
                name: "icon",
                attributes,
                style: { ...style },
            });
        },
    });

    reg.set("flag", {
        onSelf: (attributes, style, emit) => {
            emit({
                kind: "flag",
                name: "flag",
                attributes,
                style: { ...style }
            })
        }
    })

    return reg;
}

// ---- Utilities ---------------------------------------------------------------

/** Accepts "#RGB", "#RRGGBB", or "rgb(r,g,b)". Returns undefined if invalid. */
export function parseColor(s: string): Color3 | undefined {
    const str = string.lower(trim(s));
    if (string.sub(str, 1, 1) === "#") {
        const hex = string.sub(str, 2);
        if (hex.size() === 3) {
            const r = tonumber("0x" + hex.sub(1, 1));
            const g = tonumber("0x" + hex.sub(2, 2));
            const b = tonumber("0x" + hex.sub(3, 3));
            if (r && g && b) {
                return new Color3((r * 17) / 255, (g * 17) / 255, (b * 17) / 255);
            }
        }
        if (hex.size() === 6) {
            const r = tonumber("0x" + hex.sub(1, 2));
            const g = tonumber("0x" + hex.sub(3, 4));
            const b = tonumber("0x" + hex.sub(5, 6));
            if (r && g && b) {
                return new Color3(r / 255, g / 255, b / 255);
            }
        }
    }

    const m = string.match(str, "^rgb%((%d+),%s*(%d+),%s*(%d+)%)$");
    if (m) {
        const r = tonumber(m[0]);
        const g = tonumber(m[1]);
        const b = tonumber(m[2]);

        if (r && g && b) {
            return new Color3(math.clamp(r, 0, 255) / 255, math.clamp(g, 0, 255) / 255, math.clamp(b, 0, 255) / 255);
        }
    }
    return undefined;
}
