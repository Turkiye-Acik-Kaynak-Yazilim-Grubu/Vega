import { Effect } from "./Effect";


export type VideoEffect = {
  id: string;
  type: "video";
  videoAssetId: string;
  x: number;
  y: number;
};

export const isVideoEffect = (effect: Effect): effect is VideoEffect => {
  return effect.type === "video";
};
