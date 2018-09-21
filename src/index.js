import { ParticleManager } from './particles';
import {
  PoseManager,
  NOSE,
  LEFT_EYE,
  RIGHT_EYE,
  LEFT_EAR,
  RIGHT_EAR,
  LEFT_SHOULDER,
  RIGHT_SHOULDER,
  LEFT_ELBOW,
  RIGHT_ELBOW,
  LEFT_WRIST,
  RIGHT_WRIST,
  LEFT_HIP,
  RIGHT_HIP,
  LEFT_KNEE,
  RIGHT_KNEE,
  LEFT_ANKLE,
  RIGHT_ANKLE,
} from './poses';
import { VineManager } from './vines';
import { generateFlowers } from './commands/flowers';
import { generateShowVideo } from './commands/video';
import { generateVines, MAX_VINES } from './commands/vines';

import REGL from 'regl';
import * as posenet from "@tensorflow-models/posenet";
import { mat4, vec3, vec4 } from 'gl-matrix';
import { range, sample } from 'lodash';

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

const vinesPerPerson = {}

const promises = [posenet.load(0.75), videoPromise, flowerPromise];
Promise.all(promises).then(([net, video]) => {
  // for debugging:
  // document.querySelector('body').appendChild(video)

  const connections = {
    [NOSE]: [LEFT_EYE, RIGHT_EYE, LEFT_EAR, RIGHT_EAR, LEFT_SHOULDER, RIGHT_SHOULDER],
    [LEFT_EYE]: [NOSE, RIGHT_EYE, LEFT_EAR, RIGHT_EAR, LEFT_SHOULDER, RIGHT_SHOULDER],
    [RIGHT_EYE]: [NOSE, LEFT_EYE, RIGHT_EAR, RIGHT_EAR, RIGHT_SHOULDER, LEFT_SHOULDER],
    [LEFT_EAR]: [NOSE, LEFT_EYE, LEFT_SHOULDER],
    [RIGHT_EAR]: [NOSE, RIGHT_EYE, RIGHT_SHOULDER],
    [LEFT_SHOULDER]: [LEFT_EAR, NOSE, LEFT_ELBOW, LEFT_WRIST, LEFT_HIP, RIGHT_SHOULDER],
    [RIGHT_SHOULDER]: [RIGHT_EAR, NOSE, RIGHT_ELBOW, RIGHT_WRIST, RIGHT_HIP, LEFT_SHOULDER],
    [LEFT_ELBOW]: [LEFT_SHOULDER, LEFT_WRIST, LEFT_HIP, LEFT_KNEE],
    [RIGHT_ELBOW]: [RIGHT_SHOULDER, RIGHT_WRIST, RIGHT_HIP, RIGHT_KNEE],
    [LEFT_WRIST]: [LEFT_SHOULDER, LEFT_ELBOW, LEFT_HIP, LEFT_KNEE],
    [RIGHT_WRIST]: [RIGHT_SHOULDER, RIGHT_ELBOW, RIGHT_HIP, RIGHT_KNEE],
    [LEFT_HIP]: [LEFT_WRIST, LEFT_SHOULDER, RIGHT_SHOULDER, RIGHT_HIP, LEFT_KNEE, RIGHT_KNEE],
    [RIGHT_HIP]: [RIGHT_WRIST, RIGHT_SHOULDER, LEFT_SHOULDER, LEFT_HIP, RIGHT_KNEE, LEFT_KNEE],
    [LEFT_KNEE]: [RIGHT_SHOULDER, RIGHT_HIP, LEFT_HIP, RIGHT_KNEE, LEFT_ANKLE, RIGHT_ANKLE],
    [RIGHT_KNEE]: [LEFT_SHOULDER, LEFT_HIP, RIGHT_HIP, LEFT_KNEE, RIGHT_ANKLE, LEFT_ANKLE],
    [LEFT_ANKLE]: [RIGHT_SHOULDER, RIGHT_HIP, LEFT_KNEE, RIGHT_KNEE, RIGHT_ANKLE],
    [RIGHT_ANKLE]: [LEFT_SHOULDER, LEFT_HIP, RIGHT_KNEE, LEFT_KNEE, LEFT_ANKLE],
  };

  const flowers = generateFlowers(regl, flower);
  const vines = generateVines(regl);
  const showVideo = generateShowVideo(regl);
  const particles = new ParticleManager(regl);
  const poseManager = new PoseManager(regl, 0.25);
  const vineManager = new VineManager(regl);

  const videoTexture = regl.texture(video);

  const imageScaleFactor = 0.25;
  const flipHorizontal = true;
  const outputStride = 16;

  let tick = 0;
  let startTime = new Date().getTime();
  regl.frame(() => {
    net
      .estimateMultiplePoses(video, imageScaleFactor, flipHorizontal, outputStride, 5, 0.1, 30.0)
      .then(poses => poseManager.update(poses, (newPeople, removedPeople) => {
        removedPeople.forEach((i) => {
          delete vinesPerPerson[i]

          vineManager.eachVine((vine) => {
            if (vineManager.value(vine, 'person') === i) {
              vineManager.removeVine(vine);
            }
          });

          particles.eachParticle((particle) => {
            if (particles.value(particle, 'person') === i) {
              particles.removeParticle(particle);
            }
          });
        });

        // Add spawning vine for each new person
        newPeople.forEach((i) => {
          const index = vineManager.addVine();
          if (index === null) return;
          // start anywhere from the head to the shoulders
          const start = sample(range(RIGHT_SHOULDER + 1));
          vineManager.update(index, {
            pointA: start,
            pointB: sample(connections[start]),
            seed: Math.random(),
            person: i,
            life: 0
          });
        });
      }));

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

    vineManager.eachVine((index) => {
      const life = vineManager.value(index, 'life');
      const person = vineManager.value(index, 'person');

      // If there is still room to grow
      if (life < 1) {
        // Keep growing towards destination
        vineManager.update(index, {life: life + 0.04});

        // Maybe add a flower at the current point of growth
        if (Math.random() > 0.95) {
          const flowerIndex = particles.addParticle();
          if (flowerIndex !== undefined) {
            particles.update(flowerIndex, {
              pointA: vineManager.value(index, 'pointA'),
              pointB: vineManager.value(index, 'pointB'),
              person: vineManager.value(index, 'person'),
              mix: life,
              life: 0,
              seed: vineManager.value(index, 'seed'),
              scale: Math.random() * 1.2 + 0.5,
              rotation: Math.random() * 2 * Math.PI,
            });
          }
        }

      } else {
        // If we're done growing and haven't yet spawned more vines
        if (!vineManager.value(index, 'spawned')) {
          const spawnFrom = vineManager.value(index, 'pointB');

          vinesPerPerson[person] = vinesPerPerson[person] || 0;

          let numVinesToSpawn = 0;
          if (vinesPerPerson[person] < 12) {
            numVinesToSpawn = sample(range(3)) + 1;
          } else {
            numVinesToSpawn = Math.floor(3 * Math.random() * (1 - vinesPerPerson[person] / MAX_VINES))
          }

          // Maybe add more vines
          range(numVinesToSpawn).forEach(() => {
            const newIndex = vineManager.addVine();
            if (newIndex !== null) {
              vinesPerPerson[person] += 1;
              vineManager.update(newIndex, {
                // Start from the current vine's endpoint, going to somewhere new
                pointA: spawnFrom,
                pointB: sample(connections[spawnFrom]),
                seed: Math.random(),
                person: vineManager.value(index, 'person'),
                life: 0,
              });
            }
          });

          // Don't spawn any more vines from this one; mark it done
          vineManager.update(index, {spawned: true});
        }
      }
    });

    videoTexture(video);
    showVideo({ video: videoTexture });

    vines({
      vineState: vineManager.getTexture(),
      people: poseManager.getTexture(),
    });

    const t = new Date().getTime() - startTime;
    const windOffset = [
      Math.pow(Math.sin(t / 10000), 10) * (0.25*Math.sin(t / 400) + 0.05*Math.sin(t / 30)),
      Math.pow(Math.sin(t / 9998), 10) * (0.25*Math.sin(t / 403) + 0.05*Math.sin(t / 37)),
    ];

    flowers({
      particleState: particles.getTexture(),
      people: poseManager.getTexture(),
      windOffset,
    });
  });
});
