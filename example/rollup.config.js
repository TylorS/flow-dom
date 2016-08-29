/* eslint-disable */
import buble from 'rollup-plugin-buble'
import babel from 'rollup-plugin-babel'
import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

export default {
  entry: 'main.js',
  dest: 'app.js',
  format: 'iife',
  moduleName: 'FlowDom',
  plugins: [
    babel(),
    buble(),
    nodeResolve({
      jsnext: false
    }),
    commonjs()
  ],
  acorn: {
    allowReserved: true
  }
}
