import { LitElement, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js'
import { template } from '../client.js'

/*
reprezinta si afiseaza un tabel cu trei coloane: 1. checkbox, 2. nume persoana, 3. cantitate estimata atibuita persoanei
lista persoane: contextOferta.angajati from client.js
*/

class LitwcSelectAntemasuratori extends LitElement {
  static properties = {
    ds: { type: Array }
  }

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(template.content.cloneNode(true))
  }

  connectedCallback() {
    super.connectedCallback()
  }

  render() {}
}

customElements.define('litwc-select-antemasuratori', LitwcSelectAntemasuratori)