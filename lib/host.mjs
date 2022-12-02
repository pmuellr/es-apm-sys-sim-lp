const MAX_MEM = 1000 * 1000 // ONE WHOLE MEGABYTE OF MEMORY!!!

import { LaunchPad } from './launchpad.mjs'

const ColorBlue = 41
const ColorGreen = 25
const ColorYellow = 12
const ColorRed = 5

const CpuValues =   [      0.01,       0.25,        0.50,     0.75,     0.99 ]
const PulseValues = [     false,      false,       false,    false,     true ]
const ColorValues = [ ColorBlue, ColorGreen, ColorYellow, ColorRed, ColorRed ]

export class Host {
  /**
   * @constructs Host
   * @param {number} instance
   * @param {LaunchPad} launchPad: 
   */  
  constructor(instance, launchPad) {
    this.instance = instance;
    this.launchPad = launchPad;
    this.hostName = `host-${instance + 1}`;
    this.cpuIndex = 0
    /** @type { number[] } */
    this.history = []

    this.historyNotes = [81, 82, 83, 84, 85, 86, 87, 88]
    this.currentNotes = [11, 21, 31, 41, 51]

    this.historyNotes = this.historyNotes.map(n => n - 10 * instance)
    this.currentNotes = this.currentNotes.map(n => n + instance)

    for (let i=0; i<this.currentNotes.length; i++ ) {
      const note = this.currentNotes[i]
      this.launchPad.onNote(note, () => this.updateCpuIndex(i))
    }
  }

  /** @type { (index: number) => void } */
  updateCpuIndex(index) {
    // console.log(`\nsetting ${this.instance} cpuIndex: ${index}`)
    this.cpuIndex = index

    this.currentNotes.forEach(note => this.launchPad.lightPad(note))
    for (let i=0; i<=index; i++) {
      const note = this.currentNotes[i]
      const color = ColorValues[i]
      const pulse = PulseValues[i]
      this.launchPad.lightPad(note, color, pulse)  
    }
  }

  cpuMetric() {
    return CpuValues[this.cpuIndex]
  }

  statusString() {
    const cpu = this.cpuMetric();

    return `${this.hostName}: c:${cpu}`;
  }

  /** @type { () => any } */
  nextDocument() {
    this.updateHistory()

    const cpu = this.cpuMetric()
    return getDocument(this.hostName, cpu)
  }

  /** @type { () => any } */
  updateHistory() {
    this.history.push(this.cpuIndex)
    while (this.history.length > 8) this.history.shift()

    for (let i=0; i<8; i++) {
      const index = this.history[i]
      if (index == null) break;

      const note = this.historyNotes[i]
      const color = ColorValues[index]
      const pulse = PulseValues[index]
      this.launchPad.lightPad(note, color, pulse)
    }
  }

}

/** @type { (hostName: string, cpu: number) => any } */
function getDocument(hostName, cpu) {
  return {
    '@timestamp': new Date().toISOString(),
    host: {
        name: hostName
    },
    system: {
        cpu: {
            total: {
                norm: {
                    pct: cpu
                }
            }
        }
    }
  }
}
