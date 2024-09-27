import { LitElement, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js'
import { template, _nivel_oferta } from '../client.js'
import { _cantitate_antemasuratori, _cantitate_oferta } from '../utils/_cantitate_oferta.js'
import { context } from '../controllers/estimari.js'

class LitwcSelectAntemasuratori extends LitElement {
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
      table.id = 'lista_select_antemasuratori'
      table.style.fontSize = 'small'

      var tbody = document.createElement('tbody')
      tbody.id = 'tbody_lista_select_antemasuratori'
      table.appendChild(tbody)

      let maxNivele = 0
      //add rows
      this.ds.forEach(function (o) {
        let instanta = o.CCCINSTANTE
        let r = o.CCCPATHS
        let ISMAIN = o.ISMAIN
        let counter = o.CCCINSTANTE
        let counter2 = o.CCCPATHS
        let counter3 = o.CCCACTIVITINSTANTE
        let CCCANTEMASURATORI = Object.hasOwnProperty.call(o, 'CCCANTEMASURATORI')
          ? o.CCCANTEMASURATORI
          : null
        let CCCESTIMARI = Object.hasOwnProperty.call(o, 'CCCESTIMARI') ? o.CCCESTIMARI : null
        let CCCACTIVITESTIMARI = Object.hasOwnProperty.call(o, 'CCCACTIVITESTIMARI')
          ? o.CCCACTIVITESTIMARI
          : null

        let a = CCCANTEMASURATORI
        let b = CCCESTIMARI
        let c = CCCACTIVITESTIMARI
        let d = CCCACTIVITESTIMARI ? true : false

        if (ISMAIN) {
          //add main activity row
          let mn = this.addTableRow(tbody, instanta, r, counter, counter2, counter3, o, true, a, b, c, d)
          if (mn > maxNivele) {
            maxNivele = mn
          }
        }
        let mn = this.addTableRow(tbody, instanta, r, counter, counter2, counter3, o, false, a, b, c, d)
        if (mn > maxNivele) {
          maxNivele = mn
        }
      }, this)

      //add table header
      var thead = document.createElement('thead')
      var tr = document.createElement('tr')
      //add checkbox for main activity
      var th = document.createElement('th')
      th.innerHTML = 'Select'
      th.classList.add('ROW_SELECTED')
      tr.appendChild(th)
      //add plus/minus icon
      th = document.createElement('th')
      tr.appendChild(th)
      //add counter
      th = document.createElement('th')
      th.innerHTML = 'Nr.'
      tr.appendChild(th)
      //add columns based on estimariDisplayMask
      for (var key in context.estimariDisplayMask) {
        if (context.estimariDisplayMask[key].visible && context.estimariDisplayMask[key].inPopup) {
          //check maxNivele
          if (key.includes(_nivel_oferta)) {
            let n = parseInt(key.split('_')[2])
            if (n <= maxNivele) {
              th = document.createElement('th')
              if (context.estimariDisplayMask[key].filter === 'select') {
                var select = document.createElement('select')
                select.classList.add('form-select', 'form-select-sm')
                let option = document.createElement('option')
                option.value = ''
                option.innerHTML = 'Select'
                select.appendChild(option)
                //add options
              } else {
              }
              th.appendChild(select)
              tr.appendChild(th)
            }
          } else {
            th = document.createElement('th')
            if (context.estimariDisplayMask[key].filter === 'text') {
              //add search input
              let input = document.createElement('input')
              input.type = 'text'
              input.classList.add('form-control', 'form-control-sm')
              input.placeholder = 'Search'
              th.appendChild(input)
            } else if (context.estimariDisplayMask[key].filter === 'select') {
              let select = document.createElement('select')
              select.classList.add('form-select', 'form-select-sm')
              let option = document.createElement('option')
              option.value = ''
              option.innerHTML = 'Select'
              select.appendChild(option)
              //add options
            } else {
              th.innerHTML = context.estimariDisplayMask[key].label
            }
            tr.appendChild(th)
          }
        }
      }
      thead.appendChild(tr)
      table.appendChild(thead)
    }

    return html`${table}`
  }

  addTableRow(
    tbody,
    i,
    k,
    counter,
    counter2,
    counter3,
    o,
    ISMAIN,
    CCCANTEMASURATORI,
    CCCESTIMARI,
    CCCACTIVITESTIMARI,
    isDB
  ) {
    let bg_color = counter % 2 == 0 ? 'table-light' : 'table-white'
    let tr = document.createElement('tr')
    let id = ''
    if (ISMAIN) {
      id = i + '@' + k
    } else {
      id = i + '@' + k + '_' + counter3
    }
    tr.id = id
    tr.setAttribute('data-cccantemasuratori', CCCANTEMASURATORI)
    tr.setAttribute('data-cccestimari', CCCESTIMARI)
    tr.setAttribute('data-cccactivitestimari', CCCACTIVITESTIMARI)
    tr.setAttribute('data-is-db', isDB)
    if (ISMAIN) {
      tr.classList.add('table-primary')
    } else {
      tr.classList.add(bg_color)
    }
    tbody.appendChild(tr)
    //create a checkbox for main activity
    let td = document.createElement('td')
    td.classList.add('ROW_SELECTED')
    //create a checkbox
    let checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.id = 'checkbox-' + id
    checkbox.classList.add('form-check-input', 'align-middle')
    checkbox.checked = o['ROW_SELECTED']
    td.appendChild(checkbox)
    tr.appendChild(td)
    td = document.createElement('td')
    if (ISMAIN) {
      //add plus/minus icon
      let plus_icon = document.createElement('i')
      plus_icon.classList.add('bi', 'bi-dash-square', 'fs-6', 'align-middle')
      plus_icon.style.cursor = 'pointer'
      i = this.toggleChildrenVisibility(plus_icon, i, k)
      td.appendChild(plus_icon)
    } else {
      td.innerHTML = ''
    }
    tr.appendChild(td)

    //add counter
    td = document.createElement('td')
    td.classList.add('align-middle')
    if (!ISMAIN) {
      td.innerHTML = counter + '.' + counter2 + '.' + counter3
    } else {
      td.innerHTML = counter + '.' + counter2
    }
    tr.appendChild(td)

    let maxNivele = 0
    //add columns based on estimariDisplayMask
    for (var key in context.estimariDisplayMask) {
      //check key vs estimariDisplayMask
      //first check if key exists in estimariDisplayMask
      if (Object.keys(o).includes(key)) {
        //check if visible
        if (context.estimariDisplayMask[key].visible) {
          //maxNivele based on _nivel_oferta
          if (key.includes(_nivel_oferta)) {
            let n = parseInt(key.split('_')[2])
            if (n > maxNivele) {
              maxNivele = n
            }
          }
          let td = document.createElement('td')
          if (context.estimariDisplayMask[key].type === 'number') {
            td.style.textAlign = 'right'
            td.innerHTML = parseFloat(o[key]) || ''
          } else {
            td.innerHTML = o[key] || ''
          }
          td.classList.add(key)
          tr.appendChild(td)
        }
      }
    }

    return maxNivele
  }

  toggleChildrenVisibility(plus_icon, i, k) {
    plus_icon.onclick = function () {
      //show hide all children, identified by same id and a "_some_number"
      var children = this.shadowRoot
        .getElementById('tbody_lista_select_antemasuratori')
        .querySelectorAll('[id^="' + i + '@' + k + '_"]')
      for (let i = 0; i < children.length; i++) {
        if (children[i].classList.contains('d-none')) {
          children[i].classList.remove('d-none')
        } else {
          children[i].classList.add('d-none')
        }
      }
      //change icon
      if (plus_icon.classList.contains('bi-dash-square')) {
        plus_icon.classList.remove('bi-dash-square')
        plus_icon.classList.add('bi-plus-square')
      } else {
        plus_icon.classList.remove('bi-plus-square')
        plus_icon.classList.add('bi-dash-square')
      }
    }
    return i
  }
}

export { LitwcSelectAntemasuratori }
