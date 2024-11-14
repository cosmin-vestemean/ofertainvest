import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js'
import { template, theadIsSet } from '../client.js'
import { recipeDisplayMask } from './masks.js'

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
      return html`<p class="label label-danger">No data</p>`
    } else {
      return html`
        <div class="container-fluid">
          ${this.data.map((reteta) =>
            reteta.reteta.map((activitate) => {
              let articol = activitate.object
              return html`
                <div class="row">
                  ${Object.keys(recipeDisplayMask).map((key) => {
                    let column = recipeDisplayMask[key]
                    return articol[column.value] && column.visible
                      ? html`<div class="col">${articol[column.label]}</div>`
                      : ''
                  })}
                  ${activitate.children.map((subarticol) => {
                    let subarticolObject = subarticol.object
                    return html`
                      <div class="row">
                        ${Object.keys(recipeDisplayMask).map((key) => {
                          let column = recipeDisplayMask[key]
                          return subarticolObject[column.value] && column.visible
                            ? html`<div class="col">${subarticolObject[column.label]}</div>`
                            : ''
                        })}
                        <button
                          class="btn btn-danger"
                          data-id-reteta="${reteta.id}"
                          data-id-articol="${articol.CCCACTIVITRETETE}"
                          data-id-subarticol="${subarticolObject.CCCMATRETETE}"
                          @click="${this.deleteSubarticol}"
                        >
                          Delete
                        </button>
                      </div>
                    `
                  })}
                </div>
              `
            })
          )}
        </div>
      `
    }
  }
}

customElements.define('my-table-lista-retete', MyTableListaRetete)
