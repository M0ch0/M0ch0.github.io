class ParseResult {
    constructor() {
        this.data = null;
        this.errors = [];
        this.blocks = [];
    }

    addError(error, index) {
        this.errors.push({ error, index });
    }

    addBlock(start, end) {
        this.blocks.push({ start, end });
    }

    setData(data) {
        this.data = data;
    }
}

class SpecialJsonParser {
    constructor(text) {
        this.text = text.replace(/\s+/g, '');
        this.cursor = 0;
        this.result = new ParseResult();
    }

    parse() {
        try {
            if (this.text[this.cursor] === '{') {
                this.result.setData(this.parseObject());
            } else {
                this.result.addError("Invalid JSON: must start with '{'", this.cursor);
            }
        } catch (e) {
            this.result.addError(e.message, this.cursor);
        }
        return this.result;
    }

    parseObject() {
        const obj = {};
        const start = this.cursor;
        this.cursor++;
        while (this.text[this.cursor] !== '}') {
            const key = this.parseKey();
            const value = this.parseValue();
            obj[key] = value;
            if (this.text[this.cursor] === ',') {
                this.cursor++;
            }
        }
        const end = this.cursor;
        this.cursor++;
        this.result.addBlock(start, end);
        return obj;
    }

    parseArray() {
        const array = [];
        const start = this.cursor;
        this.cursor++;
        while (this.text[this.cursor] !== ']') {
            const value = this.parseValue();
            array.push(value);
            if (this.text[this.cursor] === ',') {
                this.cursor++;
            }
        }
        const end = this.cursor;
        this.cursor++;
        this.result.addBlock(start, end);
        return array;
    }

    parseKey() {
        const match = /[^:]+:/.exec(this.text.substring(this.cursor));
        if (!match) {
            throw new Error("Invalid JSON: key not found");
        }
        const key = match[0].slice(0, -1).trim();
        this.cursor += match[0].length;
        return key;
    }

    parseValue() {
        if (this.text[this.cursor] === '{') {
            return this.parseObject();
        } else if (this.text[this.cursor] === '[') {
            return this.parseArray();
        } else {
            let value;
            if (this.text[this.cursor] === '"') {

                let endQuoteIndex = this.cursor + 1;
                while (endQuoteIndex < this.text.length) {
                    if (this.text[endQuoteIndex] === '"' && this.text[endQuoteIndex - 1] !== '\\') {
                        break;
                    }
                    endQuoteIndex++;
                }
                if (endQuoteIndex >= this.text.length) {
                    throw new Error("Invalid JSON: unclosed string");
                }
                value = this.text.substring(this.cursor, endQuoteIndex + 1);
                this.cursor = endQuoteIndex + 1;
            } else {

                const match = /[^,}\]]+/.exec(this.text.substring(this.cursor));
                if (!match) {
                    throw new Error("Invalid JSON: value not found");
                }
                value = match[0].trim();
                this.cursor += match[0].length;

                // UUIDの特殊形式の処理
                if (value.startsWith("I;") && !value.startsWith("\"I;")) {
                    value = value.replace("I;", "I; ");
                }

            }
            return value;
        }
    }


}


function customStringify(obj, indentLevel = 0) {
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
