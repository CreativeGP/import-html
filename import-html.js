/***
    import-html [https://github.com/CreativeGP/import-html]

    03/16/2018 (mm/dd/yyyy)
    CreativeGP (C) 2018
*/


const { expand } = require('./expand');
const fs = require('fs');
const path = require('path');

// Recursive watching is not supported in linux by 'fs'
// So use 'node-watch' instead
const watch = require('node-watch');

var dependences = {
};

const IMPORT_HTML_DEPENDENCES_FILE_PATH = "./.import_html_dependences.json";

const error = str => {
    console.log("Error! " + str);
    process.exit(1);
};

const defor = (v, str) => {
    if (!v) error(str);
};


const deal_with_file = filename => {
    const output_file_path = path.join(process.env.PWD, process.argv[4], process.argv[2]);

    let contents = fs.readFileSync(process.argv[3]).toString();
    defor(contents, `Input file '{process.argv[3]}' is not found.`);

    // Craete directory if doesn't exist
    if (!fs.existsSync(path.dirname(output_file_path))) {
        fs.mkdirSync(path.dirname(output_file_path));
    }

    // Create empty file if doesn't exist
    if (!fs.existsSync(output_file_path)) {
        fs.closeSync(fs.openSync(output_file_path, 'w'));
    }

    fs.writeFileSync(output_file_path, expand(contents));
};

const get_dependences = filepath => {
    let contents = fs.readFileSync(filepath, 'utf-8');

    // Divide in lines
    let lines = contents.split(/\n/g).map(s => s.slice(0, -1));

    // For each line, check whether the tag exists
    for (let i = 0; i < lines.length; ++i) {
        let re = /<#include(?:\s)?"(.*)"(?:\s)?\/?(?:\s)?>/;
        let found = lines[i].match(re);
        let filename = "";

        if (found && found[1]) {
            filename = found[1];
        } else {
            // Check single quotation case
            let re = /<#include(?:\s)?'(.*)'(?:\s)?\/?(?:\s)?>/;
            let found = lines[i].match(re);
            if (found && found[1]) filename = found[1];
        }

        if (filename != "") {
            if (!(filepath in dependences)) dependences[filepath] = [];
            dependences[filepath].push(path.join(path.dirname(filepath), filename));
        }
    }
};

const exit_handler = () => {
    // Save dependences at exit
    if (!fs.existsSync(IMPORT_HTML_DEPENDENCES_FILE_PATH)) {
        fs.closeSync(fs.openSync(IMPORT_HTML_DEPENDENCES_FILE_PATH, 'w'));
    }
    fs.writeFileSync(IMPORT_HTML_DEPENDENCES_FILE_PATH, JSON.stringify(dependences));
};
process.on('exit', exit_handler.bind(null,{cleanup:true}));
process.on('SIGINT', exit_handler.bind(null, {exit:true}));
process.on('SIGUSR1', exit_handler.bind(null, {exit:true}));
process.on('SIGUSR2', exit_handler.bind(null, {exit:true}));
// process.on('uncaughtException', exit_handler.bind(null, {exit:true}));


if (process.argv.length <= 2) error("Too few arguments.");

// Load dependences file
dependences = JSON.parse(fs.readFileSync(IMPORT_HTML_DEPENDENCES_FILE_PATH, 'utf-8'));


if (process.argv[2].match(/w/)) {
    // Watch mode

    // Support recursive option `r`
    let recursive = Boolean(process.argv[2].match(/r/));

    // Begin watching current directory
    watch("./", { recursive: recursive }, (eventType, filename) => {
        // Ignore file event if it is not html
        if (path.extname(filename) != ".html") return;

    });
} else {
    // Nomal mode
    deal_with_file();
}
