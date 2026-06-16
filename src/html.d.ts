// HTML files are imported as their raw text contents (wrangler "Text" module rule
// in wrangler.jsonc). Used for the generated Datenschutz page.
declare module '*.html' {
  const content: string
  export default content
}
