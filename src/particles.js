import { MAX_PARTICLES } from './commands/flowers';

import { range } from 'lodash';

export class ParticleManager {
  static properties = {
    used: 0,
    life: 1,
    x: 2,
    y: 3
  };

  static textureProps = {
    width: MAX_PARTICLES,
    height: 4,
    channels: 1,
    format: 'alpha',
    type: 'float'
  };

  freeParticleIndices = range(MAX_PARTICLES).reverse();
  usedParticleIndices = {};
  state = Float32Array.from(range(MAX_PARTICLES*4).map(() => 0));
  dirty = true;

  constructor(regl) {
    this.regl = regl;
    this.texture = regl.texture(ParticleManager.textureProps);
  }

  getTexture() {
    if (this.dirty) {
      this._updateTexture();
    }

    return this.texture;
  }

  addParticle() {
    if (this.freeParticleIndices.length > 0) {
      const newIndex = this.freeParticleIndices.pop();
      this.usedParticleIndices[newIndex] = true;
      this._setProperty(newIndex, 'used', 1);
      return newIndex;
    }

    return null;
  }

  removeParticle(index) {
    this._setProperty(newIndex, 'used', 0);
    this.freeParticleIndices.push(index);
    delete this.usedParticleIndices[newIndex];
  }

  update(index, properties) {
    Object.keys(ParticleManager.properties).forEach((property) => {
      if (properties[property] !== undefined) {
        this._setProperty(index, property, properties[property]);
      }
    });
  }

  value(index, property) {
    return this._getProperty(index, property);
  }

  eachParticle(callback) {
    range(MAX_PARTICLES).forEach((index) => {
      if (this._getProperty(index, 'used') !== 0) {
        callback(index);
      }
    });
  }

  _updateTexture() {
    this.texture({ ...ParticleManager.textureProps, data: this.state });
    this.dirty = false;
  }

  _setProperty(index, property, value) {
    this.state[ParticleManager.properties[property] * MAX_PARTICLES + index] = value;
    this.dirty = true;
  }

  _getProperty(index, property) {
    return this.state[ParticleManager.properties[property] * MAX_PARTICLES + index];
  }
}
