const pkg = require('./package.json')
module.exports = {
  input: 'wiv.js',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true
    },
    {
      file: 'dist/wiv.js',
      format: 'umd',
      sourcemap: true,
      name: 'wiv'
    }
  ],
}
