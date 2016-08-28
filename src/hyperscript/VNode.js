/* @flow */
export class VNode {
  _tagName: string
  _id: string
  _classList: Array<string>
  _data: Object
  _children: Array<VNode>
  _text: string | null
  _element: Element | Text | null
  _key: string | number | null

  conctructor (tagName: string, id: string, classList: string[], data: Object,
               children: Array<VNode>, text: string, element: Element | Text | null, key: string | number | null) {
    this._tagName = tagName
    this._id = id
    this._classList = classList
    this._data = data
    this._children = children
    this._text = text
    this._element = element || null
    this._key = key || null
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
      `${this._classList && this._classList.length > 0 ? '.' + this._classList.sort().join('.') : ''}`
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
    return new VNode(tagName, this.id, this.classList, this.data,
      this.children, this.text, this.element, this.key)
  }

  setId (id: string): VNode {
    return new VNode(this.tagName, id, this.classList, this.data,
      this.children, this.text, this.element, this.key)
  }

  setClassList (classList: Array<string>): VNode {
    return new VNode(this.tagName, this.id, classList, this.data,
      this.children, this.text, this.element, this.key)
  }

  setData (data: Object): VNode {
    return new VNode(this.tagName, this.id, this.classList, data,
        this.children, this.text, this.element, this.key)
  }

  setChildren (children: Array<VNode>): VNode {
    return new VNode(this.tagName, this.id, this.classList, this.data,
      children, this.text, this.element, this.key)
  }

  setText (text: string): VNode {
    return new VNode(this.tagName, this.id, this.classList, this.data,
      this.children, text, this.element, this.key)
  }

  setElement (element: Element | Text): VNode {
    return new VNode(this.tagName, this.id, this.classList, this.data,
      this.children, this.text, element, this.key)
  }

  setKey (key: string | number | null): VNode {
    return new VNode(this.tagName, this.id, this.classList, this.data,
      this.children, this.text, this.element, key)
  }
}
