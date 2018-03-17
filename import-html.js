const { expand } = require('./expand');
const fs = require('fs');
const path = require('path');

const error = str => {
    console.log("Error! " + str);
    process.exit(1);
};

const defor = (v, str) => {
    if (!v) error(str);
};


if (process.argv.length <= 2) error("Too few arguments.");


const deal_with_file = filename => {
    const output_file_path = path.join(process.env.PWD, process.argv[3], process.argv[2]);

    let contents = fs.readFileSync(process.argv[2]).toString();
    defor(contents, `Input file '{process.argv[2]}' is not found.`);

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
