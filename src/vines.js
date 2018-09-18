import { MAX_VINES } from './commands/vines';
import { flatMap, range } from 'lodash';

export class VineManager {
  static properties = {
    used: 0,
    life: 1,
    pointA: 2,
    pointB: 3,
    person: 5,
  };

  static textureProps = {
    width: MAX_VINES,
    height: 6,
    channels: 1,
    format: 'alpha',
    type: 'float'
  };

  state = Float32Array.from(range(MAX_VINES*6).map(() => 0));
  freeVineIndices = range(MAX_VINES).reverse();
  usedVineIndices = {};
  dirty = true;


  constructor(regl) {
    this.regl = regl;
    this.texture = regl.texture(VineManager.textureProps);
  }

  addVine() {
    if (this.freeVineIndices.length > 0) {
      const newIndex = this.freeVineIndices.pop();
      this.usedVineIndices[newIndex] = true;
      this._setProperty(newIndex, 'used', 1);
      return newIndex;
    }

    return null;
  }

  removeVine(index) {
    this._setProperty(newIndex, 'used', 0);
    this.freeVineIndices.push(index);
    delete this.usedVineIndices[newIndex];
  }

  update(index, properties) {
    Object.keys(VineManager.properties).forEach((property) => {
      if (properties[property] !== undefined) {
        this._setProperty(index, property, properties[property]);
      }
    });
  }

  value(index, property) {
    return this._getProperty(index, property);
  }

  getTexture() {
    if (this.dirty) {
      this._updateTexture();
    }

    return this.texture;
  }

  eachVine(callback) {
    range(MAX_VINES).forEach((index) => {
      if (this._getProperty(index, 'used') !== 0) {
        callback(index);
      }
    });
  }

  _updateTexture() {
    this.texture({ ...VineManager.textureProps, data: this.state });
    this.dirty = false;
  }

  _setProperty(index, property, value) {
    this.state[VineManager.properties[property] * MAX_VINES + index] = value;
    this.dirty = true;
  }

  _getProperty(index, property) {
    return this.state[VineManager.properties[property] * MAX_VINES + index];
  }
}
