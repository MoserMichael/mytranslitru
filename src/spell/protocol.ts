export type ToWorker =
  | { type: 'init'; affUrl: string; dicUrl: string; personal: string[] }
  | { type: 'check'; id: number; words: string[] }
  | { type: 'suggest'; word: string }
  | { type: 'add'; word: string }

export type FromWorker =
  | { type: 'ready' }
  | { type: 'error'; message: string }
  | { type: 'checked'; id: number; wrong: string[] }
  | { type: 'suggestions'; word: string; list: string[] }
