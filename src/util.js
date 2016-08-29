/* @flow */
import type { VNode } from './hyperscript/VNode'
import { FlowVNode } from './hyperscript/VNode' // eslint-disable-line

export function isUndef (x: any): boolean {
  return x === void 0
}

export function emptyVNodeAt (node: Element): VNode {
  return new FlowVNode(node.tagName.toLowerCase(), node.id || '', copy(node.classList), {}, [], '', node, null)
}

export function sameVNode (a: VNode, b: VNode): boolean {
  return a.selector === b.selector && a.key === b.key
}

export function forEach (f: Function, arr: Array<any>) {
  const length = arr.length
  for (let i = 0; i < length; ++i) { // eslint-disable-line immutable/no-let
    f(arr[i], i)
  }
}

// copy :: [a] -> [a]
// duplicate a (shallow duplication)
export function copy (a: any): any[] {
  const l = a.length
  const b = new Array(l)
  for (let i = 0; i < l; ++i) { // eslint-disable-line immutable/no-let
    b[i] = a[i]
  }
  return b
}

// map :: (a -> b) -> [a] -> [b]
// transform each element with f
export function map (f: Function, a: any): any[] {
  const l = a.length
  const b = new Array(l)
  for (let i = 0; i < l; ++i) { // eslint-disable-line immutable/no-let
    b[i] = f(a[i], i)
  }
  return b
}

// reduce :: (a -> b -> a) -> a -> [b] -> a
// accumulate via left-fold
export function reduce (f: Function, z: any, a: any): any {
  let r = z // eslint-disable-line immutable/no-let
  for (let i = 0, l = a.length; i < l; ++i) { // eslint-disable-line immutable/no-let
    r = f(r, a[i], i)
  }
  return r
}

// replace :: a -> Int -> [a]
// replace element at index
export function replace (x: any, i: number, a: any): any[] {
  if (i < 0) {
    throw new TypeError('i must be >= 0')
  }

  const l = a.length
  const b = new Array(l)
  for (let j = 0; j < l; ++j) { // eslint-disable-line immutable/no-let
    b[j] = i === j ? x : a[j]
  }
  return b
}
