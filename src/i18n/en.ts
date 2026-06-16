import type { Dictionary } from './types'

// English mirror of de.ts. Typed as `Dictionary` so the shape stays in sync with
// the German source (a missing or extra key is a compile error).

export const en: Dictionary = {
  common: {
    brand: 'Putt Party',
    tagline: 'Live leaderboard for your mini-golf tournament',
    organiserLogin: 'Organiser login',
    languageLabel: 'Language',
    chooseLanguage: 'Choose language',
  },

  meta: {
    landingTitle: 'Putt Party — Live leaderboard for your mini-golf tournament',
    landingDescription:
      'Spin up a mini-golf tournament in 30 seconds, put up the QR code and everyone watches the ranking update live on the big screen. Free, no app, no account.',
    ogImageAlt: 'Putt Party — live leaderboard on the big screen',
    notFoundTitle: 'Not found · Putt Party',
    imprintTitle: 'Imprint · Putt Party',
    privacyTitle: 'Privacy · Putt Party',
  },

  landing: {
    heroTitleLine1: 'Live leaderboard for your',
    heroTitleLine2: 'mini-golf tournament',
    heroLead:
      'Create a game in 30 seconds, put up the QR code — and everyone sees the ranking update live on the big screen. Free, no app.',
    heroImgAlt: 'Live leaderboard on the big screen',
    ctaCreate: '＋ Create game',
    ctaHow: 'How it works',
    howTitle: 'How it works',
    howLead: 'Three steps from an empty course to a live ranking.',
    steps: [
      {
        title: 'Create a game',
        body: 'Name, date, number of holes — done. No account, no app. You instantly get a secret management link.',
      },
      {
        title: 'Share the QR code',
        body: 'Put up the QR code or send the link. Players enter their score from their own phone.',
      },
      {
        title: 'Follow it live',
        body: 'The leaderboard updates in real time on the big screen — with podium, ranks and climbers.',
      },
    ],
    feature1Title: 'Enter scores in seconds',
    feature1Body:
      'Players scan the QR code and enter their own score — as a total or hole by hole. With instant placement and a friendly confirmation.',
    feature1Alt: 'Score entry on a phone',
    feature2Title: 'Live on the big screen',
    feature2Body:
      'Throw the leaderboard onto a projector or TV. Podium, shared ranks and climbs/drops update live the moment someone enters a score.',
    feature2Alt: 'Live leaderboard with podium',
    ctaBandTitle: 'Ready for your tournament?',
    ctaBandButton: '＋ Create a game now',
  },

  footer: {
    tagline: 'Live leaderboard for your mini-golf tournament',
    imprint: 'Imprint',
    privacy: 'Privacy',
  },

  notFound: {
    title: 'Not found',
    body: 'This game doesn’t exist (anymore). Check the link or QR code.',
  },

  entry: {
    titleSuffix: 'Enter score',
    successSuffix: 'Submitted',
    lockedSuffix: 'Closed',
    holesCount: (n: number) => `${n} holes`,
    subPerHole: 'Strokes per hole — we add them up.',
    subTotal: 'Enter your score — fewest strokes wins.',
    holesLabel: 'Strokes per hole',
    total: 'Total',
    nameLabel: 'Name',
    namePlaceholder: 'Your name',
    teamLabel: 'Team / department',
    teamPlaceholder: 'e.g. Marketing',
    strokesLabel: 'Total strokes',
    strokesPlaceholder: 'e.g. 42',
    submit: 'Submit',
    toBoardArrow: 'To the leaderboard →',
    toBoard: 'To the leaderboard',
    successTitle: 'Submitted! 🏌️',
    successGreeting: (name: string) => `Nicely played, ${name}. Your score is in.`,
    placementLabel: 'Your placement',
    outOf: (total: number) => `of ${total}`,
    places: (n: number) => (n === 1 ? 'place' : 'places'),
    lockedTitle: 'This round is closed',
    lockedBody: 'No new scores are being accepted. See who won!',
  },

  board: {
    titleSuffix: 'Leaderboard',
    participants: 'Participants',
    live: 'LIVE',
    strokesUnit: 'strokes',
    tied: 'tied',
    scanToPlay: 'Scan & play',
    ctaOwnScore: '＋ Enter your own score',
    emptyTitle: 'No results yet',
    emptyBody: 'Be the first on the course!',
    lockedAsideLine1: 'Entry',
    lockedAsideLine2: 'closed',
    bahnRange: (holes: number) => `Hole 1–${holes}`,
    updatedPrefix: 'updated ',
    justNow: 'just now',
    secondsAgo: (s: number) => `${s}s ago`,
    minutesAgo: (m: number) => `${m}m ago`,
    hoursAgo: (h: number) => `${h}h ago`,
  },

  gameForm: {
    createTitle: 'New game',
    editTitle: 'Edit game',
    close: 'Close',
    name: 'Name',
    date: 'Date',
    datePlaceholder: 'DD.MM.YYYY',
    openCalendar: 'Open calendar',
    location: 'Location',
    capture: 'Scoring input',
    totalMode: 'Total strokes',
    perHoleMode: 'Per hole',
    holesCount: 'Number of holes',
    scoring: 'Scoring: fewest strokes',
    scoringFixed: 'fixed',
    teams: 'Teams / departments',
    teamsHint: 'Show field in the form',
    language: 'Language (board & entry)',
    status: 'Status',
    statusOpen: 'Open',
    statusLocked: 'Locked',
    cancel: 'Cancel',
    save: 'Save game',
    optional: '(optional)',
    turnstileFailed: 'Please confirm you are human and try again.',
  },

  status: {
    open: 'Open',
    locked: 'Locked',
    archived: 'Archived',
  },

  validation: {
    numberFrom1: 'Please enter a number from 1.',
    maxStrokes: 'At most 999 strokes.',
    perHoleFrom1: 'Please enter a number from 1 for each hole.',
    wholeNumbers: 'Please enter whole numbers.',
    maxPerHole: 'At most 99 strokes per hole.',
    nameRequired: 'Please enter your name.',
    dateRequired: 'Date is required.',
    invalidDate: 'Invalid date.',
    allHoles: 'Please fill in all holes.',
    gameNameRequired: 'Name is required.',
    minHole: 'At least 1 hole.',
    maxHoles: 'At most 60 holes.',
  },

  qrAlt: 'QR code',
}
