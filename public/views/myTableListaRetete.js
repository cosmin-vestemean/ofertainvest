import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js'
import { template, theadIsSet } from '../client.js'

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
          const articolCell = document.createElement('td')
          articolCell.className = 'foldable'
          articolCell.textContent = articol.object.DENUMIRE_ARTICOL_OFERTA
          articolCell.addEventListener('click', this.toggleFold.bind(this))
          articolRow.appendChild(articolCell)

          const addButtonCell = document.createElement('td')
          const addButton = document.createElement('i')
          //add class to addButton
          addButton.classList.add('bi')
          addButton.classList.add('bi-plus')
          addButton.classList.add('text-primary')
          addButton.dataset.idReteta = reteta.id
          addButton.dataset.idArticol = articol.object.CCCACTIVITRETETE
          addButton.addEventListener('click', this.addSubarticol.bind(this))
          addButtonCell.appendChild(addButton)
          articolRow.appendChild(addButtonCell)

          table.appendChild(articolRow)

          const subarticolRow = document.createElement('tr')
          //add left margin to subarticolRow
          subarticolRow.style.marginLeft = '20px'
          subarticolRow.className = 'hidden'
          const subarticolCell = document.createElement('td')
          subarticolCell.colSpan = 2
          const subarticolTable = document.createElement('table')
          //add class to subarticolTable
          subarticolTable.classList.add('table')
          subarticolTable.classList.add('table-sm')
          subarticolTable.classList.add('table-hover')
          subarticolTable.classList.add('table-responsive')
          subarticolTable.classList.add('subarticol')
          subarticolTable.style.fontSize = 'small'

          articol.children.forEach((subarticol) => {
            const subarticolTableRow = document.createElement('tr')
            const subarticolTableCell = document.createElement('td')
            const isCustom = subarticol.object.ISCUSTOM || true
            subarticolTableCell.contentEditable = isCustom
            subarticolTableCell.textContent = subarticol.object.DENUMIRE_ARTICOL_OFERTA
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

            subarticolTable.appendChild(subarticolTableRow)
          })

          subarticolCell.appendChild(subarticolTable)
          subarticolRow.appendChild(subarticolCell)
          table.appendChild(subarticolRow)
        })
      })

      return html`${table}`
    }
  }
}

customElements.define('my-table-lista-retete', MyTableListaRetete)
