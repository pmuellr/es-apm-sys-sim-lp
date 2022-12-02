#!/usr/bin/env node

'use strict'

import * as es from '@elastic/elasticsearch'

import { createLaunchPad } from './lib/launchpad.mjs'
import { Host } from "./lib/host.mjs"

const HOSTS = 3
const DEBUG = process.env.DEBUG != null
const DEFAULT_INDEX_NAME = 'es-apm-sys-sim'
const DEFAULT_CLUSTER_URL = 'http://elastic:changeme@localhost:9200'
const DEFAULT_CLUSTER_URL_ENV = 'ES_URL'

const [
  intervalS, 
  indexName = DEFAULT_INDEX_NAME, 
  clusterURL = process.env[DEFAULT_CLUSTER_URL_ENV] || DEFAULT_CLUSTER_URL
] = process.argv.slice(2)

if (intervalS == null) logError('interval parameter missing')

const interval = parseInt(intervalS, 10)
if (isNaN(interval)) logError(`invalid interval parameter: ${intervalS}`)

console.log([
  `running with`,
  `interval: ${interval} sec;`,
  `hosts: ${HOSTS};`,
  `indexName: ${indexName};`,
  `clusterURL: ${clusterURL}`
].join(' '))

let DocsWritten = 0

/** @type { Host[] } */
const Hosts = []

main()

async function main() {
  const launchPad = createLaunchPad()

  function shutItDown() {
    launchPad.shutdown()
    process.exit(0)
  }
  
  process.on('SIGINT', shutItDown)
  process.on('SIGTERM', shutItDown)
  process.on('SIGBREAK', shutItDown)

  const esClient = new es.Client({
    node: clusterURL,
    ssl: {
      rejectUnauthorized: false
    }
  })
  
  for (let i = 0; i < HOSTS; i++) {
    Hosts.push(new Host(i, launchPad))
  }

  setImmediate(update)
  setInterval(update, 1000 * interval)

  let wroteSampleDoc = false
  function update() {
    for (const host of Hosts) {
      const doc = host.nextDocument()
      writeDoc(esClient, doc)

      if (!wroteSampleDoc) {
        wroteSampleDoc = true
        const printable = JSON.stringify(doc, null, 4)
        console.log(`sample doc:`, printable)
        console.log('')
      }

      printCurrentStatus()
    }
  }
}

function printCurrentStatus() {
  const statuses = Hosts.map(host => host.statusString())
  statuses.push(`docs: ${DocsWritten}`)
  process.stdout.write(`\r${statuses.join('   ')}`)
}

/** @type { (esClient: any, doc: any) => Promise<void> } */
async function writeDoc (esClient, doc) {
  if (DEBUG) console.log(`writing doc ${indexName}: ${JSON.stringify(doc)}`)
  let response
  try {
    response = await esClient.index({
      index: indexName,
      body: doc
    })
  } catch (err) {
    logError(`error indexing document: ${JSON.stringify(err, null, 4)}`)
  }

  if (response.statusCode !== 201) {
    logError(`unexpected error indexing document: ${JSON.stringify(response, null, 4)}`)
  }

  DocsWritten++
}

/** @type { () => string } */
function getHelp () {
  return `
es-apm-sys-sim [options] <intervalSeconds> [<indexName> [<clusterURL>]]

Writes apm system metrics documents containing cpu usage
metrics, for three hosts, on the specified interval, to
the specified index at the specified elasticsearch cluster.

<indexName>  defaults to es-apm-sys-sim if not supplied
<clusterURL> defaults to the environment variable ${DEFAULT_CLUSTER_URL_ENV} or the value
             ${DEFAULT_CLUSTER_URL}

Fields in documents written:
  @timestamp                 current time
  host.name                  host name 
  host.name.keyword          host name (keyword field for aggregations)
  system.cpu.total.norm.pct  cpu usage,    0 -> 1 

home: https://github.com/pmuellr/es-apm-sys-sim-lp
`.trim()
}

/** @type { (message: string) => void } */
function logError (message) {
  console.log(message)
  process.exit(1)
}
