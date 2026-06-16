import { AIProfile } from '../types';

export const aiProfiles: Record<string, AIProfile> = {
  big_dog: {
    characterId: 'big_dog',
    preferredRange: 'close',
    aggressionBase: 0.85,
    specialUsageWeights: [0.3, 0.5, 0.2],
    antiAirTendency: 0.3,
    trapLayingFrequency: 0,
  },

  donna: {
    characterId: 'donna',
    preferredRange: 'mid',
    aggressionBase: 0.5,
    specialUsageWeights: [0.5, 0.3, 0.2],
    antiAirTendency: 0.6,
    trapLayingFrequency: 0,
  },

  dougie: {
    characterId: 'dougie',
    preferredRange: 'mid',
    aggressionBase: 0.7,
    specialUsageWeights: [0.4, 0.4, 0.2],
    antiAirTendency: 0.4,
    trapLayingFrequency: 0,
  },

  aaron: {
    characterId: 'aaron',
    preferredRange: 'mid',
    aggressionBase: 0.65,
    specialUsageWeights: [0.5, 0.3, 0.2],
    antiAirTendency: 0.7,
    trapLayingFrequency: 0,
  },

  mabry: {
    characterId: 'mabry',
    preferredRange: 'mid',
    aggressionBase: 0.75,
    specialUsageWeights: [0.4, 0.3, 0.3],
    antiAirTendency: 0.5,
    trapLayingFrequency: 0,
  },

  nate: {
    characterId: 'nate',
    preferredRange: 'far',
    aggressionBase: 0.3,
    specialUsageWeights: [0.6, 0.3, 0.1],
    antiAirTendency: 0.4,
    trapLayingFrequency: 0,
  },

  dulcey: {
    characterId: 'dulcey',
    preferredRange: 'far',
    aggressionBase: 0.35,
    specialUsageWeights: [0.3, 0.2, 0.5],
    antiAirTendency: 0.3,
    trapLayingFrequency: 0.7,
  },

  nicole: {
    characterId: 'nicole',
    preferredRange: 'mid',
    aggressionBase: 0.55,
    specialUsageWeights: [0.3, 0.3, 0.4],
    antiAirTendency: 0.4,
    trapLayingFrequency: 0,
  },

  kristen: {
    characterId: 'kristen',
    preferredRange: 'close',
    aggressionBase: 0.8,
    specialUsageWeights: [0.5, 0.3, 0.2],
    antiAirTendency: 0.3,
    trapLayingFrequency: 0,
  },
};
