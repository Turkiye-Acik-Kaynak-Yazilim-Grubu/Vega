import { FC } from "react";
import { X } from "tabler-icons-react";

import { PanelBody } from "./asset_details_panel/AssetDetailsPanel";
import { Card } from "./core/Card";
import { iconProps } from "./core/iconProps";
import { KeyFrameIconButton } from "./strip_panel/styled/KeyFrameIconButton";

export const ModalBody: FC<{
  title?: string;
  onClose?: () => void;
}> = (props) => {
  return (
    <Card
      width={"auto"}
      height={"auto"}
      style={{
        margin: "auto",
      }}
    >
      <PanelBody
        style={{
          height: "100%",
          margin: "0 8px",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex" }}>
          <div style={{ width: "16px" }}></div>
          <div style={{ margin: "auto", fontWeight: "bold" }}>
            {props.title}
          </div>
          <div>
            <KeyFrameIconButton onClick={props.onClose}>
              <X {...iconProps} />
            </KeyFrameIconButton>
          </div>
        </div>
        {props.children}
      </PanelBody>
    </Card>
  );
};
