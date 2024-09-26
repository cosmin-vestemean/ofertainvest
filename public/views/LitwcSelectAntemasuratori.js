import { LitElement, html, css } from 'lit-element'
import { template } from '../client.js'
import { _cantitate_antemasuratori, _cantitate_oferta } from '../utils/_cantitate_oferta.js'
import { antemasuratoriDisplayMask } from '../controllers/antemasuratori.js'

class LitwcSelectAntemasuratori extends HTMLElement {
  static properties = {
    ds: { type: Array } //ds_antemasuratori
  }

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(template.content.cloneNode(true))
  }

  connectedCallback() {
    super.connectedCallback()
  }

  render() {
    //a simple table with filters and sorting
    if (!this.ds || this.ds.length == 0) {
      return html`<p class="label label-danger">No data</p>`
    } else {
      //add table
      var table = document.createElement('table')
      table.classList.add('table')
      table.classList.add('table-sm')
      table.classList.add('table-hover')
      table.classList.add('table-responsive')
      table.id = 'lista_antemasuratori'
      table.style.fontSize = 'small'
      var thead = document.createElement('thead')
      //look in antemasuratoriDisplayMask for visible fields and check property 'filter'. If filter = 'search', add input field. If filter = 'filter', add select field with distinct values
      //search or filter the table according to the input value or select value
      //add 'ROW_SELECTED' column with checkbox; on closing the modal, get the selected rows and update the parent component

      thead.id = 'thead_lista_antemasuratori'
      thead.classList.add('align-middle')
      var tr = document.createElement('tr')
      thead.appendChild(tr)
      for (var key in antemasuratoriDisplayMask) {
        if (antemasuratoriDisplayMask[key].visible) {
          if (antemasuratoriDisplayMask[key].filter == 'search') {
            var th = document.createElement('th')
            th.innerHTML = `<input type="text" id="search_${key}" placeholder="Search ${antemasuratoriDisplayMask[key].label || key}">`
            tr.appendChild(th)
          } else if (antemasuratoriDisplayMask[key].filter == 'filter') {
            var th = document.createElement('th')
            th.innerHTML = `<select id="filter_${key}" placeholder="Filter ${antemasuratoriDisplayMask[key].label || key}"></select>`
            tr.appendChild(th)
          } else {
            var th = document.createElement('th')
            th.innerHTML = antemasuratoriDisplayMask[key].label || key
            tr.appendChild(th)
          }
        }
      }
      table.appendChild(thead)

      var tbody = document.createElement('tbody')
      tbody.id = 'tbody_lista_antemasuratori'
      table.appendChild(tbody)

      for (let o of this.ds) {
        var tr = document.createElement('tr')
        tbody.appendChild(tr)
        for (var key in antemasuratoriDisplayMask) {
          if (Object.keys(object).includes(key)) {
            //check if visible
            if (antemasuratoriDisplayMask[key].visible) {
              var td = document.createElement('td')
              td.innerHTML =
                typeof object[key] === 'number' ? object[key].toFixed(2) : object[key] ? object[key] : ''
            }
          }
        }
        tr.appendChild(td)
      }
    }
  }
}

customElements.define('litwc-select-antemasuratori', LitwcSelectAntemasuratori)

export { LitwcSelectAntemasuratori }
