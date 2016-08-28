/* @flow */

import { VNode } from './hyperscript/VNode'

export type CreateHook = (oldVNode: VNode, vNode: VNode) => VNode;
export type UpdateHook = (oldVNode: VNode, vNode: VNode) => VNode;
export type InsertHook = (vNode: VNode) => VNode;
export type RemoveHook = (vNode: VNode, removeCallback: () => void) => void;
export type DestroyHook = (vNode: VNode) => void;

export type Module = {
  create: CreateHook,
  update: UpdateHook,
  insert: InsertHook,
  remove: RemoveHook,
  destroy: DestroyHook
}
