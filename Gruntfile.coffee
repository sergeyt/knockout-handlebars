module.exports = (grunt) ->

	# load grunt plugins
	plugins = [
		'grunt-contrib-jshint',
		'grunt-npm',
		'grunt-bump',
		'grunt-auto-release',
		'grunt-karma',
		'grunt-contrib-uglify'
	]

	for name in plugins
		grunt.loadNpmTasks name

	pkg = grunt.file.readJSON 'package.json'

	banner = """/*
 * <%= pkg.name %>.js v<%= pkg.version %> - handlebars and more syntax sugar for knockout.js
 * https://github.com/sergeyt/knockout-handlebars
 * Licensed under MIT (https://github.com/sergeyt/knockout-handlebars/blob/master/LICENSE)
 */
 """

  	# Project configuration.
	grunt.initConfig
		pkg: pkg

		'npm-contributors':
			options:
				commitMessage: 'chore: update contributors'

		bump:
			options:
				commitMessage: 'chore: release v%VERSION%'
				pushTo: 'origin'

		'auto-release':
			options:
				checkTravisBuild: false

		jshint:
			options:
				# Expected an assignment or function call and instead saw an expression.
				'-W030': true,
				globals:
					node: true,
					console: true,
					module: true,
					require: true
			all:
				options:
					ignores: ['*.min.js', 'src/*.min.js']
				src: ['*.js', 'src/*.js']

		karma:
			unit:
				configFile: 'karma.conf.js'
				singleRun: true

		uglify:
			min:
				options:
					banner: banner + '\n\n'
					mangle: false
				files:
					'dist/knockout.handlebars.min.js': 'knockout.handlebars.js'
	

	grunt.registerTask 'release', 'Bump the version and publish to NPM.',
		(type) -> grunt.task.run [
			'npm-contributors',
			"bump:#{type||'patch'}",
			'npm-publish'
		]

	# meta tasks
	grunt.registerTask 'lint', ['jshint']
	grunt.registerTask 'test', ['lint', 'karma']
	grunt.registerTask 'default', ['test', 'uglify']
