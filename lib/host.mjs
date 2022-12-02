const MAX_MEM = 1000 * 1000 // ONE WHOLE MEGABYTE OF MEMORY!!!

import { LaunchPad } from './launchpad.mjs'

const CpuValues = [ 0.0, 0.25, 0.50, 0.75, 1.0 ]

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

    this.historyNotes = this.historyNotes.map(n => n + 10 * instance)
    this.currentNotes = this.currentNotes.map(n => n + instance)

    for (let i=0; i<this.currentNotes.length; i++ ) {
      const note = this.currentNotes[i]
      const value = CpuValues[i]
      this.launchPad.onNote(note, () => { this.cpuIndex = i })
      this.launchPad.onNote(note, () => console.log(`\nsetting ${this.instance} cpuIndex: ${i}`))
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
    this.history.push(this.cpuIndex)
    while (this.history.length > 8) this.history.shift()

    const cpu = this.cpuMetric()
    return getDocument(this.hostName, cpu)
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
