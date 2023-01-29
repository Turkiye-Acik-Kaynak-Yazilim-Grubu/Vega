import { FC } from "react";
import { Key } from "tabler-icons-react";

import { iconProps } from "@/components/core/iconProps";
import { NumberEditInput } from "@/components/core/NumberEditInput";
import { Item, Select } from "@/components/core/Select";
import { ImageEffect, Strip } from "@/packages/types";
import { isImageAsset } from "@/rendering/updateTextEffect";
import { useSelector } from "@/store/useSelector";
import { UndoManager } from "@/UndoManager";
import { exactKeyFrame } from "@/utils/exactKeyFrame";

import { hasKeyFrame } from "./hasKeyFrame";
import { KeyFrameIconButton } from "./KeyFrameIconButton";
import { useAnimationedValue } from "./makeEmit";
import { PropertyName, Row } from "./StripPanel";
import { useUpdateEffect } from "./useUpdateEffect";

export type PickProperties<T, TFilter> = {
  [K in keyof T as T[K] extends TFilter ? K : never]: T[K];
};

type NumberProps = PickProperties<ImageEffect, number | undefined>;

const numberKeys: (keyof NumberProps)[] = [
  "x",
  "y",
  "width",
  "height",
  "opacity",
];

const scaleKeysMap: NumberProps = {
  x: 1,
  y: 1,
  opacity: 0.01,
};

const viewKeysMap: { [key in keyof NumberProps]: (v: number) => string } = {
  x: (v: number) => v.toFixed(0),
  y: (v: number) => v.toFixed(0),
};

const minMaxKeysMap: {
  [key in keyof NumberProps]: [number, number] | undefined;
} = {
  x: undefined,
  y: undefined,
  opacity: [0, 1],
};

export const ImageEffectView: FC<{
  imageEffect: ImageEffect;
  strip: Strip;
}> = (props) => {
  const { imageEffect } = props;
  const currentTime = useSelector((state) => state.scene.currentTime);
  const assets = useSelector((state) => state.scene.assets);
  const imageAssets = assets.filter(isImageAsset);

  const { emit, addKeyFrame } = useUpdateEffect<ImageEffect>(
    imageEffect,
    props.strip
  );
  const animation = useAnimationedValue<ImageEffect>(imageEffect, props.strip);

  const imageAssetItems: Item[] = imageAssets.map((a) => ({
    value: a.id,
    label: a.name,
  }));

  const noImageAsset =
    imageAssets.find((a) => a.id === imageEffect.imageAssetId) === undefined;

  if (noImageAsset) {
    imageAssetItems.unshift({
      value: imageEffect.imageAssetId,
      label: "Asset Not Found",
      disabled: true,
    });
  }
  const time = currentTime - props.strip.start;

  return (
    <>
      {numberKeys.map((key) => {
        return (
          <Row key={key}>
            <PropertyName>{key}</PropertyName>
            <KeyFrameIconButton>
              <Key
                {...iconProps}
                onClick={() => addKeyFrame(key)}
                color={
                  exactKeyFrame(imageEffect, key, time)
                    ? "var(--color-strip-selected)"
                    : hasKeyFrame(imageEffect, key)
                    ? "var(--color-primary)"
                    : "white"
                }
              />
            </KeyFrameIconButton>
            <NumberEditInput
              value={animation(key)}
              scale={scaleKeysMap[key]}
              max={minMaxKeysMap[key]?.[1]}
              min={minMaxKeysMap[key]?.[0]}
              view={viewKeysMap[key]}
              onInput={(value) => emit({ [key]: value })}
              onChange={(value) =>
                UndoManager.main
                  .add({
                    undo: () => {
                      emit({ [key]: imageEffect[key] });
                    },
                    redo: () => emit({ [key]: value }),
                  })
                  .run()
              }
            />
          </Row>
        );
      })}

      <Row>
        <PropertyName>image</PropertyName>
        <Select
          items={imageAssetItems}
          onChange={(value) => emit({ imageAssetId: value })}
          value={imageEffect.imageAssetId}
        />
      </Row>
    </>
  );
};


