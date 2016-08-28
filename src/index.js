/* @flow */
import type { Module } from './interfaces'
import { reduce, map, replace } from '@most/prelude'

import { VNode } from './hyperscript/VNode'
import { isUndef, emptyVNodeAt, sameVNode, forEach } from './util'

const emptyVNode = new VNode('', '', [], {}, [], '', null, null)

const id = (x, y): VNode => y

function setTextContent (node: any, text: any) {
  node.setTextContent(text)
}

function insertBefore (parent: any, node: any, before: any) {
  parent.insertVNode(node, before)
}

function removeChild (parent: any, child: any) {
  parent.removeChild(child)
}

function nextSibling (element: any): Element {
  return element.nextSibling
}

const appendChild = (parent: any): Function => (node: any) => { parent.appendChild(node) }

function createKeyToIndex (children: VNode[], beginIdx: number, endIdx: number): Object {
  return reduce(function (map: Object, child: VNode, i: number): Object {
    if (child.key) {
      map[child.key] = i
    }
    return map
  }, {}, children)
}

function callInsert (vNode: VNode): VNode {
  const { data, children } = vNode

  const insertedChildren = children.length > 0
    ? map(callInsert, children)
    : children

  if (data.insert) {
    return data.insert(vNode)
  }

  return vNode.setChildren(insertedChildren)
}

export function init (modules: Module[] = []): (oldVNode: VNode | HTMLElement, vNode: VNode) => VNode {
  // calls all update hooks
  function callUpdateHooks (oldVNode: VNode, vNode: VNode): VNode {
    const [updatedOldVNode, updatedVNode] = reduce(function ([oldVNode, vNode]: [VNode, VNode], module: Module): [VNode, VNode] {
      return [vNode, module.update(oldVNode, vNode)]
    }, [oldVNode, vNode], modules)

    const update = !isUndef(updatedVNode.data) && updatedVNode.data.update || id

    return update(updatedOldVNode, updatedVNode)
  }

  // calls all create hooks
  function callCreateHooks (vNode: VNode): VNode {
    const updatedVNode = reduce(function (vNode: VNode, module: Module): VNode {
      return module.create(emptyVNode, vNode)
    }, vNode, modules)

    const create = vNode.data.insert || id

    return create(emptyVNode, updatedVNode)
  }

  // recursively calls destroy hook on a VNode and all it's children
  function callDestroyHooks (vNode: VNode) {
    const { data, children } = vNode
    if (data.destroy) data.destroy(vNode)

    forEach(function (module: Module) {
      module.destroy(vNode)
    }, modules)

    if (children.length > 0) {
      forEach(callDestroyHooks, children)
    }
  }

  // calls remove hooks
  function callRemoveHooks (vNode: VNode, remove: Function) {
    const { data } = vNode

    forEach(function (module: Module) {
      module.remove(vNode, remove)
    }, modules)

    if (data.remove) {
      data.remove(vNode, remove)
    } else {
      remove()
    }
  }

  // create a new VNode which contains an element
  function createElement (vNode: VNode): VNode {
    const { tagName, id, classList, children: VNodeChildren, text, data } = vNode

    const element = data.ns
      ? document.createElementNS(data.ns, tagName)
      : document.createElement(tagName)

    if (id) element.id = id
    if (classList.length > 0) element.className = classList.join(' ')

    const children = map(createElement, VNodeChildren)

    if (children.length > 0) {
      forEach(appendChild(element), children)
    } else if (text && text.length > 0) {
      setTextContent(element, text)
    }

    return callCreateHooks(vNode.setElement(element).setChildren(children))
  }

  function createRemoveCallback (childElement: any, listeners: number): Function {
    return function () {
      if (--listeners === 0) {
        const parent = childElement.parentNode
        removeChild(parent, childElement)
      }
    }
  }

  function removeVNodes (parent: Node, vNodes: VNode[], startIndex: number, endIndex: number) {
    for (; startIndex < endIndex; ++startIndex) {
      const listeners = modules.length + 1
      const child = vNodes[startIndex]
      if (child) {
        if (child.tagName !== '') {
          callDestroyHooks(child)
          const rm = createRemoveCallback(child.element, listeners)
          callRemoveHooks(child, rm)
        } else { // Text Node
          removeChild(parent, child.element)
        }
      }
    }
  }

  function addVNodes (parent: any, vNode: VNode, before: any): VNode {
    const { children } = vNode

    const childrenWithElements = map(function (child: VNode): VNode {
      insertBefore(parent, child.element, before)
      return callInsert(child)
    }, map(createElement, children))

    return vNode.setChildren(childrenWithElements)
  }

  type UpdateChildren = {
    parent: any,
    // $flow-ignore-line
    oldChildren: Array<VNode>,
    vNode: VNode,
    oldKeyToIndex: Object,
    oldStartIndex: number,
    oldEndIndex: number,
    newStartIndex: number,
    newEndIndex: number,
    oldStartVNode: VNode,
    oldEndVNode: VNode,
    newStartVNode: VNode,
    newEndVNode: VNode
  }

  // update children when they have changed
  function updateChildren ({parent, oldChildren, vNode, oldKeyToIndex,
                            oldStartIndex, oldEndIndex, newStartIndex, newEndIndex,
                            oldStartVNode, oldEndVNode, newStartVNode, newEndVNode }: UpdateChildren): VNode {
    const previousInput = arguments[0]
    const { children } = vNode

    if (oldStartIndex > oldEndIndex) {
      const before = isUndef(children[newEndIndex + 1]) ? null : children[newEndIndex + 1].element
      return addVNodes(parent, vNode, before)
    }

    if (newStartIndex > newEndIndex) {
      removeVNodes(parent, oldChildren, oldStartIndex, oldEndIndex)
      return vNode
    }

    // VNode has moved left in child array

    if (isUndef(oldStartVNode)) {
      const _oldStartIndex = oldStartIndex + 1
      return updateChildren({ ...previousInput,
        oldStartVNode: oldChildren[_oldStartIndex],
        oldStartIndex: _oldStartIndex
      })
    }

    if (isUndef(oldEndVNode)) {
      const _oldEndIndex = oldEndIndex - 1
      return updateChildren({...previousInput,
        oldEndVNode: oldChildren[_oldEndIndex],
        oldEndIndex: _oldEndIndex
      })
    }

    if (sameVNode(oldStartVNode, newStartVNode)) {
      const _updatedVNode = patchVNode(oldStartVNode, newStartVNode)
      const newChildren = replace(_updatedVNode, newStartIndex, children)

      const _oldStartIndex = oldStartIndex + 1
      const _newStartIndex = newStartIndex + 1

      return updateChildren({...previousInput,
        vNode: vNode.setChildren(newChildren),
        oldStartIndex: _oldStartIndex,
        newStartIndex: _newStartIndex,
        oldStartVNode: oldChildren[_oldStartIndex],
        newStartVNode: children[_newStartIndex]
      })
    }

    if (sameVNode(oldEndVNode, newEndVNode)) {
      const updatedVNode = patchVNode(oldEndVNode, newEndVNode)
      const newChildren = replace(updatedVNode, newEndIndex, children)

      const _oldEndIndex = oldEndIndex - 1
      const _newEndIndex = newEndIndex - 1

      return updateChildren({...previousInput,
        vNode: vNode.setChildren(newChildren),
        oldEndIndex: _oldEndIndex,
        newEndIndex: _newEndIndex,
        oldEndVNode: oldChildren[_oldEndIndex],
        newEndVNode: children[_newEndIndex]
      })
    }

    // vNode has moved right in the array
    if (sameVNode(oldStartVNode, newEndVNode)) {
      const updatedVNode = patchVNode(oldStartVNode, newEndVNode)
      const newChildren = replace(updatedVNode, newEndIndex, children)

      insertBefore(parent, oldStartVNode.element, nextSibling(oldEndVNode.element))

      const _oldStartIndex = oldStartIndex + 1
      const _newEndIndex = newEndIndex - 1

      return updateChildren({...previousInput,
        vNode: vNode.setChildren(newChildren),
        oldStartIndex: _oldStartIndex,
        newEndIndex: _newEndIndex,
        oldStartVNode: oldChildren[_oldStartIndex],
        newEndVNode: children[_newEndIndex]
      })
    }

    // vNode moved left
    if (sameVNode(oldEndVNode, newStartVNode)) {
      const updatedVNode = patchVNode(oldEndVNode, newStartVNode)
      const newChildren = replace(updatedVNode, newStartIndex, children)

      insertBefore(parent, oldEndVNode.element, oldStartVNode.element)

      const _oldEndIndex = oldEndIndex - 1
      const _newStartIndex = newStartIndex + 1

      return updateChildren({...previousInput,
        vNode: vNode.setChildren(newChildren),
        oldEndIndex: _oldEndIndex,
        newStartIndex: _newStartIndex,
        oldEndVNode: oldChildren[_oldEndIndex],
        newStartVNode: children[_newStartIndex]
      })
    }

    const indexInOld = oldKeyToIndex[newStartVNode.key]
    if (isUndef(indexInOld)) { // new element
      const _vNode = createElement(newStartVNode)
      insertBefore(parent, _vNode.element, oldStartVNode)

      const _newStartIndex = newStartIndex + 1
      const _newStartVNode = children[_newStartIndex]

      return updateChildren({...previousInput,
        vNode: callInsert(_vNode),
        newStartIndex: _newStartIndex,
        newStartVNode: _newStartVNode
      })
    } else {
      const elementToMove = oldChildren[indexInOld]
      const updatedVNode = patchVNode(elementToMove, newStartVNode)
      const newChildren = replace(updatedVNode, newStartIndex, children)
      const _vNode = vNode.setChildren(newChildren)
      // $flow-ignore-line
      oldChildren[indexInOld] = undefined
      insertBefore(parent, elementToMove.element, oldStartVNode.element)
      const _newStartIndex = newStartIndex + 1
      const _newStartVNode = children[_newStartIndex]
      return updateChildren({...previousInput,
        vNode: _vNode,
        newStartIndex: _newStartIndex,
        newStartVNode: _newStartVNode
      })
    }
  }

  // updates the DOM and VNode with the current information it should have
  function patchVNode (oldVNode: VNode, vNode: VNode): VNode {
    // if the previous and current are equal do nothing
    if (oldVNode === vNode) return vNode

    // if the vNode has changed drastically create a new one an replace the old
    if (!sameVNode(oldVNode, vNode)) {
      const parent = oldVNode.element && oldVNode.element.parentNode
      const newVNode = createElement(vNode)
      insertBefore(parent, newVNode.element, oldVNode.element)
      const updatedVNode = callInsert(newVNode)
      if (parent !== null && parent !== undefined) {
        removeVNodes(parent, [oldVNode], 0, 0)
      }
      return updatedVNode
    }

    const updatedVNode = callUpdateHooks(oldVNode, vNode)

    const { element, children } = updatedVNode

    // lets update the DOM
    if (updatedVNode.text === '') {
      if (oldVNode.children.length > 0 && children.length > 0) { // children have changed somehow
        if (oldVNode.children === updatedVNode.children) return updatedVNode

        const oldEndIndex = oldVNode.children.length - 1
        const newEndIndex = children.length - 1

        const oldStartVNode = oldVNode.children[0]
        const oldEndVNode = oldVNode.children[oldEndIndex]
        const newStartVNode = children[0]
        const newEndVNode = children[newEndIndex]

        const input: UpdateChildren = {
          parent: element,
          oldChildren: oldVNode.children,
          vNode: updatedVNode,
          oldKeyToIndex: createKeyToIndex(oldVNode.children, 0, oldEndIndex),
          oldStartIndex: 0,
          oldEndIndex,
          newStartIndex: 0,
          newEndIndex,
          oldStartVNode,
          oldEndVNode,
          newStartVNode,
          newEndVNode
        }

        return updateChildren(input)
      } else if (children.length > 0) { // children have been added when there were none
        if (oldVNode.text !== '') setTextContent(element, '')
        return addVNodes(element, updatedVNode, null)
      } else if (oldVNode.children.length > 0) { // children have been completely removed
        if (updatedVNode.element) {
          removeVNodes(updatedVNode.element, oldVNode.children, 0, oldVNode.children.length - 1)
        }
        return updatedVNode
      } else if (oldVNode.text !== '') { // text has been removed
        setTextContent(updatedVNode.element, '')
        return updatedVNode
      }
    } else if (oldVNode.text !== updatedVNode.text) { // update text if needed
      setTextContent(element, updatedVNode.text)
    }

    return updatedVNode
  }

  return function patch (oldVNode: VNode | HTMLElement, vNode: VNode): VNode {
    if (oldVNode === vNode) return vNode

    const previousVNode = oldVNode instanceof HTMLElement
      ? emptyVNodeAt(oldVNode)
      : oldVNode

    if (sameVNode(previousVNode, vNode)) {
      return patchVNode(previousVNode, vNode)
    }

    const { element } = previousVNode
    const parent = element && element.parentNode

    const newVNode = createElement(vNode)

    if (parent) {
      insertBefore(parent, newVNode.element, element && element.nextSibling)
      return callInsert(newVNode)
    }

    return newVNode
  }
}
