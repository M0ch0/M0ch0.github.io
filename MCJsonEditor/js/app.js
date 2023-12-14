let history = [];
let currentHistoryIndex = -1;

$('#editorBox').on('input', function () {
    if (currentHistoryIndex !== history.length - 1) {
        history = history.slice(0, currentHistoryIndex + 1);
    }

    history.push(this.value);
    currentHistoryIndex++;
});

$(document).ready(function () {
    const editor = ace.edit("editorBox")
    const Json5Mode = ace.require("ace/mode/json5").Mode;
    editor.getSession().setMode(new Json5Mode());

    $('#formatBtn').click(function () {
        const value = editor.getSession().getValue();
        console.log(value)
        const parser = new SpecialJsonParser(value);
        const result = parser.parse();
        const formattedJson = customStringify(result.data, 1);
        if(formattedJson == null || formattedJson == undefined){
            displayErrors(result.errors, value);
            return;
        }
        const lines = formattedJson.split('\n'); // 文字列を行に分割
        const lastLine = lines[lines.length - 1];
        const trimmedLastLine = lastLine.trim();
        lines[lines.length - 1] = trimmedLastLine;
        const modifiedJson = lines.join('\n');

        editor.getSession().setValue(modifiedJson)
        displayErrors(result.errors, modifiedJson);
    });

    $('#copyWithoutSpaceBtn').click(function () {
        const value = editor.getSession().getValue();
        const textWithoutSpaces = value.replace(/[\n\s]/g, '');
        const textArea = document.createElement("textarea");
        textArea.id = "copyArea"
        textArea.value = textWithoutSpaces;
        document.body.appendChild(textArea);
        textArea.select();
        textArea.focus();
        document.execCommand('copy');
        document.body.removeChild(textArea);

    });


    const currentTheme = localStorage.getItem('theme') || 'light';
    setTheme(editor, currentTheme);

    $('#themeToggle').change(function () {
        if (this.checked) {
            setTheme(editor, 'dark');
        } else {
            setTheme(editor, 'light');
        }
    });

    $('#themeToggle').prop('checked', currentTheme === 'dark');

});


function displayErrors(errors, inputText) {
    const errorMessages = $('#errorMessages');
    errorMessages.empty();

    if (errors.length > 0) {
        errors.forEach(error => {
            const errorLine = getErrorLine(error.index, inputText);
            errorMessages.append(`<div class="alert alert-danger">Error at line ${errorLine} ( ${error.index} ): ${error.error}</div>`);
        });
    }
}

function getErrorLine(index, text) {
    const upToError = text.substring(0, index);
    return upToError.split('\n').length;
}

function setTheme(editor, theme) {
    const body = $('body');
    const navbar = $('.navbar');
    if (theme === 'dark') {
        body.removeClass('light-theme').addClass('dark-theme');
        navbar.addClass('navbar-custom navbar-light bg-light').removeClass('navbar-dark bg-dark');

        editor.setTheme('ace/theme/twilight');
    } else {
        body.removeClass('dark-theme').addClass('light-theme');
        navbar.addClass('navbar-custom').removeClass('navbar-light bg-light');


        editor.setTheme('ace/theme/chrome');
    }
    localStorage.setItem('theme', theme);
}