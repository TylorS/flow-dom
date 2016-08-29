/* @flow */
import type { VNode } from './VNode'
import { map, reduce } from '../util'
import { FlowVNode } from './VNode' // eslint-disable-line

const assign = (x: Object, y: Object): Object => Object.assign({}, x, y)

function setSVGNamespace (vNode: VNode): VNode {
  const newVNode = vNode.setData(assign(vNode.data, { ns: 'http://www.w3.org/2000/svg' }))
  if (newVNode.children.length > 0 && newVNode.tagName !== 'foreignObject') {
    return newVNode.setChildren(addNS(newVNode.children))
  }
  return newVNode
}

function addNS (children: any[]): VNode[] {
  return map(setSVGNamespace, children)
}

function convertText (children: any[]): VNode[] {
  return map(function (child: VNode | string): VNode {
    return typeof child === 'string'
      ? new FlowVNode('', '', [], {}, [], child, null, null)
      : (child: VNode)
  }, children)
}

export function h (selector: string, data: Object, childrenOrText: string | Array<VNode>): VNode {
  const { tagName, id, classList } = parseSelector(selector)

  const text = typeof childrenOrText === 'string'
    ? childrenOrText
    : ''

  const children = Array.isArray(childrenOrText)
    ? childrenOrText
    : []

  return new FlowVNode(tagName, id, classList, data,
    tagName === 'svg' ? addNS(children) : convertText(children),
    text, null, data && data.key || null)
}

const classIdSplit = /([\.#]?[a-zA-Z0-9\u007F-\uFFFF_:-]+)/
const notClassId = /^\.|#/

type selectorOuput = { tagName: string, id: string, classList: string[] }

function parseSelector (selector: string): selectorOuput {
  const tagParts = selector.split(classIdSplit)

  if (selector === '') {
    return {
      tagName: 'div',
      id: '',
      classList: []
    }
  }

  const seed = notClassId.test(tagParts[1])
    ? { tagName: 'div', id: '', classList: [] }
    : { tagName: '', id: '', classList: [] }

  return reduce(function (output: selectorOuput, part: string): selectorOuput {
    if (!part) return output

    const type = part.charAt(0)

    if (!output.tagName) {
      output.tagName = part.trim()
    } else if (type === '.') {
      output.classList.push(part.substring(1, part.length).trim())
    } else if (type === '#') {
      output.id = part.substring(1, part.length).trim()
    }

    return output
  }, seed, tagParts)
}
