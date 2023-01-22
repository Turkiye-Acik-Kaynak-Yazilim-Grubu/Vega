import { GlobalStyle } from "../components/core/styled/GlobalStyle";
import styled from "styled-components";
import { Timeline } from "../components/timeline_panel/Timeline";
import { Provider } from "react-redux";
import store from "../store";
import { Preview } from "../components/preview_panel/Preview";
import { AssetPanel } from "../components/assets_panel/AssetPanel";
import { Key, KeyboardInput } from "../KeyboardInput";
import { UndoManager } from "../UndoManager";
import { AssetDetailsPanel } from "../components/asset_details_panel/AssetDetailsPanel";
import { StripPanel } from "../components/strip_panel/StripPanel";
import { KeyFramePanel } from "../components/keyframes_panel/KeyFramePanel";
import { MenuButton } from "./MenuButton";
import { formatForSave } from "./formatForSave";
import { writeFile } from "../ipc/writeFile";
import { appAction } from "../store/app";

export function download(blob: Blob | string, name: string) {
  const link = document.createElement("a");
  if (link.href) {
    URL.revokeObjectURL(link.href);
  }
  if (typeof blob === "string") {
    link.href = "data:text/json;charset=utf-8," + encodeURIComponent(blob);
  } else {
    link.href = URL.createObjectURL(blob);
  }
  link.download = name;
  link.dispatchEvent(new MouseEvent("click"));
  link.remove();
}

const IndexPage = () => {
  KeyboardInput.init(() => {
    KeyboardInput.addKeyDownListener(Key.KeyS, (e) => {
      e.preventDefault();
      if (KeyboardInput.isPressed(Key.Meta)) {
        const url = store.getState().app.currentPath;
        const data = formatForSave(store.getState().scene);
        if (!writeFile(url, data)) {
          throw new Error("Failed to save file");
        }
        store.dispatch(appAction.setReadedDataJsonString(data));
        // NOTE: This is a hack for FileWatcher that subscribes UndoManager
        UndoManager.main.emit("change");
      }
    });
    KeyboardInput.addKeyDownListener(Key.KeyZ, (e) => {
      e.preventDefault();
      if (
        KeyboardInput.isPressed(Key.Shift) &&
        KeyboardInput.isPressed(Key.Meta)
      ) {
        UndoManager.main.redo();
      } else {
        if (KeyboardInput.isPressed(Key.Meta)) {
          UndoManager.main.undo();
        }
      }
    });
  });
  return (
    <>
      <GlobalStyle />
      <Provider store={store}>
        <div
          style={{
            display: "flex",
            height: "16px",
            padding: "4px 4px 0px 4px",
          }}
        >
          <MenuButton />
        </div>
        <VPanelBox
          style={{
            height: "calc(100% - 24px)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "4px",
              height: "calc(100% - 8px)",
              width: "calc(100% - 8px)",
            }}
          >
            <HPanelBox
              style={{
                height: "50%",
              }}
            >
              <VPanelBox
                style={{
                  width: "40%",
                }}
              >
                <StripPanel />
                <VPanelDivider />
                <KeyFramePanel />
              </VPanelBox>
              <HPanelDivider />
              <Preview />
            </HPanelBox>
            <VPanelDivider />
            <HPanelBox
              style={{
                height: "50%",
              }}
            >
              <Timeline />
              <HPanelDivider />
              <HPanelBox
                style={{
                  width: "50%",
                }}
              >
                <AssetDetailsPanel />
                <HPanelDivider />
                <AssetPanel />
              </HPanelBox>
            </HPanelBox>
          </div>
        </VPanelBox>
      </Provider>
    </>
  );
};

const VPanelDivider = styled.div`
  width: 100%;
  min-height: 4px;
  background-color: var(--color-panel-divider);
  cursor: row-resize;
  user-select: none;
`;

const HPanelDivider = styled.div`
  min-width: 4px;
  height: 100%;
  background-color: var(--color-panel-divider);
  cursor: col-resize;
  user-select: none;
`;

const VPanelBox = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

const HPanelBox = styled.div`
  display: flex;
  flex-direction: row;
  height: 100%;
  width: 100%;
`;

export default IndexPage;
