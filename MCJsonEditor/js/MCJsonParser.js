class ParseResult {
    constructor() {
        this.data = null;
        this.errors = [];
        this.blocks = [];
    }

    addError(error, index) {
        this.errors.push({error, index});
    }

    addBlock(start, end) {
        this.blocks.push({start, end});
    }

    setData(data) {
        this.data = data;
    }
}

class SpecialJsonParser {
    constructor(text) {
        this.text = text;
        this.cursor = 0;
        this.result = new ParseResult();
        this.keyPathStack = [];
    }

    parse() {
        this.skipWhitespace();
        try {
            if (this.text[this.cursor] === '{') {
                this.result.setData(this.parseObject());
            } else {
                this.result.addError("Invalid JSON: must start with '{'", this.cursor);
            }
        } catch (e) {
            this.result.addError(e.message, this.cursor);
        }
        if (this.cursor < this.text.length) {
            this.result.addError("Invalid JSON: unexpected end of input", this.cursor);
        }
        return this.result;
    }

    parseObject() {
        this.skipWhitespace();
        const obj = {};
        this.cursor++; // Skip '{'
        while (this.text[this.cursor] !== '}') {
            this.skipWhitespace();
            const key = this.parseKey();
            this.skipWhitespace();
            if (this.text[this.cursor] !== ':') {
                throw new Error("Invalid JSON: Expected ':' after key");
            }
            this.cursor++; // Skip ':'
            this.skipWhitespace();
            const value = this.parseValue();
            obj[key] = value;
            this.skipWhitespace();
            if (this.text[this.cursor] === ',') {
                this.cursor++; // Skip ','
            } else if (this.text[this.cursor] !== '}') {
                throw new Error("Invalid JSON: Expected ',' or '}'");
            }
        }
        this.cursor++; // Skip '}'
        return obj;
    }

    parseArray() {
        this.skipWhitespace();
        const array = [];
        this.cursor++; // Skip '['
        while (this.text[this.cursor] !== ']') {
            this.skipWhitespace();
            const value = this.parseValue();
            array.push(value);
            this.skipWhitespace();
            if (this.text[this.cursor] === ',') {
                this.cursor++; // Skip ','
            } else if (this.text[this.cursor] !== ']') {
                throw new Error("Invalid JSON: Expected ',' or ']'");
            }
        }
        this.cursor++; // Skip ']'
        return array;
    }

    parseKey() {
        if (this.text[this.cursor] === '"' || this.text[this.cursor] === '\'') {
            return this.parseString(this.text[this.cursor]);
        } else {
            const match = /[^:,{}\[\]]+/.exec(this.text.substring(this.cursor));
            if (!match) {
                throw new Error("Invalid JSON: Invalid key format");
            }
            const key = match[0].trim();
            this.cursor += match[0].length;
            return key;
        }
    }

    parseValue() {
        switch (this.text[this.cursor]) {
            case '{':
                return this.parseObject();
            case '[':
                return this.parseArray();
            case '"':
            case '\'':
                return this.parseString(this.text[this.cursor]);
            default:
                return this.parsePrimitive();
        }
    }

    parseString(quoteType) {
        let endQuoteIndex = this.cursor + 1;
        let isEscaped = false;
        while (endQuoteIndex < this.text.length) {
            if (this.text[endQuoteIndex] === quoteType && !isEscaped) {
                break;
            }
            isEscaped = this.text[endQuoteIndex] === '\\' && !isEscaped;
            endQuoteIndex++;
        }
        if (endQuoteIndex >= this.text.length) {
            throw new Error("Invalid JSON: unclosed string");
        }
        const str = this.text.substring(this.cursor, endQuoteIndex + 1);
        this.cursor = endQuoteIndex + 1;
        return str;
    }

    parsePrimitive() {
        const match = /[^,}\]]+/.exec(this.text.substring(this.cursor));
        if (!match) {
            throw new Error("Invalid JSON: value not found");
        }
        const value = match[0].trim();
        this.cursor += match[0].length;
        return value; // Treat as string to preserve format
    }

    skipWhitespace() {
        while (/\s/.test(this.text[this.cursor])) {
            this.cursor++;
        }
    }
}

function customStringify(obj, indentLevel = 0) {
    if (obj === null || obj === undefined) {
        return null;
    }
    const indent = '  '.repeat(indentLevel);
    const childIndent = '  '.repeat(indentLevel + 1);

    if (Array.isArray(obj)) {
        const arrayItems = obj.map(item => `${childIndent}${customStringify(item, indentLevel + 1)}`).join(',\n');
        return `[\n${arrayItems}\n${indent}]`;
    } else if (typeof obj === 'object' && obj !== null) {
        const objectItems = Object.entries(obj)
            .map(([key, value]) => `${childIndent}${key}: ${customStringify(value, indentLevel + 1)}`)
            .join(',\n');
        return `{\n${objectItems}\n${indent}}`;
    } else if (typeof obj === 'string') {
        if (obj.startsWith('I;')) {
            return obj;
        }
        if (obj.match(/^-?[0-9]+(\.[0-9]+)?[bdfls]?$/)) {
            return obj;
        } else {
            return obj;
        }
    } else {
        return obj.toString();
    }
}
