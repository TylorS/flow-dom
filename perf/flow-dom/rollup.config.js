/* eslint-disable */
import buble from 'rollup-plugin-buble'
import babel from 'rollup-plugin-babel'
import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

export default {
  entry: 'src/index.js',
  dest: 'dist/main.js',
  format: 'iife',
  moduleName: 'VDOMBenchmarkFlowDom',
  plugins: [
    babel(),
    buble(),
    nodeResolve({
      jsnext: true
    }),
    commonjs()
  ]
}
