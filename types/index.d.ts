/** One handoff this session received, as the Blixel pane lists it. */
export type PanelHandoff = { n: number; text: string; at: number; state: 'waiting' | 'held' | 'delivered' }

/** What the Blixel pane shows. */
export type Panel = {
  app: 'unknown' | 'running' | 'closed'
  isInMeeting: boolean
  isConnected: boolean
  approval: 'ask' | 'direct' | null
  isViaMonitor: boolean
  handoffs: PanelHandoff[]
}

declare module 'claude-code' {
  interface PluginState {
    blixel: { panel: Shaped<Panel>; opened: number[] }
  }
}
