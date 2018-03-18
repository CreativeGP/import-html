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


const deal_with_file = (filename, output) => {
    const output_file_path = path.join(process.env.PWD, output, path.basename(filename));

    let contents = fs.readFileSync(filename).toString();
    defor(contents, `Input file '{filename}' is not found.`);

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
            let abfilepath = path.resolve(filepath);
            if (!(abfilepath in dependences))
                dependences[abfilepath] = [];
            dependences[abfilepath].push(path.resolve(path.join(path.dirname(filepath), filename)));

            // Remove duplicated elements
            dependences[abfilepath] = Array.from(new Set(dependences[abfilepath]));
        }
    }
};

const exit_handler = (options, err) => {
    // Save dependences at exit
    if (!fs.existsSync(IMPORT_HTML_DEPENDENCES_FILE_PATH)) {
        fs.closeSync(fs.openSync(IMPORT_HTML_DEPENDENCES_FILE_PATH, 'w'));
    }
    fs.writeFileSync(IMPORT_HTML_DEPENDENCES_FILE_PATH, JSON.stringify(dependences));

    if (options.cleanup) console.log('clean');
    if (err) console.log(err.stack);
    if (options.exit) process.exit();
};
process.on('exit', exit_handler.bind(null,{cleanup:true}));
process.on('SIGINT', exit_handler.bind(null, {exit:true}));
process.on('SIGUSR1', exit_handler.bind(null, {exit:true}));
process.on('SIGUSR2', exit_handler.bind(null, {exit:true}));
// process.on('uncaughtException', exit_handler.bind(null, {exit:true}));

if (process.argv.length <= 3) error("Too few arguments.");

// Load dependences file
dependences = JSON.parse(fs.readFileSync(IMPORT_HTML_DEPENDENCES_FILE_PATH, 'utf-8'));


if (process.argv[2].match(/w/)) {
    // Watch mode

    let watches = {};

    let update = filepath => {
        deal_with_file(filepath, process.argv[3]);
        console.log("Updated: "+filepath);
    };

    // Support recursive option `r`
    let recursive = Boolean(process.argv[2].match(/r/));

    // 最初に全ての依存ファイルを監視
    for (let abfilename in dependences) {
        // 依存しているファイルに変更があった場合に上位のファイルを更新する
        watches[abfilename] = [];
        for (let i = 0;
             depend = dependences[abfilename][i];
             i++)
        {
            watches[abfilename].push(fs.watch(depend, (event, f) => {
                update(abfilename);
            }));
        }
    }

    // Begin watching current directory
    watch("./", { recursive: recursive }, (eventType, filename) => {
        // Ignore file event if it is not html
        if (path.extname(filename) != ".html") return;
        // Ignore hidden files
        if ((/(^|\/)\.[^\/\.]/g).test(filename)) return;

        let abfilename = path.resolve(filename);

        get_dependences(filename);

        if (!(filename in dependences)) return;

        // 依存が更新された際には監視を一回全て解除する
        for (let i in watches[abfilename])
            watches[abfilename][i].close();

        // 依存しているファイルに変更があった場合に上位のファイルを更新する
        watches[abfilename] = [];
        if (abfilename in dependences) {
            for (let i = 0;
                 depend = dependences[abfilename][i];
                 i++)
            {
                console.log(depend);
                watches[abfilename].push(fs.watch(depend, (event, f) => {
                    console.log(f);
                    update(filename);
                }));
            }
        }

        update(filename);
    });
} else {
    // Nomal mode
    deal_with_file(process.argv[3], process.argv[4]);
}
