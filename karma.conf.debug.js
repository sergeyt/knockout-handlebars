// Karma configuration for debug

module.exports = function(config) {

	config.set({debug: true});

	// apply base config
	require('./karma.conf.js')(config);

	config.set({
		browsers: ['Chrome'],
		autoWatch: true,
		reporters: ['dots']
	});
};
