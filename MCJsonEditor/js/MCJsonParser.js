class ParseError extends Error {
    constructor(message, path) {
        super(message);
        this.name = "ParseError";
        this.path = path;
        console.log(path);
    }
}



class ParseResult {
    constructor() {
        this.data = null;
        this.errors = [];
        this.blocks = [];
    }

    addError(error, path) {
        this.errors.push({error, path});
    }

    addBlock(name, start, end) {
        this.blocks.push({name, start, end});
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

    parse(path = "root") {
        this.skipWhitespace();
        try {
            if (this.text[this.cursor] === '{') {
                this.result.setData(this.parseObject(path));
            } else {
                this.result.addError("Invalid JSON: must start with '{'", path);
            }
        } catch (e) {
            this.result.addError(e.message, e.path);
            console.log(e.stack);
        }
        return this.result;
    }

    parseObject(path) {
        this.skipWhitespace();
        const obj = {};
        this.cursor++; // Skip '{'
        while (this.text[this.cursor] !== '}') {
            this.skipWhitespace();
            const key = this.parseKey(path);
            const newPath = `${path}.${key}`;
            this.skipWhitespace();
            if (this.text[this.cursor] !== ':') {
                throw new ParseError("Invalid JSON: Expected ':' after key", newPath);
            }
            this.cursor++; // Skip ':'
            this.skipWhitespace();
            const value = this.parseValue(newPath);
            obj[key] = value;
            this.skipWhitespace();
            if (this.text[this.cursor] === ',') {
                this.cursor++; // Skip ','
            } else if (this.text[this.cursor] !== '}') {
                throw new ParseError("Invalid JSON: Expected ',' or '}'", newPath);
            }
        }
        this.cursor++; // Skip '}'
        return obj;
    }

    parseArray(path) {
        this.skipWhitespace();
        const array = [];
        this.cursor++; // Skip '['

        let index = 0;

        while (this.text[this.cursor] !== ']') {
            this.skipWhitespace();
            const elementPath = `${path}[${index}]`;
            const value = this.parseValue(elementPath);
            array.push(value);

            this.skipWhitespace();
            if (this.text[this.cursor] === ',') {
                this.cursor++; // Skip ','
                index++;
            } else if (this.text[this.cursor] !== ']') {
                throw new ParseError("Invalid JSON: Expected ',' or ']'", elementPath);
            }
        }
        this.cursor++; // Skip ']'
        return array;
    }

    parseKey(path) {
        if (this.text[this.cursor] === '"' || this.text[this.cursor] === '\'') {
            return this.parseString(this.text[this.cursor]);
        } else {
            const match = /[^:,{}\[\]]+/.exec(this.text.substring(this.cursor));
            if (!match) {
                throw new ParseError("Invalid JSON: Invalid key format", `${path}.${this.text.substring(this.cursor, 10)}`);
            }
            const key = match[0].trim();
            this.cursor += match[0].length;
            return key;
        }
    }

    parseValue(path) {
        switch (this.text[this.cursor]) {
            case '{':
                return this.parseObject(path);
            case '[':
                return this.parseArray(path);
            case '"':
            case '\\"':
            case '\'':
                return this.parseString(this.text[this.cursor], path);
            default:
                return this.parsePrimitive(path);
        }
    }

    parseString(quoteType, path) {
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
            throw new ParseError("Invalid JSON: unclosed string", path);
        }
        const str = this.text.substring(this.cursor, endQuoteIndex + 1);
        this.cursor = endQuoteIndex + 1;
        return str;
    }

    parsePrimitive(path) {
        const match = /[^,}\]]+/.exec(this.text.substring(this.cursor));
        if (!match) {
            throw new ParseError("Invalid JSON: value not found", `${path}.${this.text.substring(this.cursor, 10)}`);
        }
        const value = match[0].trim();
        this.cursor += match[0].length;

        if(value.startsWith('I;')){
            const numberPart = value.substring(2);
            if (/^-?\d+$/.test(numberPart)) {
                return value;
            } else {
                throw new ParseError("Invalid JSON: incorrect UUID format", `${path}.${value}`);
            }
        }
        if (/^-?\d+(\.\d+)?[bflsd]?$/.test(value)) {
            return value;
        } else if (!isNaN(parseFloat(value)) && isFinite(value)) {
            return value;
        } else if (/^[^,}\]]+$/.test(value)) { 
            return value;
        } else {
            throw new ParseError("Invalid JSON: incorrect value format", path);
        }

        // return value;
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
            try {
                const parsed = JSON.parse(obj);
                return customStringify(parsed, indentLevel);
            } catch (e) {
                return obj;
            }

            return obj;
        }
    } else {
        return obj.toString();
    }
}
