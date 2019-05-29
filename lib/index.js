const ModuleFilenameHelpers = require('webpack').ModuleFilenameHelpers;

class Extractor {
    constructor(opts) {
        console.log("----Extractor constructor ");
        this.options = Object.assign({patterns: [], oldFileSuffix: ".js"}, opts);
    }

    apply(compiler) {
        compiler.plugin('compilation', compilation => {
            compilation.plugin('optimize-chunk-assets', (chunks, callback) => {
                chunks.reduce((acc, chunk) => acc.concat(chunk.files || []), [])
                    .concat(compilation.additionalChunkAssets || [])
                    .filter(ModuleFilenameHelpers.matchObject.bind(null, this.options))
                    .forEach((file) => {
                        console.log("----Extractor plugin File: ", file);
                        const asset = compilation.assets[file];
                        const fileName = this.options.oldFileSuffix ? file.slice(0, -1 * this.options.oldFileSuffix.length) : file;

                        // Get the content of the file
                        const source = asset.source();
                        // For each defined pattern from the constructor
                        for (const index in this.options.patterns) {
                            const pattern = this.options.patterns[index];

                            // Matched content
                            const values = new Set();
                            let match = null;
                            while ((match = pattern.regex.exec(source)) !== null) {
                                const value = typeof pattern.value === 'function' ? pattern.value(match) : pattern.value;
                                values.add(value);
                            }

                            // Create a new cfg source content
                            let cfgSource;
                            if (values.size === 0) {
                                // always write an empty array
                                cfgSource = "[]";
                            } else {
                                // put matched values into new config source
                                cfgSource = "[\"" + Array.from(values).join("\", \"") + "\"]";
                            }
                            // return new config assets for each pattern/suffix definition
                            compilation.assets[fileName + pattern.targetSuffix] = {
                                source: function () {
                                    return cfgSource
                                },
                                size: function () {
                                    return cfgSource.length
                                }
                            };
                        }
                    });
                callback();
            });
        });
    }
}

module.exports = Extractor;
