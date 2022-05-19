import * as THREE from "three";
import { EffectObject } from "./EffectObject";
import { TextStripEffect } from "./TextStripEffect";
import { Strip } from "./Strip";

export class TextStripEffectObject extends EffectObject {
  id: string;
  obj?: THREE.Mesh;
  texture?: THREE.CanvasTexture;
  canvas?: HTMLCanvasElement;
  ctx?: CanvasRenderingContext2D;
  geometry?: THREE.PlaneBufferGeometry;
  material?: THREE.MeshBasicMaterial;

  text: string;

  /**
   * 計算したテキストの幅
   */
  mesureWidth = 0;
  mesureHeight = 0;

  constructor(itext: TextStripEffect) {
    super();
    this.text = itext.text;
    // this.fontFamily = itext.fontFamily;
    this.canvas = document.createElement("canvas");
    this.canvas.width = 1024;
    this.canvas.height = 1024;
    this.ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.needsUpdate = true;
    this.texture.premultiplyAlpha = true;
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
      stencilWriteMask: 0xff,
      stencilWrite: true,
    });
    this.geometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1);
    this.obj = new THREE.Mesh(this.geometry, this.material);
    this.obj.uuid = itext.id;
    this.obj.position.setX(itext.position.x);
    this.obj.position.setY(itext.position.y);
    // this.obj.rotateY(Math.PI);
    this.obj.position.setZ(itext.position.z);
    // this.obj.renderOrder = 10;

    // this.outlineColor = itext.outlineColor;
    // this.outlineSize = itext.outlineSize;
    // this.shadowBlur = itext.shadowBlur;
    // this.shadowColor = itext.shadowColor;
    // this.updateFont(itext);
  }

  updateFont(itext: TextStripEffect) {
    if (itext.size == this.prevSize) return;
    const span = document.createElement("span");
    span.innerHTML = this.text;
    span.style.fontFamily = itext.family;
    span.style.fontSize = itext.size + "px";
    span.style.fontStyle = itext.style;
    span.style.whiteSpace = "nowrap";
    document.body.append(span);
    const r = span.getBoundingClientRect();
    // this.canvas.height = r.height;
    this.mesureHeight = r.height;
    span.remove();
    this.prevSize = itext.size;
  }

  prevSize = 0;

  /**
   * Draw text to canvas by ctx.fillText.
   */
  draw(itext: TextStripEffect) {
    this.updateFont(itext);
    // const font =
    // this.updateFont();
    this.ctx.font = `${itext.style} ${itext.size}px ${itext.family}`;
    const metrics = this.ctx.measureText(itext.text);
    this.mesureWidth = metrics.width;

    this.obj.scale.set(this.canvas.width, this.canvas.height, 1);

    this.ctx.textAlign = "left";
    this.ctx.textBaseline = "bottom";

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // this.ctx.fillStyle = "black";
    // this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.shadowColor = itext.shadowColor;
    this.ctx.shadowBlur = itext.shadowBlur;
    this.ctx.strokeStyle = itext.outlineColor;
    this.ctx.lineWidth = itext.outlineWidth;
    this.ctx.strokeText(
      itext.text,
      this.canvas.width / 2 - metrics.width / 2,
      this.canvas.height / 2 + this.mesureHeight / 2
    );
    this.ctx.shadowBlur = 0;

    this.ctx.fillStyle = itext.color;
    // this.ctx.fillRect(0, 0, 10000, 10000);
    this.ctx.fillText(
      itext.text,
      this.canvas.width / 2 - metrics.width / 2,
      this.canvas.height / 2 + this.mesureHeight / 2
    );
    this.texture.needsUpdate = true;
  }

  public async update(strip: Strip, itext: TextStripEffect, time: number) {
    function findBetween(time: number) {
      let prev = -1;
      for (let i = 0; i < itext.animations.length; i++) {
        if (itext.animations[i].time < time) {
          prev = i;
        }
      }

      const prevAnimation = prev !== -1 ? itext.animations[prev] : null;

      let next = -1;
      for (let i = itext.animations.length - 1; i >= 0; i--) {
        if (itext.animations[i].time > time) {
          next = i;
        }
      }

      const nextAnimation = next !== -1 ? itext.animations[next] : null;
      return [prevAnimation, nextAnimation];
    }

    const [prev, next] = findBetween(time);

    function normalize(min: number, max: number, value: number) {
      return (value - min) / (max - min);
    }

    function easeInOutCubic(x: number): number {
      return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }

    let v = 0;
    if (prev && next) {
      v =
        prev.value +
        easeInOutCubic(normalize(prev.time, next.time, time)) *
          (next.value - prev.value);
    } else if (prev && !next) {
      v = prev.value;
    } else if (next && !prev) {
      v = next.value;
    }

    this.obj.position.set(v, itext.position.y, strip.layer);

    if (strip.start < time && time < strip.start + strip.length) {
      this.obj.visible = true;
      this.draw(itext);
    } else {
      this.obj.visible = false;
    }

    // Use await for """Async method 'update' has no 'await' expression""" (require-await)
    return await new Promise<void>((resolve, reject) => {
      try {
        return resolve();
      } catch (e) {
        reject(e);
      }
    });
  }
}
