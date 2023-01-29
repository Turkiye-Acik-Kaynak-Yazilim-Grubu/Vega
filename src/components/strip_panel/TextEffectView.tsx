import { FC } from "react";

import {
  ClickEditInput,
  ClickEditTextarea,
} from "@/components/core/ClickEditInput";
import { NumberEditInput } from "@/components/core/NumberEditInput";
import { Item, Select } from "@/components/core/Select";
import { Strip, TextEffect } from "@/packages/types";
import { useSelector } from "@/store/useSelector";
import { UndoManager } from "@/UndoManager";
import { exactKeyFrame } from "@/utils/exactKeyFrame";
import { hasKeyFrame } from "@/utils/hasKeyFrame";

import { useAnimationedValue } from "./hooks/useAnimationedValue";
import { useUpdateEffect } from "./hooks/useUpdateEffect";
import { KeyframeButton } from "./ImageEffectView";
import { PropertyName, Row } from "./StripPanel";
import { textEffectConfig } from "./textEffectConfig";

export const TextEffectView: FC<{ textEffect: TextEffect; strip: Strip }> = (
  props
) => {
  const { textEffect } = props;
  const currentTime = useSelector((state) => state.scene.currentTime);
  const assets = useSelector((state) => state.scene.assets);

  const { emit, addKeyFrame } = useUpdateEffect<TextEffect>(
    textEffect,
    props.strip
  );
  const animation = useAnimationedValue<TextEffect>(textEffect, props.strip);

  const undo = () => emit({ ...textEffect });

  const fontAssets = assets.filter((a) => a.type === "font");

  const fontAssetItems: Item[] = fontAssets.map((a) => ({
    value: a.id,
    label: a.name,
  }));

  const noFontAsset =
    fontAssets.find((a) => a.id === textEffect.fontAssetId) === undefined;

  if (noFontAsset) {
    fontAssetItems.unshift({
      value: textEffect.fontAssetId ?? "",
      label: "No font asset",
      disabled: true,
    });
  }
  const time = currentTime - props.strip.start;
  return (
    <>
      <Row>
        <PropertyName>text</PropertyName>
        <ClickEditTextarea
          style={{
            maxWidth: "100%",
            width: "100%",
            marginLeft: "8px",
          }}
          value={textEffect.text}
          onInput={(value) => emit({ text: value })}
          onChange={(value) =>
            UndoManager.main
              .add({
                undo,
                redo: () => emit({ text: value }),
              })
              .run()
          }
        />
      </Row>
      {textEffectConfig.stringKeys.map((key) => {
        return (
          <Row key={key}>
            <PropertyName>{key}</PropertyName>
            <ClickEditInput
              value={textEffect[key] as string}
              onInput={(value) => emit({ [key]: value })}
              onChange={(value) =>
                UndoManager.main
                  .add({
                    undo,
                    redo: () => emit({ [key]: value }),
                  })
                  .run()
              }
            />
          </Row>
        );
      })}
      {textEffectConfig.numberKeys.map((key) => {
        return (
          <Row key={key}>
            <PropertyName>{key}</PropertyName>
            <KeyframeButton
              onClick={() => addKeyFrame(key)}
              highlight={!!exactKeyFrame(textEffect, key, time)}
              active={hasKeyFrame(textEffect, key)}
            ></KeyframeButton>
            <NumberEditInput
              value={animation(key)}
              scale={textEffectConfig.scaleKeysMap[key]}
              view={textEffectConfig.viewKeysMap[key]}
              onInput={(value) => emit({ [key]: value })}
              onChange={(value) =>
                UndoManager.main
                  .add({
                    undo: () => {
                      emit({ [key]: textEffect[key] });
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
        <PropertyName>font</PropertyName>
        <Select
          items={fontAssetItems}
          onChange={(value) => emit({ fontAssetId: value })}
          value={textEffect.fontAssetId ?? ""}
        />
      </Row>
      <Row>
        <PropertyName>font style</PropertyName>
        <Select
          items={["normal", "bold", "italic", "bold italic"].map((v) => ({
            value: v,
            label: v,
          }))}
          onChange={(value) => emit({ fontStyle: value })}
          value={textEffect.fontStyle ?? "normal"}
        />
      </Row>
    </>
  );
};
