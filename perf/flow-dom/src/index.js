import benchmark from 'vdom-benchmark-base'
import { init } from '../../../src/index'
import { h } from '../../../src/hyperscript/h'
const patch = init([])

var NAME = 'flow-dom'
var VERSION = '1.0.0'

function map (arr, f) {
  const l = arr.length
  const x = new Array(l)
  for (let i = 0; i < l; ++i) { // eslint-disable-line immutable/no-let
    x[i] = f(arr[i])
  }
  return x
}

function convertToVnodes (nodes) {
  return map(nodes, function (n) {
    if (n.children !== null) {
      return h('div', {key: n.key}, convertToVnodes(n.children))
    }
    return h('div', {key: n.key}, n.key)
  })
}

function BenchmarkImpl (container, a, b) {
  this.container = container
  this.a = a
  this.b = b
  this.vnode = null
}

BenchmarkImpl.prototype.setUp = function () {
}

BenchmarkImpl.prototype.tearDown = function () {
  patch(this.vnode, h('div'))
}

BenchmarkImpl.prototype.render = function () {
  const elm = document.createElement('div')
  this.vnode = patch(elm, h('div', convertToVnodes(this.a)))
  this.container.appendChild(elm)
}

BenchmarkImpl.prototype.update = function () {
  this.vnode = patch(this.vnode, h('div', convertToVnodes(this.b)))
}

document.addEventListener('DOMContentLoaded', function (e) {
  benchmark(NAME, VERSION, BenchmarkImpl)
}, false)
