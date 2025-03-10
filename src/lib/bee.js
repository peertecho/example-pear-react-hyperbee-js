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
  teardown(() => store.close())
  await store.ready()
  swarm.on('connection', conn => store.replicate(conn))

  const core = store.get({ name })
  teardown(() => core.close())
  await core.ready()

  const bee = new Hyperbee(core, {
    keyEncoding: 'utf-8',
    valueEncoding: 'utf-8'
  })
  teardown(() => bee.close())

  const discovery = swarm.join(core.discoveryKey)
  await discovery.flushed()

  if (core.length <= 1) {
    console.log('importing dictionary...')
    const dict = await fetch(`${window.location.origin}/dict.json`).then(res => res.json())
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
  teardown(() => store.close())
  await store.ready()
  swarm.on('connection', (conn) => store.replicate(conn))

  const core = store.get({ key: coreKeyWriter })
  teardown(() => core.close())
  await core.ready()

  const bee = new Hyperbee(core, {
    keyEncoding: 'utf-8',
    valueEncoding: 'utf-8'
  })
  teardown(() => bee.close())

  swarm.join(core.discoveryKey)
  swarm.flush()

  return bee
}
