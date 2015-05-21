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
	}
}
```

## License

MIT (http://www.opensource.org/licenses/mit-license.php)

## Installation

``` shell
npm install tslint-loader --save-dev
```

