/***
    import-html [https://github.com/CreativeGP/import-html]

    03/16/2018 (mm/dd/yyyy)
    CreativeGP (C) 2018
*/


const fs = require('fs');

module.exports = {
    // Expand #include tag. String -> String
    expand: function (contents) {
        // Divide in lines
        let lines = contents.split(/\n/g).map(s => s.slice(0, -1));
        let result = "";

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

            if (filename != "" && fs.existsSync(filename)) {
                let contents = fs.readFileSync(filename).toString();
                lines[i] = contents.slice(0, -1);
            }

            result += lines[i] + "\n";
        }

        return result;
    }
};
