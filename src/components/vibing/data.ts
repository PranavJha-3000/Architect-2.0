/**
 * Mocked music. No APIs, no streaming, no embeds — static local data only.
 *
 * The Reels and Learn feeds that used to live here are gone: with no feed, no
 * cards and no persistent tabs, nothing rendered them. Those capabilities
 * survive as contextual URL handoff (see `links.ts`), not as a media browser.
 */

export interface Track {
  id: string
  title: string
  artist: string
  durationSec: number
}

export const TRACKS: Track[] = [
  { id: 't1', title: 'Compile Night', artist: 'Static Bloom', durationSec: 198 },
  { id: 't2', title: 'Merge Conflict', artist: 'The Standups', durationSec: 225 },
  { id: 't3', title: 'Green Build', artist: 'Lint Festival', durationSec: 172 },
]
