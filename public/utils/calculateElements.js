export function calculateLeftMenuTopPosition() {
    window.addEventListener('load', () => {
      const pageHeader = document.getElementById('page-header')
      const leftMenu = document.getElementById('leftMenu')
      const headerHeight = pageHeader.offsetHeight
      leftMenu.style.top = `${headerHeight}px`
    })
  }