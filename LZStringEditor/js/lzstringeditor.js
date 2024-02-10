$(document).ready(function () {
    const editor = ace.edit("editorBox")
    const langTools = ace.require("ace/ext/language_tools");
    const Json5Mode = ace.require("ace/mode/json5").Mode;
    ace.config.loadModule("ace/ext/searchbox", function(m) {m.Search(editor)});
    editor.getSession().setMode(new Json5Mode());
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


    $('#decodeAndFormatBtn').click(function() {
        try {
            var compressed = editor.getValue();
            var decompressed = LZString.decompressFromBase64(compressed);

            if (decompressed === null) {
                throw new Error('Invalid LZString data.');
            }
            console.log(decompressed)
            const parser = new SpecialJsonParser(decompressed);
            const result = parser.parse();
            const formattedJson = customStringify(result.data, 1);
            editor.setValue(formattedJson, -1);
        } catch (e) {
            alert('Error: ' + e);
        }
    });

    $('#copyEncodeText').click(function() {
        try {
            var json = editor.getValue();
            var compressed = LZString.compressToBase64(json);

            navigator.clipboard.writeText(compressed).then(function() {
                alert('Copied to clipboard!');
            }, function(err) {
                alert('Error in copying text: ' + err);
            });
        } catch (e) {
            alert('Error: ' + e.message);
        }
    });


});



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