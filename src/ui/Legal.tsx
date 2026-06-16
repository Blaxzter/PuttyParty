import { raw } from "hono/html";
import type { Child, FC } from "hono/jsx";
import { useI18n } from "../i18n";
import { fillLegalTokens, type LegalInfo } from "../lib/legalInfo";
import DATENSCHUTZ_HTML from "./DATENSCHUTZ_GENERATED.html";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Layout } from "./layout";
import { BrandBadge } from "./primitives";

// Impressum (§5 DDG) + Datenschutzerklärung. Operator details come from env via
// getLegalInfo(c.env) (see src/lib/legalInfo.ts) so the real address stays out of
// the git repo. When unset, [PLACEHOLDER] fallbacks render and a draft note shows.
// Long-form legal copy is branched by locale here rather than living in the dict.

const PAGE_STYLE =
    "max-width:760px;margin:0 auto;padding:32px 22px 64px;font-family:var(--font-body);color:var(--pp-ink);line-height:1.6";

const LINK = "color:var(--pp-green-text,#2E8B57)";

const LegalShell: FC<{ title: string; children?: Child }> = ({
    title,
    children,
}) => {
    const { t } = useI18n();
    return (
        <Layout title={title} bodyClass="pp-body--legal">
            <div style={PAGE_STYLE}>
                <header style="display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:28px">
                    <a
                        href="/"
                        style="display:inline-flex;align-items:center;gap:10px;text-decoration:none;color:var(--pp-turf-to);font-family:var(--font-head);font-weight:800"
                    >
                        <BrandBadge size={32} withBall />
                        {t.common.brand}
                    </a>
                    <LanguageSwitcher />
                </header>
                {children}
                <hr style="margin:40px 0 20px;border:none;border-top:2px dashed #e2dac4" />
                <p style="font-size:13px;color:var(--pp-text-soft)">
                    <a href="/" style={LINK}>
                        ← {t.common.brand}
                    </a>
                    <span style="margin:0 8px">·</span>
                    <a href="/impressum" style={LINK}>
                        {t.footer.imprint}
                    </a>
                    <span style="margin:0 8px">·</span>
                    <a href="/datenschutz" style={LINK}>
                        {t.footer.privacy}
                    </a>
                </p>
            </div>
        </Layout>
    );
};

const H1 = ({ children }: { children?: Child }) => (
    <h1 style="font-family:var(--font-head);font-weight:800;font-size:28px;color:var(--pp-turf-to);margin:0 0 18px">
        {children}
    </h1>
);
const H2 = ({ children }: { children?: Child }) => (
    <h2 style="font-family:var(--font-head);font-weight:700;font-size:19px;color:var(--pp-turf-to);margin:28px 0 8px">
        {children}
    </h2>
);
const DraftNote = ({ children }: { children?: Child }) => (
    <p style="margin-top:28px;padding:11px 14px;border-radius:11px;background:#fbf3dd;border:1.5px solid #ebd9a8;font-size:13px;color:#8a6d1f">
        {children}
    </p>
);

const Address: FC<{ info: LegalInfo }> = ({ info }) => (
    <p>
        {info.name}
        <br />
        {info.street}
        <br />
        {info.city}
        <br />
        {info.country}
    </p>
);

const MailLink: FC<{ email: string }> = ({ email }) => (
    <a href={`mailto:${email}`} style={LINK}>
        {email}
    </a>
);

export const ImprintPage: FC<{ info: LegalInfo }> = ({ info }) => {
    const { locale, t } = useI18n();
    return (
        <LegalShell title={t.meta.imprintTitle}>
            {locale === "de" ? (
                <>
                    <H1>Impressum</H1>
                    <H2>Angaben gemäß § 5 DDG</H2>
                    <Address info={info} />
                    <H2>Kontakt</H2>
                    <p>
                        E-Mail: <MailLink email={info.email} />
                        {info.phone ? (
                            <>
                                <br />
                                Telefon: {info.phone}
                            </>
                        ) : null}
                    </p>
                    <H2>Verantwortlich für den Inhalt</H2>
                    <p>{info.name} (Anschrift wie oben)</p>
                    <H2>EU-Streitschlichtung</H2>
                    <p>
                        Die Europäische Kommission stellt eine Plattform zur
                        Online-Streitbeilegung (OS) bereit:{" "}
                        <a
                            href="https://ec.europa.eu/consumers/odr"
                            target="_blank"
                            rel="noreferrer"
                            style={LINK}
                        >
                            https://ec.europa.eu/consumers/odr
                        </a>
                        . Wir sind nicht verpflichtet und nicht bereit, an
                        Streitbeilegungsverfahren vor einer
                        Verbraucherschlichtungsstelle teilzunehmen (§ 36 VSBG).
                    </p>
                    <H2>Haftung für Inhalte</H2>
                    <p>
                        Als Diensteanbieter sind wir für eigene Inhalte auf
                        diesen Seiten nach den allgemeinen Gesetzen
                        verantwortlich (§ 7 Abs. 1 DDG). Putt Party ist ein
                        kostenloses Hilfsmittel zum Führen einer
                        Live-Bestenliste; für die von Nutzer:innen erstellten
                        Spiele und eingetragenen Inhalte sind die jeweiligen
                        Organisator:innen verantwortlich. Bei Bekanntwerden von
                        Rechtsverletzungen entfernen wir die betreffenden
                        Inhalte umgehend.
                    </p>
                    <H2>Haftung für Links</H2>
                    <p>
                        Unser Angebot kann Links zu externen Websites Dritter
                        enthalten, auf deren Inhalte wir keinen Einfluss haben.
                        Für diese fremden Inhalte können wir keine Gewähr
                        übernehmen; es ist stets der jeweilige Anbieter oder
                        Betreiber der Seiten verantwortlich.
                    </p>
                    <H2>Urheberrecht</H2>
                    <p>
                        Die durch den Betreiber erstellten Inhalte auf diesen
                        Seiten unterliegen dem deutschen Urheberrecht. Namen und
                        Ergebnisse, die <strong>Nutzer:innen</strong> eingeben,
                        bleiben bei den jeweiligen Organisator:innen bzw.
                        Teilnehmenden.
                    </p>
                </>
            ) : (
                <>
                    <H1>Imprint</H1>
                    <H2>Information pursuant to § 5 DDG (German law)</H2>
                    <Address info={info} />
                    <H2>Contact</H2>
                    <p>
                        Email: <MailLink email={info.email} />
                        {info.phone ? (
                            <>
                                <br />
                                Phone: {info.phone}
                            </>
                        ) : null}
                    </p>
                    <H2>Responsible for content</H2>
                    <p>{info.name} (address as above)</p>
                    <H2>EU dispute resolution</H2>
                    <p>
                        The EU Commission provides a platform for online dispute
                        resolution (ODR):{" "}
                        <a
                            href="https://ec.europa.eu/consumers/odr"
                            target="_blank"
                            rel="noreferrer"
                            style={LINK}
                        >
                            https://ec.europa.eu/consumers/odr
                        </a>
                        . We are neither obliged nor willing to take part in
                        dispute resolution proceedings before a consumer
                        arbitration board (§ 36 VSBG).
                    </p>
                    <H2>Liability for content</H2>
                    <p>
                        As a service provider we are responsible for our own
                        content on these pages under the general laws (§ 7 (1)
                        DDG). Putt Party is a free tool for running a live
                        leaderboard; the games created by users and the content
                        they enter are the responsibility of the respective
                        organisers. We remove infringing content promptly once
                        we become aware of it.
                    </p>
                    <H2>Liability for links</H2>
                    <p>
                        Our offer may contain links to external third-party
                        websites over whose content we have no influence. We
                        cannot accept any liability for this external content;
                        the respective provider or operator of the pages is
                        always responsible.
                    </p>
                    <H2>Copyright</H2>
                    <p>
                        Content created by the operator on these pages is
                        subject to German copyright law. Names and scores
                        entered by <strong>users</strong> remain with the
                        respective organisers and participants.
                    </p>
                </>
            )}
            {!info.complete ? (
                <DraftNote>
                    {locale === "de"
                        ? "Entwurf: Die Betreiberangaben stammen aus den LEGAL_*-Umgebungsvariablen (lokal .dev.vars, in Produktion via wrangler secret put). Vor Veröffentlichung setzen und den Text prüfen lassen."
                        : "Draft: operator details come from the LEGAL_* environment variables (local .dev.vars, production via wrangler secret put). Set them and have the text reviewed before publishing."}
                </DraftNote>
            ) : null}
        </LegalShell>
    );
};

export const PrivacyPage: FC<{ info: LegalInfo }> = ({ info }) => {
    const { locale, t } = useI18n();
    return (
        <LegalShell title={t.meta.privacyTitle}>
            {locale === "de" ? (
                // German policy = the cleaned datenschutz-generator.de HTML,
                // with {{TOKENS}} filled from env so the address stays out of git.
                <div class="pp-legal">
                    {raw(fillLegalTokens(DATENSCHUTZ_HTML, info))}
                </div>
            ) : (
                <>
                    <H1>Privacy Policy</H1>
                    <p style="font-style:italic;color:var(--pp-text-soft)">
                        This is a courtesy translation. The legally binding version
                        is the{" "}
                        <a href="/datenschutz?lang=de" style={LINK}>
                            German privacy policy
                        </a>
                        .
                    </p>
                    <p>
                        This page explains how personal data is processed when
                        you use Putt Party.
                    </p>

                    <H2>Controller</H2>
                    <p>
                        {info.name}, {info.street}, {info.city}, {info.country}.
                        Email: <MailLink email={info.email} />
                    </p>

                    <H2>Hosting</H2>
                    <p>
                        The application runs on Cloudflare (Cloudflare, Inc.)
                        infrastructure (Cloudflare Workers, D1 database). When
                        you visit, technically necessary data such as IP
                        address, timestamp and the requested resource are
                        processed to deliver the page and ensure security (Art.
                        6 (1)(f) GDPR). A data processing agreement is in place
                        with Cloudflare.
                    </p>

                    <H2>What we process</H2>
                    <p>
                        <strong>Creating a game:</strong> game name, date and
                        (optionally) location — all freely chosen.
                        <br />
                        <strong>Entering a score:</strong> the name you enter (a
                        pseudonym is fine), an optional team/department, and
                        your stroke count. The legal basis is performing the
                        game / your own entry (Art. 6 (1)(b)/(f) GDPR). Please
                        don't enter sensitive data.
                        <br />
                        <strong>Management link:</strong> organisers receive a
                        secret link granting management of exactly one game.
                    </p>

                    <H2>Spam protection (Cloudflare Turnstile)</H2>
                    <p>
                        Creating a game may be protected against automated abuse
                        by Cloudflare Turnstile. Cloudflare processes technical
                        device/usage data to tell humans from bots (Art. 6
                        (1)(f) GDPR). No tracking cookies are set.
                    </p>

                    <H2>Cookies</H2>
                    <p>
                        We set a single, strictly necessary cookie (
                        <code>pp_lang</code>) to remember your language choice.
                        It is not used for analytics or tracking, so no consent
                        is required.
                    </p>

                    <H2>Fonts</H2>
                    <p>
                        Fonts are served locally from this server; no data is
                        transferred to third parties (e.g. Google Fonts).
                    </p>

                    <H2>Analytics / tracking</H2>
                    <p>
                        There is no tracking and no advertising-related
                        profiling of your behaviour.
                    </p>

                    <H2>Retention</H2>
                    <p>
                        Game and score data is kept until the responsible
                        organiser resets, archives or deletes the game.
                    </p>

                    <H2>Your rights</H2>
                    <p>
                        You have the right to access, rectification, erasure,
                        restriction of processing, data portability and
                        objection (Art. 15–21 GDPR), and the right to lodge a
                        complaint with a data protection authority. Contact{" "}
                        <MailLink email={info.email} /> to exercise these
                        rights.
                    </p>
                </>
            )}
            {!info.complete ? (
                <DraftNote>
                    {locale === "de"
                        ? "Entwurf: Die Betreiberangaben stammen aus den LEGAL_*-Umgebungsvariablen. Vor Veröffentlichung setzen und den Text prüfen lassen."
                        : "Draft: operator details come from the LEGAL_* environment variables. Set them and have the text reviewed before publishing."}
                </DraftNote>
            ) : null}
        </LegalShell>
    );
};
