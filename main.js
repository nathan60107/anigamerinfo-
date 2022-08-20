//---------------------External libarary---------------------//
/**
 *
 * detectIncognito v1.1.0 - (c) 2022 Joe Rutkowski <Joe@dreggle.com> (https://github.com/Joe12387/detectIncognito)
 *
 **/
var detectIncognito=function(){return new Promise(function(t,o){var e,n="Unknown";function r(e){t({isPrivate:e,browserName:n})}function i(e){return e===eval.toString().length}function a(){(void 0!==navigator.maxTouchPoints?function(){try{window.indexedDB.open("test",1).onupgradeneeded=function(e){var t=e.target.result;try{t.createObjectStore("test",{autoIncrement:!0}).put(new Blob),r(!1)}catch(e){/BlobURLs are not yet supported/.test(e.message)?r(!0):r(!1)}}}catch(e){r(!1)}}:function(){var e=window.openDatabase,t=window.localStorage;try{e(null,null,null,null)}catch(e){return r(!0),0}try{t.setItem("test","1"),t.removeItem("test")}catch(e){return r(!0),0}r(!1)})()}function c(){navigator.webkitTemporaryStorage.queryUsageAndQuota(function(e,t){r(t<(void 0!==(t=window).performance&&void 0!==t.performance.memory&&void 0!==t.performance.memory.jsHeapSizeLimit?performance.memory.jsHeapSizeLimit:1073741824))},function(e){o(new Error("detectIncognito somehow failed to query storage quota: "+e.message))})}function d(){void 0!==Promise&&void 0!==Promise.allSettled?c():(0,window.webkitRequestFileSystem)(0,1,function(){r(!1)},function(){r(!0)})}void 0!==(e=navigator.vendor)&&0===e.indexOf("Apple")&&i(37)?(n="Safari",a()):void 0!==(e=navigator.vendor)&&0===e.indexOf("Google")&&i(33)?(e=navigator.userAgent,n=e.match(/Chrome/)?void 0!==navigator.brave?"Brave":e.match(/Edg/)?"Edge":e.match(/OPR/)?"Opera":"Chrome":"Chromium",d()):void 0!==document.documentElement&&void 0!==document.documentElement.style.MozAppearance&&i(37)?(n="Firefox",r(void 0===navigator.serviceWorker)):void 0!==navigator.msSaveBlob&&i(39)?(n="Internet Explorer",r(void 0===window.indexedDB)):o(new Error("detectIncognito cannot determine the browser"))})};
//---------------------External libarary---------------------//

let $ = jQuery
let dd = (...d) => {
  d.forEach((it)=>{console.log(it)})
}

async function isPrivateFF() {
  return new Promise((resolve) => {
    detectIncognito().then((result) => {
      if(result.browserName === 'Firefox' && result.isPrivate) return resolve(true)
      return resolve(false)
    });
  })
}

function titleProcess(title){
  return title.replaceAll('-', '\\-').replaceAll('#', '')
}

async function getAnimeNameJp() {
  let bahaDbUrl = $('.data_intro .bluebtn')[1].href
  let animeNameJp = $((await GET(bahaDbUrl)).responseText).find('.ACG-mster_box1 > h2')[0].innerText
  return titleProcess(animeNameJp)
}

async function getAnimeNameEn() {
  let bahaDbUrl = $('.data_intro .bluebtn')[1].href
  let animeNameEn = $((await GET(bahaDbUrl)).responseText).find('.ACG-mster_box1 > h2')[1].innerText
  return titleProcess(animeNameEn)
}

async function GET(url) {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest ({
      method:   "GET",
      url:      url,
      onload:   (response) => {
        resolve(response)
      },
      onerror:  (response)=>{reject(response)},
    });
  })
}

async function POST(url, payload, headers = {}) {
  let data = []
  Object.keys(payload).forEach(key => data.push(`${key}=${payload[key]}`))
  data = data.join('&')
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method:  "POST",
      url:     url,
      data:    data,
      headers: {
        // "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        'Content-Length': data.length,
        ...headers
      },
      onload:   (response)=>{
        resolve(response)
      },
      onerror:  (response)=>{
        reject(response)
      },
    })
  })
}

function getJson(str) {
  try{
    return JSON.parse(str)
  }catch{
    console.log('josn error')
    return {}
  }
}

async function google(type, keyword) {
  let site = ''
  switch (type) {
    case 'syoboi':
      site = 'https://cal.syoboi.jp/tid'
      break
    case 'allcinema':
      site = 'https://www.allcinema.net/cinema/'
      break
  }

  let googleUrl = `https://www.google.com/search?as_q=${keyword}&as_qdr=all&as_sitesearch=${site}&as_occt=any`
  dd(googleUrl)

  let googleHtml = (await GET(googleUrl)).responseText
  if (googleHtml.includes('為何顯示此頁')) throw { type: 'google', url: googleUrl }
  let googleResult = $($.parseHTML(googleHtml)).find('#res .v7W49e a')
  for(let goo of googleResult) {
    let link = goo.href.replace('http://', 'https://')
    if(link.startsWith(site))return link
  }
  return 'no result'
}

async function searchSyoboi(site, time) {
  let url = ``
}

function songType(type) {
  type = type.toLowerCase().replace('section ', '')
  switch(type){
    case 'op':
      return 'OP'
    case 'ed':
      return 'ED'
    case 'st':
    case '挿入歌':
      return '插入曲'
    default:
      return '主題曲'
  }
}

async function getAllcinema(jpTitle = true) {
  changeState('allcinema')

  let animeName = jpTitle ? await getAnimeNameJp() : await getAnimeNameEn()
  if (animeName === '') return null
  let allcinemaUrl = await google('allcinema', animeName)
  dd(allcinemaUrl)
  if(allcinemaUrl === 'no result') return null

  let allcinemaId = allcinemaUrl.match(/https:\/\/www.allcinema.net\/cinema\/([0-9]{1,7})/)[1]
  let allcinemaHtml = (await GET(allcinemaUrl))
  let title = allcinemaHtml.responseText.match(/<title>([^<]*<\/title>)/)[1]

  let allcinemaXsrfToken = allcinemaHtml.responseHeaders.match(/XSRF-TOKEN=([^=]*); expires/)[1]
  let allcinemaSession = allcinemaHtml.responseHeaders.match(/allcinema_session=([^=]*); expires/)[1]
  let allcinemaCsrfToken = allcinemaHtml.responseText.match(/var csrf_token = '([^']+)';/)[1]
  let allcinemaHeader = {
    ...(await isPrivateFF()
      ? { 'Cookie' : `XSRF-TOKEN=${allcinemaXsrfToken}; allcinema_session=${allcinemaSession}` }
      : {}
    ),
    'X-CSRF-TOKEN': allcinemaCsrfToken,
    Accept: 'application/json, text/javascript, */*; q=0.01',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  }

  let castData = allcinemaHtml.responseText.match(/"cast":(.*)};/)[1]
  let castJson = getJson(castData)
  let cast = castJson.jobs[0].persons.map(it=>({
    char: it.castname,
    cv: it.person.personnamemain.personname
  }))
  let songData = await POST('https://www.allcinema.net/ajax/cinema', {
    ajax_data: 'moviesounds',
    key: allcinemaId,
    page_limit: 10
  }, allcinemaHeader)
  let songJson = getJson(songData.responseText)
  let song = songJson.moviesounds.sounds.map(it=>({
    type: songType(it.sound.usetype),
    title: `「${it.sound.soundtitle}」`,
    singer: it.sound.credit.staff.jobs.
      filter(job=>job.job.jobname.includes('歌'))
      [0].persons[0].person.personnamemain.personname
  }))
  dd(castJson, songJson)

  return {
    source: allcinemaUrl,
    title, cast, song
  }
}

async function getSyoboi() {
  changeState('syoboi')

  let animeNameJp = await getAnimeNameJp()
  if (animeNameJp === '') return null
  let syoboiUrl = await google('syoboi', animeNameJp)
  dd(syoboiUrl)
  if(syoboiUrl === 'no result') return null
  let syoboiHtml = (await GET(syoboiUrl)).responseText
  let title = syoboiHtml.match(/<title>([^<]*<\/title>)/)[1]

  let castData = $($.parseHTML(syoboiHtml)).find('.cast table').html()
  let cast = castData.match(/<th[^<]*>([^<]*)<\/th><td><wbr><[^<]+>([^<]*)<\/a>/g)
    .map(it=>it.split('</th>'))
    .map(it=>({
      char: it[0].replaceAll(/<[^<]+>/g, ''),
      cv: it[1].replaceAll(/<[^<]+>/g, '')
    }))

  let song = []
  let songData = $($.parseHTML(syoboiHtml)).find('.op, .ed, .st')
  for(let sd of songData){
    song.push({
      type: songType(sd.className),
      title: $(sd).find('.title')[0].childNodes[2].data,
      singer: $(sd).find('th:contains("歌")').parent().children()[1]?.innerText,
    })
  }
  dd(songData)

  return {
    source: syoboiUrl,
    title, cast, song
  }
}

async function getCastHtml(json) {
  let nameList = json.map(j => j.cv).join('|')
  let wikiApi = `https://ja.wikipedia.org/w/api.php?action=query&format=json&prop=langlinks|pageprops&titles=${nameList}&lllang=zh&llinlanguagecode=ja&lllimit=100&ppprop=disambiguation`
  let wikiJson = JSON.parse((await GET(wikiApi)).responseText)
  let disamb = _.filter(wikiJson.query.pages, ['pageprops', {disambiguation: ''}])
  let normalized = wikiJson.query.normalized

  // Deal with wiki page disambiguation.
  if (disamb.length || normalized){
    normalized?.forEach((it) => {
      json.forEach((j,index) => {
        if (j.cv === it.from || j.cvName2 === it.from){
          json[index].cvName2 = it.to
        }
      })
      nameList = nameList.replace(it.from, it.to)
    })
    disamb.forEach((it) => {
      json.forEach((j,index) => {
        if (j.cv === it.title || j.cvName2 === it.title){
          json[index].cvName2 = `${it.title} (声優)`
        }
      })
      nameList = nameList.replace(it.title, `${it.title} (声優)`)
    })
    wikiApi = `https://ja.wikipedia.org/w/api.php?action=query&format=json&prop=langlinks|pageprops&titles=${nameList}&lllang=zh&llinlanguagecode=ja&lllimit=100&ppprop=disambiguation`
    wikiJson = JSON.parse((await GET(wikiApi)).responseText)
    dd('disamb', disamb, redirect, normalized)
  }
  dd(wikiJson)

  return json.map(j => {
    dd(j)
    let wikiPage = _.filter(wikiJson.query.pages, page => 
      page.title === j.cv || page.title === j.cvName2
    )[0]
    let zhName = wikiPage.langlinks?.[0]['*']
    let wikiUrl = zhName ? `https://zh.wikipedia.org/zh-tw/${zhName}` : `https://ja.wikipedia.org/wiki/${j.cv}`
    let wikiText = zhName ? 'Wiki' : 'WikiJP'
    dd(wikiPage)

    return `
      <div>${j.char ?? ''}</div>
      <div>${j.cv}</div>
      ${wikiPage.missing === ''
        ? '<div></div>'
        : `<a href="${wikiUrl}" target="_blank">🔗${wikiText}</a>`}
  `}).join('')
}

function getSongHtml(json) {
  return json.map(j => `
    <div>${j.type}${j.title}</div>
    <div>${j.singer ?? '-'}</div>
    <a href="https://www.youtube.com/results?search_query=${j.title.slice(1, j.title.length-1)} ${j.singer ?? ''}" target="_blank">
      🔎Youtube
    </a>
  `).join('')
}

function getCss() {
  return `
    #ani-info .grid {
      display: grid;
      gap: 10px;
      margin-top: 10px
    }
    #ani-info a {
      color: rgb(51, 145, 255)
    }
    #ani-info .bluebtn {
      font-size: 13px;
    }
    #ani-info .grid.cast {
      grid-template-columns: repeat(3, auto);
    }
    #ani-info .grid.song {
      grid-template-columns: repeat(3, auto);
    }
  `
}

async function changeState(state, params) {
  switch(state){
    case 'init':
      $('.anime-option').append(`
        <style type='text/css'>${getCss()}</style>
        <div id="ani-info">
          <ul class="data_type">
            <li>
              <span>aniInfo+</span>
              <i id="ani-info-msg">歡迎使用動畫瘋資訊+</i>
            </li>
          </ul>
        </div>
      `)
      break
    case 'btn':
      $('#ani-info-msg').html(`
        <div id="ani-info-main" class="bluebtn" onclick="aniInfoMain()">
          讀取動畫資訊
        </div>
      `)
      $('#ani-info-main')[0].addEventListener("click", main, {
        once: true
      });
      break
    case 'google':
      $('#ani-info-msg').html(`Google搜尋失敗，請點擊<a href="${params.url}" target="_blank">連結</a>解除reCAPTCHA後重整此網頁。`)
      break
    case 'syoboi':
      $('#ani-info-msg').html(`嘗試取得syoboi資料中...`)
      break
    case 'allcinema':
      $('#ani-info-msg').html(`嘗試取得allcinema資料中...`)
      break
    case 'fail':
      $('#ani-info-msg').html(`無法取得資料 ${params.error}`)
      break
    case 'result':
      dd(params)
      let castHtml = await getCastHtml(params.cast)
      let songHtml = getSongHtml(params.song)
      $('#ani-info').html('')
      if(castHtml) $('#ani-info').append(`
        <ul class="data_type">
          <li>
            <span>CAST</span>
            <div class="grid cast">${castHtml}</div>
          </li>
        </ul>
      `)
      if(songHtml) $('#ani-info').append(`
        <ul class="data_type">
          <li>
            <span>主題曲</span>
            <div class="grid song">${songHtml}</div>
          </li>
        </ul>
      `)
      $('#ani-info').append(`
        <ul class="data_type">
          <li>
            <span>aniInfo+</span>
            資料來源：<a href="${params.source}" target="_blank">${params.title}</a>
          </li>
        </ul>
      `)
      break
  }
}

async function main() {
  try {
    let result = await getSyoboi()
    if (!result) result = await getAllcinema()
    if (!result) result = await getAllcinema(false)
    
    if (result) changeState('result', result)
    else changeState('fail', {error: ''})
  } catch(e) {
    if (e.type === 'google'){
      changeState('google', {url: e.url})
    } else {
      changeState('fail', {error: e})
    }
  }
}

(async function() {
  changeState('init')

  // Set user option default value.
  if(GM_getValue('auto') == undefined){ GM_setValue('auto', true); }

  // Set user option menu in Tampermonkey.
  let isAuto = GM_getValue('auto');
  GM_registerMenuCommand(`設定為${isAuto ? '手動' : '自動'}執行`, () => {
    GM_setValue('auto', !GM_getValue('auto'));
    location.reload();
  });

  // Do task or set button to wait for click and do task.
  if(isAuto) main()
  else changeState('btn')
})();

/**
 * Reference:
 * [Write userscript in VSC](https://stackoverflow.com/a/55568568)
 * [Same above but video](https://www.youtube.com/watch?v=7bWwkTWJy40)
 * [Detect browser private mode](https://stackoverflow.com/a/69678895/13069889)
 * [and its cdn](https://cdn.jsdelivr.net/gh/Joe12387/detectIncognito@main/detectIncognito.min.js)
 * [FF observe GM request](https://firefox-source-docs.mozilla.org/devtools-user/browser_toolbox/index.html)
 * [Wiki API](https://ja.wikipedia.org/wiki/特別:ApiSandbox#action=query&format=json&prop=langlinks&titles=Main Page&redirects=1)
 */