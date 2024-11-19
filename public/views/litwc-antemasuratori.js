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
      return html`
        <div class="container-fluid">
          <table class="table table-sm is-responsive" style="font-size: small;">
            <thead>
              <tr>
                <th></th>
                ${Object.keys(antemasuratoriDisplayMask).map(
                  (key) => html`<th>${antemasuratoriDisplayMask[key].label || key}</th>`
                )}
              </tr>
            </thead>
            <tbody>
              ${this.ds.map(
                (item, index) => html`
                  <tr data-index="${index}">
                    <td>
                      <i
                        class="bi bi-trash text-danger"
                        style="cursor: pointer;"
                        @click="${() => this.deleteAntemasuratoare(index)}"
                      ></i>
                    </td>
                    ${Object.keys(antemasuratoriDisplayMask).map(
                      (key) =>
                        html`<td contenteditable="${antemasuratoriDisplayMask[key].RW}">
                          ${typeof item[key] === 'number' ? parseFloat(item[key]) : item[key] ? item[key] : ''}
                        </td>`
                    )}
                  </tr>
                `
              )}
            </tbody>
          </table>
        </div>
      `
    }
  }

  deleteAntemasuratoare(index) {
    if (!confirm('Are you sure you want to delete this antemasuratoare?')) {
      return
    }
    console.log('delete antemasuratoare', index)
    deleteAntemasuratore(index)
  }
}

customElements.define('litwc-antemasuratori', antemasuratori)
