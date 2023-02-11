import { FC } from "react";
import { useDispatch } from "react-redux";

import { writeFile } from "@/ipc/writeFile";
import {
  Effect,
  isAudioEffect,
  isImageEffect,
  isScriptEffect,
  isTextEffect,
  isVideoEffect,
  Strip,
} from "@/shared/src";
import { actions } from "@/store/scene";

import { AudioEffectView } from "./effects/audio/AudioEffectView";
import { ImageEffectView } from "./effects/image/ImageEffectView";
import { TextEffectView } from "./effects/text/TextEffectView";
import { VideoEffectView } from "./effects/video/VideoEffectView";
import { ScriptEffectView } from "./ScriptEffectView";

export const Effects: FC<{ effects: Effect[]; strip: Strip }> = (props) => {
  const { effects } = props;
  const dispatch = useDispatch();

  return (
    <div>
      {effects.map((effect) => {
        return (
          <div key={effect.id} style={{ marginTop: "8px" }}>
            <strong
              style={{
                marginBottom: "4px",
                display: "block",
              }}
            >
              {effect.type}
            </strong>
            {isTextEffect(effect) && (
              <TextEffectView textEffect={effect} strip={props.strip} />
            )}
            {isVideoEffect(effect) && (
              <VideoEffectView videoEffect={effect} strip={props.strip} />
            )}
            {isImageEffect(effect) && (
              <ImageEffectView imageEffect={effect} strip={props.strip} />
            )}
            {isAudioEffect(effect) && (
              <AudioEffectView audioEffect={effect} strip={props.strip} />
            )}
            {isScriptEffect(effect) && (
              <ScriptEffectView
                scriptEffect={effect}
                strip={props.strip}
                appCtx={{
                  dispatch,
                  actions,
                  fs: {
                    writeFile: writeFile,
                  },
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
