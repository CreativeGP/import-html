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


if (process.argv.length <= 2) error("Too few arguments.");
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
