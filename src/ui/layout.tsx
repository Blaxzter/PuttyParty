import { raw } from 'hono/html'
import type { Child, FC } from 'hono/jsx'

const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=Anton&family=Roboto+Mono:wght@400;500;600&display=swap'

export interface LayoutProps {
  title: string
  bodyClass?: string
  /** Load the vendored htmx bundle. */
  htmx?: boolean
  /** Module scripts appended before </body>, e.g. ['/board.js']. */
  scripts?: string[]
  /** Extra nodes for <head>. */
  head?: Child
  children?: Child
}

export const Layout: FC<LayoutProps> = (props) => (
  <>
    {raw('<!DOCTYPE html>')}
    <html lang="de">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{props.title}</title>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
        <link href={FONTS_HREF} rel="stylesheet" />
        <link rel="stylesheet" href="/app.css" />
        {props.htmx ? <script src="/htmx.min.js" defer /> : null}
        {props.head}
      </head>
      <body class={props.bodyClass}>
        {props.children}
        {props.scripts?.map((src) => (
          <script key={src} type="module" src={src} />
        ))}
      </body>
    </html>
  </>
)
