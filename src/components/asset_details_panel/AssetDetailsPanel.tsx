import { IconLink } from "@tabler/icons-react";
import { FC } from "react";
import { useDispatch } from "react-redux";
import styled, { css } from "styled-components";

import { AutoHeightTextarea, IconButton, iconProps } from "@/app-ui/src";
import { Card } from "@/components/Card";
import {
  Effect,
  isAudioEffect,
  isImageEffect,
  isScriptAsset,
  isScriptEffect,
  isVideoEffect,
  Strip,
} from "@/core/types";
import { useSelector } from "@/hooks/useSelector";
import { unLinkImageElement } from "@/rendering/updateImageEffect";
import {
  isAudioAsset,
  isImageAsset,
  isTextAsset,
  isVideoAsset,
} from "@/rendering/updateTextEffect";
import { actions } from "@/store/scene";
import { filePick } from "@/utils/filePick";

import { AudioAssetDetailsPanel } from "./AudioAssetDetailsPanel";
import { EditableView } from "./EditableView";
import { ImageAssetDetailsPanel } from "./ImageAssetDetailsPanel";
import { ScriptAssetDetailsPanel } from "./ScriptAssetDetailsPanel";
import { TextAssetDetailsPanel } from "./TextAssetDetailsPanel";
import { VideoAssetDetailsPanel } from "./VideoAssetDetailsPanel";

export function getAllEffectReferencedByAssetId(strips: Strip[], id: string) {
  const effects: Effect[] = [];
  strips.forEach((strip) => {
    strip.effects.forEach((effect) => {
      if (isImageEffect(effect)) {
        if (effect.imageAssetId === id) {
          effects.push(effect);
        }
      } else if (isScriptEffect(effect)) {
        if (effect.scriptAssetId === id) {
          effects.push(effect);
        }
      } else if (isAudioEffect(effect)) {
        if (effect.audioAssetId === id) {
          effects.push(effect);
        }
      } else if (isVideoEffect(effect)) {
        if (effect.videoAssetId === id) {
          effects.push(effect);
        }
      }
    });
  });
  return effects;
}

export const AssetDetailsPanel: FC = () => {
  const selectedAssetIds = useSelector((state) => state.scene.selectedAssetIds);
  const assets = useSelector((state) => state.scene.assets);
  const selectedAssets = assets.filter((asset) =>
    selectedAssetIds.includes(asset.id)
  );
  const strips = useSelector((state) => state.scene.strips);
  const dispatch = useDispatch();

  const changeAssetPath = () => {
    filePick((_, path) => {
      const effects = getAllEffectReferencedByAssetId(
        strips,
        selectedAssets[0].id
      );
      const newAsset = { ...selectedAssets[0], path: path };
      effects.forEach((effect) => {
        if (isImageEffect(effect)) {
          unLinkImageElement(effect);
        }
      });

      dispatch(actions.updateAssets(newAsset));
    }, "*");
  };

  if (selectedAssets.length !== 1) {
    return <Card />;
  }
  const selectedAsset = selectedAssets[0];
  return (
    <Card>
      <div
        style={{
          overflow: "hidden",
          height: "100%",
        }}
      >
        <div
          css={css`
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 0 4px;
          `}
        >
          <SectionDiv>
            <strong>name</strong>
            <EditableView
              text={selectedAsset.name}
              onChange={(value) => {
                const newAsset = { ...selectedAssets[0], name: value };
                dispatch(actions.updateAssets(newAsset));
              }}
            />
          </SectionDiv>
          <SectionDiv>
            <strong>path</strong>
            <Flex>
              <IconButton
                style={{ marginLeft: "auto" }}
                onClick={() => {
                  changeAssetPath();
                }}
              >
                <IconLink {...iconProps} />
              </IconButton>
              <AutoHeightTextarea
                css={css`
                  width: 100%;
                  max-width: 100%;
                `}
                style={{ width: "100%", maxWidth: "100%" }}
                value={selectedAsset.path.replace(/\n/g, "")}
              />
            </Flex>
          </SectionDiv>
          <SectionDiv>
            <strong>preview</strong>
            {isTextAsset(selectedAsset) && (
              <TextAssetDetailsPanel asset={selectedAsset} />
            )}
            {isVideoAsset(selectedAsset) && (
              <VideoAssetDetailsPanel asset={selectedAsset} />
            )}
            {isImageAsset(selectedAsset) && (
              <ImageAssetDetailsPanel asset={selectedAsset} />
            )}
            {isAudioAsset(selectedAsset) && (
              <AudioAssetDetailsPanel asset={selectedAsset} />
            )}
            {isScriptAsset(selectedAsset) && (
              <ScriptAssetDetailsPanel asset={selectedAsset} />
            )}
          </SectionDiv>
        </div>
      </div>
    </Card>
  );
};
const Flex = styled.div`
  display: flex;
`;

const SectionDiv = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;
