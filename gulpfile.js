/*jslint node: true, for */

'use strict';

let gulp = require(`gulp`),
    del = require(`del`),
    sass = require(`gulp-sass`),
    babel = require(`gulp-babel`),
    cssCompressor = require(`gulp-csso`),
    browserSpecificPrefixer = require(`gulp-autoprefixer`),
    htmlMinifier = require(`gulp-htmlmin`),
    htmlValidator = require(`gulp-html`),
    jsLinter = require(`gulp-eslint`),
    jsCompressor = require(`gulp-uglify`),
    imageCompressor = require(`gulp-imagemin`),
    tempCache = require(`gulp-cache`),
    browserSync = require(`browser-sync`),
    config = require(`./config.json`),
    colors = config.colors,
    reload = browserSync.reload,
    browserChoice = `default`;

gulp.task(`safari`, function () {
    browserChoice = `safari`;
});

gulp.task(`firefox`, function () {
    browserChoice = `firefox`;
});

gulp.task(`chrome`, function () {
    browserChoice = `google chrome`;
});

gulp.task(`opera`, function () {
    browserChoice = `opera`;
});

gulp.task(`edge`, function () {
    browserChoice = `microsoft-edge`;
});

gulp.task(`allBrowsers`, function () {
    browserChoice = [`safari`, `firefox`, `google chrome`, `opera`, `microsoft-edge`];
});

// Validate the HTML that has been written
gulp.task(`validateHTML`, function () {
    return gulp.src([`src/html/*.html`, `src/html/**/*.html`])
        .pipe(htmlValidator());
});

// This task will compress the HTML that has been written and remove all the comments
gulp.task(`compressHTML`, function () {
    return gulp.src([`src/html/*.html`, `src/html/**/*.html`])
        .pipe(htmlMinifier({
            removeComments: true,
            collapseWhitespace: true
        }))
        .pipe(gulp.dest(`prod`));
});

// This task will compile all the css
gulp.task(`compileCSSForDev`, function () {
    return gulp.src(`src/styles/main.scss`)
        .pipe(sass({
            outputStyle: `expanded`,
            precision: 10
        }).on(`error`, sass.logError))
        .pipe(browserSpecificPrefixer({
            browsers: [`last 2 versions`]
        }))
        .pipe(gulp.dest(`temp/styles`));
});

// This task will compile the CSS for production
gulp.task(`compileCSSForProd`, function () {
    return gulp.src(`src/styles/main.scss`)
        .pipe(sass({
            outputStyle: `compressed`,
            precision: 10
        }).on(`error`, sass.logError))
        .pipe(browserSpecificPrefixer({
            browsers: [`last 2 versions`]
        }))
        .pipe(cssCompressor())
        .pipe(gulp.dest(`prod/styles`));
});


// Transpile JS files for development
gulp.task(`transpileJSForDev`, function () {
    return gulp.src(`src/scripts/*.js`)
        .pipe(babel())
        .pipe(gulp.dest(`temp/scripts`));
});

// Transpile JS files for production
gulp.task(`transpileJSForProd`, function () {
    return gulp.src(`src/scripts/*.js`)
        .pipe(babel())
        .pipe(jsCompressor())
        .pipe(gulp.dest(`prod/scripts`));
});

// Lint the Javascript
gulp.task(`lintJS`, function () {
    return gulp.src(`src/scripts/*.js`)
        .pipe(jsLinter({
            rules: {
                indent: [2, 4, {SwitchCase: 1}],
                quotes: [2, 'single'],
                semi: [2, `always`],
                'linebreak-style': [2, `unix`],
                'max-len': [1, 85, 4]
            },
            env: {
                es6: true,
                node: true,
                browser: true
            },
            extends: `eslint:recommended`
        }))
        .pipe(jsLinter.formatEach(`compact`, process.stderr));
});

// Compress images and copy to the production folder
gulp.task(`compressThenCopyImagesToProdFolder`, function () {
    return gulp.src(`src/img/**/*`)
        .pipe(tempCache(
            imageCompressor({
                optimizationLevel: 3, // For PNG files. Accepts 0 – 7; 3 is default.
                progressive: true,    // For JPG files.
                multipass: false,     // For SVG files. Set to true for compression.
                interlaced: false     // For GIF files. Set to true for compression.
            })
        ))
        .pipe(gulp.dest(`prod/img`));
});

// Copy the unprocessed assets to the production folder
gulp.task(`copyUnprocessedAssetsToProdFolder`, function () {
    return gulp.src([
        `src/*.*`,       // Source all files,
        `src/**`,        // and all folders,
        `!src/html/`,    // but not the HTML folder
        `!src/html/*.*`, // or any files in it
        `!src/html/**`,  // or any sub folders;
        `!src/img/`,     // ignore images;
        `!src/**/*.js`,  // ignore JS;
        `!src/styles/**` // and, ignore Sass/CSS.
    ], {dot: true}).pipe(gulp.dest(`prod`));
});

// Gulptask run for development
gulp.task(`serve`, [`compileCSSForDev`, `lintJS`, `transpileJSForDev`, `validateHTML`], function () {
    browserSync({
        notify: true,
        port: 9000,
        reloadDelay: 100,
        browser: browserChoice,
        server: {
            baseDir: [
                `temp`,
                `src`,
                `src/html`
            ]
        }
    });

    gulp.watch(`src/scripts/*.js`, [`lintJS`, `transpileJSForDev`])
        .on(`change`, reload);

    gulp.watch(`src/styles/**/*.scss`, [`compileCSSForDev`])
        .on(`change`, reload);

    gulp.watch([`src/html/**/*.html`], [`validateHTML`])
        .on(`change`, reload);

    gulp.watch(`src/img/**/*`)
        .on(`change`, reload);
});

gulp.task(`default`, function () {
    let exec = require(`child_process`).exec;

    exec(`gulp --tasks`, function (error, stdout, stderr) {
        if (null !== error) {
            process.stdout.write(`An error was likely generated when invoking ` +
                    `the “exec” program in the default task.`);
        }

        if (`` !== stderr) {
            process.stdout.write(`Content has been written to the stderr stream ` +
                    `when invoking the “exec” program in the default task.`);
        }

        process.stdout.write(`\n\tThis default task does ${colors.red}` +
                `nothing ${colors.default}but generate this message. The ` +
                `available tasks are:\n\n ${stdout}`);
    });
});
