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

  static styles = css`
    .subarticol {
      padding-left: 20px;
    }
    .foldable {
      cursor: pointer;
    }
    .hidden {
      display: none;
    }
  `

  toggleFold(event) {
    const subarticolRow = event.target.parentElement.nextElementSibling
    if (!subarticolRow.children.length) return
    subarticolRow.classList.toggle('hidden')
  }

  addSubarticol(event) {
    //afiseaza lista standard articole
    const idReteta = event.target.dataset.idReteta
    const idArticol = event.target.dataset.idArticol
    const newSubarticol = {
      object: {
        DENUMIRE_ARTICOL_OFERTA: 'New Subarticol',
        editable: true
      }
    }
    this.data = this.data.map((reteta) => {
      if (reteta.id === idReteta) {
        reteta.reteta = reteta.reteta.map((articol) => {
          if (articol.object.CCCACTIVITRETETE === idArticol) {
            articol.children.push(newSubarticol)
          }
          return articol
        })
      }
      return reteta
    })
  }

  editSubarticol(event) {
    const idReteta = event.target.dataset.idReteta
    const idArticol = event.target.dataset.idArticol
    const idSubarticol = event.target.dataset.idSubarticol
    const newValue = event.target.textContent
    this.data = this.data.map((reteta) => {
      if (reteta.id === idReteta) {
        reteta.reteta = reteta.reteta.map((articol) => {
          if (articol.object.CCCACTIVITRETETE === idArticol) {
            articol.children = articol.children.map((subarticol) => {
              if (subarticol.object.CCCMATRETETE === idSubarticol) {
                subarticol.object.DENUMIRE_ARTICOL_OFERTA = newValue
              }
              return subarticol
            })
          }
          return articol
        })
      }
      return reteta
    })
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
      //add div container fluid
      const container = document.createElement('div')
      container.classList.add('container-fluid')
      const table = document.createElement('table')
      //add class to table
      table.classList.add('table')
      table.classList.add('table-sm')
      table.classList.add('table-hover')
      table.classList.add('table-responsive')
      table.style.fontSize = 'small'

      this.data.forEach((reteta) => {
        /* const retetaRow = document.createElement('tr')
        const retetaCell = document.createElement('td')
        retetaCell.colSpan = 2
        retetaCell.innerHTML = `<strong>Reteta ID: ${reteta.id}</strong>`
        retetaRow.appendChild(retetaCell)
        table.appendChild(retetaRow) */

        reteta.reteta.forEach((articol) => {
          const articolRow = document.createElement('tr')
          //add border bottom to articolRow lightgray
          articolRow.style.borderBottom = '1px solid lightgray'
          Object.keys(recipeDisplayMask).forEach((mask) => {
            if (recipeDisplayMask[mask].visible) {
              const articolCell = document.createElement('td')
              articolCell.classList.add('foldable')
              articolCell.classList.add('articol')
              articolCell.style.width = recipeDisplayMask[mask].width
              articolCell.textContent += articol.object[recipeDisplayMask[mask].label]
                ? articol.object[recipeDisplayMask[mask].label]
                : articol.object[recipeDisplayMask[mask].value]

              if (articol.children.length) {
                articolCell.addEventListener('click', this.toggleFold.bind(this))
              }
              articolRow.appendChild(articolCell)
            }
          })
          const addButtonCell = document.createElement('td')
          const addButton = document.createElement('i')
          //add class to addButton
          addButton.classList.add('bi')
          addButton.classList.add('bi-plus-square')
          addButton.classList.add('fs-4')
          addButton.classList.add('text-primary')
          addButton.dataset.idReteta = reteta.id
          addButton.dataset.idArticol = articol.object.CCCACTIVITRETETE
          addButton.addEventListener('click', this.addSubarticol.bind(this))
          addButtonCell.appendChild(addButton)
          articolRow.appendChild(addButtonCell)

          table.appendChild(articolRow)

          const subarticolRow = document.createElement('tr')
          //add border bottom to subarticolRow lightgray
          subarticolRow.style.borderBottom = '1px solid lightgray'
          //add left margin to subarticolRow
          subarticolRow.classList.add('hidden')
          //add a "indent" cell to subarticolRow
          const subarticolIndentCell = document.createElement('td')
          subarticolIndentCell.style.width = '5%'
          subarticolRow.appendChild(subarticolIndentCell)
          const subarticolCell = document.createElement('td')
          //add width to subarticolCell
          subarticolCell.style.width = '90%'
          const subarticolTable = document.createElement('table')
          //add class to subarticolTable
          subarticolTable.classList.add('table')
          subarticolTable.classList.add('table-sm')
          subarticolTable.classList.add('table-hover')
          subarticolTable.classList.add('table-responsive')
          subarticolTable.classList.add('w-100')
          subarticolTable.classList.add('subarticol')
          subarticolTable.style.fontSize = 'small'

          articol.children.forEach((subarticol) => {
            const subarticolTableRow = document.createElement('tr')
            //add border bottom to subarticolTableRow lightgray
            subarticolTableRow.style.borderBottom = '1px solid lightgray'
            Object.keys(recipeDisplayMask).forEach((mask) => {
              if (recipeDisplayMask[mask].visible) {
                const subarticolTableCell = document.createElement('td')
                subarticolTableCell.style.width = recipeDisplayMask[mask].width
                const isCustom = subarticol.object.ISCUSTOM || false
                subarticolTableCell.contentEditable = isCustom
                subarticolTableCell.textContent += subarticol.object[recipeDisplayMask[mask].label]
                  ? subarticol.object[recipeDisplayMask[mask].label]
                  : subarticol.object[recipeDisplayMask[mask].value]

                subarticolTableCell.dataset.idReteta = reteta.id
                subarticolTableCell.dataset.idArticol = articol.object.CCCACTIVITRETETE
                subarticolTableCell.dataset.idSubarticol = subarticol.object.CCCMATRETETE
                subarticolTableCell.addEventListener('blur', this.editSubarticol.bind(this))
                subarticolTableRow.appendChild(subarticolTableCell)
                if (isCustom) {
                  const deleteButtonCell = document.createElement('td')
                  const deleteButton = document.createElement('i')
                  //add class to deleteButton
                  deleteButton.classList.add('bi')
                  deleteButton.classList.add('bi-trash')
                  deleteButton.classList.add('text-danger')
                  deleteButton.dataset.idReteta = reteta.id
                  deleteButton.dataset.idArticol = articol.object.CCCACTIVITRETETE
                  deleteButton.dataset.idSubarticol = subarticol.object.CCCMATRETETE
                  deleteButton.addEventListener('click', this.deleteSubarticol.bind(this))
                  deleteButtonCell.appendChild(deleteButton)
                  subarticolTableRow.appendChild(deleteButtonCell)
                }
              }
            })

            subarticolTable.appendChild(subarticolTableRow)
          })

          subarticolCell.appendChild(subarticolTable)
          subarticolRow.appendChild(subarticolCell)
          //add td Actions
          const subarticolActionsCell = document.createElement('td')
          const subarticolActions = document.createElement('div')
          subarticolActions.classList.add('d-flex')
          subarticolActions.classList.add('justify-content-center')
          subarticolActions.classList.add('align-items-center')
          subarticolActions.style.width = '5%'
          //add buttons fpr various actions
          const subarticolAddButton = document.createElement('i')
          //add class to subarticolAddButton
          subarticolAddButton.classList.add('bi')
          subarticolAddButton.classList.add('bi-plus-square')
          subarticolAddButton.classList.add('fs-4')
          subarticolAddButton.classList.add('text-primary')
          subarticolAddButton.dataset.idReteta = reteta.id
          subarticolAddButton.dataset.idArticol = articol.object.CCCACTIVITRETETE
          subarticolAddButton.addEventListener('click', this.addSubarticol.bind(this))
          subarticolActions.appendChild(subarticolAddButton)
          subarticolActionsCell.appendChild(subarticolActions)
          subarticolRow.appendChild(subarticolActionsCell)
          table.appendChild(subarticolRow)
        })
      })

      container.appendChild(table)

      return html`${container}`
    }
  }
}

customElements.define('my-table-lista-retete', MyTableListaRetete)
