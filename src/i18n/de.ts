// German dictionary — the source of truth for the Dictionary shape. The original
// public copy was German, so these strings are the canonical voice; en.ts mirrors
// this structure exactly (enforced by the `Dictionary` type).

export const de = {
  common: {
    brand: 'Putt Party',
    tagline: 'Live-Bestenliste fürs Minigolf-Turnier',
    organiserLogin: 'Organisator-Login',
    languageLabel: 'Sprache',
    chooseLanguage: 'Sprache wählen',
  },

  meta: {
    landingTitle: 'Putt Party — Live-Bestenliste fürs Minigolf-Turnier',
    landingDescription:
      'Erstelle in 30 Sekunden ein Minigolf-Turnier, häng den QR-Code auf und alle sehen die Rangliste in Echtzeit auf dem grossen Bildschirm. Kostenlos, ohne App, ohne Konto.',
    ogImageAlt: 'Putt Party — Live-Bestenliste auf dem grossen Bildschirm',
    notFoundTitle: 'Nicht gefunden · Putt Party',
    imprintTitle: 'Impressum · Putt Party',
    privacyTitle: 'Datenschutz · Putt Party',
  },

  landing: {
    heroTitleLine1: 'Live-Bestenliste fürs',
    heroTitleLine2: 'Minigolf-Turnier',
    heroLead:
      'Erstelle in 30 Sekunden ein Spiel, häng den QR-Code auf — und alle sehen die Rangliste in Echtzeit auf dem grossen Bildschirm. Kostenlos, ohne App.',
    heroImgAlt: 'Live-Bestenliste auf dem grossen Bildschirm',
    ctaCreate: '＋ Spiel erstellen',
    ctaHow: 'So funktioniert’s',
    howTitle: 'So funktioniert’s',
    howLead: 'In drei Schritten vom leeren Platz zur Live-Rangliste.',
    steps: [
      {
        title: 'Spiel erstellen',
        body: 'Name, Datum, Anzahl Bahnen — fertig. Kein Konto, keine App. Du bekommst sofort einen geheimen Verwaltungs-Link.',
      },
      {
        title: 'QR-Code teilen',
        body: 'Häng den QR-Code aus oder schick den Link. Spieler:innen tragen ihren Score vom eigenen Handy ein.',
      },
      {
        title: 'Live mitfiebern',
        body: 'Die Bestenliste aktualisiert sich in Echtzeit auf dem grossen Bildschirm — mit Podium, Rängen und Aufstiegen.',
      },
    ],
    feature1Title: 'Punkte in Sekunden eintragen',
    feature1Body:
      'Spieler:innen scannen den QR-Code und tragen ihren Score selbst ein — als Gesamtschläge oder Bahn für Bahn. Mit sofortiger Platzierung und freundlicher Bestätigung.',
    feature1Alt: 'Score-Eingabe auf dem Handy',
    feature2Title: 'Live auf dem grossen Screen',
    feature2Body:
      'Wirf die Bestenliste auf Beamer oder TV. Podium, geteilte Ränge und Auf-/Abstiege aktualisieren sich live, sobald jemand einen Score einträgt.',
    feature2Alt: 'Live-Bestenliste mit Podium',
    ctaBandTitle: 'Bereit für euer Turnier?',
    ctaBandButton: '＋ Jetzt Spiel erstellen',
  },

  footer: {
    tagline: 'Live-Bestenliste fürs Minigolf-Turnier',
    imprint: 'Impressum',
    privacy: 'Datenschutz',
  },

  notFound: {
    title: 'Nicht gefunden',
    body: 'Dieses Spiel gibt es nicht (mehr). Prüfe den Link oder QR-Code.',
  },

  entry: {
    titleSuffix: 'Eintragen',
    successSuffix: 'Eingetragen',
    lockedSuffix: 'Geschlossen',
    holesCount: (n: number) => `${n} Bahnen`,
    subPerHole: 'Schläge pro Bahn — wir zählen zusammen.',
    subTotal: 'Trag deinen Score ein — wenig Schläge gewinnen.',
    holesLabel: 'Schläge pro Bahn',
    total: 'Gesamt',
    nameLabel: 'Name',
    namePlaceholder: 'Dein Name',
    teamLabel: 'Team / Abteilung',
    teamPlaceholder: 'z. B. Diakonie',
    strokesLabel: 'Gesamtschläge',
    maxPerHoleHint: (limit: number, penalty: number) =>
      `Max. ${limit} Schläge — danach Ball aufnehmen (+${penalty}).`,
    strokesPlaceholder: 'z. B. 42',
    submit: 'Eintragen',
    toBoardArrow: 'Zur Bestenliste →',
    toBoard: 'Zur Bestenliste',
    successTitle: 'Eingetragen! 🏌️',
    successGreeting: (name: string) => `Stark gespielt, ${name}. Dein Score steht.`,
    placementLabel: 'Deine Platzierung',
    outOf: (total: number) => `von ${total}`,
    places: (n: number) => (n === 1 ? 'Platz' : 'Plätze'),
    lockedTitle: 'Diese Runde ist geschlossen',
    lockedBody: 'Es werden keine neuen Scores mehr angenommen. Schau dir an, wer gewonnen hat!',
  },

  board: {
    titleSuffix: 'Bestenliste',
    participants: 'Teilnehmer:innen',
    live: 'LIVE',
    strokesUnit: 'Schläge',
    tied: 'geteilt',
    scanToPlay: 'Scan & mitspielen',
    ctaOwnScore: '＋ Eigenen Score eintragen',
    emptyTitle: 'Noch keine Ergebnisse',
    emptyBody: 'Sei die/der Erste auf dem Platz!',
    lockedAsideLine1: 'Eintragen',
    lockedAsideLine2: 'geschlossen',
    bahnRange: (holes: number) => `Bahn 1–${holes}`,
    // Relative "last updated" — also used client-side (see client/i18n.ts).
    updatedPrefix: 'aktualisiert ',
    justNow: 'gerade eben',
    secondsAgo: (s: number) => `vor ${s} Sek.`,
    minutesAgo: (m: number) => `vor ${m} Min.`,
    hoursAgo: (h: number) => `vor ${h} Std.`,
  },

  gameForm: {
    createTitle: 'Neues Spiel',
    editTitle: 'Spiel bearbeiten',
    close: 'Schließen',
    name: 'Name',
    date: 'Datum',
    datePlaceholder: 'TT.MM.JJJJ',
    openCalendar: 'Kalender öffnen',
    location: 'Ort',
    capture: 'Erfassung',
    totalMode: 'Gesamtschläge',
    perHoleMode: 'Pro Bahn',
    holesCount: 'Anzahl Bahnen',
    strokeLimit: 'Schlaglimit pro Bahn',
    maxStrokes: 'Max. Schläge',
    penalty: 'Strafschläge',
    recordedMax: 'Maximal {n} Schläge pro Bahn werden erfasst.',
    scoring: 'Wertung: Wenigste Schläge',
    scoringFixed: 'fix',
    teams: 'Teams / Abteilungen',
    teamsHint: 'Feld im Formular zeigen',
    language: 'Sprache (Board & Eingabe)',
    status: 'Status',
    statusOpen: 'Offen',
    statusLocked: 'Gesperrt',
    cancel: 'Abbrechen',
    save: 'Spiel speichern',
    optional: '(optional)',
    turnstileFailed: 'Bitte bestätige, dass du kein Roboter bist, und versuche es erneut.',
  },

  status: {
    open: 'Offen',
    locked: 'Gesperrt',
    archived: 'Archiviert',
  },

  validation: {
    numberFrom1: 'Bitte eine Zahl ab 1 eingeben.',
    maxStrokes: 'Maximal 999 Schläge.',
    perHoleFrom1: 'Bitte für jede Bahn eine Zahl ab 1 eingeben.',
    wholeNumbers: 'Bitte ganze Zahlen eingeben.',
    maxPerHole: 'Maximal 99 Schläge pro Bahn.',
    maxPerHoleN: (n: number) => `Maximal ${n} Schläge pro Bahn.`,
    strokeLimitRange: 'Limit: 1–90 Schläge pro Bahn.',
    penaltyRange: 'Strafschläge: 0–9.',
    nameRequired: 'Bitte deinen Namen eingeben.',
    dateRequired: 'Datum ist erforderlich.',
    invalidDate: 'Ungültiges Datum.',
    allHoles: 'Bitte alle Bahnen ausfüllen.',
    gameNameRequired: 'Name ist erforderlich.',
    minHole: 'Mindestens 1 Bahn.',
    maxHoles: 'Maximal 60 Bahnen.',
  },

  qrAlt: 'QR-Code',
} as const
