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
      const noDataMessage = document.createElement('p')
      noDataMessage.className = 'label label-danger'
      noDataMessage.textContent = 'No data'
      return noDataMessage
    } else {
      // Add main div container
      let container = document.createElement('div')
      container.className = 'container-fluid'
      this.data.forEach((reteta) => {
        reteta.reteta.forEach((activitate) => {
          let articol = activitate.object
          // Div class row with divs class col for each column from recipeDisplayMask, if articol key exists in recipeDisplayMask has visible property set to true
          let row = document.createElement('div')
          row.className = 'row'
          for (var key in recipeDisplayMask) {
            if (Object.prototype.hasOwnProperty.call(recipeDisplayMask, key)) {
              let column = recipeDisplayMask[key]
              if (articol[column.value] && column.visible) {
                let col = document.createElement('div')
                col.className = 'col'
                col.textContent = articol[column.label]
                row.appendChild(col)
                console.log(articol[column.value], articol[column.label])
              }
            }
          }
          let subarticole = activitate.children
          subarticole.forEach((subarticol) => {
            let subarticolObject = subarticol.object
            let subrow = document.createElement('div')
            subrow.className = 'row'
            for (var key in recipeDisplayMask) {
              if (Object.prototype.hasOwnProperty.call(recipeDisplayMask, key)) {
                let column = recipeDisplayMask[key]
                if (subarticolObject[column.value] && column.visible) {
                  let subcol = document.createElement('div')
                  subcol.className = 'col'
                  subcol.textContent = subarticolObject[column.label]
                  subrow.appendChild(subcol)
                  console.log(subarticolObject[column.value], subarticolObject[column.label])
                }
              }
            }
            let deleteButton = document.createElement('button')
            deleteButton.className = 'btn btn-danger'
            deleteButton.textContent = 'Delete'
            deleteButton.dataset.idReteta = reteta.id
            deleteButton.dataset.idArticol = articol.CCCACTIVITRETETE
            deleteButton.dataset.idSubarticol = subarticolObject.CCCMATRETETE
            deleteButton.addEventListener('click', this.deleteSubarticol.bind(this))
            subrow.appendChild(deleteButton)
            row.appendChild(subrow)
          })
          container.appendChild(row)
        })
      })
      return html`${container}`
    }
  }
}

customElements.define('my-table-lista-retete', MyTableListaRetete)
