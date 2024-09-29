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
    return html`can you see me?`
  }

  //class methods
    //add a new row to the table
    addRow() {}

    //delete selected rows
    deleteRows() {}

    //select all rows
    selectAll() {}

    //deselect all rows
    deselectAll() {}
}

export { LitwcCantitatePersoana }