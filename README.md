# X Link Cleaner

Build a polished, fully functional Arabic RTL single-page web app named «منظّف روابط X» (X Link Cleaner). Purpose: user pastes an X/Twitter post URL and the app removes the query string/tracking parameters, returning the clean canonical post URL. Validate input safely: accept x.com, www.x.com, twitter.com, www.twitter.com and mobile.twitter.com; require a recognizable /status/{numericId} path; preserve the username/status path and optionally remove trailing /photo/1 or /video/1 path segments? Prefer canonical URL https://x.com/{username}/status/{id}. Do not make network requests, do not store or transmit pasted URLs, no login, no analytics. UI should be beautiful modern Arabic RTL, mobile-friendly, accessible, with a textarea, paste affordance if possible, clear button, clean button, result area, copy button and open-post link. Explain briefly that it removes URL query parameters but does not prevent all platform-side tracking. Add an example using a URL with ?a=...&s=48. Make all controls functional. No backend/database needed.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://x-link-cleaner.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0bae87dd-d27a-43c6-86c7-4e7138630502).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
