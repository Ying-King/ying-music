import './icons'
import Swiper from './swiper'

class Player {
  constructor(node) {
    this.root = typeof node === 'string' ? document.querySelector(node) : node

    this.audio = new Audio()

    this.$ = selector => this.root.querySelector(selector)
    this.$$ = selector => this.root.querySelectorAll(selector)

    this.songList = [] // 音乐数据
    this.currentIndex = 0 // 索引初始化为 0

    this.lyricsArr = []
    this.lyricIndex = -1

    this.start()
    this.bind()
  }

  start() { // 音乐要“开始”播放，首先需要“数据”。通过 fetch 去获取数据 data
    fetch('https://ying-king.github.io/data-mock/ying-music/music-list.json')
      .then(res => res.json()) // 返回一个Promise，可以解析成JSON
      .then(data => { // 获取json数据
        console.log(data)
        this.songList = data
        this.loadSong()
      }).catch(err => {
        console.log(err)
      })
  }

  loadSong() { // “缓存”数据
    let songObj = this.songList[this.currentIndex]
    this.audio.src = songObj.url

    this.$('.header h1').innerText = songObj.title
    this.$('.header p').innerText = songObj.author + '-' + songObj.album

    // 当指定的音频/视频的元数据已加载时，会发生 loadedmetadata 事件
    this.audio.onloadedmetadata = () => this.$('.time-end').innerText = this.formateTime(this.audio.duration)

    this.loadLyric()
  }

  loadLyric() { // 获取歌词
    fetch(this.songList[this.currentIndex].lyric)
      .then(res => res.json())
      .then(data => {
        console.log(data.lrc.lyric)
        this.setLyrics(data.lrc.lyric)
        window.lyrics = data.lrc.lyric
      })
  }

  setLyrics(lyrics) { // 设置歌词
    this.lyricIndex = 0
    let fragment = document.createDocumentFragment()
    let lyricsArr = []
    this.lyricsArr = lyricsArr

    lyrics.split(/\n/) // 字符串分割为字符数组,得到“每一行”歌词——行与行是单独分开的
      .filter(str => str.match(/\[.+?\]/)) //过滤出歌词里边不包含如 [00:30.22] 这种格式的歌词——不是这种格式的话，不是一项有效的歌词
      .forEach(line => { // 对每一行歌词运用以下逻辑
        let str = line.replace(/\[.+?]/g, '') // 替换掉前边的 [] 为“空字符”，得到一个纯的字符串
        line.match(/\[.+?]/g).forEach(t => { // 对匹配到的每一行的“时间”运用以下逻辑
          // 把时间点的“中括号”去掉，得到一个单纯的时间，如 00:30.22
          t = t.replace(/[\[\]]/g, '')
          // 将时间统一全部变成“毫秒
          let milliseconds = parseInt(t.slice(0, 2)) * 60 * 1000 + parseInt(t.slice(3, 5)) * 1000 + parseInt(t.slice(6))
          // 然后创建一个新的数组，数组里是时间“毫秒数”和歌词“字符串”,放入 lyricsArr
          lyricsArr.push([milliseconds, str])
        })
      })

    // 根据“时间”做一个比较排序,trim()方法从字符串的两端删除空格
    lyricsArr.filter(line => line[1].trim() !== '').sort((v1, v2) => {
      if (v1[0] > v2[0]) {
        return 1
      } else {
        return -1
      }
    }).forEach(line => { // 排序好后，对里边的每一条运用以下逻辑
      let node = document.createElement('p') // 在页面创建一个 p 标签
      node.setAttribute('data-time', line[0]) // 给 p 标签设置一个 data-time 属性,时间毫秒数作为这个属性的值
      node.innerText = line[1] // 第二个参数“歌词”赋值给 p 的内容
      fragment.appendChild(node) // 把 p 放到虚拟 DOM 里边
    })

    this.$('.panel-lyrics .container').innerHTML = ''

    this.$('.panel-lyrics .container').appendChild(fragment) // 把虚拟 DOM 放在 container 里边

    if (this.lyricIndex < this.lyricsArr.length - 1) {
      this.$$('.panel-effect .lyric p')[0].innerText = this.lyricsArr[this.lyricIndex][1]
      this.$$('.panel-effect .lyric p')[1].innerText = this.lyricsArr[this.lyricIndex + 1] ? this.lyricsArr[this.lyricIndex + 1][1] : ''
    }
  }

  bind() { // 当用户点击任何一个按钮时，播放器的运行逻辑都是：先“缓存”对应歌曲的信息，然后“播放”该歌曲
    let self = this

    // 操作按钮
    let btnPlayPause = this.$('.btn-play-pause')
    let btnPre = this.$('.btn-pre')
    let btnNext = this.$('.btn-next')
    let btnLoad = this.$('.btn-load')
    let btnLike = this.$('.btn-like')
    // 进度条相关
    let bar = this.$('.bar')
    let progress = this.$('.bar .progress')
    let control = this.$('.bar .control')

    let touchPoint = 0 // 初始化触摸起点
    let crlLeft = 0 // 控件离容器最左方的距离

    // 播放、停止按钮
    btnPlayPause.onclick = function () {
      if (this.classList.contains('playing')) {
        self.audio.pause()
        console.log('pause')

        this.classList.remove('playing')
        this.classList.add('pause')
        this.querySelector('use').setAttribute('xlink:href', '#icon-play')
      } else if (this.classList.contains('pause')) {
        self.audio.play()
        console.log('playing')

        this.classList.remove('pause')
        this.classList.add('playing')
        this.querySelector('use').setAttribute('xlink:href', '#icon-pause')
      }
    }

    // 上一曲
    btnPre.onclick = function () {
      if (btnPlayPause.classList.contains('pause')) {
        btnPlayPause.classList.remove('pause')
        btnPlayPause.classList.add('playing')
        btnPlayPause.querySelector('use').setAttribute('xlink:href', '#icon-pause')
      }
      self.currentIndex = (self.currentIndex - 1 + self.songList.length) % self.songList.length
      self.loadSong()
      self.playSong()
      console.log('pre')
    }

    // 下一曲
    btnNext.onclick = function () {
      if (btnPlayPause.classList.contains('pause')) {
        btnPlayPause.classList.remove('pause')
        btnPlayPause.classList.add('playing')
        btnPlayPause.querySelector('use').setAttribute('xlink:href', '#icon-pause')
      }
      self.currentIndex = (self.currentIndex + 1) % self.songList.length
      self.loadSong()
      self.playSong()
      console.log('next')
    }

    // 刷新
    btnLoad.onclick = function() {
      if (btnPlayPause.classList.contains('pause')) {
        btnPlayPause.classList.remove('pause')
        btnPlayPause.classList.add('playing')
        btnPlayPause.querySelector('use').setAttribute('xlink:href', '#icon-pause')
      }
      self.audio.load()
      self.loadSong()
      self.playSong()
      console.log('load')
    }

    // 喜欢
    btnLike.onclick = function() {
      if (this.classList.contains('like')) {
        this.classList.remove('like')
        this.classList.add('liker')
        this.querySelector('use').setAttribute('xlink:href', '#icon-liker')
      } else if (this.classList.contains('liker')) {
        this.classList.remove('liker')
        this.classList.add('like')
        this.querySelector('use').setAttribute('xlink:href', '#icon-like')
      }
    }

    // 滑动面板
    let swiper = new Swiper(this.$('.panels'))
    swiper.on('swiperLeft', function () {
      this.classList.remove('panel1')
      this.classList.add('panel2')
      self.$$('.header .balls span')[0].classList.remove('current')
      self.$$('.header .balls span')[1].classList.add('current')
      console.log('left')
    })
    swiper.on('swiperRight', function () {
      this.classList.remove('panel2')
      this.classList.add('panel1')
      self.$$('.header .balls span')[1].classList.remove('current')
      self.$$('.header .balls span')[0].classList.add('current')
      console.log('Right')
    })

    // 音乐播放的过程中，播放器会时刻地触发方法 ontimeupdate
    this.audio.ontimeupdate = function () {
      self.locateLyric()
      self.setProgressBar()
    }

    // 拖拽进度条
    control.addEventListener('touchstart', e => {
      let touch = e.changedTouches[0]
      if (btnPlayPause.classList.contains('playing')) {
        self.audio.pause()
        btnPlayPause.classList.remove('playing')
        btnPlayPause.classList.add('pause')
        btnPlayPause.querySelector('use').setAttribute('xlink:href', '#icon-play')
      }

      touchPoint = touch.clientX
      crlLeft = touch.target.offsetLeft
    }, false)

    control.addEventListener('touchmove', e => {
      let touch = e.changedTouches[0]
      let diffX = touch.clientX - touchPoint
      let crlLeftStyle = crlLeft + diffX
      let maxX = bar.offsetWidth - 8

      crlLeftStyle = crlLeftStyle < -8 ? -8 : crlLeftStyle
      crlLeftStyle = crlLeftStyle > maxX ? maxX : crlLeftStyle

      touch.target.style.left = crlLeftStyle + 'px'
      progress.style.width = (crlLeftStyle + 8) / bar.offsetWidth * 100 + '%'
      self.audio.currentTime = self.audio.duration * (crlLeftStyle + 8) / bar.offsetWidth
    }, false)

    control.addEventListener('touchend', () => {
      if (btnPlayPause.classList.contains('pause')) {
        self.audio.play()
        btnPlayPause.classList.remove('pause')
        btnPlayPause.classList.add('playing')
        btnPlayPause.querySelector('use').setAttribute('xlink:href', '#icon-pause')
      }
    }, false)

    // 点击bar，让进度条直接到达这个位置
    bar.onclick = function (e) {
      let barLeft = e.clientX - this.offsetLeft

      progress.style.width = barLeft / bar.offsetWidth * 100 + '%'
      control.style.left = barLeft - 8 + 'px'
      self.audio.currentTime = self.audio.duration * barLeft / bar.offsetWidth
      self.locateLyric()
      if (btnPlayPause.classList.contains('pause')) {
        self.audio.play()
        btnPlayPause.classList.remove('pause')
        btnPlayPause.classList.add('playing')
        btnPlayPause.querySelector('use').setAttribute('xlink:href', '#icon-pause')
      }
    }
  }

  playSong() { // 播放歌曲
    console.log('playSong')
    this.audio.oncanplaythrough = () => this.audio.play()
  }

  locateLyric() { // 定位歌词
    console.log('locateLyric')

    let currentTime = this.audio.currentTime * 1000
    let nextLineTime = this.lyricsArr[this.lyricIndex + 1][0]

    // 播放歌曲的时间大于 DOM 元素
    if (currentTime > nextLineTime && this.lyricIndex < this.lyricsArr.length - 1) {
      this.lyricIndex++
      let node = this.$('[data-time="' + this.lyricsArr[this.lyricIndex][0] + '"]')

      if (node) this.setLyricToCenter(node)

      this.$$('.panel-effect .lyric p')[0].innerText = this.lyricsArr[this.lyricIndex][1]
      this.$$('.panel-effect .lyric p')[1].innerText = this.lyricsArr[this.lyricIndex + 1] ? this.lyricsArr[this.lyricIndex + 1][1] : ''
    }
  }

  setLyricToCenter(node) { // 将播放的歌词放到“歌词面板”中间并“高亮”
    console.log(node)

    //偏移的高度:歌词元素到顶点高度 - 歌词面板高度/2
    let translateY = node.offsetTop - this.$('.panel-lyrics').offsetHeight / 2
    translateY = translateY > 0 ? translateY : 0

    // 把歌词放到“歌词面板”的中央
    this.$('.panel-lyrics .container').style.transform = `translateY(-${translateY}px)`
    // 歌词“高亮”的设置
    this.$$('.panel-lyrics p').forEach(node => node.classList.remove('current'))
    node.classList.add('current')
  }

  formateTime(secondsTotal) { // 设置“播放时间”
    let minutes = parseInt(secondsTotal / 60)
    minutes = minutes >= 10 ? '' + minutes : '0' + minutes

    let seconds = parseInt(secondsTotal % 60)
    seconds = seconds >= 10 ? '' + seconds : '0' + seconds

    return minutes + ':' + seconds
  }

  setProgressBar() { // 设置“播放进度条”
    console.log('set setProgressBar')

    let percent = (this.audio.currentTime * 100 / this.audio.duration) + '%'

    this.$('.bar .progress').style.width = percent
    this.$('.bar .control').style.left = this.$('.bar .progress').offsetWidth - 8 + 'px'
    this.$('.time-start').innerText = this.formateTime(this.audio.currentTime)

    console.log(this.$('.bar .progress').style.width)
  }
}

window.p = new Player('#player')