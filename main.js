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
  if(BAHAID !== 'nathan60107')return
  d.forEach((it)=>{console.log(it)})
}

function regexEscape(pattern) {
  return pattern.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1')
}

async function isPrivateFF() {
  return new Promise((resolve) => {
    detectIncognito().then((result) => {
      if(result.browserName === 'Firefox' && result.isPrivate) return resolve(true)
      return resolve(false)
    });
  })
}

function titleProcess(title) {
  return title.replaceAll('-', '\\-').replaceAll('#', '')
}

function timeProcess(time) {
  if(!time || time === '不明') return ''
  let [, year, month] = time.match(/([0-9]{4})-([0-9]{2})-([0-9]{2})/)
  return `${year}-${parseInt(month)}～`
}

async function getBahaData() {
  let bahaDbUrl = $('.data_intro .bluebtn')[1].href
  let bahaHtml = $((await GET(bahaDbUrl)).responseText)
  let nameJp = bahaHtml.find('.ACG-mster_box1 > h2')[0].innerText
  let nameEn = bahaHtml.find('.ACG-mster_box1 > h2')[1].innerText
  let urlObj = new URL(bahaHtml.find('.ACG-box1listB > li:contains("官方網站") > a')[0]?.href ?? 'https://empty')
  let fullUrl = urlObj.searchParams.get('url')
  let time = bahaHtml.find('.ACG-box1listA > li:contains("當地")')[0]?.innerText?.split('：')[1]

  return {
    nameJp: titleProcess(nameJp),
    nameEn: titleProcess(nameEn),
    site: fullUrl ? new URL(fullUrl).hostname.replace('www.', '') : '',
    fullUrl: fullUrl,
    time: timeProcess(time),
  }
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
  let data = new URLSearchParams(payload).toString()
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method:  "POST",
      url:     url,
      data:    data,
      headers: {
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
    console.log('json error')
    return {}
  }
}

async function google(type, keyword) {
  let site = ''
  let match = ''
  switch (type) {
    case 'syoboi':
      site = 'https://cal.syoboi.jp/tid'
      match = 'https://cal.syoboi.jp/tid'
      break
    case 'allcinema':
      site = 'https://www.allcinema.net/cinema/'
      match = /https:\/\/www\.allcinema\.net\/cinema\/([0-9]{1,7})/
      break
  }

  let googleUrlObj = new URL('https://www.google.com/search?as_qdr=all&as_occt=any')
  googleUrlObj.searchParams.append('as_q', keyword)
  googleUrlObj.searchParams.append('as_sitesearch', site)
  let googleUrl = googleUrlObj.toString()
  dd(`Google result: ${googleUrl}`)

  let googleHtml = (await GET(googleUrl)).responseText
  if (googleHtml.includes('為何顯示此頁')) throw { type: 'google', url: googleUrl }
  let googleResult = $($.parseHTML(googleHtml)).find('#res .v7W49e a')
  for(let goo of googleResult) {
    let link = goo.href.replace('http://', 'https://')
    if(link.match(match))return link
  }
  return ''
}

async function searchSyoboi() {
  let {site, time, fullUrl} = bahaData
  if(!site || !time) return ''

  let exceptionSite = [
    'tv-tokyo.co.jp',
    'tbs.co.jp',
    'sunrise-inc.co.jp'
  ]
  if(exceptionSite.includes(site)) {
    // https://stackoverflow.com/a/33305263
    let exSiteList = exceptionSite.reduce((acc, cur) => {
      return acc.concat([regexEscape(`${cur}/anime/`), regexEscape(`${cur}/`)])
    }, [])

    for (const ex of exSiteList) {
      let regexResult = fullUrl.match(new RegExp(`(${ex}[^\/]+)`))?.[1]
      if(regexResult){
        site = regexResult
        break
      }
    }
  }

  let searchUrlObj = new URL('https://cal.syoboi.jp/find?sd=0&ch=&st=&cm=&r=0&rd=&v=0')
  searchUrlObj.searchParams.append('kw', site)
  let searchUrl = searchUrlObj.toString()
  dd(`Syoboi result: ${searchUrl}`)

  let syoboiHtml = (await GET(searchUrl)).responseText
  let syoboiResults = $($.parseHTML(syoboiHtml)).find('.tframe td')
  for (let result of syoboiResults) {
    let resultTime = $(result).find('.findComment')[0].innerText

    if(resultTime.includes(time)){
      let resultUrl = $(result).find('a').attr('href')
      return `https://cal.syoboi.jp${resultUrl}`
    }
  }
  return ''
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

  let animeName = jpTitle ? bahaData.nameJp : bahaData.nameEn
  if (animeName === '') return null
  let allcinemaUrl = await google('allcinema', animeName)
  dd(`Allcinema url: ${allcinemaUrl}`)
  if(!allcinemaUrl) return null

  let allcinemaId = allcinemaUrl.match(/https:\/\/www\.allcinema\.net\/cinema\/([0-9]{1,7})/)[1]
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
  let song = songJson.moviesounds.sounds.map(it=>{
    return {
      type: songType(it.sound.usetype),
      title: `「${it.sound.soundtitle}」`,
      singer: it.sound.credit.staff.jobs.
        filter(job=>job.job.jobname.includes('歌'))
        [0]?.persons[0].person.personnamemain.personname
  }})
  // dd(castJson, songJson)

  return {
    source: allcinemaUrl,
    title, cast, song
  }
}

async function getSyoboi(searchGoogle = false) {
  changeState('syoboi')

  let nameJp = bahaData.nameJp
  if (nameJp === '') return null
  let syoboiUrl = await (searchGoogle ? google('syoboi', nameJp) : searchSyoboi())
  dd(`Syoboi url: ${syoboiUrl}`)
  if(!syoboiUrl) return null
  let syoboiHtml = (await GET(syoboiUrl)).responseText
  let title = syoboiHtml.match(/<title>([^<]*)<\/title>/)[1]
  
  let cast = []
  let castData = $($.parseHTML(syoboiHtml)).find('.cast table tr')
  for(let role of castData){
    cast.push({
      char: $(role).find('th').text(),
      cv: $(role).find('td > a').text()
    })
  }

  let song = []
  let songData = $($.parseHTML(syoboiHtml)).find('.staff ~ .section:not(.cast)') // https://stackoverflow.com/a/42575222
  for(let sd of songData){
    song.push({
      type: songType(sd.className),
      title: $(sd).find('.title')[0].childNodes[2].data,
      singer: $(sd).find('th:contains("歌")').parent().children()[1]?.innerText,
    })
  }

  return {
    source: syoboiUrl,
    title, cast, song
  }
}

async function searchWiki(json) {
  let searchWikiUrl = (nameList) => {
    let wikiUrlObj = new URL('https://ja.wikipedia.org/w/api.php')
    const params = {
      action: 'query',
      format: 'json',
      prop: 'langlinks|pageprops',
      titles: nameList,
      redirects: 1,
      lllang: 'zh',
      lllimit: 100,
      ppprop: 'disambiguation'
    }
    for(let [k, v] of Object.entries(params)){
      wikiUrlObj.searchParams.append(k, v)
    }
    return wikiUrlObj.toString()
  }

  let castList = _.chunk(_.uniq(json.map(j => j.cvName2 ?? j.cv)), 50)  
  let result = {
    query: {
      pages: {},
      normalized: [],
      redirects: [],
    }
  }

  for(let cast50 of castList){
    let nameList = cast50.join('|')
    let wikiApi = searchWikiUrl(nameList)
    let wikiJson = JSON.parse((await GET(wikiApi)).responseText)

    Object.assign(result.query.pages, wikiJson.query.pages)
    result.query.normalized.push(...wikiJson.query.normalized || [])
    result.query.redirects.push(...wikiJson.query.redirects || [])
  }

  return result
}

async function getCastHtml(json) {
  function replaceEach(array, getFrom = (it)=>it.from, getTo = (it)=>it.to) {
    array?.forEach((it) => {
      json.forEach((j, index) => {
        if (j.cv === getFrom(it) || j.cvName2 === getFrom(it)){
          json[index].cvName2 = getTo(it)
        }
      })
    })
  }

  let wikiJson = await searchWiki(json)
  let disamb = _.filter(wikiJson.query.pages, ['pageprops', {disambiguation: ''}])
  let normalized = wikiJson.query.normalized
  let redirects = wikiJson.query.redirects
  dd(wikiJson, normalized, redirects, disamb)

  // Deal with wiki page normalized, redirects and disambiguation.
  replaceEach(normalized)
  replaceEach(redirects)
  if (disamb.length) {
    replaceEach(disamb, (it)=>it.title, (it)=>`${it.title} (声優)`)

    wikiJson = await searchWiki(json)
    redirects = wikiJson.query.redirects
    replaceEach(redirects)
  }

  return json.map(j => {
    let wikiPage = _.filter(wikiJson.query.pages, page => 
      page.title === j.cv || page.title === j.cvName2
    )[0]
    let zhName = wikiPage.langlinks?.[0]['*']
    let wikiUrl = zhName ? `https://zh.wikipedia.org/zh-tw/${zhName}` : `https://ja.wikipedia.org/wiki/${j.cvName2 ?? j.cv}`
    let wikiText = zhName ? 'Wiki' : 'WikiJP'

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
    case 'result': {
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
    case 'debug': {
      let aaa = await getSyoboi()
      let bbb = await getSyoboi(true)
      let ccc = await getAllcinema()
      let ddd = await getAllcinema(false)
      $('#ani-info').html('')
      $('#ani-info').append(`
        <ul class="data_type">
          <li>
            <span>aniInfo+</span>
            <br>
            syoboi：<a href="${aaa?.source}" target="_blank">${aaa?.title}</a>
            <br>
            allcinema(jp)：<a href="${ccc?.source}" target="_blank">${ccc?.title}</a>
            <br>
            allcinema(en)：<a href="${ddd?.source}" target="_blank">${ddd?.title}</a>
            <br>
            syoboi(google)：<a href="${bbb?.source}" target="_blank">${bbb?.title}</a>
            <br>
          </li>
        </ul>
      `)
      break
    }
  }
}

async function main() {
  let debug = false
  try {
    if(debug){
      changeState('debug')
      return
    }
    let result = null
    result = await getSyoboi(false)
    if (!result) result = await getAllcinema(true)
    if (!result) result = await getAllcinema(false)
    if (!result) result = await getSyoboi(true)
    
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
  globalThis.bahaData = await getBahaData()
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
 * [Wiki API](https://ja.wikipedia.org/wiki/%E7%89%B9%E5%88%A5:ApiSandbox#action=query&format=json&prop=langlinks%7Cpageprops&titles=%E6%A2%B6%E5%8E%9F%E5%B2%B3%E4%BA%BA%7C%E5%B0%8F%E6%9E%97%E8%A3%95%E4%BB%8B%7C%E4%B8%AD%E4%BA%95%E5%92%8C%E5%93%89%7CM%E3%83%BBA%E3%83%BBO%7C%E9%88%B4%E6%9D%91%E5%81%A5%E4%B8%80%7C%E4%B8%8A%E6%A2%9D%E6%B2%99%E6%81%B5%E5%AD%90%7C%E6%A5%A0%E5%A4%A7%E5%85%B8%7C%E8%88%88%E6%B4%A5%E5%92%8C%E5%B9%B8%7C%E6%97%A5%E9%87%8E%E8%81%A1%7C%E9%96%A2%E6%99%BA%E4%B8%80%7C%E6%82%A0%E6%9C%A8%E7%A2%A7%7C%E5%89%8D%E9%87%8E%E6%99%BA%E6%98%AD&redirects=1&lllang=zh&lllimit=100&ppprop=disambiguation)
 * [Always use en/decodeURIComponent](https://stackoverflow.com/a/747845)
 */