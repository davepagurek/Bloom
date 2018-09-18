import { flatMap, range } from 'lodash';

export function generateShowVideo(regl) {
  return regl({
    vert: `
      precision mediump float;

      attribute vec2 position;
      varying vec2 vPosition;

      void main() {
        vPosition = position;
        gl_Position = vec4(position, 0.9, 1.0);
      }
    `,

    frag: `
      precision mediump float;

      uniform sampler2D video;

      varying vec2 vPosition;

      void main() {
        gl_FragColor = vec4(texture2D(video, vec2(1.0, 1.0) - (vPosition/2.0 + vec2(0.5, 0.5))).xyz, 1.0);
      }
    `,

    attributes: {
      position: [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1]
      ]
    },

    uniforms: {
      video: regl.prop('video'),
    },

    primitive: 'triangle strip',

    count: 4
  });
}
