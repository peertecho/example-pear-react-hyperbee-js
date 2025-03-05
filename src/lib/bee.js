/* global Pear, Node */
/** @typedef {import('pear-interface')} */

import path from 'path'
import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import Hyperbee from 'hyperbee'
import b4a from 'b4a'

const { updates, reload, teardown } = Pear

updates(() => reload())

const swarm = new Hyperswarm()
teardown(() => swarm.destroy())

export async function createBeeWriter ({ name = 'writer' } = {}) {
  console.log('starting writer')
  const store = new Corestore(path.join(Pear.config.storage, name))
  await store.ready()
  swarm.on('connection', conn => store.replicate(conn))

  const core = store.get({ name })
  await core.ready()

  const bee = new Hyperbee(core, {
    keyEncoding: 'utf-8',
    valueEncoding: 'utf-8'
  })

  console.log('joining', b4a.toString(core.discoveryKey, 'hex'))
  const discovery = swarm.join(core.discoveryKey)
  await discovery.flushed()

  if (core.length <= 1) {
    console.log('importing dictionary...')
    const clientId = JSON.parse(Pear.argv[Pear.argv.length - 1]).id
    const filePath = 'dict.json'
    const dict = await fetch(`${window.location.origin}/${filePath}`, {
      headers: { 'User-Agent': `Pear ${clientId}` }
    }).then(res => res.json())
    const batch = bee.batch()
    for (const { key, value } of dict) {
      await batch.put(key, value)
    }
    await batch.flush()
  } else {
    console.log('seeding dictionary...')
  }

  return core
}

export async function createBeeReader ({ name = 'reader', coreKeyWriter } = {}) {
  console.log('starting reader', coreKeyWriter)
  const store = new Corestore(path.join(Pear.config.storage, name))
  await store.ready()
  swarm.on('connection', (conn) => store.replicate(conn))

  const core = store.get({ key: coreKeyWriter })
  await core.ready()

  const bee = new Hyperbee(core, {
    keyEncoding: 'utf-8',
    valueEncoding: 'utf-8'
  })

  swarm.join(core.discoveryKey)

  return bee
}

export async function createCoreReader ({ name = 'core-reader', coreKeyWriter } = {}) {
  console.log('starting core-reader', coreKeyWriter)
  const store = new Corestore(path.join(Pear.config.storage, name))
  await store.ready()
  swarm.on('connection', (conn) => store.replicate(conn))

  const core = store.get({ key: coreKeyWriter })
  await core.ready()

  console.log('joining', b4a.toString(core.discoveryKey, 'hex'))
  const foundPeers = core.findingPeers()
  swarm.join(core.discoveryKey)
  swarm.on('connection', conn => core.replicate(conn))
  swarm.flush().then(() => foundPeers())

  console.log('updating')
  await core.update()

  const seq = core.length - 1
  const lastBlock = await core.get(core.length - 1)

  console.log(`Raw Block ${seq}:`, lastBlock)
  console.log(`Decoded Block ${seq}`, Node.decode(lastBlock))
}
