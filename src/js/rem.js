(function () {

  setRemUnit()
  window.onresize = setRemUnit

  function setRemUnit() {
    let docEl = document.documentElement

    var viewWidth = docEl.getBoundingClientRect().width || window.innerWidth
    viewWidth = viewWidth > 640 ? 640 : viewWidth
    document.getElementsByTagName('html')[0].style.fontSize = viewWidth / 750 * 100 + 'px'

    if( viewWidth >= 640 ) {
      document.querySelector('.panels .effect-1').style.width = 56 + 'vw'
      document.querySelector('.panels .effect-1').style.height = 56 + 'vw'
      document.querySelector('.panels .effect-2').style.width = 48 + 'vw'
      document.querySelector('.panels .effect-2').style.height = 48 + 'vw'
      document.querySelector('.panels .effect-3').style.width = 19 + 'vw'
      document.querySelector('.panels .effect-3').style.height = 19 + 'vw'
    }
    

  }

})()