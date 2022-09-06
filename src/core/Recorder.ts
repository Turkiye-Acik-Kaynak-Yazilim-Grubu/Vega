import { AudioStripEffectObject } from './effectObject/AudioStripEffectObject'
import { Strip } from './Strip'
import { VideoStripEffectObject } from './effectObject/VideoStripEffectObject'
import { Renderer } from '@/core'

export class Recorder {
  data: Blob[] = []
  audioNodes: AudioNode[] = []
  audioCtx!: AudioContext
  elNodeMap: WeakMap<HTMLMediaElement, AudioNode> = new WeakMap()

  recorder?: MediaRecorder
  static main?: Recorder

  stream?: MediaStream
  dst!: MediaStreamAudioDestinationNode

  onEnd?: (blob: Blob) => void

  constructor (private canvas: HTMLCanvasElement) {
    this.canvas = canvas
    Recorder.main = this
  }

  start (strips: Strip[]) {
    this.stream = this.canvas.captureStream()
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext()
    }
    if (!this.dst) {
      this.dst = this.audioCtx.createMediaStreamDestination()
    }

    this.recorder = new MediaRecorder(this.stream, {
      mimeType: 'video/webm;codecs=vp9',
      audioBitsPerSecond: 16 * 1000
    })

    strips.forEach((strip) => {
      strip.effects.forEach((effect) => {
        const stripObj = Renderer.effectObjectMap.get(effect.id)
        if (
          stripObj instanceof AudioStripEffectObject ||
          stripObj instanceof VideoStripEffectObject
        ) {
          let mediaEl: HTMLMediaElement | null = null
          if (stripObj instanceof AudioStripEffectObject) {
            mediaEl = stripObj.audio
          } else if (stripObj instanceof VideoStripEffectObject) {
            mediaEl = stripObj.video
          }
          if (!mediaEl) {
            return
          }
          let node = this.elNodeMap.get(mediaEl)
          if (!node) {
            node = this.audioCtx?.createMediaElementSource(mediaEl)
          }
          node.connect(this.dst)
          this.audioNodes.push(node)
          this.elNodeMap.set(mediaEl, node)
          const ts = this.dst.stream.getAudioTracks()
          ts.forEach((t) => {
            this.stream?.addTrack(t)
          })
        }
      })
    })

    this.recorder.addEventListener('stop', () => {
      this.onEnd?.(new Blob(this.data))
    })

    this.recorder.addEventListener('dataavailable', (ev) => {
      this.data.push(ev.data)
    })

    this.recorder.start(1000)
  }

  stop () {
    this.backAudio()
    this.recorder?.stop()
    this.dst?.disconnect()
    delete this.stream
    delete this.recorder
  }

  /**
   * back audio distination to speaker.
   */
  private backAudio () {
    this.audioNodes.forEach((node) => {
      node.connect(this.audioCtx.destination)
    })
    this.audioNodes = []
  }
}
