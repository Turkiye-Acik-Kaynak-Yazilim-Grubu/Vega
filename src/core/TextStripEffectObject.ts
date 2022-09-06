import * as THREE from 'three'
import { calcAnimationValue } from './utils/calcAnimationValue'
import { EffectObject } from './EffectObject'
import { EffectUpdateContext } from './EffectUpdateContext'
import { TextStripEffect, VideoStripEffect } from './stripEffect'
import { Strip } from './Strip'
import { Timeline } from './Timeline'

export class TextStripEffectObject extends EffectObject {
  // id: string;
  obj: THREE.Mesh
  texture: THREE.CanvasTexture
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  geometry?: THREE.PlaneBufferGeometry
  material?: THREE.MeshBasicMaterial

  text: string

  /**
   * 計算したテキストの幅
   */
  mesureWidth = 0
  mesureHeight = 0

  constructor (ctx:EffectUpdateContext) {
    super(ctx)
    const itext = ctx.effect as TextStripEffect
    this.text = itext.text
    // this.fontFamily = itext.fontFamily;
    this.canvas = document.createElement('canvas')
    this.canvas.width = 2048
    this.canvas.height = 1024
    this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D
    this.texture = new THREE.CanvasTexture(this.canvas)
    this.texture.needsUpdate = true
    this.texture.premultiplyAlpha = true
    this.material = new THREE.MeshBasicMaterial({
      map: this.texture,
      // for transparent background
      transparent: true,
      depthTest: true,
      // colorWrite: false,
      depthWrite: false,
      opacity: 1,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneMinusSrcAlphaFactor,
      blendEquation: THREE.AddEquation,
      // alphaMap: this.texture,
      // stencilFuncMask: 0x00,
      stencilWriteMask: 0xFF,
      stencilWrite: true
    })
    this.geometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1)
    this.obj = new THREE.Mesh(this.geometry, this.material)
    this.obj.uuid = itext.id
    this.obj.position.setX(itext.position.x)
    this.obj.position.setY(itext.position.y)
    // this.obj.rotateY(Math.PI);
    this.obj.position.setZ(itext.position.z)
    ctx.scene.add(this.obj)
    // this.obj.renderOrder = 10;

    // this.outlineColor = itext.outlineColor;
    // this.outlineSize = itext.outlineSize;
    // this.shadowBlur = itext.shadowBlur;
    // this.shadowColor = itext.shadowColor;
    // this.updateFont(itext);
  }

  updateFont (itext: TextStripEffect, strip: Strip, current: number) {
    if (itext.size === this.prevSize && itext.text === this.prevText) {
      return
    }
    const span = document.createElement('span')
    span.innerHTML = this.text
    span.style.fontFamily = itext.family
    const size = calcAnimationValue(
      itext.animations,
      current - strip.start,
      'size',
      itext.size
    )
    span.style.fontSize = size + 'px'
    span.style.fontStyle = itext.style
    span.style.whiteSpace = 'nowrap'
    document.body.append(span)
    const r = span.getBoundingClientRect()
    // this.canvas.height = r.height;
    this.mesureHeight = r.height * itext.text.split('\n').length - 1
    span.remove()
    this.prevSize = size
    this.prevText = itext.text
  }

  prevSize = 0
  prevText = ''

  /**
   * Draw text to canvas by ctx.fillText.
   */
  draw (itext: TextStripEffect, strip: Strip, current: number) {
    if (!this.ctx || !this.obj || !this.canvas) {
      return
    }

    // keyframe calculation
    let characterSpace = calcAnimationValue(
      itext.animations,
      current - strip.start,
      'characterSpace',
      itext.characterSpace
    )
    const size = calcAnimationValue(
      itext.animations,
      current - strip.start,
      'size',
      itext.size
    )

    this.updateFont(itext, strip, current)
    this.ctx.font = `${itext.style} ${size}px ${itext.family}`

    this.mesureWidth = 0
    itext.text.split('\n').forEach((line, i) => {
      const metrics = this.ctx.measureText(line)
      if (!characterSpace) {
        characterSpace = 0
      }
      this.mesureWidth = Math.max(
        metrics.width + characterSpace * (line.length - 1),
        this.mesureWidth
      )
    })

    const breakLineCount = itext.text.split('\n').length - 1

    const lineHeight = this.mesureHeight / (breakLineCount + 1)

    this.obj.scale.set(this.canvas.width, this.canvas.height, 1)

    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'bottom'

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    // this.ctx.fillStyle = "black";
    // this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.shadowColor = itext.shadowColor
    this.ctx.shadowBlur = itext.shadowBlur
    this.ctx.lineJoin = 'round'
    this.ctx.strokeStyle = itext.outlineColor
    this.ctx.lineWidth = itext.outlineWidth

    let left = this.canvas.width / 2 - this.mesureWidth / 2
    let top =
      this.canvas.height / 2 +
      lineHeight / 2 -
      (lineHeight / 2) * breakLineCount
    for (let i = 0; i < itext.text.length; i++) {
      const char = itext.text[i]
      if (char === '\n') {
        top += lineHeight
        left = this.canvas.width / 2 - this.mesureWidth / 2
        continue
      }
      const w = this.ctx.measureText(char).width
      this.ctx.strokeText(char, left, top)
      left += w + characterSpace
    }

    this.ctx.fillStyle = itext.color
    this.ctx.shadowBlur = itext.shadowBlur

    left = this.canvas.width / 2 - this.mesureWidth / 2
    top =
      this.canvas.height / 2 +
      lineHeight / 2 -
      (lineHeight / 2) * breakLineCount
    for (let i = 0; i < itext.text.length; i++) {
      const char = itext.text[i]
      if (char === '\n') {
        top += lineHeight
        left = this.canvas.width / 2 - this.mesureWidth / 2
        continue
      }
      const w = this.ctx.measureText(char).width
      this.ctx.fillText(char, left, top)
      left += w + characterSpace
    }
    this.texture.needsUpdate = true
    this.ctx.fillStyle = 'red'
  }

  public update ({ strip, effect: _effect, timeline, isPlay, jump }: EffectUpdateContext) {
    const effect = _effect as TextStripEffect
    const time = timeline.curent

    // keyframe calculation
    const x = calcAnimationValue(
      effect.animations,
      time - strip.start,
      'position.x',
      effect.position.x
    )
    const y = calcAnimationValue(
      effect.animations,
      time - strip.start,
      'position.y',
      effect.position.y
    )

    this.obj.position.set(x, y, strip.layer)

    if (strip.start <= time && time < strip.start + strip.length) {
      this.obj.visible = true
      this.draw(effect, strip, time)
    } else {
      this.obj.visible = false
    }

    // if (timeline.focusStripId === strip.id) {
    //   this.obj.visible = false
    // }
  }
}
