import { expect, test } from 'claude-code/testing'

import { complete, run, stage, start, status } from './support'

const SURFACES = ['terminal', 'desktop'] as const
const LONG = Array.from({ length: 80 }, (_, i) => `word${i}`).join(' ')

const pane = (surface: (typeof SURFACES)[number]) =>
  ({
    plugin: 'blixel',
    surface,
    component: 'Pane',
    requestId: 'blixel',
    viewport: { columns: 100, rows: 40 },
    props: {
      title: 'Blixel',
      isFocused: false,
      bodyColumns: 60,
      placement: 'dock',
      scroll: { offset: 0, bodyRows: 30 },
      view: {},
    },
  }) as const

const connectedCli = () => {
  let isConnected = true
  return {
    calls: [] as string[],
    answer(command: string) {
      this.calls.push(command)
      if (command === 'disconnect') isConnected = false
      if (command === 'connect') isConnected = true
      if (command === 'disconnect' || command === 'connect') {
        return { exitCode: 0, stdout: JSON.stringify({ data: { outcome: isConnected ? 'connected' : 'disconnected' } }) }
      }
      return {
        exitCode: 0,
        stdout: isConnected
          ? status({ connection_id: 'c-1', follower_attached: true }, { approval_mode: 'ask' })
          : status({ follower_attached: true }),
      }
    },
  }
}

test('/blixel:status opens the Blixel pane', async ($, on) => {
  const stub = stage(on)

  await start($)
  await stub.settle()
  await run($, 'blixel:status')

  expect(stub.panes).toEqual(['blixel'])
})

test('/blixel:connect opens the pane in the desktop app', async ($, on) => {
  const cli = connectedCli()
  const desktop = stage(on, { cli: command => cli.answer(command), surfaces: ['desktop'] })

  await start($)
  await desktop.settle()
  await run($, 'blixel:connect')

  expect(desktop.panes).toEqual(['blixel'])
})

test('/blixel:connect leaves the terminal as it is', async ($, on) => {
  const cli = connectedCli()
  const terminal = stage(on, { cli: command => cli.answer(command), surfaces: ['terminal'] })

  await start($)
  await terminal.settle()
  await run($, 'blixel:connect')

  expect(terminal.panes).toEqual([])
})

test('the pane shows the connection and ends it, on every surface', async ($, on) => {
  const cli = connectedCli()
  const stub = stage(on, { cli: command => cli.answer(command) })

  await start($)
  await stub.settle()

  for (const surface of SURFACES) {
    await run($, 'blixel:connect')
    await stub.settle()
    const ui = await $.ui.mount(pane(surface))
    expect(await ui.find({ type: 'Text', text: /Connected to your meeting/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /asks you before each handoff/ })).toBeDefined()
    expect((await ui.find({ key: 'connection' }))?.props.label).toBe('Disconnect')

    await ui.press({ key: 'connection' })
    await stub.settle()
    expect(cli.calls).toContain('disconnect')
    expect(await ui.find({ type: 'Text', text: /Not connected/ })).toBeDefined()
    expect((await ui.find({ key: 'connection' }))?.props.label).toBe('Connect')
    await ui.unmount()
  }
})

test("the pane says when Blixel isn't running, with nothing to press", async ($, on) => {
  const stub = stage(on, {
    cli: () => ({ exitCode: 1, stderr: '{"error":{"code":"app_unavailable","message":"The app is not running"}}\n' }),
  })

  await start($)
  await stub.settle()

  for (const surface of SURFACES) {
    const ui = await $.ui.mount(pane(surface))
    expect(await ui.find({ type: 'Text', text: /Blixel isn't running/ })).toBeDefined()
    expect(await ui.find({ key: 'connection' })).toBeUndefined()
    await ui.unmount()
  }
})

test('the pane lists each handoff with what became of it', async ($, on) => {
  const answers = ['the prompt was removed from the queue before it ran']
  const stub = stage(on, { printed: ['Rename the flag\n'], submit: () => answers.shift() })

  await start($)
  await stub.settle()

  for (const surface of SURFACES) {
    const ui = await $.ui.mount(pane(surface))
    expect(await ui.find({ type: 'Text', text: /Rename the flag/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Waiting for your next message/ })).toBeDefined()
    await ui.unmount()
  }

  await complete($)
  await stub.settle()

  for (const surface of SURFACES) {
    const ui = await $.ui.mount(pane(surface))
    expect(await ui.find({ type: 'Text', text: /Waiting for your next message/ })).toBeUndefined()
    await ui.unmount()
  }
  const desktop = await $.ui.mount(pane('desktop'))
  expect(await desktop.find({ type: 'Text', text: /Sent to Claude/ })).toBeDefined()
  await desktop.unmount()
})

test('a long handoff in the pane shows its opening until it is opened', async ($, on) => {
  const stub = stage(on, { printed: [`${LONG}\n`] })

  await start($)
  await stub.settle()

  for (const surface of SURFACES) {
    const ui = await $.ui.mount(pane(surface))
    expect(await ui.find({ type: 'Text', text: /word79/ })).toBeUndefined()

    await ui.press({ key: 'more-1' })
    expect(await ui.find({ type: 'Text', text: /word79/ })).toBeDefined()

    await ui.press({ key: 'more-1' })
    expect(await ui.find({ type: 'Text', text: /word79/ })).toBeUndefined()
    await ui.unmount()
  }
})
