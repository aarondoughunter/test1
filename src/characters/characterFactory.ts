import { BaseCharacter } from './BaseCharacter'
import { BigDog } from './BigDog'
import { Donna } from './Donna'
import { Dougie } from './Dougie'
import { Aaron } from './Aaron'
import { Mabry } from './Mabry'
import { Nate } from './Nate'
import { Dulcey } from './Dulcey'
import { Nicole } from './Nicole'
import { Kristen } from './Kristen'
import Phaser from 'phaser'

// Map of character IDs to their constructors
const characterClasses: Record<string, new (scene: Phaser.Scene, x: number, y: number, isPlayer: boolean) => BaseCharacter> = {
  big_dog: BigDog,
  donna: Donna,
  dougie: Dougie,
  aaron: Aaron,
  mabry: Mabry,
  nate: Nate,
  dulcey: Dulcey,
  nicole: Nicole,
  kristen: Kristen,
}

export const CHARACTER_ORDER = ['big_dog', 'donna', 'dougie', 'aaron', 'mabry', 'nate', 'dulcey', 'nicole', 'kristen']

export function createCharacter(id: string, scene: Phaser.Scene, x: number, y: number, isPlayer: boolean): BaseCharacter {
  const Cls = characterClasses[id]
  if (!Cls) throw new Error(`Unknown character id: ${id}`)
  return new Cls(scene, x, y, isPlayer)
}
