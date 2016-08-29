/* @flow */

export type VNode = {
  tagName: string,
  id: string,
  classList: string[],
  selector: string,
  data: Object,
  children: Array<VNode>,
  text: string | null,
  element: Element | Text | null,
  key: string | number | null,

  setTagName(tagName: string): VNode,
  setId(id: string): VNode,
  setClassList(classList: string[]): VNode,
  setData(data: Object): VNode,
  setChildren(children: Array<VNode>): VNode,
  setText(text: string): VNode,
  setElement(element: Element | Text): VNode,
  setKey(key: string | number): VNode
}

export class FlowVNode {
  _tagName: string
  _id: string
  _classList: string[]
  _data: Object
  _children: Array<VNode>
  _text: string
  _element: Element | Text | null
  _key: string | number | null

  constructor (tagName: string, id: string, classList: string[], data: Object, children: Array<VNode>,
               text: string, element: Element | Text | null, key: string | number | null) {
    this._tagName = tagName
    this._id = id
    this._classList = classList
    this._data = data
    this._children = children
    this._text = text
    this._element = element
    this._key = key
  }

  get tagName (): string {
    return this._tagName
  }

  get id (): string {
    return this._id
  }

  get classList (): string[] {
    return this._classList
  }

  get selector (): string {
    return `${this._tagName}${this._id && `#${this._id}` || ''}` +
      `${this._classList && this._classList.length > 0 ? '.' + this._classList.sort().join('') : ''}`
  }

  get data (): Object {
    return this._data
  }

  get children (): Array<VNode> {
    return this._children
  }

  get text (): string | null {
    return this._text
  }

  get element (): Element | Text | null {
    return this._element
  }

  get key (): string | number | null {
    return this._key
  }

  setTagName (tagName: string): VNode {
    return new FlowVNode(tagName, this._id, this._classList, this._data,
      this._children, this._text, this._element, this._key)
  }

  setId (id: string): VNode {
    return new FlowVNode(this._tagName, id, this._classList, this._data,
      this._children, this._text, this._element, this._key)
  }

  setClassList (classList: Array<string>): VNode {
    return new FlowVNode(this._tagName, this._id, classList, this._data,
      this._children, this._text, this._element, this._key)
  }

  setData (data: Object): VNode {
    return new FlowVNode(this._tagName, this._id, this._classList, data,
      this._children, this._text, this._element, this._key)
  }

  setChildren (children: Array<VNode>): VNode {
    return new FlowVNode(this._tagName, this._id, this._classList, this._data,
      children, this._text, this._element, this._key)
  }

  setText (text: string): VNode {
    return new FlowVNode(this._tagName, this._id, this._classList, this._data,
      this._children, text, this._element, this._key)
  }

  setElement (element: Element | Text): VNode {
    return new FlowVNode(this._tagName, this._id, this._classList, this._data,
      this._children, this._text, element, this._key)
  }

  setKey (key: string | number): VNode {
    return new FlowVNode(this._tagName, this._id, this._classList, this._data,
      this._children, this._text, this._element, key)
  }
}
