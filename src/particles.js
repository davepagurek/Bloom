import { MAX_PARTICLES } from './commands/flowers';

import { range } from 'lodash';

export class ParticleManager {
  freeParticleIndices = range(MAX_PARTICLES);
  particleLife = Int16Array.from(range(MAX_PARTICLES).map(() => 0));
  particleUsed = Int16Array.from(range(MAX_PARTICLES).map(() => 0));
  particleLocation = Float32Array.from(range(MAX_PARTICLES*2).map(() => 0));

  addParticle() {
    if (this.freeParticleIndices.length > 0) {
      const newIndex = this.freeParticleIndices.pop();
      this.usedParticleIndices[newIndex] = true;
      this.particleUsed[newIndex] = 1;
      return newIndex;
    }

    return null;
  }

  removeParticle(index) {
    this.particleUsed[index] = 0;
    this.freeParticleIndices.push(index);
  }

  update(index, properties) {
    if (properties.x !== undefined) {
      this.particleLocations[index*2] = properties.x;
    }

    if (properties.y !== undefined) {
      this.particleLocations[index*2 + 1] = properties.y;
    }

    if (properties.life !== undefined) {
      this.particleLife[index] = properties.life
    }
  }

  value(index, property) {
    if (property == 'x') {
      return this.particleLocation[index*2];
    } else if (property == 'y') {
      return this.particleLocation[index*2 + 1];
    } else if (property == 'life') {
      return this.particleLife[index];
    }

    return null;
  }
}
