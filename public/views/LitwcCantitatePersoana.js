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
    ds: { type: Array } //[{CCCESTIMARIPERS: 1, PRSN: 12, NAME2: 'Popescu Ion', CANTITATE: 10}]
  }

  //lit methods
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(template.content.cloneNode(true))
  }

  connectedCallback() {
    super.connectedCallback()
  }

  render() {
    var table = document.createElement('table')
    table.classList.add('table')
    table.classList.add('table-sm')
    table.classList.add('table-hover')
    table.classList.add('table-responsive')
    table.id = 'detalii_cantitate_persoana'
    table.style.fontSize = 'small'

    var thead = document.createElement('thead')
    table.appendChild(thead)

    var tr = document.createElement('tr')
    thead.appendChild(tr)

    var th = document.createElement('th')
    //checkbox
    var input = document.createElement('input')
    input.type = 'checkbox'
    input.id = 'select_all'
    th.appendChild(input)
    tr.appendChild(th)

    //select angajat
    th = document.createElement('th')
    th.textContent = 'Angajat'
    tr.appendChild(th)

    //cantitate
    th = document.createElement('th')
    th.textContent = 'Cantitate'
    tr.appendChild(th)

    //add rows
    var tbody = document.createElement('tbody')
    tbody.id = 'tbody_detalii_cantitate_persoana'
    table.appendChild(tbody)

    if (!this.ds || this.ds.length == 0) {
      //add a single empty row
      this.addEmptyRow()
    } else {
      //add rows
      this.ds.forEach(function (o) {
        let tr = document.createElement('tr')
        tbody.appendChild(tr)
      })
    }

    return html`${table}`
  }

  //class methods
  //add a new row to the table
  addEmptyRow() {
    let nrTableRow = tbody.rows.length + 1
    var tbody = document.getElementById('tbody_detalii_cantitate_persoana')
    var tr = document.createElement('tr')
    tbody.appendChild(tr)

    //checkbox
    var td = document.createElement('td')
    var input = document.createElement('input')
    input.id = 'checkbox' + nrTableRow
    input.type = 'checkbox'
    td.appendChild(input)
    tr.appendChild(td)

    //select angajat
    td = document.createElement('td')
    var select = document.createElement('select')
    select.id = 'select_angajat' + nrTableRow
    //add attr data-searchable="true"
    select.setAttribute('data-searchable', 'true')
    let select_angajat = new UseBootstrapSelect(select)
    contextOferta.angajati.forEach(function (o) {
      select_angajat.addOption(o.PRSN, o.NAME2)
    })
    td.appendChild(select)

    //cantitate
    td = document.createElement('td')
    var input = document.createElement('input')
    input.id = 'cantitate' + nrTableRow
    input.type = 'text'
    input.size = 5
    td.appendChild(input)
    tr.appendChild(td)
  }

  //delete selected rows
  deleteRows() {
    var tbody = document.getElementById('tbody_detalii_cantitate_persoana')
    var rows = tbody.rows
    for (var i = rows.length - 1; i >= 0; i--) {
      var row = rows[i]
      var checkbox = row.cells[0].firstChild
      if (checkbox.checked) {
        tbody.removeChild(row)
      }
    }
  }

  //select all rows
  selectAll() {
    var tbody = document.getElementById('tbody_detalii_cantitate_persoana')
    var rows = tbody.rows
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i]
      var checkbox = row.cells[0].firstChild
      checkbox.checked = true
    }
  }

  //deselect all rows
  deselectAll() {
    var tbody = document.getElementById('tbody_detalii_cantitate_persoana')
    var rows = tbody.rows
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i]
      var checkbox = row.cells[0].firstChild
      checkbox.checked = false
    }
  }
}

export { LitwcCantitatePersoana }
