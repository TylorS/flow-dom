(function () {
'use strict';

function interopDefault(ex) {
	return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var executor = createCommonjsModule(function (module) {
'use strict';

function render(nodes) {
  var children = [];
  var j;
  var c;
  var i;
  var e;
  var n;

  for (i = 0; i < nodes.length; i++) {
    n = nodes[i];
    if (n.children !== null) {
      e = document.createElement('div');
      c = render(n.children);
      for (j = 0; j < c.length; j++) {
        e.appendChild(c[j]);
      }
      children.push(e);
    } else {
      e = document.createElement('span');
      e.textContent = n.key.toString();
      children.push(e);
    }
  }

  return children;
}

function testInnerHtml(testName, nodes, container) {
  var c = document.createElement('div');
  var e = document.createElement('div');
  var children = render(nodes);
  for (var i = 0; i < children.length; i++) {
    e.appendChild(children[i]);
  }
  c.appendChild(e);
  if (c.innerHTML !== container.innerHTML) {
    console.log('error in test: ' + testName);
    console.log('container.innerHTML:');
    console.log(container.innerHTML);
    console.log('should be:');
    console.log(c.innerHTML);
  }
}

function Executor(impl, container, tests, iterations, cb, iterCb, enableTests) {
  if (iterCb === void 0) iterCb = null;

  this.impl = impl;
  this.container = container;
  this.tests = tests;
  this.iterations = iterations;
  this.cb = cb;
  this.iterCb = iterCb;
  this.enableTests = enableTests;

  this._currentTest = 0;
  this._currentIter = 0;
  this._renderSamples = [];
  this._updateSamples = [];
  this._result = [];

  this._tasksCount = tests.length * iterations;

  this._iter = this.iter.bind(this);
}

Executor.prototype.start = function () {
  this._iter();
};

Executor.prototype.finished = function () {
  this.cb(this._result);
};

Executor.prototype.progress = function () {
  if (this._currentTest === 0 && this._currentIter === 0) {
    return 0;
  }

  var tests = this.tests;
  return (this._currentTest * tests.length + this._currentIter) / (tests.length * this.iterataions);
};

Executor.prototype.iter = function () {
  if (this.iterCb != null) {
    this.iterCb(this);
  }

  var tests = this.tests;

  if (this._currentTest < tests.length) {
    var test = tests[this._currentTest];

    if (this._currentIter < this.iterations) {
      var e, t;
      var renderTime, updateTime;

      e = new this.impl(this.container, test.data.a, test.data.b);
      e.setUp();

      t = window.performance.now();
      e.render();
      renderTime = window.performance.now() - t;

      if (this.enableTests) {
        testInnerHtml(test.name + 'render()', test.data.a, this.container);
      }

      t = window.performance.now();
      e.update();
      updateTime = window.performance.now() - t;

      if (this.enableTests) {
        testInnerHtml(test.name + 'update()', test.data.b, this.container);
      }

      e.tearDown();

      this._renderSamples.push(renderTime);
      this._updateSamples.push(updateTime);

      this._currentIter++;
    } else {
      this._result.push({
        name: test.name + ' ' + 'render()',
        data: this._renderSamples.slice(0)
      });

      this._result.push({
        name: test.name + ' ' + 'update()',
        data: this._updateSamples.slice(0)
      });

      this._currentTest++;

      this._currentIter = 0;
      this._renderSamples = [];
      this._updateSamples = [];
    }

    setTimeout(this._iter, 0);
  } else {
    this.finished();
  }
};

module.exports = Executor;
});

var executor$1 = interopDefault(executor);


var require$$0$1 = Object.freeze({
  default: executor$1
});

var benchmark$1 = createCommonjsModule(function (module) {
'use strict';

var Executor = interopDefault(require$$0$1);

function Benchmark() {
  this.running = false;
  this.impl = null;
  this.tests = null;
  this.reportCallback = null;
  this.enableTests = false;

  this.container = document.createElement('div');

  this._runButton = document.getElementById('RunButton');
  this._iterationsElement = document.getElementById('Iterations');
  this._reportElement = document.createElement('pre');

  document.body.appendChild(this.container);
  document.body.appendChild(this._reportElement);

  var self = this;

  this._runButton.addEventListener('click', function (e) {
    e.preventDefault();

    if (!self.running) {
      var iterations = parseInt(self._iterationsElement.value);
      if (iterations <= 0) {
        iterations = 10;
      }

      self.run(iterations);
    }
  }, false);

  this.ready(true);
}

Benchmark.prototype.ready = function (v) {
  if (v) {
    this._runButton.disabled = '';
  } else {
    this._runButton.disabled = 'true';
  }
};

Benchmark.prototype.run = function (iterations) {
  var self = this;
  this.running = true;
  this.ready(false);

  new Executor(self.impl, self.container, self.tests, 1, function () {
    // warmup
    new Executor(self.impl, self.container, self.tests, iterations, function (samples) {
      self._reportElement.textContent = JSON.stringify(samples, null, ' ');
      self.running = false;
      self.ready(true);
      if (self.reportCallback != null) {
        self.reportCallback(samples);
      }
    }, undefined, false).start();
  }, undefined, this.enableTests).start();
};

module.exports = Benchmark;
});

var benchmark$2 = interopDefault(benchmark$1);


var require$$0 = Object.freeze({
  default: benchmark$2
});

var index = createCommonjsModule(function (module) {
'use strict';

var Benchmark = interopDefault(require$$0);
var benchmark = new Benchmark();

function initFromScript(scriptUrl, impl) {
  var e = document.createElement('script');
  e.src = scriptUrl;

  e.onload = function () {
    benchmark.tests = window.generateBenchmarkData().units;
    benchmark.ready(true);
  };

  document.head.appendChild(e);
}

function initFromParentWindow(parent, name, version, id) {
  window.addEventListener('message', function (e) {
    var data = e.data;
    var type = data.type;

    if (type === 'tests') {
      benchmark.tests = data.data;
      benchmark.reportCallback = function (samples) {
        parent.postMessage({
          type: 'report',
          data: {
            name: name,
            version: version,
            samples: samples
          },
          id: id
        }, '*');
      };
      benchmark.ready(true);

      parent.postMessage({
        type: 'ready',
        data: null,
        id: id
      }, '*');
    } else if (type === 'run') {
      benchmark.run(data.data.iterations);
    }
  }, false);

  parent.postMessage({
    type: 'init',
    data: null,
    id: id
  }, '*');
}

function init(name, version, impl) {
  // Parse Query String.
  var qs = function (a) {
    if (a == "") return {};
    var b = {};
    for (var i = 0; i < a.length; ++i) {
      var p = a[i].split('=', 2);
      if (p.length == 1) {
        b[p[0]] = "";
      } else {
        b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
      }
    }
    return b;
  }(window.location.search.substr(1).split('&'));

  if (qs['name'] !== void 0) {
    name = qs['name'];
  }

  if (qs['version'] !== void 0) {
    version = qs['version'];
  }

  var type = qs['type'];

  if (qs['test'] !== void 0) {
    benchmark.enableTests = true;
    console.log('tests enabled');
  }

  var id;
  if (type === 'iframe') {
    id = qs['id'];
    if (id === void 0) id = null;
    initFromParentWindow(window.parent, name, version, id);
  } else if (type === 'window') {
    if (window.opener != null) {
      id = qs['id'];
      if (id === void 0) id = null;
      initFromParentWindow(window.opener, name, version, id);
    } else {
      console.log('Failed to initialize: opener window is NULL');
    }
  } else {
    var testsUrl = qs['data']; // url to the script generating test data
    if (testsUrl !== void 0) {
      initFromScript(testsUrl);
    } else {
      console.log('Failed to initialize: cannot load tests data');
    }
  }

  benchmark.impl = impl;
}

// performance.now() polyfill
// https://gist.github.com/paulirish/5438650
// prepare base perf object
if (typeof window.performance === 'undefined') {
  window.performance = {};
}
if (!window.performance.now) {
  var nowOffset = Date.now();
  if (performance.timing && performance.timing.navigationStart) {
    nowOffset = performance.timing.navigationStart;
  }
  window.performance.now = function now() {
    return Date.now() - nowOffset;
  };
}

module.exports = init;
});

var benchmark = interopDefault(index);

// copy :: [a] -> [a]
// duplicate a (shallow duplication)
function copy(a) {
  var l = a.length;
  var b = new Array(l);
  for (var i = 0; i < l; ++i) {
    b[i] = a[i];
  }
  return b;
}

// map :: (a -> b) -> [a] -> [b]
// transform each element with f
function map(f, a) {
  var l = a.length;
  var b = new Array(l);
  for (var i = 0; i < l; ++i) {
    b[i] = f(a[i]);
  }
  return b;
}

// reduce :: (a -> b -> a) -> a -> [b] -> a
// accumulate via left-fold
function reduce(f, z, a) {
  var r = z;
  for (var i = 0, l = a.length; i < l; ++i) {
    r = f(r, a[i], i);
  }
  return r;
}

var VNode = function VNode () {};

var prototypeAccessors = { tagName: {},id: {},classList: {},selector: {},data: {},children: {},text: {},element: {},key: {} };

VNode.prototype.conctructor = function conctructor (tagName, id, classList, data, children, text, element, key) {
  this._tagName = tagName;
  this._id = id;
  this._classList = classList;
  this._data = data;
  this._children = children;
  this._text = text;
  this._element = element || null;
  this._key = key || null;
};

prototypeAccessors.tagName.get = function () {
  return this._tagName;
};

prototypeAccessors.id.get = function () {
  return this._id;
};

prototypeAccessors.classList.get = function () {
  return this._classList;
};

prototypeAccessors.selector.get = function () {
  return "" + (this._tagName) + (this._id && ("#" + (this._id)) || '') + "" + (this._classList && this._classList.length > 0 ? '.' + this._classList.sort().join('.') : '');
};

prototypeAccessors.data.get = function () {
  return this._data;
};

prototypeAccessors.children.get = function () {
  return this._children;
};

prototypeAccessors.text.get = function () {
  return this._text;
};

prototypeAccessors.element.get = function () {
  return this._element;
};

prototypeAccessors.key.get = function () {
  return this._key;
};

VNode.prototype.setTagName = function setTagName (tagName) {
  return new VNode(tagName, this.id, this.classList, this.data, this.children, this.text, this.element, this.key);
};

VNode.prototype.setId = function setId (id) {
  return new VNode(this.tagName, id, this.classList, this.data, this.children, this.text, this.element, this.key);
};

VNode.prototype.setClassList = function setClassList (classList) {
  return new VNode(this.tagName, this.id, classList, this.data, this.children, this.text, this.element, this.key);
};

VNode.prototype.setData = function setData (data) {
  return new VNode(this.tagName, this.id, this.classList, data, this.children, this.text, this.element, this.key);
};

VNode.prototype.setChildren = function setChildren (children) {
  return new VNode(this.tagName, this.id, this.classList, this.data, children, this.text, this.element, this.key);
};

VNode.prototype.setText = function setText (text) {
  return new VNode(this.tagName, this.id, this.classList, this.data, this.children, text, this.element, this.key);
};

VNode.prototype.setElement = function setElement (element) {
  return new VNode(this.tagName, this.id, this.classList, this.data, this.children, this.text, element, this.key);
};

VNode.prototype.setKey = function setKey (key) {
  return new VNode(this.tagName, this.id, this.classList, this.data, this.children, this.text, this.element, key);
};

Object.defineProperties( VNode.prototype, prototypeAccessors );

function isUndef(x) {
  return x === void 0;
}

function emptyVNodeAt(node) {
  return new VNode(node.tagName.toLowerCase(), node.id || '', copy(node.classList), {}, [], node, null);
}

function sameVNode(a, b) {
  return a.selector === b.selector && a.key === b.key;
}

function forEach(f, arr) {
  var length = arr.length;
  for (var i = 0; i < length; ++i) {
    // eslint-disable-line immutable/no-let
    f(arr[i], i);
  }
}

var _extends = Object.assign || function (target) {
var arguments$1 = arguments;
 for (var i = 1; i < arguments.length; i++) { var source = arguments$1[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var emptyVNode = new VNode('', '', [], {}, [], '', null, null);

var id = function (x, y) { return y; };

function setTextContent(node, text) {
  node.setTextContent(text);
}

function insertBefore(parent, node, before) {
  parent.insertVNode(node, before);
}

function removeChild(parent, child) {
  parent.removeChild(child);
}

function nextSibling(element) {
  return element.nextSibling;
}

var appendChild = function (parent) { return function (node) {
  parent.appendChild(node);
}; };

function createKeyToIndex(children, beginIdx, endIdx) {
  return reduce(function (map, child, i) {
    if (child.key) {
      map[child.key] = i;
    }
    return map;
  }, {}, children);
}

function init(modules) {
  if ( modules === void 0 ) modules = [];

  // calls all update hooks
  function callUpdateHooks(oldVNode, vNode) {
    var ref = reduce(function (ref, module) {
      var oldVNode = ref[0];
      var vNode = ref[1];

      return [vNode, module.update(oldVNode, vNode)];
    }, [oldVNode, vNode], modules);
    var updatedOldVNode = ref[0];
    var updatedVNode = ref[1];

    var insert = !isUndef(updatedVNode.data) && updatedVNode.data.insert || id;

    return insert(updatedOldVNode, updatedVNode);
  }

  // calls all create hooks
  function callCreateHooks(vNode) {
    var updatedVNode = reduce(function (vNode, module) {
      return module.create(emptyVNode, vNode);
    }, vNode, modules);

    var create = vNode.data.insert || id;

    return create(emptyVNode, updatedVNode);
  }

  // recursively calls destroy hook on a VNode and all it's children
  function callDestroyHooks(vNode) {
    var data = vNode.data;
    var children = vNode.children;
    if (data.destroy) data.destroy(vNode);

    forEach(function (module) {
      module.destroy(vNode);
    }, modules);

    if (children.length > 0) {
      forEach(callDestroyHooks, children);
    }
  }

  // calls remove hooks
  function callRemoveHooks(vNode, remove) {
    var data = vNode.data;

    forEach(function (module) {
      module.remove(vNode, remove);
    }, modules);

    if (data.remove) {
      data.remove(vNode, remove);
    } else {
      remove();
    }
  }

  // create a new VNode which contains an element
  function createElement(vNode) {
    var tagName = vNode.tagName;
    var id = vNode.id;
    var classList = vNode.classList;
    var VNodeChildren = vNode.children;
    var text = vNode.text;
    var data = vNode.data;

    var element = data.ns ? document.createElementNS(data.ns, tagName) : document.createElement(tagName);

    if (id) element.id = id;
    if (classList.length > 0) element.className = classList.join(' ');

    var children = map(createElement, VNodeChildren);

    if (children.length > 0) {
      forEach(appendChild(element), children);
    } else if (text && text.length > 0) {
      setTextContent(element, text);
    }

    return callCreateHooks(vNode.setElement(element).setChildren(children));
  }

  function createRemoveCallback(childElement, listeners) {
    return function () {
      if (--listeners === 0) {
        var parent = childElement.parentNode;
        removeChild(parent, childElement);
      }
    };
  }

  function removeVNodes(parent, vNodes, startIndex, endIndex) {
    for (; startIndex < endIndex; ++startIndex) {
      var listeners = modules.length + 1;
      var child = vNodes[startIndex];
      if (child) {
        if (child.tagName !== '') {
          callDestroyHooks(child);
          var rm = createRemoveCallback(child.element, listeners);
          callRemoveHooks(child, rm);
        } else {
          // Text Node
          removeChild(parent, child.element);
        }
      }
    }
  }

  function addVNodes(parent, vNode, before) {
    var children = vNode.children;

    var childrenWithElements = map(createElement, children);

    forEach(function (child) {
      insertBefore(parent, child.element, before);
    }, childrenWithElements);

    return vNode.setChildren(childrenWithElements);
  }

  // update children when they have changed
  function updateChildren(ref) {
    var parent = ref.parent;
    var oldChildren = ref.oldChildren;
    var vNode = ref.vNode;
    var oldKeyToIndex = ref.oldKeyToIndex;
    var oldStartIndex = ref.oldStartIndex;
    var oldEndIndex = ref.oldEndIndex;
    var newStartIndex = ref.newStartIndex;
    var newEndIndex = ref.newEndIndex;
    var oldStartVNode = ref.oldStartVNode;
    var oldEndVNode = ref.oldEndVNode;
    var newStartVNode = ref.newStartVNode;
    var newEndVNode = ref.newEndVNode;

    var previousInput = arguments[0];
    var children = vNode.children;

    if (oldStartIndex > oldEndIndex) {
      var before = isUndef(children[newEndIndex + 1]) ? null : children[newEndIndex + 1].element;
      return addVNodes(parent, vNode, before);
    }

    if (newStartIndex > newEndIndex) {
      removeVNodes(parent, oldChildren, oldStartIndex, oldEndIndex);
      return vNode;
    }

    // VNode has moved left in child array

    if (isUndef(oldStartVNode)) {
      var _oldStartIndex = oldStartIndex + 1;
      return updateChildren(_extends({}, previousInput, {
        oldStartVNode: oldChildren[_oldStartIndex],
        oldStartIndex: _oldStartIndex
      }));
    }

    if (isUndef(oldEndVNode)) {
      var _oldEndIndex = oldEndIndex - 1;
      return updateChildren(_extends({}, previousInput, {
        oldEndVNode: oldChildren[_oldEndIndex],
        oldEndIndex: _oldEndIndex
      }));
    }

    if (sameVNode(oldStartVNode, newStartVNode)) {
      var _updatedVNode = patchVNode(oldStartVNode, newStartVNode);
      children[newStartIndex] = _updatedVNode; // mutation

      var _oldStartIndex$1 = oldStartIndex + 1;
      var _newStartIndex = newStartIndex + 1;

      return updateChildren(_extends({}, previousInput, {
        vNode: vNode.setChildren(children),
        oldStartIndex: _oldStartIndex$1,
        newStartIndex: _newStartIndex,
        oldStartVNode: oldChildren[_oldStartIndex$1],
        newStartVNode: children[_newStartIndex]
      }));
    }

    if (sameVNode(oldEndVNode, newEndVNode)) {
      var updatedVNode = patchVNode(oldEndVNode, newEndVNode);
      children[newEndIndex] = updatedVNode; // mutation

      var _oldEndIndex$1 = oldEndIndex - 1;
      var _newEndIndex = newEndIndex - 1;

      return updateChildren(_extends({}, previousInput, {
        vNode: vNode.setChildren(children),
        oldEndIndex: _oldEndIndex$1,
        newEndIndex: _newEndIndex,
        oldEndVNode: oldChildren[_oldEndIndex$1],
        newEndVNode: children[_newEndIndex]
      }));
    }

    // vNode has moved right in the array
    if (sameVNode(oldStartVNode, newEndVNode)) {
      var updatedVNode$1 = patchVNode(oldStartVNode, newEndVNode);
      children[newEndIndex] = updatedVNode$1; // mutation

      insertBefore(parent, oldStartVNode.element, nextSibling(oldEndVNode.element));

      var _oldStartIndex$2 = oldStartIndex + 1;
      var _newEndIndex$1 = newEndIndex - 1;

      return updateChildren(_extends({}, previousInput, {
        vNode: vNode.setChildren(children),
        oldStartIndex: _oldStartIndex$2,
        newEndIndex: _newEndIndex$1,
        oldStartVNode: oldChildren[_oldStartIndex$2],
        newEndVNode: children[_newEndIndex$1]
      }));
    }

    // vNode moved left
    if (sameVNode(oldEndVNode, newStartVNode)) {
      var updatedVNode$2 = patchVNode(oldEndVNode, newStartVNode);
      children[newStartIndex] = updatedVNode$2; // mutation

      insertBefore(parent, oldEndVNode.element, oldStartVNode.element);

      var _oldEndIndex$2 = oldEndIndex - 1;
      var _newStartIndex$1 = newStartIndex + 1;

      return updateChildren(_extends({}, previousInput, {
        vNode: vNode.setChildren(children),
        oldEndIndex: _oldEndIndex$2,
        newStartIndex: _newStartIndex$1,
        oldEndVNode: oldChildren[_oldEndIndex$2],
        newStartVNode: children[_newStartIndex$1]
      }));
    }

    var indexInOld = oldKeyToIndex[newStartVNode.key];
    if (isUndef(indexInOld)) {
      // new element
      var _vNode = createElement(newStartVNode);
      insertBefore(parent, vNode.element, oldStartVNode);

      var _newStartIndex$2 = newStartIndex + 1;
      var _newStartVNode = children[_newStartIndex$2];

      return updateChildren(_extends({}, previousInput, {
        vNode: _vNode,
        newStartIndex: _newStartIndex$2,
        newStartVNode: _newStartVNode
      }));
    } else {
      var elementToMove = oldChildren[indexInOld];
      var updatedVNode$3 = patchVNode(elementToMove, newStartVNode);
      children[newStartIndex] = updatedVNode$3;
      var _vNode$1 = vNode.setChildren(children);
      // $flow-ignore-line
      oldChildren[indexInOld] = undefined;
      insertBefore(parent, elementToMove.element, oldStartVNode.element);
      var _newStartIndex$3 = newStartIndex + 1;
      var _newStartVNode$1 = children[_newStartIndex$3];
      return updateChildren(_extends({}, previousInput, {
        vNode: _vNode$1,
        newStartIndex: _newStartIndex$3,
        newStartVNode: _newStartVNode$1
      }));
    }
  }

  // updates the DOM and VNode with the current information it should have
  function patchVNode(oldVNode, vNode) {
    // if the previous and current are equal do nothing
    if (oldVNode === vNode) return vNode;

    // if the vNode has changed drastically create a new one an replace the old
    if (!sameVNode(oldVNode, vNode)) {
      var parent = oldVNode.element && oldVNode.element.parentNode;
      var newVNode = createElement(vNode);
      insertBefore(parent, newVNode.element, oldVNode.element);
      if (parent !== null && parent !== undefined) {
        removeVNodes(parent, [oldVNode], 0, 0);
      }
      return newVNode;
    }

    var updatedVNode = callUpdateHooks(oldVNode, vNode);

    var element = updatedVNode.element;
    var children = updatedVNode.children;

    // lets update the DOM
    if (updatedVNode.text === '') {
      if (oldVNode.children.length > 0 && children.length > 0) {
        // children have changed somehow
        if (oldVNode.children === updatedVNode.children) return updatedVNode;

        var oldEndIndex = oldVNode.children.length - 1;
        var newEndIndex = children.length - 1;

        var oldStartVNode = oldVNode.children[0];
        var oldEndVNode = oldVNode.children[oldEndIndex];
        var newStartVNode = children[0];
        var newEndVNode = children[newEndIndex];

        var input = {
          parent: element,
          oldChildren: oldVNode.children,
          vNode: updatedVNode,
          oldKeyToIndex: createKeyToIndex(oldVNode.children, 0, oldEndIndex),
          oldStartIndex: 0,
          oldEndIndex: oldEndIndex,
          newStartIndex: 0,
          newEndIndex: newEndIndex,
          oldStartVNode: oldStartVNode,
          oldEndVNode: oldEndVNode,
          newStartVNode: newStartVNode,
          newEndVNode: newEndVNode
        };

        return updateChildren(input);
      } else if (children.length > 0) {
        // children have been added when there were none
        if (oldVNode.text !== '') setTextContent(element, '');
        return addVNodes(element, updatedVNode, null);
      } else if (oldVNode.children.length > 0) {
        // children have been completely removed
        if (updatedVNode.element) {
          removeVNodes(updatedVNode.element, oldVNode.children, 0, oldVNode.children.length - 1);
        }
        return updatedVNode;
      } else if (oldVNode.text !== '') {
        // text has been removed
        setTextContent(updatedVNode.element, '');
        return updatedVNode;
      }
    } else if (oldVNode.text !== updatedVNode.text) {
      // update text if needed
      setTextContent(element, updatedVNode.text);
    }

    return updatedVNode;
  }

  return function patch(oldVNode, vNode) {
    if (oldVNode === vNode) return vNode;

    var previousVNode = oldVNode instanceof HTMLElement ? emptyVNodeAt(oldVNode) : oldVNode;

    if (sameVNode(previousVNode, vNode)) {
      return patchVNode(previousVNode, vNode);
    }

    var element = previousVNode.element;
    var parent = element && element.parentNode;

    var newVNode = createElement(vNode);

    if (parent) {
      insertBefore(parent, newVNode.element, element && element.nextSibling);
    }

    return newVNode;
  };
}

var assign = function (x, y) { return Object.assign({}, x, y); };

function setSVGNamespace(vNode) {
  var newVNode = vNode.setData(assign(vNode.data, { ns: 'http://www.w3.org/2000/svg' }));
  if (newVNode.children.length > 0 && newVNode.tagName !== 'foreignObject') {
    return newVNode.setChildren(addNS(newVNode.children));
  }
  return newVNode;
}

function addNS(children) {
  return map(setSVGNamespace, children);
}

function convertText(children) {
  return map(function (child) {
    return typeof child === 'string' ? new VNode('', '', [], {}, [], child, null, null) : child;
  }, children);
}

function h(selector, data, childrenOrText) {
  var ref = parseSelector(selector);
  var tagName = ref.tagName;
  var id = ref.id;
  var classList = ref.classList;

  var text = typeof childrenOrText === 'string' ? childrenOrText : '';

  var children = Array.isArray(childrenOrText) ? childrenOrText : [];

  return new VNode(tagName, id, classList, data, tagName === 'svg' ? addNS(children) : convertText(children), text, null, data && data.key || null);
}

var classIdSplit = /([\.#]?[a-zA-Z0-9\u007F-\uFFFF_:-]+)/;
var notClassId = /^\.|#/;

function parseSelector(selector) {
  var tagParts = selector.split(classIdSplit);

  if (selector === '') {
    return {
      tagName: 'div',
      id: '',
      classList: []
    };
  }

  var seed = notClassId.test(tagParts[1]) ? { tagName: 'div', id: '', classList: [] } : { tagName: '', id: '', classList: [] };

  return reduce(function (output, part) {
    if (!part) return output;

    var type = part.charAt(0);

    if (!output.tagName) {
      output.tagName = part.trim();
    } else if (type === '.') {
      output.classList.push(part.trim());
    } else if (type === '#') {
      output.id = part.substring(1, part.length).trim();
    }

    return output;
  }, seed, tagParts);
}

var patch = init([]);

var NAME = 'flow-dom';
var VERSION = '1.0.0';

function convertToVnodes(nodes) {
  return nodes.map(function (n) {
    if (n.children !== null) {
      return h('div', { key: n.key }, convertToVnodes(n.children));
    }
    return h('div', { key: n.key }, n.key);
  });
}

function BenchmarkImpl(container, a, b) {
  this.container = container;
  this.a = a;
  this.b = b;
  this.vnode = null;
}

BenchmarkImpl.prototype.setUp = function () {};

BenchmarkImpl.prototype.tearDown = function () {
  patch(this.vnode, h('div'));
};

BenchmarkImpl.prototype.render = function () {
  var elm = document.createElement('div');
  this.vnode = patch(elm, h('div', convertToVnodes(this.a)));
  this.container.appendChild(elm);
};

BenchmarkImpl.prototype.update = function () {
  this.vnode = patch(this.vnode, h('div', convertToVnodes(this.b)));
};

document.addEventListener('DOMContentLoaded', function (e) {
  benchmark(NAME, VERSION, BenchmarkImpl);
}, false);

}());