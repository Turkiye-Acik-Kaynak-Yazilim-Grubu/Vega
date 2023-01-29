import { SelectRectProps } from "@/components/core/styled/SelectRect";
import { TextEffect } from "@/packages/types";
import { caclulateKeyFrameValue } from "@/rendering/caclulateKeyFrameValue";
import {
  measureMap,
} from "@/rendering/updateTextEffect";

export function textEffectToRect(
  effect: TextEffect,
  scale: number,
  left: number,
  top: number,
  currentTime: number,
  fps: number
): SelectRectProps | null {
  let { x, y } = effect;
  x = caclulateKeyFrameValue(effect.keyframes, currentTime, "x", effect.x, fps);
  y = caclulateKeyFrameValue(effect.keyframes, currentTime, "y", effect.y, fps);

  const measure = measureMap.get(effect.id);
  if (!measure) {
    return null;
  }
  const lineBreaks = effect.text.split("\n").length - 1;
  return {
    $left: x * scale + left,
    $top: y * scale + top - (measure.height - effect.fontSize * lineBreaks) * scale,
    $width: measure.width * scale,
    $height: measure.height * scale,
  };
}
