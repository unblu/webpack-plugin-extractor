const Compilation = require('webpack').Compilation;

class Extractor {
    constructor(opts) {
        console.log("Unblu WebpackPluginExtractor (v5.0.4) created.");
        this.options = Object.assign({patterns: [], oldFileSuffix: ".js"}, opts);
    }

    apply(compiler) {
        compiler.hooks.compilation.tap('WebpackPluginExtractor', (compilation) => {
            compilation.hooks.processAssets.tap({ name: 'WebpackPluginExtractor', stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE, additionalAssets: true }, (chunks) => {
                    const assetList = Object.keys(chunks);
                    assetList.filter((file) => {
                        const asset = compilation.assets[file];
                        const fileName = this.options.oldFileSuffix ? file.slice(0, -1 * this.options.oldFileSuffix.length) : file;
                        // Get the content of the file
                        const source = asset.source();
                        // Extract content to provided variable
                        // ------------------------------------
                        // Extract search pattern and store results
                        if (this.options.extractPattern) {
                            console.log("Unblu WebpackPluginExtractor plugin file: ", file);
                            let extractRegex = this.options.extractPattern.regex;
                            let foundMatch = null;
                            while ((foundMatch = extractRegex.exec(source)) !== null) {
                                let keyword = this.options.extractPattern.value(foundMatch);
                                if (!this.options.extractPattern.store.includes(keyword)) {
                                    console.log("Found keyword and store in variable: ", keyword);
                                    this.options.extractPattern.store.push(keyword);
                                }
                            }
                        }

                        // Extract content to new provided file extension
                        // ----------------------------------------------
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
            });
        });
    }
}

module.exports = Extractor;
