import { Vector3 } from "three";
import { Layer } from "./Layer";
import { Strip } from "./Strip";

export interface Timeline {
  selectedStrips: Strip[];
  isPlay: boolean;
  curent: number;
  width: number;
  height: number;
  strips: Strip[];
  start: number;
  end: number;
  scale: number;
  length: number;
}
