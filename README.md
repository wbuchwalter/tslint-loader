# tslint loader for webpack

## Usage

Apply the tslint loader as pre/postLoader in your webpack configuration:

``` javascript
module.exports = {
	module: {
		preLoaders: [
			{
				test: /\.ts$/,				
				loader: "tslint"
			}
		]
	},
  // more options in the optional tslint object
	tslint: {
		// any tslint option https://www.npmjs.com/package/tslint#supported-rules
		// i. e.
		rules: {
      quotemark: [true, "double"]
    },

		// tslint errors are displayed by default as warnings
		// set emitErrors to true to display them as errors
		emitErrors: false,

		// tslint does not interrupt the compilation by default
		// if you want any file with jshint errors to fail
		// set failOnHint to true
		failOnHint: true,		
	}
}
```

## License

MIT (http://www.opensource.org/licenses/mit-license.php)