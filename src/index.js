import { ParticleManager } from './particles';
import { generateFlowers } from './commands/flowers';

import REGL from 'regl';
import * as posenet from "@tensorflow-models/posenet";
import { mat4, vec3, vec4 } from 'gl-matrix';
import { range } from 'lodash';

const regl = REGL({ extensions: ['OES_texture_float'] });
const flower = new Image();
flower.src = 'img/flower.png';

const video = document.createElement('video');
video.width = window.innerWidth;
video.height = window.innerHeight;

const setupCamera = () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
      "Browser API navigator.mediaDevices.getUserMedia not available"
    );
  }

  return new Promise(resolve => {
    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: window.innerWidth,
          height: window.innerHeight,
        }
      })
      .then(stream => {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          resolve(video);
        };
      });
  });
};

const flowerPromise = new Promise(resolve => {
  flower.onload = resolve
});
const videoPromise = new Promise((resolve, reject) => {
  try {
    setupCamera().then(video => {
      video.play();
      resolve(video);
    });
  } catch (e) {
    reject(e);
  }
})

const promises = [posenet.load(0.75), videoPromise, flowerPromise];
Promise.all(promises).then(([net, video]) => {
  // for debugging:
  // document.querySelector('body').appendChild(video)

  const flowers = generateFlowers(regl, flower);
  const particles = new ParticleManager(regl);

  range(20).forEach(() => {
    const index = particles.addParticle();
    particles.update(index, { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, life: 0 });
  });

  const imageScaleFactor = 0.25;
  const flipHorizontal = true;
  const outputStride = 16;
  const minPoseConfidence = 0.25;

  let tick = 0;
  regl.frame(() => {
    net
      .estimateMultiplePoses(video, imageScaleFactor, flipHorizontal, outputStride, 5, 0.1, 30.0)
      .then(poses => {
        poses.forEach(({ score, keypoints }) => {
          if (score >= minPoseConfidence) {
            console.log(keypoints)
            // draw particles with keypoints
          }
        });
      });

    tick = (tick + 1) % 5;

    particles.eachParticle((index) => {
      if (tick !== 0) return;

      const life = particles.value(index, 'life');
      if (life < 12) {
        particles.update(index, {
          life: life + 1
        });
      }
    });

    flowers({
      particleState: particles.getTexture()
    });
  });
});
