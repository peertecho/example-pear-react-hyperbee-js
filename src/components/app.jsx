/* global alert */
import { useState } from 'react'
import b4a from 'b4a'

import { createBeeWriter, createBeeReader } from '../lib/bee'

export default function App () {
  const [core, setCore] = useState()
  const [bee, setBee] = useState()
  const [message, setMessage] = useState('')

  const [inputCoreKey, setInputCoreKey] = useState('')
  const [status, setStatus] = useState('')
  const [output, setOutput] = useState('')

  const coreKey = core ? b4a.toString(core.key, 'hex') : ''

  const query = async (data) => {
    const word = data.toString().trim()
    if (!word.length) {
      alert('Please enter a msg')
      return
    }
    const node = await bee.get(word)
    if (!node?.value) setOutput(`No dictionary entry for ${word}`)
    else setOutput(`${word} -> ${node.value}`)
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

      <h3>Output</h3>
      <p>{output}</p>
    </div>
  )
}
