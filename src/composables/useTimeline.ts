import { Ref } from 'nuxt/dist/app/compat/capi'
import { EffectUpdateContext, EffectObject } from './../core/EffectObject'
import { initialTimelineState } from '@/core/const'
import { Renderer } from '@/core/Renderer'
import { Timeline } from '@/core/Timeline'
import {
  TextStripEffect,
  VideoStripEffect,
  ImageStripEffect,
  StripEffect,
  AudioStripEffect
} from '@/core/stripEffect'
import { TextStripEffectObject } from '@/core/TextStripEffectObject'

import { VideoStripEffectObject } from '@/core/VideoStripEffectObject'
import { snap } from '@/utils/snap'
import { Strip } from '@/core/Strip'
import { AudioStripEffectObject } from '@/core/AudioStripEffectObject'
import { ImageStripEffectObject } from '@/core/ImageStripEffectObject'
import { Animation } from '@/core/Animation'

function findStripById (id: string, timeline: Timeline) {
  for (const strip of timeline.strips) {
    if (strip.id === id) {
      return strip
    }
  }
  return null
}

function moveStrip (timeline: Ref<Timeline>) {
  return (id: string, start: number, length: number, layer?: number) => {
    const strip = findStripById(id, timeline.value)
    if (!strip) {
      return
    }
    strip.start = snap(start)
    strip.length = snap(length)
    strip.layer = layer ?? strip.layer
  }
}

function changeView (timeline: Ref<Timeline>) {
  return (start: number, end: number) => {
    if (start < 0) {
      start = 0
    }
    if (end > timeline.value.length) {
      end = snap(timeline.value.length)
    }
    if (end - start < 1) {
      end = start + 1
    }
    timeline.value.start = snap(start)
    timeline.value.end = snap(end)
  }
}

const ONE_FRAME = 1 / 60

function update (timeline: Ref<Timeline>) {
  return (time: number, jump = false) => {
    if (time < 0) {
      time = 0
    }
    timeline.value.curent = time
    if (jump) {
      timeline.value.curent = Math.floor(time / ONE_FRAME) * ONE_FRAME
    }

    for (let j = 0; j < timeline.value.strips.length; j++) {
      const strip = timeline.value.strips[j]

      for (let k = 0; k < strip.effects.length; k++) {
        const effect = strip.effects[k]
        const context: EffectUpdateContext = {
          strip,
          effect,
          timeline: timeline.value,
          assets: { assets: [], selectedAssets: [] },
          jump,
          scene: Renderer.scene,
          isPlay: timeline.value.isPlay,
          // TODO add more functions to this context
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          updateStrip: (stripId: string, effect: StripEffect) => {
            const strip = findStripById(stripId, timeline.value)
            if (!strip) {
              return
            }
            const index = strip.effects.findIndex(e => e.id === effect.id)
            if (index === -1) {
              return
            }
            const newAnimations: Animation[] = []
            effect.animations.forEach((a) => {
              if (
                !newAnimations.find(
                  na => na.key === a.key && na.time === a.time
                )
              ) {
                newAnimations.push(a)
              }
            })
            effect.animations = newAnimations
            strip.effects[index] = effect
          }
        }
        Renderer.effectObjectMap.get(effect.id)?.update(context)
      }
    }
  }
}

function play (timeline: Ref<Timeline>) {
  return (state: boolean) => {
    timeline.value.isPlay = state
  }
}

export function isText (effect: StripEffect): effect is TextStripEffect {
  return effect.type === 'Text'
}

export function isVideo (effect: StripEffect): effect is VideoStripEffect {
  return effect.type === 'Video'
}

export function isAudio (effect: StripEffect): effect is AudioStripEffect {
  return effect.type === 'Audio'
}
export function isImage (effect: StripEffect): effect is ImageStripEffect {
  return effect.type === 'Image'
}

export function setTimeline (state: Ref<Timeline>) {
  return (timeline: Timeline) => {
    state.value = timeline
  }
}

export const constructorMap: Record<
  string,
  new (ctx: EffectUpdateContext) => EffectObject
> = {
  Video: VideoStripEffectObject,
  Text: TextStripEffectObject,
  Image: ImageStripEffectObject,
  Audio: AudioStripEffectObject
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
declare function require(args: string[], cb: (result: unknown) => void): void;

export function useTimeline () {
  const timeline = useState('timeline', () => initialTimelineState)
  const assets = useAssets()

  const init = () => {
    for (const strip of timeline.value.strips) {
      for (const effect of strip.effects) {
        const context: EffectUpdateContext = {
          strip,
          effect,
          timeline: timeline.value,
          assets: assets.assets.value,
          jump: false,
          scene: Renderer.scene,
          isPlay: timeline.value.isPlay
        }
        const veo = Renderer.effectObjectMap.get(effect.id)
        if (!veo) {
          if (effect.type === 'Plugin' && 'name' in effect) {
            // TODO fix to id base search
            const asset = context.assets.assets.find(
              a => a.name === effect.name
            )
            if (!asset) {
              return
            }
            if (!constructorMap[asset.name]) {
              require([asset.path], () => {
                require([asset.name], (result: any) => {
                  constructorMap[asset.name] = result.default
                  Renderer.effectObjectMap.set(
                    effect.id,
                    new constructorMap[effect.name](context)
                  )
                })
              })
            } else {
              Renderer.effectObjectMap.set(
                effect.id,
                new constructorMap[effect.name](context)
              )
            }
          } else {
            Renderer.effectObjectMap.set(
              effect.id,
              new constructorMap[effect.type](context)
            )
          }
        } else {
          veo.updateStrip(context)
        }
      }
    }
  }

  return {
    timeline,
    init,
    addStrip: ((state: Ref<Timeline>) => {
      return (strip: Strip) => {
        state.value.strips.push(strip)
      }
    })(timeline),
    removeStrips: ((state: Ref<Timeline>) => {
      return (ids: string[]) => {
        state.value.strips = state.value.strips.filter(
          s => !ids.includes(s.id)
        )
      }
    })(timeline),
    moveStrip: moveStrip(timeline),
    changeView: changeView(timeline),
    update: update(timeline),
    play: play(timeline),
    setTimeline: setTimeline(timeline),
    startRecording: ((state: Ref<Timeline>) => {
      return (value = true) => {
        state.value.isRecording = value
      }
    })(timeline),
    updateLength: ((state: Ref<Timeline>) => {
      return (length: number) => {
        state.value.length = length
      }
    })(timeline),

    getFisrtSelectedStrip: ((state: Ref<Timeline>) => {
      return () => {
        if (state.value.selectedStrips.length > 0) {
          return state.value.selectedStrips[0]
        }
        return null
      }
    })(timeline),

    setFocusStripId: ((state: Ref<Timeline>) => {
      return (id: string) => {
        state.value.focusStripId = id
      }
    })(timeline),

    selectStrip: ((state: Ref<Timeline>) => {
      return (ids: string[]) => {
        const strips = ids
          .map((id) => {
            return findStripById(id, state.value)
          })
          .filter(strip => strip) as Strip[]
        state.value.selectedStrips = strips
      }
    })(timeline),

    updateStrip: ((state: Ref<Timeline>) => {
      return (strip: Strip) => {
        state.value.strips = state.value.strips.map((s) => {
          if (s.id === strip.id) {
            return strip
          }
          return s
        })
      }
    })(timeline),

    updateEffect: ((state: Ref<Timeline>) => {
      return <T extends StripEffect>(stripId: string, effect: T) => {
        const strip = findStripById(stripId, state.value)
        if (!strip) {
          return
        }
        const index = strip.effects.findIndex(e => e.id === effect.id)
        if (index === -1) {
          return
        }
        const newAnimations: Animation[] = []
        effect.animations.forEach((a) => {
          if (
            !newAnimations.find(na => na.key === a.key && na.time === a.time)
          ) {
            newAnimations.push(a)
          }
        })
        effect.animations = newAnimations
        strip.effects[index] = effect
      }
    })(timeline),

    selectKeyframe: ((state: Ref<Timeline>) => {
      return (animations: Animation[]) => {
        state.value.selectedKeyframes = animations
      }
    })(timeline),

    changeTimelineTool: ((state: Ref<Timeline>) => {
      return (tool: 'cursor' | 'cut') => {
        state.value.timelineTool = tool
      }
    })(timeline)
  }
}
