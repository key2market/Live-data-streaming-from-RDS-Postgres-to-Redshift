const path = require("path");

/**
 * @type {import("webpack").Configuration}
 */
const config = {   
    entry: {
        "rds-replication": "./src/rds-replication/index.js",
        "rds-get-changes": "./src/rds-get-changes/index.js"
    },
    mode: "production",
    externals: {
        "aws-sdk":  {
            commonjs: "aws-sdk"
        },
        "pg-native": {
            commonjs: "pg-native"
        }
    },
    target: "node",
    output: {
        filename: "[name]/index.js",
        path: path.join(__dirname, "build"),
        libraryTarget: "commonjs"
    }
};

module.exports = config;