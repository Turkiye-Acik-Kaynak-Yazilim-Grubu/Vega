import { Strip } from "../interfaces/Strip";
import { AudioEffect } from "../interfaces/effects/AudioEffect";
import { SceneState } from "../store/scene";

const loadedAudioElementMap = new Map<string, HTMLAudioElement>();

enum AudioStatus {
  Loading,
  Playing,
  Paused,
  Seeking,
}

const audioStatusMap = new Map<string, AudioStatus>();

const modeLoadingBlack = false;

export function updateAudioEffect(
  ctx: CanvasRenderingContext2D,
  effect: AudioEffect,
  strip: Strip,
  scene: SceneState
) {
  const audioAsset = scene.assets.find(
    (asset) => asset.id === effect.audioAssetId
  );
  const elementMapKey = effect.id + effect.audioAssetId;
  if (
    scene.currentTime < strip.start ||
    scene.currentTime > strip.start + strip.length - 1 / scene.fps
  ) {
    audioStatusMap.set(effect.audioAssetId, AudioStatus.Paused);
    let audioElement = loadedAudioElementMap.get(elementMapKey);
    if (!audioElement) {
      return;
    }
    audioElement.pause();
    audioElement.currentTime = 0;
    return;
  }
  if (audioAsset) {
    let audioElement = loadedAudioElementMap.get(elementMapKey);
    if (!audioElement) {
      audioElement = document.createElement("audio");
      loadedAudioElementMap.set(elementMapKey, audioElement);
      audioElement.src = audioAsset.path;
      audioElement.autoplay = true;
      audioStatusMap.set(elementMapKey, AudioStatus.Loading);
    }
    audioElement.onloadeddata = () => {
      audioStatusMap.set(elementMapKey, AudioStatus.Paused);
      audioElement.pause();
    };
    const currentStatus = audioStatusMap.get(elementMapKey);
    if (currentStatus === AudioStatus.Loading) {
      return;
    }
    audioElement.onseeked = () => {
      if (scene.isPlaying) {
        audioElement.play();
        audioStatusMap.set(elementMapKey, AudioStatus.Playing);
      } else {
        audioElement.pause();
        audioStatusMap.set(elementMapKey, AudioStatus.Paused);
      }
    };
    audioElement.onplay = () => {
      audioStatusMap.set(elementMapKey, AudioStatus.Playing);
    };
    audioElement.onpause = () => {
      audioStatusMap.set(elementMapKey, AudioStatus.Paused);
    };
    const gapFrames = 5;
    const diff = Math.abs(
      audioElement.currentTime - scene.currentTime + strip.start + effect.offset
    );
    if (currentStatus === AudioStatus.Playing && !scene.isPlaying) {
      audioElement.pause();
    } else if (currentStatus === AudioStatus.Paused && scene.isPlaying) {
      audioElement.play();
    } else if (
      diff > (1 / scene.fps) * gapFrames &&
      currentStatus !== AudioStatus.Seeking
    ) {
      // should seek if audio currentTime is too far from scene currentTime
      audioElement.currentTime =
        scene.currentTime - strip.start + effect.offset;
      audioStatusMap.set(elementMapKey, AudioStatus.Seeking);
    } else if (currentStatus === AudioStatus.Seeking && modeLoadingBlack) {
    }
    audioElement.volume = effect.volume;
    if (currentStatus === AudioStatus.Seeking && scene.isPlaying) {
      return;
    }
  }
}
