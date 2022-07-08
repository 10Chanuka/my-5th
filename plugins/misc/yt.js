let fetch = require('node-fetch')
let { JSDOM } = require('jsdom')

function post(url, formdata) {
  return fetch(url, {
    method: 'POST',
    headers: {
      accept: "*/*",
      'accept-language': "en-US,en;q=0.9",
      'content-type': "application/x-www-form-urlencoded; charset=UTF-8"
    },
    body: new URLSearchParams(Object.entries(formdata))
  })
}
const ytIdRegex = /(?:youtube\.com\/\S*(?:(?:\/e(?:mbed))?\/|watch\?(?:\S*?&?v\=))|youtu\.be\/)([a-zA-Z0-9_-]{6,11})/
async function yt(url, quality, type, bitrate, server = 'en68') {
  let ytId = ytIdRegex.exec(url)
  url = 'https://youtu.be/' + ytId[1]
  let res = await post(`https://www.y2mate.com/mates/${server}/analyze/ajax`, {
    url,
    q_auto: 0,
    ajax: 1
  })
  function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Byte';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  }
  let json = await res.json()
  let { document } = (new JSDOM(json.result)).window
  let tables = document.querySelectorAll('table')
  let table = tables[{ mp4: 0, mp3: 1 }[type] || 0]
  let list
  switch (type) {
    case 'mp4':
      list = Object.fromEntries([...table.querySelectorAll('td > a[href="#"]')].filter(v => !/\.3gp/.test(v.innerHTML)).map(v => [v.innerHTML.match(/.*?(?=\()/)[0].trim(), v.parentElement.nextSibling.nextSibling.innerHTML]))
      break
    case 'mp3':
      list = {
        '128kbps': table.querySelector('td > a[href="#"]').parentElement.nextSibling.nextSibling.innerHTML
      }
      break
    default:
      list = {}
  }
  let filesize = list[quality]
  let id = /var k__id = "(.*?)"/.exec(document.body.innerHTML) || ['', '']
  let thumb = document.querySelector('img').src
  let title = document.querySelector('b').innerHTML
  let res2 = await post(`https://www.y2mate.com/mates/${server}/convert`, {
    type: 'youtube',
    _id: id[1],
    v_id: ytId[1],
    ajax: '1',
    token: '',
    ftype: type,
    fquality: bitrate
  })
  let json2 = await res2.json()
  let resUrl = /<a.+?href="(.+?)"/.exec(json2.result)[1]
  return {
    dl_link: resUrl.replace(/https/g, 'http'),
    thumb,
    title,
    size: filesize
  }
}
async function downloadYT(vid,type = 'video',quality = '360p'){
var format = type === 'video' ? 'mp4' : 'mp3';
var resolution = type === 'mp3' ? '128kbps' : quality;
var end = resolution.endsWith("p") ? "p" : "kbps";
var {dl_link,thumb,title,size} = await yt('https://youtu.be/'+vid,resolution,format,resolution.replace(end,""),'en154')
if (dl_link.includes("app.y2mate")) var {dl_link,thumb,title,size} = await yt('https://youtu.be/'+vid,resolution,format,resolution.replace(end,""),'en154')
if (dl_link.includes("app.y2mate")) var {dl_link,thumb,title,size} = await yt('https://youtu.be/'+vid,resolution,format,resolution.replace(end,""),'en154')
if (dl_link.includes("app.y2mate")) var {dl_link,thumb,title,size} = await yt('https://youtu.be/'+vid,resolution,format,resolution.replace(end,""),'en154')
return {
url:dl_link,
title:title,
thumbnail:thumb,
size:size
}
}
module.exports = {
  yt,
  ytIdRegex,
  downloadYT,
  servers: ['en136', 'id4', 'en60', 'en61', 'en68']
};