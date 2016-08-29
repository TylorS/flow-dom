const { init, h } = require('../src/index')
const { fromEvent } = require('most')

const patch = init([])

function view (clicks) {
  return h('div.flow', {}, [
    h('button.btn', {}, 'Click me'),
    h('h1', {}, 'Clicked ' + String(clicks) + ' times!')
  ])
}

const click$ = fromEvent('click', document.body)
  .tap((x) => console.log(x))
  .filter(ev => ev.target.matches('.btn'))

const state$ = click$.scan((x) => x + 1, 0).tap(x => console.log(x))

const view$ = state$.map(view)

view$.scan(patch, document.querySelector('#app')).drain()
