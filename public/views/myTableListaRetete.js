import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js'
import { template, theadIsSet } from '../client.js'
import { recipeDisplayMask, recipeSubsDisplayMask } from './masks.js'

class MyTableListaRetete extends LitElement {
  static properties = {
    data: { type: Array }
  }

  constructor() {
    super()
    this.data = []
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(template.content.cloneNode(true))
  }

  deleteSubarticol(event) {
    const idReteta = event.target.dataset.idReteta
    const idArticol = event.target.dataset.idArticol
    const idSubarticol = event.target.dataset.idSubarticol
    this.data = this.data.map((reteta) => {
      if (reteta.id === idReteta) {
        reteta.reteta = reteta.reteta.map((articol) => {
          if (articol.object.CCCACTIVITRETETE === idArticol) {
            articol.children = articol.children.filter(
              (subarticol) => subarticol.object.CCCMATRETETE !== idSubarticol
            )
          }
          return articol
        })
      }
      return reteta
    })
  }

  render() {
    if (!this.data || this.data.length == 0) {
      const noDataMessage = document.createElement('p')
      noDataMessage.className = 'label label-danger'
      noDataMessage.textContent = 'No data'
      return html`${noDataMessage}`
    } else {
      //add main div container
      let container = document.createElement('div')
      container.className = 'container-fluid'
      let articole = []
      this.data.forEach((reteta) => {
        reteta.reteta.forEach((activitate) => {
          let articol = activitate.object
          let newArticol = {}
          let newSubarticole = []
          //recipieDisplayMask
          for (let key in recipeDisplayMask) {
            if (recipeDisplayMask[key].visible) {
              if (Object.keys(articol).includes(key)) {
                newArticol[key] = articol[key]
              }
            }
          }
          let subarticole = activitate.children.map((subarticol) => subarticol.object)
          for (let subarticol of subarticole) {
            for (let key in recipeSubsDisplayMask) {
              if (recipeSubsDisplayMask[key].visible) {
                if (Object.keys(subarticol).includes(key)) {
                  newSubarticole.push({ [key]: subarticol[key] })
                }
              }
            }
          }

          articole.push({ articol: newArticol, subarticole: newSubarticole })
        })
      })

      console.log('articole', articole)

      return html`${container}`
    }
  }
}

customElements.define('my-table-lista-retete', MyTableListaRetete)
