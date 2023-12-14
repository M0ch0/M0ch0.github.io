let history = [];
let currentHistoryIndex = -1;

$('#editorBox').on('input', function() {
    if (currentHistoryIndex !== history.length - 1) {
        history = history.slice(0, currentHistoryIndex + 1);
    }

    history.push(this.value);
    currentHistoryIndex++;
});

$(document).ready(function() {
    const editor = ace.edit("editorBox")
    const Json5Mode = ace.require("ace/mode/json5").Mode;
    editor.getSession().setMode(new Json5Mode());
    $('#formatBtn').click(function() {
        console.log(editor.getSession().getValue())
        const parser = new SpecialJsonParser(editor.getSession().getValue());
        const result = parser.parse();
        const formattedJson = customStringify(result.data, 2);
        editor.getSession().setValue(formattedJson)

        displayErrors(result.errors, formattedJson);
    });

    const currentTheme = localStorage.getItem('theme') || 'light';
    setTheme(editor, currentTheme);

    $('#themeToggle').change(function() {
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