export const MAX_PARTICLES = 500;

export function generateFlowers(regl) {
  return regl({
    vert: `
      precision mediump float;

      attribute int index;
      attribute int corner;

      uniform bool particleUsed[${MAX_PARTICLES}];
      uniform vec2 particleLocation[${MAX_PARTICLES}];
      uniform vec2 offset[4];

      void main() {
        if (!particleUsed[index]) {
          gl_Position = vec4(0.0, 0.0, 0.0, 1.0);
          return;
        }

        gl_Position = vec4(
          particleLocations[index] + offset[corner],
          0.5,
          1.0
        );
      }
    `,

    frag: `
      precision mediump float;

      uniform bool particleUsed[${MAX_PARTICLES}];

      void main() {
        if (!particleUsed[index]) {
          discard;
          return;
        }

        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      }
    `,

    attributes: {
      index: range(MAX_PARTICLES * 6).map((i) => Math.floor(i/6)),
      corner: flatMap(range(MAX_PARTICLES), () => [0, 1, 2, 2, 3, 0])
    },

    uniforms: {
      particleUsed: regl.prop('particleUsed'),
      particleLocation: regl.prop('particleLocation'),
      offset: [
        [-0.1, -0.1],
        [-0.1, 0.1],
        [0.1, 0.1],
        [0.1, -0.1]
      ]
    },

    elements: [
      [0, 1, 2],
      [2, 3, 0]
    ]
  });
}
