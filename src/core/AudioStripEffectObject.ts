import { AudioStripEffect } from './stripEffect/AudioStripEffect'
import { firstInterfact } from './Global'
import { Strip } from './Strip'
import { EffectObject, EffectUpdateContext } from './EffectObject'

export class AudioStripEffectObject extends EffectObject {
  type = 'Audio'
  loaded = false
  videoOffset = 0
  inProgress = false
  audio: HTMLAudioElement

  constructor (iface: AudioStripEffect, src: string) {
    super()
    this.audio = document.createElement('audio')
    document.body.append(this.audio)

    this.audio.volume = iface.volume
    this.updateAsset(src)
  }

  public updateAsset (src: string) {
    this.loaded = false
    const onLoad = () => {
      if (this.loaded) { return }
      this.loaded = true
    }
    this.audio.onloadedmetadata = () => onLoad()
    this.audio.src = src
    this.audio.load()
  }

  prevTime = 0

  public update ({ strip, effect: _effect, timeline, isPlay, jump }: EffectUpdateContext) {
    const effect = _effect as AudioStripEffect
    const time = timeline.curent
    if (!this.loaded) {
      this.audio.volume = 0
      return
    }

    if (strip.start <= time && time < strip.start + strip.length) {
      this.audio.volume = effect.volume

      // When move strip and
      if (this.prevTime !== strip.start) {
        this.audio.currentTime = time - strip.start + effect.start
      }

      if ((isPlay && this.audio.paused) || jump) {
        // cannot play without user interaction
        if (firstInterfact) {
          if (!this.inProgress) {
            this.inProgress = true
            this.audio.play().then(() => {
              this.inProgress = false
            })
          }
          this.audio.currentTime = time - strip.start + effect.start
        }
      }
      if (!isPlay && !this.inProgress) {
        this.audio.pause()
      }
    } else {
      this.audio.volume = 0
      if (!this.audio.paused && !this.inProgress) {
        this.audio.pause()
      }
    }
    this.prevTime = strip.start
  }
}
