import type { Ref } from 'vue'
import { initialContaerState } from './../core'
import { Container, Position } from '@/core'
import { IVector2 } from '@/core'

const event = new EventTarget()

const MIN_PERCENT = 10

function minMax (value: number) {
  return Math.max(Math.min(value, 100 - MIN_PERCENT), MIN_PERCENT)
}

export default function useContainer () {
  const container = useState('counter', () => initialContaerState)

  /**
   * コンテナをリサイズする
   * @param state 状態
   * @returns
   */
  const resizeContainer = (state: Ref<Container>) => {
    return (payload: { id: string; delta: IVector2 }) => {
      const { id, delta } = payload

      const container = findContainer(state.value, id)
      const parent = findParent(state.value, id)
      const current = parent?.children
      if (!parent || !current || !container) {
        return
      }
      if (current.length <= 1) {
        return
      }
      const i = current.findIndex(c => c.id === id)

      if (parent.align === 'vertical') {
        const r = current[i].rect
        current[i].rect = {
          ...r,
          top: r.top + delta.y,
          height: minMax(r.height - delta.y)
        }
        current[i - 1].rect = {
          ...current[i - 1].rect,
          height: minMax(current[i - 1].rect.height + delta.y)
        }
      } else if (parent.align === 'horizontal') {
        const r = current[i].rect
        current[i].rect = {
          ...r,
          left: r.left + delta.x,
          width: minMax(r.width - delta.x)
        }
        current[i - 1].rect = {
          ...current[i - 1].rect,
          width: minMax(current[i - 1].rect.width + delta.x)
        }
      }

      event.dispatchEvent(new CustomEvent('resize', { detail: state.value }))
    }
  }

  /**
   * レイアウトを変更する
   * @param state 状態
   * @returns
   */
  const changeLayout = (state: Ref<Container>) => {
    return (payload: { from: string; to: string; pos: Position }) => {
      const { from, to, pos } = payload
      const fromContainer = findContainer(state.value, from)
      if (!fromContainer) {
        return
      }
      const fromParent = findParent(state.value, from)
      if (!fromParent) {
        return
      }
      const index = fromParent?.children.findIndex(c => c.id === from)
      if (index === -1) {
        return
      }
      const toContainer = findContainer(state.value, to)
      if (!toContainer) {
        return
      }
      const toParent = findParent(state.value, to)
      if (!toParent) {
        return
      }

      fromParent.children.splice(index, 1)

      // 移動元のコンテナの子が1つになる場合、そのコンテナを削除する
      if (
        fromParent.id !== toParent.id &&
        fromParent.children.length === 1 &&
        fromParent.id !== 'root'
      ) {
        const child = fromParent.children[0]
        fromParent.children = []
        fromParent.panel = child.panel
      }

      if (fromParent.id !== toParent.id) {
        const newChild: Container = {
          id: toContainer.id + '-new',
          align: '',
          children: [],
          rect: { ...toContainer.rect },
          panel: toContainer.panel
        }

        const newChildren: Container[] = [newChild]

        if (pos === 'right' || pos === 'bottom') {
          newChildren.push(fromContainer)
        } else {
          newChildren.splice(0, 0, fromContainer)
        }
        if (pos === 'top' || pos === 'bottom') {
          toContainer.align = 'vertical'
        } else {
          toContainer.align = 'horizontal'
        }

        newChild.rect.width = toContainer.align === 'horizontal' ? 50 : 100
        newChild.rect.height = toContainer.align === 'horizontal' ? 100 : 50

        toContainer.children = newChildren
        toContainer.panel = null

        fromContainer.rect.width =
          toContainer.align === 'horizontal' ? 50 : 100
        fromContainer.rect.height =
          toContainer.align === 'horizontal' ? 100 : 50
      } else {
        if (pos === 'right' || pos === 'bottom') {
          toParent.children.push(fromContainer)
        } else {
          toParent.children.splice(0, 0, fromContainer)
        }
        if (pos === 'top' || pos === 'bottom') {
          toParent.align = 'vertical'
          toContainer.rect.width = 100
          toContainer.rect.height = 50
          fromContainer.rect.width = 100
          fromContainer.rect.height = 50
        } else {
          toParent.align = 'horizontal'
          toContainer.rect.width = 50
          toContainer.rect.height = 100
          fromContainer.rect.width = 50
          fromContainer.rect.height = 100
        }
      }

      if (fromParent.id === 'root' && fromParent.children.length === 1) {
        fromParent.children = fromParent.children[0].children
        fromParent.align = 'horizontal'
        fromParent.rect.width = 100
        fromParent.rect.height = 100
      }
    }
  }
  return {
    container: readonly(container),
    resizeContainer: resizeContainer(container),
    changeLayout: changeLayout(container),
    addEventListener: ((_: Ref<Container>) => {
      return (type: string, listener: EventListenerOrEventListenerObject) => {
        event.addEventListener(type, listener)
      }
    })(container),
    resize: () => {
      event.dispatchEvent(new CustomEvent('resize'))
    },
    setContainer: ((state: Ref<Container>) => {
      return (value: Container) => {
        state.value = value
      }
    })(container)
  }
}

/**
 * コンテナIDからコンテナを検索する
 * @param container コンテナ
 * @param id コンテナID
 * @returns
 */
const findContainer = (container: Container, id: string): Container | null => {
  if (container.id === id) {
    return container
  }
  for (let i = 0; i < container.children.length; i++) {
    const result = findContainer(container.children[i], id)
    if (result) {
      return result
    }
  }
  return null
}

/**
 * コンテナIDから親コンテナを検索する
 * @param container コンテナ
 * @param id コンテナID
 * @returns
 */
const findParent = (container: Container, id: string): Container | null => {
  for (let i = 0; i < container.children.length; i++) {
    if (container.children[i].id === id) {
      return container
    }
  }

  for (let i = 0; i < container.children.length; i++) {
    const result = findParent(container.children[i], id)
    if (result) {
      return result
    }
  }
  return null
}
