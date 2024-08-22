class Editor {
    constructor() {
        this.history = [];
        this.currentHistoryIndex = -1;
        this.editor = ace.edit("editorBox");
        this.langTools = ace.require("ace/ext/language_tools");
        this.Json5Mode = ace.require("ace/mode/json5").Mode;
        this.init();
    }

    init() {
        this.editor.getSession().setMode(new this.Json5Mode());
        this.restoreState();

        window.onbeforeunload = () => this.saveState();
        setInterval(() => this.saveState(), 300000);

        this.editor.commands.addCommand({
            name: 'pasteSpecial',
            bindKey: { win: 'Ctrl-V', mac: 'Command-V' },
            exec: (editor) => {
                navigator.clipboard.readText().then(text => {
                    if (text.startsWith('/') && text.includes('{')) {
                        const modifiedText = text.substring(text.indexOf('{'));
                        editor.insert(modifiedText);
                    } else {
                        editor.insert(text);
                    }
                });
            }
        });

        this.editor.setOptions({
            enableBasicAutocompletion: true,
            enableLiveAutocompletion: true
        });

        const nbtCompleter = {
            getCompletions: (editor, session, pos, prefix, callback) => {
                if (prefix.length === 0) {
                    callback(null, []);
                    return;
                }

                const completions = wordList
                    .filter(item => item.word.startsWith(prefix))
                    .map(item => ({
                        name: item.word,
                        value: item.word,
                        meta: item.hierarchy
                    }));

                callback(null, completions);
            }
        };

        this.editor.completers.push(nbtCompleter);

        $('#formatBtn').click(() => this.format());
        $('#copyWithoutSpaceBtn').click(() => this.copyWithoutSpace());
        $('#jsonModeSelect').change(() => this.changeJsonMode());
        $('#themeToggle').change(() => this.toggleTheme());

        const currentTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(currentTheme);
        $('#themeToggle').prop('checked', currentTheme === 'dark');
    }

    format() {
        clearErrors();
        const value = this.editor.getSession().getValue();

        let jsonMode = $('#jsonModeSelect').val();
        if (jsonMode === 'standard') {
            try {
                const parsedJson = JSON.parse(value);
                const formattedJson = JSON.stringify(parsedJson, null, 4);
                this.editor.getSession().setValue(formattedJson);
            } catch (e) {
                displayErrors([{ error: e.message, path: e.stack }], value);
            }
        } else {
            const valueWithoutSpaces = value.replace(/("[^"]+"|'[^']+')|[\n\s]/g, (match, group) => group || '');

            const parser = new SpecialJsonParser(valueWithoutSpaces);
            const result = parser.parse();
            const formattedJson = customStringify(result.data, 1);

            if (formattedJson == null || formattedJson == undefined) {
                displayErrors(result.errors, value);
                return;
            }

            const lines = formattedJson.split('\n');
            lines[lines.length - 1] = lines[lines.length - 1].trim();
            const modifiedJson = lines.join('\n');

            this.editor.getSession().setValue(modifiedJson);
            displayErrors(result.errors, modifiedJson);
        }
    }

    copyWithoutSpace() {
        const value = this.editor.getSession().getValue();
        const textWithoutSpaces = value.replace(/("[^"]+"|'[^']+')|[\n\s]/g, (match, group) => group || '');

        const textArea = document.createElement("textarea");
        textArea.id = "copyArea";
        textArea.value = textWithoutSpaces;
        document.body.appendChild(textArea);
        textArea.select();
        textArea.focus();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }

    changeJsonMode() {
        // Implement logic for changing JSON mode
    }

    toggleTheme() {
        const newTheme = $('#themeToggle').is(':checked') ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    setTheme(theme) {
        const body = $('body');
        const navbar = $('.navbar');
        if (theme === 'dark') {
            body.removeClass('light-theme').addClass('dark-theme');
            navbar.addClass('navbar-custom navbar-light bg-light').removeClass('navbar-dark bg-dark');
            this.editor.setTheme('ace/theme/twilight');
        } else {
            body.removeClass('dark-theme').addClass('light-theme');
            navbar.addClass('navbar-custom').removeClass('navbar-light bg-light');
            this.editor.setTheme('ace/theme/chrome');
        }
        localStorage.setItem('theme', theme);
    }

    saveState() {
        const content = this.editor.getSession().getValue();
        localStorage.setItem('editorContent', content);
    }

    restoreState() {
        const content = localStorage.getItem('editorContent');
        if (content) {
            this.editor.getSession().setValue(content);
        }
    }

    onInput() {
        if (this.currentHistoryIndex !== this.history.length - 1) {
            this.history = this.history.slice(0, this.currentHistoryIndex + 1);
        }

        this.history.push(this.editor.getValue());
        this.currentHistoryIndex++;
    }
}

$(document).ready(function () {
    const editor = new Editor();
    $('#editorBox').on('input', () => editor.onInput());
});


function displayErrors(errors, inputText) {
    const errorMessages = $('#errorMessages');
    errorMessages.empty();

    if (errors.length > 0) {
        errors.forEach(error => {
            errorMessages.append(`<div class="alert alert-danger">Error at ${error.path}: ${error.error}</div>`);
        });
    }
}

function clearErrors() {
    const errorMessages = $('#errorMessages');
    errorMessages.empty();
}

function getErrorLine(index, text) {
    const upToError = text.substring(0, index);
    return upToError.split('\n').length;
}

