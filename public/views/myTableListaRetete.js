import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js'
import { template, theadIsSet } from '../client.js'

export class myTableListaRetete extends LitElement {
  static properties = {
    data: { type: Array }
  }

  constructor() {
    super()
    this.data = []
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(template.content.cloneNode(true))
  }

  render() {
    //No data
    if (!this.data || this.data.length == 0) {
      return html`<p class="label label-danger">No data</p>`
    } else {
      //add table
      var table = document.createElement('table')
      table.classList.add('table')
      table.classList.add('table-sm')
      table.classList.add('table-hover')
      table.classList.add('table-responsive')
      table.id = 'table_lista_retete'
      //font size
      table.style.fontSize = 'small'
      //get or create thead and tbody
      var thead = document.createElement('thead')
      thead.id = 'thead_lista_retete'
      thead.classList.add('align-middle')
      var tbody = document.createElement('tbody')
      tbody.id = 'tbody_lista_retete'
      if (theadIsSet) {
        //add thead
        table.appendChild(thead)
      }
      //add tbody
      for (let i = 0; i < this.data.length; i++) {
        let idReteta = this.data[i].id
        let reteta = this.data[i].reteta
        //add table reteta to tbody
        let tblReteta = document.createElement('table')
        tblReteta.classList.add('table')
        tblReteta.classList.add('table-sm')
        tblReteta.classList.add('table-hover')
        tblReteta.classList.add('table-responsive')
        tblReteta.id = idReteta
        //font size
        tblReteta.style.fontSize = 'small'
        let theadReteta = document.createElement('thead')
        theadReteta.id = 'thead_' + idReteta
        let tbodyReteta = document.createElement('tbody')
        tbodyReteta.id = 'tbody_' + idReteta
        for (let j = 0; j < reteta.length; j++) {
          let activitate = reteta[j].object
          //add activitate to header reteta
          let thActivitate = document.createElement('th')
          thActivitate.textContent = activitate.DENUMIRE_ARTICOL_OFERTA
          theadReteta.appendChild(thActivitate)
          let subarticole = activitate.children
          for (let k = 0; k < subarticole.length; k++) {
            let subarticol = subarticole[k].object
            //add subarticol to tbody reteta
            let tr = document.createElement('tr')
            //append counter
            let td = document.createElement('td')
            td.textContent = k + 1
            tr.appendChild(td)
            //append subarticol
            let tdSubarticol = document.createElement('td')
            tdSubarticol.textContent = subarticol.DENUMIRE_ARTICOL_OFERTA
            tr.appendChild(tdSubarticol)
            tbodyReteta.appendChild(tr)
          }
          tblReteta.appendChild(theadReteta)
          tblReteta.appendChild(tbodyReteta)
          table.appendChild(tblReteta)
        }
      }
      table.appendChild(tbody)
      return html`${table}`
    }
  }
}
