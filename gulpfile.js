const gulp = require('gulp');
const { src, dest, series, parallel, watch } = require('gulp');
const del = require('delete');
const { rollup } = require('rollup');
// rollup looks for node_modules module
const { nodeResolve } = require('@rollup/plugin-node-resolve');
// rollup converts commonjs module to es6 module
const commonjs = require('@rollup/plugin-commonjs');
// rollup code compression
const terser = require('rollup-plugin-terser').terser;
// rollup babel plugin, support the latest ES grammar
const babel = require('@rollup/plugin-babel').default;
// Dynamic module name based on plugin structure
const path = require('path'); // Ensure the 'path' module is imported

const production = process.env.NODE_ENV === 'production'; // Check for prod environment

const pkg = require('./package.json');

// jshint esversion: 6

// Static plugin information
const pluginType = 'local';
const pluginName = 'sysbindlib';
const subModule = 'luckysheet'; // Subdirectory under sysbindlib
// Paths
const paths = {
    mainJs: 'src/index.js', // Main source input file
    assets: 'src/assets/**/*', // Additional static assets (if applicable)
    moodleSrc: `${pluginType}/${pluginName}/amd/src`, // Moodle AMD src output directory
    outputFile: `${subModule}.js` // File name for the Moodle AMD module
};
// Strip the file extension from outputFile
const outputFileName = path.basename(paths.outputFile, path.extname(paths.outputFile));

// Define the module name, appending the stripped outputFile name
const moduleName = `${pluginType}_${pluginName}/${subModule}`;


const currentYear = new Date().getFullYear(); // Get the current year dynamically

const moodleBanner = `/**
 * This file is part of the Moodle project.
 *
 * @module   ${pluginType}_${pluginName}/${subModule}
 * @copyright    ${currentYear} Your Name
 * @license    https://www.gnu.org/licenses/gpl-3.0.html GNU GPL v3 or later
 */`;


// Clean Task: Delete the Moodle plugin's submodule AMD src directory
function clean() {
    return del([paths.moodleSrc]);
}

// babel config
const babelConfig = {
    compact:false,
    babelHelpers: 'bundled',
    exclude: 'node_modules/**', // Only compile our source code
    plugins: [],
    presets: [
        ['@babel/preset-env', {
            useBuiltIns: 'usage',
            corejs: 3,
            targets: {
                chrome: 58,
                esmodules: true
            }
        }]
    ]
};

// Build Core JS for Moodle using Rollup
async function moodleCoreBuild() {
    const bundle = await rollup({
        input: paths.mainJs,
        plugins: [
            nodeResolve({
                  // Resolve third-party imports from node_modules
                  browser: true, // Ensures compatibility with browser-specific modules
                  preferBuiltins: false // Don't use Node.js builtins in the browser
              }
            ), // Locate modules in node_modules
            commonjs(), // Convert CommonJS to ESM
            production && terser(), // Minify only in production
            babel(babelConfig)
        ],
        external: []
    });

    // Output ES6 module with Moodle-specific settings
    await bundle.write({
        file: `${paths.moodleSrc}/${paths.outputFile}`,
        format: 'esm', // ES6 Module for Moodle (import/export syntax)
        sourcemap: true, // Include sourcemaps for debugging
        banner: moodleBanner, // Add Moodle-required metadata in the banner
        name: moduleName // Expose the module name
    });
}

// Copy static assets (if any) to the target folder
function copyAssets() {
    return src(paths.assets)
      .pipe(dest(paths.moodleSrc));
}

// Watch Task for Development
function watcher() {
    watch(paths.mainJs, moodleCoreBuild); // Watch the main JS file for changes
    watch(paths.assets, copyAssets); // Watch asset changes
}

// Build Task
const build = series(clean, parallel(moodleCoreBuild, copyAssets));

// Export tasks for CLI usage
exports.clean = clean;
exports.build = build;
exports.watch = watcher;
exports.dev = series(build, watcher);