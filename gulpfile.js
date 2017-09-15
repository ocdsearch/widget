var gulp = require('gulp');
var elixir = require('laravel-elixir');

elixir(function(mix) {
	mix.babel('/resources/js/widget.js', 'public/build/js/widget.js', '.');

	mix.scripts([
		'/node_modules/axios/dist/axios.js',
		'/node_modules/lodash/lodash.js',
		'/node_modules/vue/dist/vue.js',
		'/node_modules/numeral/numeral.js',
		'/node_modules/vuetify/dist/vuetify.js',
		'/node_modules/vue-observe-visibility/dist/vue-observe-visibility.js',
		'/public/build/js/widget.js'
	], 'public/build/js/app.js', '.');

	mix.styles([
		'/node_modules/vuetify/dist/vuetify.css',
    	'/resources/css/app.css'
	], 'public/build/css/app.css', '.');

	mix.version([
	    'build/css/app.css',
	    'build/js/app.js'
    ]);
});
