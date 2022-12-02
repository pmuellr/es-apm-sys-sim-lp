import { LaunchPad } from './launchpad.mjs'

const ColorBlue   = 41
const ColorGreen  = 25
const ColorYellow = 13
const ColorRed    =  5
const ColorOrange =  9

const CpuValues =   [      0.01,       0.25,        0.50,     0.75,        0.99 ]
const PulseValues = [     false,      false,       false,    false,        true ]
const ColorValues = [ ColorBlue, ColorGreen, ColorYellow, ColorRed, ColorOrange ]

const UnusedNotes = [
  14, 15, 16, 17, 18,
  24, 25, 26, 27, 28,
  34, 35, 36, 37, 38,
  44, 45, 46, 47, 48,
  54, 55, 56, 57, 58,
]
const UnusedNotesSet = new Set(UnusedNotes)

export class Host {
  /**
   * @constructs Host
   * @param {number} instance
   * @param {LaunchPad} launchPad: 
   */  
  constructor(instance, launchPad) {
    this.instance = instance
    this.launchPad = launchPad
    this.hostName = `host-${instance + 1}`
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

    for (const note of UnusedNotes) {
      this.launchPad.onNote(note, async () => {
        this.goCrazyLaunchpad2(note)
      })
    }
  }

  /** @type { (index: number) => void } */
  updateCpuIndex(index) {
    // console.log(`\nsetting ${this.instance} cpuIndex: ${index}`)
    this.cpuIndex = index

    this.updateLaunchpad()
  }

  cpuMetric() {
    return CpuValues[this.cpuIndex]
  }

  statusString() {
    const cpu = this.cpuMetric()

    return `${this.hostName}: c:${cpu}`
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

    this.updateLaunchpad()
  }

  updateLaunchpad() {
    for (let i=0; i<8; i++) {
      const index = this.history[i]
      if (index == null) break

      const note = this.historyNotes[i]
      const color = ColorValues[index]
      const pulse = PulseValues[index]
      this.launchPad.lightPad(note, color, pulse)
    }

    // clear previous notes
    this.currentNotes.forEach(note => this.launchPad.lightPad(note))

    // set current notes
    const index = this.cpuIndex
    for (let i=0; i<=index; i++) {
      const note = this.currentNotes[i]
      const color = ColorValues[index]
      const pulse = PulseValues[index]
      this.launchPad.lightPad(note, color, pulse)  
    }
  }

  /** @type { () => Promise<void> } */
  async goCrazyLaunchpad() {
    const randomColor = () => Math.round(Math.random() * 127)
    const randomNote = () => {
      const index = Math.floor(Math.random() * UnusedNotes.length)
      return UnusedNotes[index]
    }
    const start = Date.now()
    while (Date.now() - start < 500) {
      this.launchPad.lightPad(randomNote(), randomColor())
      await delay(3)
    }

    // clear
    for (const note of UnusedNotes) {
      this.launchPad.lightPad(note)
    }
  }

  /** @type { (note: number) => Promise<void> } */
  async goCrazyLaunchpad2(note) {
    let lastNote = note
    let currentNote = note
    let currentColor = Math.floor(Math.random() * 128)
    const Moves = [1, -1, 10, -10]
    const ColorChanges = [1, -1]

    const randomMove = () => Moves[Math.floor(Math.random() * 4)]
    const randomNote = () => {
      while (true) {
        const move = randomMove()
        if (randomMove == null) continue
        const next = currentNote + move
        if (next == lastNote) continue

        if (UnusedNotesSet.has(next)) return next
      }
    }
    const randomColor = () => {
      while (true) {
        const change = Math.random() < 0.5 ? -1 : 1;
        let next = currentColor + change
        if (next < 0) next = 127
        if (next > 127) next = 0

        return next
      }
    }

    const start = Date.now()
    while (Date.now() - start < 5000) {
      lastNote = currentNote
      currentNote = randomNote()
      currentColor = randomColor()
      this.launchPad.lightPad(currentNote, currentColor)
      await delay(100)
    }

    // clear
    for (const note of UnusedNotes) {
      this.launchPad.lightPad(note)
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

/** @type {(ms: number) => Promise<void>} */
async function delay(ms) {
  return new Promise((resolve, reject) => setTimeout(resolve, ms))

}
