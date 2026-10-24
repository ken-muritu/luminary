import { contextBridge, ipcRenderer } from 'electron'

function invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T> {
  return ipcRenderer.invoke(channel, ...args) as Promise<T>
}

function on(channel: string, cb: (...args: unknown[]) => void): () => void {
  const listener = (_e: Electron.IpcRendererEvent, ...args: unknown[]) => cb(...args)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

contextBridge.exposeInMainWorld('luminary', {
  songs: {
    getAll:   ()           => invoke('songs:getAll'),
    getById:  (id: number) => invoke('songs:getById', id),
    create:   (data: unknown) => invoke('songs:create', data),
    update:   (data: unknown) => invoke('songs:update', data),
    delete:   (id: number) => invoke('songs:delete', id),
    search:   (q: string)  => invoke('songs:search', q),
  },
  setlists: {
    getAll:       ()               => invoke('setlists:getAll'),
    getById:      (id: number)     => invoke('setlists:getById', id),
    create:       (data: unknown)  => invoke('setlists:create', data),
    update:       (data: unknown)  => invoke('setlists:update', data),
    delete:       (id: number)     => invoke('setlists:delete', id),
    addItem:      (data: unknown)  => invoke('setlists:addItem', data),
    removeItem:   (id: number)     => invoke('setlists:removeItem', id),
    reorderItems: (items: unknown) => invoke('setlists:reorderItems', items),
  },
  bible: {
    search:          (payload: unknown) => invoke('bible:search', payload),
    getVerse:        (payload: unknown) => invoke('bible:getVerse', payload),
    getRange:        (payload: unknown) => invoke('bible:getRange', payload),
    getChapter:      (payload: unknown) => invoke('bible:getChapter', payload),
    getBooks:        ()                 => invoke('bible:getBooks'),
    getTranslations: ()                 => invoke('bible:getTranslations'),
    parseReference:  (payload: unknown) => invoke('bible:parseReference', payload),
  },
  media: {
    list:   ()               => invoke<{ items: unknown[] }>('media:list'),
    import: ()               => invoke<{ success: boolean; cancelled?: boolean; items?: unknown[] }>('media:importDialog'),
    delete: (id: number)     => invoke('media:delete', { id }),
  },
  settings: {
    getAll:  ()               => invoke('settings:getAll'),
    get:     (key: string)    => invoke('settings:get', key),
    set:     (key: string, value: unknown) => invoke('settings:set', { key, value }),
    setBulk: (data: unknown)  => invoke('settings:setBulk', data),
  },
  reports: {
    getUsageLog:      (params?: unknown) => invoke('reports:getUsageLog', params ?? {}),
    logSongUsage:     (data: unknown)    => invoke('reports:logSongUsage', data),
    getTopSongs:      (params?: unknown) => invoke('reports:getTopSongs', params ?? {}),
    getMonthlyTotals: (params?: unknown) => invoke('reports:getMonthlyTotals', params ?? {}),
    getSummary:       (params?: unknown) => invoke('reports:getSummary', params ?? {}),
    exportCCLI:       (params?: unknown) => invoke('reports:exportCCLI', params ?? {}),
  },
  license: {
    validate: (key: string) => invoke('license:validate', key),
    getStatus: ()           => invoke('license:getStatus'),
  },
  output: {
    goLive:      ()            => invoke('output:goLive'),
    endLive:     ()            => invoke('output:endLive'),
    setSlide:    (data: unknown) => invoke('output:setSlide', data),
    setBlank:    (on: boolean) => invoke('output:setBlank', on),
    setLogo:     (on: boolean) => invoke('output:setLogo', on),
    setFreeze:   (on: boolean) => invoke('output:setFreeze', on),
    getDisplays: ()            => invoke('output:getDisplays'),
    mapDisplay:  (data: unknown) => invoke('output:mapDisplay', data),
    updateConfig: (cfg: unknown) => invoke('output:updateConfig', cfg),
  },
  stage: {
    open:        ()            => invoke('stage:open'),
    close:       ()            => invoke('stage:close'),
    setContent:  (data: unknown) => invoke('stage:setContent', data),
  },
  backup: {
    create:      () => invoke('backup:create'),
    list:        () => invoke('backup:list'),
    restore:     (path: string) => invoke('backup:restore', path),
    export:      () => invoke('backup:export'),
    import:      () => invoke('backup:import'),
    auto:        () => invoke('backup:auto'),
  },
  ai: {
    startListening: ()           => invoke('ai:startListening'),
    stopListening:  ()           => invoke('ai:stopListening'),
    setMode:        (m: string)  => invoke('ai:setMode', m),
    setModel:       (m: string)  => invoke('ai:setModel', m),
    calibrate:      ()           => invoke('ai:calibrate'),
    submitTranscript: (text: string, isFinal?: boolean) =>
      invoke('ai:submitTranscript', { text, isFinal: isFinal !== false }),
  },
  app: {
    getVersion: () => invoke('app:version'),
  },
  on: {
    verseDetected:    (cb: (data: unknown) => void) => on('ai:verseDetected', cb),
    aiStatus:         (cb: (data: unknown) => void) => on('ai:status', cb),
    displayChanged:   (cb: (data: unknown) => void) => on('display:changed', cb),
    systemAlert:      (cb: (data: unknown) => void) => on('system:alert', cb),
    outputPreview:    (cb: (data: unknown) => void) => on('output:previewUpdated', cb),
    shortcutNextSection:    (cb: () => void) => on('shortcut:nextSection', cb),
    shortcutPrevSection:    (cb: () => void) => on('shortcut:prevSection', cb),
    shortcutNextItem:       (cb: () => void) => on('shortcut:nextItem', cb),
    shortcutPrevItem:       (cb: () => void) => on('shortcut:prevItem', cb),
    shortcutToggleBlackout: (cb: () => void) => on('shortcut:toggleBlackout', cb),
    shortcutToggleFreeze:   (cb: () => void) => on('shortcut:toggleFreeze', cb),
    shortcutToggleLogo:     (cb: () => void) => on('shortcut:toggleLogo', cb),
    shortcutGoLive:         (cb: () => void) => on('shortcut:goLive', cb),
    shortcutClear:          (cb: () => void) => on('shortcut:clearProjection', cb),
  },
})
