<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- URL cleaning logic lives in the pure module `src/lib/clean-x-url.ts` (with tests beside it); UI only calls it. Why: keeps the core rule offline, testable, and free of DOM/network.
- The app must make no runtime network requests: fonts are bundled via `@fontsource` imports in `src/styles.css`, never a remote `<link>`. Why: the product promises nothing leaves the browser.
