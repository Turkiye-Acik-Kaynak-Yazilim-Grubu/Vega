import { FC } from "react";

import { NumberEditInput } from "@/components/core/NumberEditInput";
import { Select } from "@/components/core/Select";
import { PropertyName } from "@/components/PropertyName";
import { Row } from "@/components/Row";
import { useAssetOptions } from "@/hooks/useAssetOptions";
import { useUpdateEffect } from "@/hooks/useUpdateEffect";
import { Strip, VideoEffect } from "@/packages/types";
import { UndoManager } from "@/UndoManager";

import { videoEffectOptions } from "./videoEffectOptions";

export const VideoEffectView: FC<{
  videoEffect: VideoEffect;
  strip: Strip;
}> = (props) => {
  const { videoEffect } = props;
  const { emit } = useUpdateEffect<VideoEffect>(videoEffect, props.strip);
  const videoAssetItems = useAssetOptions("video");
  return (
    <>
      {videoEffectOptions.numberKeys.map((key) => {
        return (
          <Row key={key}>
            <PropertyName>{key}</PropertyName>
            <NumberEditInput
              value={videoEffect[key] as number}
              scale={videoEffectOptions.scaleKeysMap[key]}
              view={videoEffectOptions.viewKeysMap[key]}
              onInput={(value) => emit({ [key]: value })}
              onChange={(value) =>
                UndoManager.main
                  .add({
                    undo: () => emit({ [key]: videoEffect[key] }),
                    redo: () => emit({ [key]: value }),
                  })
                  .run()
              }
            />
          </Row>
        );
      })}

      <Row>
        <PropertyName>video</PropertyName>
        <Select
          items={videoAssetItems}
          onChange={(value) => emit({ videoAssetId: value })}
          value={videoEffect.videoAssetId}
        />
      </Row>
    </>
  );
};
