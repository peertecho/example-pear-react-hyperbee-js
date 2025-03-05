/* global alert */
import { useState } from 'react'
import b4a from 'b4a'

import { createBeeWriter, createBeeReader, createCoreReader } from '../lib/bee'

export default function App () {
  const [core, setCore] = useState()
  const [bee, setBee] = useState()
  const [message, setMessage] = useState('')

  const [inputCoreKey, setInputCoreKey] = useState('')
  const [status, setStatus] = useState('')
  const [messsages, setMessages] = useState([])

  const coreKey = core ? b4a.toString(core.key, 'hex') : ''

  const query = async (data) => {
    const word = data.toString().trim()
    if (!word.length) {
      alert('Please enter a msg')
      return
    }
    const node = await bee.get(word)
    if (!node?.value) console.log(`No dictionary entry for ${word}`)
    else console.log(`${word} -> ${node.value}`)
    setImmediate(console.log) // flush hack
  }

  const onStartWriter = async () => {
    const core = await createBeeWriter()
    setCore(core)
  }

  const onStartReader = async () => {
    if (!inputCoreKey) {
      alert('Please enter a core key')
      return
    }
    setStatus('starting...')
    const bee = await createBeeReader({ coreKeyWriter: inputCoreKey })
    setBee(bee)
    setStatus('started')
  }

  const onStartCoreReader = async () => {
    if (!inputCoreKey) {
      alert('Please enter a core key')
      return
    }
    setStatus('starting...')
    await createCoreReader({ 
      coreKeyWriter: inputCoreKey,
      onData: (data) => {
        setMessages((msgs) => [...msgs, b4a.toString(data.block, 'utf8')])
      }
    })
    setStatus('started')
  }

  return (
    <div style={{ padding: 10, background: 'cyan' }}>
      <h1>MyApp</h1>

      <h2>Writer</h2>
      <button onClick={onStartWriter}>Start writer</button>
      <p>Core key: {coreKey}</p>

      <hr />

      <h2>Reader</h2>
      <div>
        <textarea type='text' value={inputCoreKey} onChange={(evt) => setInputCoreKey(evt.currentTarget.value)} />
      </div>
      <button onClick={onStartReader}>Start reader</button>
      <p>Status: {status}</p>

      <h3>Query message</h3>
      <div>
        <textarea type='text' value={message} onChange={(evt) => setMessage(evt.currentTarget.value)} />
      </div>
      <button onClick={() => query(message)}>Query</button>

      <hr />

      <h2>Core Reader</h2>
      <div>
        <textarea type='text' value={inputCoreKey} onChange={(evt) => setInputCoreKey(evt.currentTarget.value)} />
      </div>
      <button onClick={onStartCoreReader}>Start core reader</button>
      <p>Status: {status}</p>

      <h3>Receive message</h3>
      {messsages.map((msg, idx) => <p key={idx}>{msg}</p>)}
    </div>
  )
}
