export function generateFlowers(regl) {
  return regl({
    vert: `
      precision mediump float;

      attribute vec2 position;

      void main() {
        gl_Position = vec4(position, 0.5, 1.0);
      }
    `,

    frag: `
      precision mediump float;

      void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      }
    `,

    attributes: {
      position: [
        [-0.5, -0.5],
        [-0.5, 0.5],
        [0.5, 0.5],
        [0.5, -0.5]
      ]
    },

    uniforms: {},

    elements: [
      [0, 1, 2],
      [2, 3, 0]
    ]
  });
}
