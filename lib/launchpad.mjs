/** @typedef { import('./types').OnMessage } OnMessage */
/** @typedef { import('./types').MidiPort } MidiPort */

import { EventEmitter } from 'node:events'

import * as midiPort from './midi-port.mjs'


export function createLaunchPad() {
  return new LaunchPad()
}

export class LaunchPad {
  constructor() {
    this.events = new EventEmitter()

    /** @type { number[] } */

    /** @type { OnMessage } */
    const onMessage = (deltaTime, message) => {
      // const bytes = message.map(toHex).join(' ')
      // console.log(`${Math.round(deltaTime * 1000)}`.padStart(7), bytes)
      const [ command, note, velocity ] = message
      // console.log(command.toString(16), note.toString(16), velocity.toString(16))
      if (command === 0x90 && velocity === 0x7F) {
        // console.log(`emitting event note-${note}`)
        this.events.emit(`note-${note}`)
      }
    }
    
    try {
      /** @type { MidiPort } */
      this.port = midiPort.createActualMidiPort({ 
        name: 'LaunchpadMini' || 'LPMiniMK3 MIDI',
        onMessage,
      })
    } catch (err) {
      throw new Error(`error opening LaunchPad midi port: ${err}`)
    }
  
    setProgrammerMode(this.port)
  }

  /** @type { (note: number, handler: (...args: any[]) => void) => void } */
  onNote(note, handler) {
    this.events.addListener(`note-${note}`, handler)
  }

  // notes are in programmer mode layout, in decimal:
  //   91 92 93 ... 99         where the 9x and x9 entries are the "black
  //   81 82 83 ... 89         keys" on the top and right edges of the 
  //   ...                     device
  //   11 12 13 ... 19

  /** @type { (note: number, paletteIndex: number, pulse: boolean) => void } */
  lightPad(note, paletteIndex, pulse = false) {
    lightPad(this.port, note, paletteIndex, pulse)
  }

  clear() {
    for (let note = 11; note <= 99; note++) {
      if (note % 10 === 0) continue;
      this.lightPad(note, 0)
    }
  }

  /** @type { (text: string, paletteIndex: number, seconds: number, speed: number) => void } */
  scrollText(text, paletteIndex, seconds = 5, speed) {
    scrollText(this.port, text, paletteIndex, speed)
  
    delay(1000 * seconds).then(() => scrollText(this.port))
  }

  shutdown() {
    shutdown(this.port)
  }
}

// color 0 sets lite off
/** @type { (port: MidiPort, note: number, paletteIndex: number, pulse: boolean) => void } */
function lightPad(port, note, paletteIndex, pulse = false) {
  const command = pulse ? 0x92 : 0x91
  port.sendMessage([ command, note, paletteIndex ]);  
}

// empty text stops scrolling
/** @type { (port: MidiPort, text: string, paletteIndex: number, speed: number) => void } */
function scrollText(port, text = '', paletteIndex = 3, speed = 1) {
  const textBytes = string2bytes(text)
  //                  F0h   00h   20h   29h   02h   0Dh   07h <loop> <speed>    <colourspec>        <text>    F7h
  port.sendMessage([0xF0, 0x00, 0x20, 0x29, 0x02, 0x0D, 0x07,     1,  speed, 0, paletteIndex, ...textBytes , 0xF7])
}

/** @type { (s: string) => number[] } */
function string2bytes(s) {
  return Buffer.from(s, 'utf8').toJSON().data
}

/** @type { (port: MidiPort) => void } */
function setProgrammerMode(port) {
  //                  F0h   00h   20h   29h   02h   0Dh   0Eh <mode>  F7h
  port.sendMessage([0xF0, 0x00, 0x20, 0x29, 0x02, 0x0D, 0x0E, 0x01, 0xF7])
}

/** @type { (port: MidiPort) => void } */
function setLiveMode(port) {
  //                  F0h   00h   20h   29h   02h   0Dh   0Eh <mode>  F7h
  port.sendMessage([0xF0, 0x00, 0x20, 0x29, 0x02, 0x0D, 0x0E, 0x00, 0xF7])
}

/** @type { (port: MidiPort) => void } */
function shutdown(port) {
  console.log('shutting down, resetting Launchpad')
  setLiveMode(port)
}

/** @type { (n: number) => string } */
function toHex(n) {
  return n.toString(16).toUpperCase().padStart(2, '0')
}

/** @type {(ms: number) => Promise<void>} */
async function delay(ms) {
  return new Promise((resolve, reject) => setTimeout(resolve, ms))

}