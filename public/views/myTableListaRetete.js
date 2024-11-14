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

  applyMask(obj, mask) {
    //take into account visible key of mask; interested into visible keys only
    let keys = Object.keys(mask).filter((key) => mask[key].visible)
    let newObj = {}
    keys.forEach((key) => {
      newObj[key] = obj[key]
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
          let newArticol = this.applyMask(articol, recipeDisplayMask)
          let subarticole = activitate.children.map((subarticol) => subarticol.object)
          let newSubarticole = subarticole.map((subarticol) => this.applyMask(subarticol, recipeSubsDisplayMask))
          articole.push({ articol: newArticol, subarticole: newSubarticole })
        })
      })

      console.log('articole', articole)
            

      return html`${container}`
    }
  }
}

customElements.define('my-table-lista-retete', MyTableListaRetete)
