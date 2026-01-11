# AniGamerInfo+

AniGamerInfo+ extracts common anime-related information (for example: cast, theme songs, and other metadata) from Ani Gamer pages (`https://ani.gamer.com.tw/animeVideo.php?sn=*`). It is implemented as a userscript and the primary source file is `main.js` in this repository.

**Features**
- **Automatic extraction:** Scrape cast and theme song information from Ani Gamer anime pages.
- **External lookups:** Uses configured cross-site connections to gather additional metadata (Wikipedia, syoboi, AllCinema, etc.).
- **Config-friendly:** Edit the local `main.js` file during development and load it into Chrome/Tampermonkey for instant updates.

**Install type helper packages (for editor/IDE experience)**
If you want better type completions and IntelliSense in editors like VS Code, install the type definitions as dev dependencies. From the project root run:

```bash
npm install
```

**Quick development workflow (Chrome + Tampermonkey)**
1. Make sure the script source file is `main.js` in this repository (example path on Windows: `D:\Home\Userscript\anigamerinfo+\main.js`).
2. Open Chrome and install Tampermonkey if you haven't already.
3. In Chrome, allow Tampermonkey to access local files: open `chrome://extensions/`, locate Tampermonkey, click `Details`, then enable `Allow access to file URLs`.
4. Create a new userscript in Tampermonkey (Dashboard → Add new script) and paste the header block below. Replace the `@require` local path with your absolute file URI (see example).
5. Save the script in Tampermonkey. With the `@require` pointing to a `file:///` URL, Tampermonkey will load the external `main.js` from disk every time the target page is loaded — so you can edit the file externally and then refresh the anime page to see changes.

**Userscript header (paste into Tampermonkey and replace the `file:///...` path with your own absolute path)**

```js
// ==UserScript==
// @name         動畫瘋資訊+
// @description  在動畫瘋中自動擷取動畫常見相關資訊，如CAST以及主題曲。
// @namespace    nathan60107
// @author       nathan60107(貝果)
// @version      0.0.0
// @homepage     https://home.gamer.com.tw/creationCategory.php?owner=nathan60107&c=425332
// @match        https://ani.gamer.com.tw/animeVideo.php?sn=*
// @icon         https://ani.gamer.com.tw/apple-touch-icon-144.jpg
// @require      https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @connect      google.com
// @connect      www.allcinema.net
// @connect      cal.syoboi.jp
// @connect      acg.gamer.com.tw
// @connect      ja.wikipedia.org
// @noframes
// @require      file:///D:/Home/Userscript/anigamerinfo+/main.js
// ==/UserScript==
```
