import { reduce } from '../util'
import { VNode } from '../hyperscript/VNode'

export function update (oldVNode: VNode, vNode: VNode): VNode {
  const oldProps = oldVNode.data.props || {}
  const props = vNode.data.props || {}

  if (!oldProps && !props) return vNode

  const keys = Object.keys(props)

  const element = reduce(function (element, key) {
    if (!props[key]) {
      delete element[key]
    }
    return element
  }, vNode.data.element, keys)

  const newElement = reduce(function (element, key) {
    const cur = props[key]
    const old = oldProps[key]

    if (old !== cur && key !== 'value' || element[key] !== cur) {
      element[key] = cur
    }

    return element
  }, element, keys)

  return vNode.setElement(newElement)
}

export const create = update

export function remove (vNode: VNode, rm: Function) {
  rm()
}

export function destroy (vNode: VNode) {}

export function insert (vNode: VNode) {
  return vNode
}

export const module = {
  update,
  create,
  insert,
  remove,
  destroy
}
