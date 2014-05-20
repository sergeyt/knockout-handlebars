module.exports = function(config) {

	var pkg = require('./package.json');
	var debug = config.debug;

	var preprocessors = {
		'test/*.coffee': 'coffee'
	};

	if (!debug) {
		preprocessors[pkg.main] = 'coverage';
	}

	var knockout = debug ?
		'node_modules/knockout/build/output/knockout-latest.debug.js'
		: 'node_modules/knockout/build/output/knockout-latest.js';

	config.set({
		// base path, that will be used to resolve files and exclude
		basePath: '',

		// frameworks to use
		frameworks: ['mocha'],

		client: {
			mocha: {
				ui: 'bdd'
			}
		},

		preprocessors: preprocessors,

		// list of files / patterns to load in the browser
		files: [
			'node_modules/jquery/dist/jquery.js',
			knockout,
			'node_modules/should/should.js',
			pkg.main,
			'test/*.coffee'
		],

		// list of files to exclude
		exclude: [],

		// test results reporter to use
		// possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
		reporters: ['dots', 'coverage'],

		coverageReporter: {
			type: 'html',
			dir: '.coverage'
		},

		// web server port
		port: 9876,

		// enable / disable colors in the output (reporters and logs)
		colors: true,

		// level of logging
		// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		logLevel: config.LOG_INFO,

		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: false,

		// Start these browsers, currently available:
		// - Chrome
		// - ChromeCanary
		// - Firefox
		// - Opera
		// - Safari (only Mac)
		// - PhantomJS
		// - IE (only Windows)
		browsers: ['PhantomJS'],

		// If browser does not capture in given timeout [ms], kill it
		captureTimeout: 60000,

		// Continuous Integration mode
		// if true, it capture browsers, run tests and exit
		singleRun: false
	});
};
