/* @flow */
import { copy } from '@most/prelude'
import { VNode } from './hyperscript/VNode'

export function isUndef (x: any): boolean {
  return x === void 0
}

export function emptyVNodeAt (node: HTMLElement): VNode {
  return new VNode(node.tagName.toLowerCase(), node.id || '', copy(node.classList), {}, [], node, null)
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
