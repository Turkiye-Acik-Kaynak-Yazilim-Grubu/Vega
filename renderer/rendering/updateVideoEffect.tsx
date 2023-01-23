import { Strip } from "../interfaces/Strip";
import { VideoEffect } from "../interfaces/effects/VideoEffect";
import { SceneState } from "../store/scene";

const loadedVideoElementMap = new Map<string, HTMLVideoElement>();

enum VideoStatus {
  Loading,
  Playing,
  Paused,
  Seeking,
}

const videoStatusMap = new Map<string, VideoStatus>();

const modeLoadingBlack = false;

export function updateVideoEffect(
  ctx: CanvasRenderingContext2D,
  effect: VideoEffect,
  strip: Strip,
  scene: SceneState
) {
  const videoAsset = scene.assets.find(
    (asset) => asset.id === effect.videoAssetId
  );
  const elementMapKey = effect.id + effect.videoAssetId;
  if (
    scene.currentTime < strip.start ||
    scene.currentTime > strip.start + strip.length - 1 / scene.fps
  ) {
    videoStatusMap.set(effect.videoAssetId, VideoStatus.Paused);
    let videoElement = loadedVideoElementMap.get(elementMapKey);
    if (!videoElement) {
      return;
    }
    videoElement.pause();
    videoElement.currentTime = 0;
    return;
  }
  if (videoAsset) {
    let videoElement = loadedVideoElementMap.get(elementMapKey);
    if (!videoElement) {
      videoElement = document.createElement("video");
      loadedVideoElementMap.set(elementMapKey, videoElement);
      videoElement.src = videoAsset.path;
      videoElement.autoplay = true;
      videoStatusMap.set(elementMapKey, VideoStatus.Loading);
    }
    videoElement.onloadeddata = () => {
      videoStatusMap.set(elementMapKey, VideoStatus.Paused);
      videoElement.pause();
    };
    const currentStatus = videoStatusMap.get(elementMapKey);
    if (currentStatus === VideoStatus.Loading) {
      return;
    }
    videoElement.onseeked = () => {
      if (scene.isPlaying) {
        videoElement.play();
        videoStatusMap.set(elementMapKey, VideoStatus.Playing);
      } else {
        videoElement.pause();
        videoStatusMap.set(elementMapKey, VideoStatus.Paused);
      }
    };
    videoElement.onplay = () => {
      videoStatusMap.set(elementMapKey, VideoStatus.Playing);
    };
    videoElement.onpause = () => {
      videoStatusMap.set(elementMapKey, VideoStatus.Paused);
    };
    const gapFrames = 5;
    const diff = Math.abs(
      videoElement.currentTime - scene.currentTime + strip.start
    );
    if (currentStatus === VideoStatus.Playing && !scene.isPlaying) {
      videoElement.pause();
    } else if (currentStatus === VideoStatus.Paused && scene.isPlaying) {
      videoElement.play();
    } else if (
      diff > (1 / scene.fps) * gapFrames &&
      currentStatus !== VideoStatus.Seeking
    ) {
      // should seek if video currentTime is too far from scene currentTime
      videoElement.currentTime = scene.currentTime - strip.start;
      videoStatusMap.set(elementMapKey, VideoStatus.Seeking);
    } else if (currentStatus === VideoStatus.Seeking && modeLoadingBlack) {
      ctx.shadowColor = "";
      ctx.shadowBlur = 0;
      ctx.fillStyle = "black";
      ctx.fillRect(effect.x, effect.y, ctx.canvas.width, ctx.canvas.height);
    }
    if (currentStatus === VideoStatus.Seeking && scene.isPlaying) {
      return;
    }
    ctx.shadowColor = "";
    ctx.shadowBlur = 0;
    ctx.drawImage(
      videoElement,
      0,
      0,
      videoElement.videoWidth,
      videoElement.videoHeight,
      effect.x,
      effect.y,
      effect.width,
      effect.height
    );
  }
}
