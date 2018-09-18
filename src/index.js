import { ParticleManager } from './particles';
import { PoseManager } from './poses';
import { generateFlowers } from './commands/flowers';
import { generateShowVideo } from './commands/video';

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

window.addEventListener('resize', () => {
  video.width = window.innerWidth;
  video.height = window.innerHeight;
})

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
  const showVideo = generateShowVideo(regl);
  const particles = new ParticleManager(regl);
  const poseManager = new PoseManager(regl, 0.25);

  const videoTexture = regl.texture(video);

  range(20).forEach(() => {
    const index = particles.addParticle();
    particles.update(index, {
      pointA: 0,
      pointB: 1,
      person: 0,
      mix: Math.random(),
      life: 0
    });
  });

  const imageScaleFactor = 0.25;
  const flipHorizontal = true;
  const outputStride = 16;

  let tick = 0;
  regl.frame(() => {
    net
      .estimateMultiplePoses(video, imageScaleFactor, flipHorizontal, outputStride, 5, 0.1, 30.0)
      .then(poses => poseManager.update(poses));

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

    videoTexture(video);
    showVideo({ video: videoTexture });
    //console.log(video);

    flowers({
      particleState: particles.getTexture(),
      people: poseManager.getTexture(),
    });
  });
});
