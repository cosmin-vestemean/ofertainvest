import { LitElement, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js'
import { template, theadIsSet } from '../client.js'
import { _cantitate_antemasuratori, _cantitate_oferta } from '../utils/_cantitate_oferta.js'
import {
  ds_antemasuratori,
  antemasuratoriDisplayMask,
  newTree,
  setDsAntemasuratoriValue,
  updateAntemasuratoare,
  deleteAntemasuratore
} from '../controllers/antemasuratori.js'

export class antemasuratori extends LitElement {
  static properties = {
    ds: { type: Array }
  }

  constructor() {
    super()
    this.ds = []
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(template.content.cloneNode(true))
    //add event listener for keydown for td class cantitate_antemasuratori
    this.shadowRoot.addEventListener('keydown', function (e) {
      if (e.target.classList.contains(_cantitate_antemasuratori)) {
        if (e.key === 'Enter') {
          e.preventDefault()
          e.target.blur()
        }
      }
    })
  }

  connectedCallback() {
    super.connectedCallback()
    //console.log('antemasuratori element added to the DOM');
  }

  render() {
    console.log('rendering antemasuratori element with following array', this.ds, 'added at', new Date())

    if (!this.ds || this.ds.length == 0) {
      return html`<p class="label label-danger">No data</p>`
    } else {
      //add table
      var table = document.createElement('table')
      table.classList.add('table')
      table.classList.add('table-sm')
      table.classList.add('table-hover')
      table.classList.add('table-responsive')
      table.id = 'table_antemasuratori'
      //font size
      table.style.fontSize = 'small'
      //get or create thead and tbody
      var thead = document.createElement('thead')
      thead.id = 'thead_antemasuratori'
      thead.classList.add('align-middle')
      var tbody = document.createElement('tbody')
      tbody.id = 'tbody_antemasuratori'
      if (theadIsSet) {
        tbody.classList.add('table-group-divider')
      }
      table.appendChild(tbody)
      //add thead
      if (theadIsSet) {
        table.appendChild(thead)
        var tr = document.createElement('tr')
        thead.appendChild(tr)
        //append thrash icon
        var th = document.createElement('th')
        th.scope = 'col'
        tr.appendChild(th)
        //append counter
        var th = document.createElement('th')
        th.scope = 'col'
        tr.appendChild(th)
        for (var key in antemasuratoriDisplayMask) {
          //check key vs antemasuratoriDisplayMask
          //first check if key exists in antemasuratoriDisplayMask
          if (Object.keys(this.ds[0]).includes(key)) {
            //check if visible
            if (antemasuratoriDisplayMask[key].visible) {
              var th = document.createElement('th')
              th.scope = 'col'
              th.style.writingMode = 'vertical-rl'
              th.style.rotate = '180deg'
              if (!antemasuratoriDisplayMask[key].isEnumerable) {
                th.innerHTML = antemasuratoriDisplayMask[key].label
                  ? antemasuratoriDisplayMask[key].label
                  : key
              } else {
                th.innerHTML = antemasuratoriDisplayMask[key].label
                  ? antemasuratoriDisplayMask[key].label
                  : key
                //insert select element with multiple selections
              }

              tr.appendChild(th)
            }
          }
        }
      }
      //add tbody
      let counter = 0
      this.ds.forEach(function (object) {
        counter++
        var tr = document.createElement('tr')
        tr.id = object.CCCANTEMASURATORI
        tbody.appendChild(tr)
        //add thrash icon
        var td = document.createElement('td')
        var i = document.createElement('i')
        i.id = 't_' + object.CCCANTEMASURATORI
        i.classList.add('bi')
        i.classList.add('bi-trash')
        i.classList.add('text-danger')
        i.style.cursor = 'pointer'
        i.addEventListener('click', function (e) {
          //are you sure you want to delete?
          if (!confirm('Are you sure you want to delete this antemasuratoare?')) {
            return
          }
          let index = e.target.id.split('_')[1]
          console.log('delete antemasuratoare', index)
          deleteAntemasuratore(index)
        })
        td.appendChild(i)
        tr.appendChild(td)
        var td = document.createElement('td')
        td.style.fontWeight = 'bold'
        td.innerHTML = counter
        tr.appendChild(td)
        for (var key in antemasuratoriDisplayMask) {
          //check key vs antemasuratoriDisplayMask
          //first check if key exists in antemasuratoriDisplayMask
          if (Object.keys(object).includes(key)) {
            //check if visible
            if (antemasuratoriDisplayMask[key].visible) {
              var td = document.createElement('td')
              td.innerHTML =
                typeof object[key] === 'number' ? parseFloat(object[key]) : object[key] ? object[key] : ''
              if (key == _cantitate_oferta || key == _cantitate_antemasuratori) {
                td.style.fontWeight = 'bold'
              }
              //cantitate antemasuratori contenteditable
              if (key == _cantitate_antemasuratori) {
                let customClass = _cantitate_antemasuratori
                td.spellcheck = false
                td.classList.add('border', 'text-primary')
                td.classList.add(customClass)
                td.style.borderColor = 'lightgray'
                //add blur (focusout) event
                td.addEventListener('focusout', function (e) {
                  const index = e.target.parentElement.id
                  console.log('index tr antemasuratori', index)
                  setDsAntemasuratoriValue(index, _cantitate_antemasuratori, parseFloat(e.target.textContent))
                  updateAntemasuratoare(index, parseFloat(e.target.textContent))
                })

                //add keydown event arrow up/down to move to prior/next td _cantitate_antemasuratori
                td.addEventListener('keydown', function (e) {
                  if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    var index = Array.from(
                      document
                        .getElementById('my_table_antemasuratori')
                        .shadowRoot.getElementById('tbody_antemasuratori')
                        .querySelectorAll('.' + _cantitate_antemasuratori)
                    ).indexOf(e.target)
                    if (index > 0) {
                      var tds = document
                        .getElementById('my_table_antemasuratori')
                        .shadowRoot.getElementById('tbody_antemasuratori')
                        .querySelectorAll('.' + _cantitate_antemasuratori)
                      tds[index - 1].focus()
                    }
                  }
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    var index = Array.from(
                      document
                        .getElementById('my_table_antemasuratori')
                        .shadowRoot.getElementById('tbody_antemasuratori')
                        .querySelectorAll('.' + _cantitate_antemasuratori)
                    ).indexOf(e.target)
                    if (index < ds_antemasuratori.length - 1) {
                      var tds = document
                        .getElementById('my_table_antemasuratori')
                        .shadowRoot.getElementById('tbody_antemasuratori')
                        .querySelectorAll('.' + _cantitate_antemasuratori)
                      tds[index + 1].focus()
                    }
                  }
                })

                //select all inner html in cell on focusin
                td.addEventListener('focusin', function (e) {
                  var range = document.createRange()
                  range.selectNodeContents(e.target)
                  var sel = window.getSelection()
                  sel.removeAllRanges()
                  sel.addRange(range)
                })
              }
              //check if RW => td.contentEditable = true
              if (antemasuratoriDisplayMask[key].RW) {
                td.contentEditable = true
              }
              tr.appendChild(td)
            }
          }
        }
      })

      return html`${table}`
    }
  }
}
