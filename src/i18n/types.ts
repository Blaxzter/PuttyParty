import type { de } from './de'

// `de` is declared `as const`, so `typeof de` is deeply literal ("Putt Party"
// rather than string). Widen<> relaxes those literals into general types so other
// locales can satisfy the same SHAPE without copying the exact German strings.
type Widen<T> = T extends string
  ? string
  : T extends (...args: infer A) => infer R
    ? (...args: A) => Widen<R>
    : T extends readonly (infer E)[]
      ? readonly Widen<E>[]
      : { [K in keyof T]: Widen<T[K]> }

/** The translation surface every locale must provide. */
export type Dictionary = Widen<typeof de>
