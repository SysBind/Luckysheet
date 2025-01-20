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
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const fs = require('fs');

const production = process.env.NODE_ENV === 'production'; // Check for prod environment

const pkg = require('./package.json');

// jshint esversion: 6

// Static plugin information
const pluginType = 'local';
const pluginName = 'sysbindlib';
const subModule = 'luckysheet'; // Subdirectory under sysbindlib
// Paths
const paths = {
    cssImages: 'src/css/**/*.{jpg,jpeg,png,gif,svg}',
    pluginImages: 'src/plugins/images/**/*.{jpg,jpeg,png,gif,svg}', // Images within plugins directory
    mainJs: 'src/index.js', // Main source input file
    assets: 'src/assets/**/*', // Additional static assets (if applicable)
    moodleSrc: `${pluginType}/${pluginName}/amd/src`, // Moodle AMD src output directory
    outputFile: `${subModule}.js`, // File name for the Moodle AMD module
    moodlePlugin: `${pluginType}/${pluginName}`
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

// Paths for CSS input and SCSS output
const scssPaths = {
    cssSrc: 'src/css/**/*.css', // Source directory for CSS files
    scssOutput: `${paths.moodlePlugin}/scss/${subModule}` // Target directory for SCSS files
};
// Reusable variables to extract from CSS
const scssVariables = {
    colorPrimary: '#007BFF',
    colorSecondary: '#6C757D',
    fontSizeBase: '16px',
    borderRadius: '4px'
};

// Task to convert and optimize CSS files into SCSS format
function cssToOptimizedScss() {
    return gulp.src(scssPaths.cssSrc)
      // Rename file extensions to .scss
      .pipe(rename({ extname: '.scss' }))

      // Replace hardcoded styles with SCSS variables
      .pipe(replace(/#007BFF/g, '$color-primary'))
      .pipe(replace(/#6C757D/g, '$color-secondary'))
      .pipe(replace(/16px/g, '$font-size-base'))
      .pipe(replace(/4px/g, '$border-radius'))

      // Attempt to group SCSS-friendly rules into nested styles
      .pipe(replace(/([a-z0-9\-\_\#\.\:\[\]\=\"]+\s?\{)/g, '\n$1')) // Add spacing for readability

      // Add SCSS variables at the top of each file
      .pipe(replace(/^/, () => {
          const variables = Object.entries(scssVariables)
            .map(([key, value]) => `$${key}: ${value};`)
            .join('\n');
          return `${variables}\n\n`;
      }))

      // Output the new SCSS files to the target directory
      .pipe(gulp.dest(scssPaths.scssOutput));
}

function copyCssImagesToMoodlePix() {
    // Destination directory dynamically uses the Moodle plugin and submodule paths
    const destPath = path.join(paths.moodlePlugin, 'pix', subModule);

    return gulp.src(paths.cssImages) // Match all image files in src/css
      .pipe(gulp.dest(destPath)); // Copy to Moodle pix/subModule directory
}

function copyPluginImagesToMoodlePix() {
    const pluginImageDestPath = path.join(paths.moodlePlugin, 'pix', subModule, 'plugins', 'images');

    return gulp.src(paths.pluginImages) // Match all images in src/plugins/images
      .pipe(gulp.dest(pluginImageDestPath)); // Copy to Moodle pix/plugins/images directory
}


// Export task for CLI usage
exports.copyCssImagesToMoodlePix = copyCssImagesToMoodlePix;

exports.copyPluginImagesToMoodlePix = copyPluginImagesToMoodlePix;

// Export the task for running via CLI
exports.cssToOptimizedScss = cssToOptimizedScss;


// Build Task
const build = series(clean, parallel(moodleCoreBuild, copyAssets, cssToOptimizedScss, copyCssImagesToMoodlePix, copyPluginImagesToMoodlePix));

// Export tasks for CLI usage
exports.clean = clean;
exports.build = build;
exports.watch = watcher;
exports.dev = series(build, watcher);