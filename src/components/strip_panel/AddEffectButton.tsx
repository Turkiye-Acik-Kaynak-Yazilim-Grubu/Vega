import { IconPlus } from "@tabler/icons-react";
import React, { FC, RefObject, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { uuid } from "short-uuid";
import { css } from "styled-components";

import {
  Button,
  iconProps,
  Popover,
  StyledContextMenuButton,
} from "@/app-ui/src";
import { useClickOutside } from "@/components/keyframes_panel/useClickOutside";
import { AudioEffect, Effect, ScriptEffect } from "@/core/types";
import { EffectPlugin } from "@/interfaces/plugins/CustomEffect";
import { userScriptMap } from "@/rendering/updateScriptEffect";

export const AddEffectButton: FC<{
  onAddEffect: (effect: Effect) => void;
}> = (props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [showThis, setShowThis] = React.useState(false);
  const { show, onMouseLeave, setShow } = useClickOutside(ref);

  let pkgs: (EffectPlugin & { assetId: string })[] = [];
  for (const [assetId, ep] of userScriptMap.entries()) {
    if (!ep.pkg) continue;
    pkgs.push({
      ...ep,
      assetId,
    });
  }

  useEffect(() => {
    setShowThis(pkgs.length > 0);
  }, [pkgs.length]);

  const handleClick = (pkg: EffectPlugin & { assetId: string }) => {
    setShow(false);
    props.onAddEffect({
      id: uuid(),
      scriptAssetId: pkg.assetId,
      keyframes: [],
      type: "script",
      ...pkg.defaultEffect,
    } as ScriptEffect);
  };

  if (!showThis) return null;

  return (
    <div
      ref={ref}
      onMouseLeave={onMouseLeave}
      style={{
        display: "flex",
        position: "relative",
        boxSizing: "border-box",
      }}
    >
      <Button
        onClick={() => setShow((v) => !v)}
        css={css`
          display: flex !important;
        `}
      >
        <IconPlus {...iconProps} />
        <div>add effects</div>
      </Button>
      {show &&
        createPortal(
          <DropdownMenu2 targetRef={ref}>
            {pkgs.map((pkg, i) => {
              return (
                <StyledContextMenuButton
                  onClick={() => handleClick(pkg)}
                  key={i}
                >
                  {pkg.pkg?.name}
                </StyledContextMenuButton>
              );
            })}
            <StyledContextMenuButton
              onClick={() => {
                const audioEffect: AudioEffect = {
                  audioAssetId: "",
                  id: uuid(),
                  keyframes: [],
                  type: "audio",
                  offset: 0,
                  volume: 1,
                };
                props.onAddEffect(audioEffect);
              }}
            >
              AudioEffect
            </StyledContextMenuButton>
          </DropdownMenu2>,
          document.body
        )}
    </div>
  );
};

function DropdownMenu2(props: {
  targetRef: RefObject<HTMLDivElement>;
  children: React.ReactNode;
}) {
  const el = props.targetRef.current;
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return (
    <Popover
      style={{ position: "absolute", top: rect.bottom, left: rect.left }}
    >
      {props.children}
    </Popover>
  );
}
