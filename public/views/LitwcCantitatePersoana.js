import { LitElement, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js'
import { template, contextOferta } from '../client.js'

/*
Reprezinta si afiseaza un tabel cu trei coloane: 
    1. checkbox, 
    2. select with angajati [{PRSN: 12, NAME2: 'Popescu Ion'}] + new UseBootstrapSelect(document.getElementById('select_angajati'))
    3. cantitate estimata atibuita persoanei.
Lista persoane: contextOferta.angajati from client.js.
Header (colspan=3):
1. Are un checkbox care selecteaza/deselecteaza toate liniile.
2. Are un plus_icon care adauga o noua linie in tabel.
3. Are un trash_icon care sterge liniile selectate (vezi ckeckbox).

If no data, return table with a single empty row so that the user can add a new row.
*/

class LitwcCantitatePersoana extends LitElement {
  static properties = {
    ds: { type: Array } // [{CCCESTIMARIPERS: 1, PRSN: 12, NAME2: 'Popescu Ion', CANTITATE: 10}]
  }

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(template.content.cloneNode(true))
    this.table = this.createTable()
    this.controlPanel = this.createControlPanel()
  }

  connectedCallback() {
    super.connectedCallback()
  }

  createTable() {
    const table = document.createElement('table')
    table.classList.add('table', 'table-sm', 'table-responsive')
    table.id = 'detalii_cantitate_persoana'
    table.style.fontSize = 'small'

    /* const thead = document.createElement('thead')
    table.appendChild(thead)

    const tr = document.createElement('tr')
    thead.appendChild(tr)

    let th = document.createElement('th')
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.id = 'select_all'
    th.appendChild(input)
    tr.appendChild(th)

    th = document.createElement('th')
    th.textContent = 'Angajat'
    tr.appendChild(th)

    th = document.createElement('th')
    th.textContent = 'Cantitate'
    tr.appendChild(th) */

    const tbody = document.createElement('tbody')
    tbody.id = 'tbody_detalii_cantitate_persoana'
    table.appendChild(tbody)

    return table
  }

  createControlPanel() {
    const controlPanel = document.createElement('div')
    controlPanel.classList.add('d-flex', 'justify-content-between', 'align-items-center')

    const div = document.createElement('div')
    controlPanel.appendChild(div)

    let icon = document.createElement('i')
    icon.classList.add('bi', 'bi-plus-square')
    icon.addEventListener('click', () => {
      this.addEmptyRow()
    })
    div.appendChild(icon)

    icon = document.createElement('i')
    icon.classList.add('bi', 'bi-trash')
    icon.addEventListener('click', () => {
      this.deleteRows()
    })
    div.appendChild(icon)

    const span = document.createElement('span')
    span.classList.add('badge', 'bg-primary', 'rounded-pill')
    span.textContent = 'Total: '
    div.appendChild(span)

    icon = document.createElement('i')
    icon.classList.add('bi', 'bi-check-all')
    icon.addEventListener('click', () => {
      this.selectAll()
    })
    div.appendChild(icon)

    icon = document.createElement('i')
    icon.classList.add('bi', 'bi-x-all')
    icon.addEventListener('click', () => {
      this.deselectAll()
    })
    div.appendChild(icon)

    return controlPanel
  }

  render() {
    const tbody = this.table.querySelector('#tbody_detalii_cantitate_persoana')
    tbody.innerHTML = '' // Clear existing rows

    if (!this.ds || this.ds.length === 0) {
      this.addEmptyRow()
    } else {
      this.ds.forEach((o) => {
        const tr = document.createElement('tr')
        tbody.appendChild(tr)
      })
    }

    return html`${this.controlPanel}${this.table}`
  }

  addEmptyRow() {
    const tbody = this.table.querySelector('#tbody_detalii_cantitate_persoana')
    const nrTableRow = tbody.rows.length + 1
    const tr = document.createElement('tr')
    tbody.appendChild(tr)

    let td = document.createElement('td')
    const input = document.createElement('input')
    input.id = 'checkbox' + nrTableRow
    input.type = 'checkbox'
    //placeholder
    input.setAttribute('placeholder', 'Cantitate')
    td.appendChild(input)
    tr.appendChild(td)

    td = document.createElement('td')
    const select = document.createElement('select')
    select.id = 'select_angajat' + nrTableRow
    select.setAttribute('data-searchable', 'true')
    select.classList.add('form-select', 'form-select-sm')
    //text small
    select.style.fontSize = 'small'
    //placeholder
    select.setAttribute('placeholder', 'Responsabil')
    //add default option
    const option = document.createElement('option')
    option.value = ''
    option.text = ''
    select.appendChild(option)
    contextOferta.angajati.forEach((o) => {
      const option = document.createElement('option')
      option.value = o.PRSN
      option.text = o.NAME2
      select.appendChild(option)
    })
    td.appendChild(select)
    tr.appendChild(td)

    // Initialize UseBootstrapSelect after appending the select element to the DOM
    //new UseBootstrapSelect(select)

    td = document.createElement('td')
    const inputCantitate = document.createElement('input')
    inputCantitate.id = 'cantitate' + nrTableRow
    inputCantitate.type = 'text'
    inputCantitate.classList.add('form-control', 'form-control-sm')
    inputCantitate.size = 5
    td.appendChild(inputCantitate)
    tr.appendChild(td)
  }

  deleteRows() {
    const tbody = this.table.querySelector('#tbody_detalii_cantitate_persoana')
    const rows = tbody.rows
    for (let i = rows.length - 1; i >= 0; i--) {
      const row = rows[i]
      const checkbox = row.cells[0].firstChild
      if (checkbox.checked) {
        tbody.removeChild(row)
      }
    }
  }

  selectAll() {
    const tbody = this.table.querySelector('#tbody_detalii_cantitate_persoana')
    const rows = tbody.rows
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const checkbox = row.cells[0].firstChild
      checkbox.checked = true
    }
  }

  deselectAll() {
    const tbody = this.table.querySelector('#tbody_detalii_cantitate_persoana')
    const rows = tbody.rows
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const checkbox = row.cells[0].firstChild
      checkbox.checked = false
    }
  }

  getTotalCantitate() {
    const tbody = this.table.querySelector('#tbody_detalii_cantitate_persoana')
    const rows = tbody.rows
    let total = 0
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const cantitate = row.cells[2].firstChild
      total += parseFloat(cantitate.value)
    }
    return total
  }
}

export { LitwcCantitatePersoana }
