import { LitElement, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js'
import {
  newTree,
  addOnChangeEvt,
  delimiter,
  ierarhii,
  flatFind,
  my_table5,
  selected_ds,
  template,
  my_table1,
  my_table2,
  my_table3,
  my_table4,
  my_table6,
  _start_date,
  _end_date
} from './client.js'
import { context } from './estimari.js'

function addNewEstimare() {
  //delete from ds_estimari all objects with key ds_estimari_flat = [] and ds_estimari_pool = []
  context.ds_estimari = context.ds_estimari.filter((o) => o.ds_estimari_flat.length > 0)

  //active = false for all objects in ds_estimari
  context.ds_estimari.forEach((o) => (o.active = false))
  context.ds_estimari.push({
    createDate: new Date(),
    updateDate: new Date(),
    id: context.ds_estimari.length,
    active: true,
    ds_estimari_pool: [],
    ds_estimari_flat: []
  })
  if (context.getDsEstimariPool().length == 0) {
    //trasform newTree in ds_estimari_pool
    if (newTree.length > 0) {
      context.createNewEstimariPool(newTree)
    } else {
      console.log('newTree is empty, run Antemasuratori first')
      alert('Genereaza antemasuratorile inainte de a genera estimarile')
    }
  }
  context.createNewEstimariFlat()
  addOnChangeEvt(context.getDsEstimariFlat(), delimiter, 'my_table_estimari')
  console.log('context.getDsEstimariPool', context.getDsEstimariPool())
  //console.log('newTree', newTree)
  let selected_options_arr = ierarhii.getValue()
  if (selected_options_arr && selected_options_arr.length > 0) {
    flatFind(selected_options_arr, context.getDsEstimariFlat(), delimiter)
    my_table5.ds = selected_ds
  } else {
    my_table5.ds = context.getDsEstimariFlat()
  }

  console.log('context.getDsEstimariFlat', context.getDsEstimariFlat())
}
const listaEstimariDisplayMask = {
  id: { label: 'ID', visible: false, type: 'number' },
  active: { label: 'Activ', visible: false, type: 'boolean' },
  createDate: { label: 'Creare', visible: true, type: 'date' },
  updateDate: { label: 'Actualizare', visible: true, type: 'date' }
}
//create and export class listaEstimari
export class listaEstimari extends LitElement {
  static properties = {
    ds: { type: Array }
  }

  constructor() {
    super()
    this.ds = []
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(template.content.cloneNode(true))
    console.log('events added to listaEstimari element')
  }

  connectedCallback() {
    super.connectedCallback()
    //console.log('listaEstimari element added to the DOM')
  }

  render() {
    console.log('rendering listaEstimari element with following array', this.ds, 'added at', new Date())

    if (!this.ds || this.ds.length == 0) {
      let div = document.createElement('div')
      div.classList.add('container')
      let h3 = document.createElement('h3')
      h3.classList.add('text-center')
      h3.classList.add('text-danger')
      h3.innerHTML = 'No data'
      div.appendChild(h3)
      let button = document.createElement('button')
      button.classList.add('btn', 'btn-primary-sm')
      //add plus icon
      let plus_icon = document.createElement('i')
      plus_icon.classList.add('bi', 'bi-plus-square')
      plus_icon.classList.add('text-primary')
      button.appendChild(plus_icon)
      button.onclick = addNewEstimare
      div.appendChild(button)
      return html`${div}`
    } else {
      //add table
      var table = document.createElement('table')
      table.classList.add('table')
      table.classList.add('table-sm')
      table.classList.add('table-hover')
      //table.classList.add('table-mobile-responsive');
      table.id = 'table_lista_estimari'
      //font size
      table.style.fontSize = 'small'
      //get or create thead and tbody
      var tbody = document.createElement('tbody')
      tbody.id = 'tbody_lista_estimari'
      table.appendChild(tbody)
      //add thead
      var thead = document.createElement('thead')
      thead.id = 'thead_lista_estimari'
      thead.classList.add('align-middle')
      table.appendChild(thead)
      var tr = document.createElement('tr')
      thead.appendChild(tr)
      //append counter
      var th = document.createElement('th')
      th.scope = 'col'
      tr.appendChild(th)
      //add add icon
      var th = document.createElement('th')
      th.scope = 'col'
      //add icon
      var plus_icon = document.createElement('i')
      plus_icon.classList.add('bi')
      plus_icon.classList.add('bi-plus-square')
      plus_icon.classList.add('text-primary')
      plus_icon.style.cursor = 'pointer'
      plus_icon.onclick = addNewEstimare
      th.appendChild(plus_icon)
      tr.appendChild(th)
      for (let [key, value] of Object.entries(listaEstimariDisplayMask)) {
        let label = value.label
        let visible = value.visible
        let th = document.createElement('th')
        if (!visible) {
          th.classList.add('d-none')
        }
        th.scope = 'col'
        th.innerHTML = label ? label : key
        tr.appendChild(th)
      }

      //add start and stop
      var th = document.createElement('th')
      th.scope = 'col'
      th.innerHTML = 'Start'
      tr.appendChild(th)
      var th = document.createElement('th')
      th.scope = 'col'
      th.innerHTML = 'Stop'
      tr.appendChild(th)

      //add tbody
      for (let i = 0; i < this.ds.length; i++) {
        let tr = document.createElement('tr')
        tbody.appendChild(tr)
        //add counter
        let td = document.createElement('td')
        td.innerHTML = i + 1
        tr.appendChild(td)
        //add thrash icon
        let td2 = document.createElement('td')
        let trash = document.createElement('i')
        trash.classList.add('bi')
        trash.classList.add('bi-trash')
        trash.classList.add('text-danger')
        trash.style.cursor = 'pointer'
        trash.onclick = () => {
          //delete ds[i]
          //remove tr from tbody
          let id = tr.getAttribute('data-id')
          if (id) {
            delete ds[id]
            let tr = document
              .getElementById('table_lista_estimari')
              .shadowRoot.getElementById('tbody_lista_estimari')
              .querySelector('tr[data-id="' + id + '"]')
            tr.remove()
          }
        }
        td2.appendChild(trash)
        tr.appendChild(td2)
        for (let key in this.ds[i]) {
          //check with listaEstimariDisplayMask
          if (!Object.keys(listaEstimariDisplayMask).includes(key)) {
            continue
          }
          //visibility
          if (!listaEstimariDisplayMask[key].visible) {
            continue
          }
          let td = document.createElement('td')
          if (listaEstimariDisplayMask[key].type === 'date') {
            //td.innerHTML = add human readable date and time. from "2024-08-05T13:05:08.428Z" to "5 august 2024, 13:05"
            let date = new Date(this.ds[i][key])
            td.innerHTML = date.toLocaleDateString('ro-RO', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          } else if (listaEstimariDisplayMask[key].type === 'boolean') {
            //add icon
            let icon = document.createElement('i')
            icon.classList.add('bi')
            icon.classList.add(this.ds[i][key] ? 'bi-check' : 'bi-x')
            icon.classList.add(this.ds[i][key] ? 'text-success' : 'text-danger')
            td.appendChild(icon)
          } else {
            td.innerHTML = this.ds[i][key] || ''
          }
          td.classList.add(key)
          //add attribute data-id
          tr.setAttribute('data-id', this.ds[i].id)
          tr.appendChild(td)
        }
        //add on click event for each row
        //load my_table5 with the selected o.ds_estimari_flat
        tr.onclick = function () {
          //get attribute data-id from tr
          let id = tr.getAttribute('data-id') || null
          if (id) {
            let ds = context.ds_estimari[id].ds_estimari_flat
            //set active false for all ds_estimari
            context.ds_estimari.forEach(function (o) {
              o.active = false
            })
            my_table1.style.display = 'none'
            my_table2.style.display = 'none'
            my_table3.style.display = 'none'
            my_table4.style.display = 'none'
            my_table5.style.display = 'block'
            my_table6.style.display = 'none'
            context.ds_estimari[id].active = true
            my_table5.ds = ds
          } else {
            console.log('id not found')
          }
        }
        try {
          //add start estimare column from this.ds[0].ds_estimari_flat.row[0][_start_date]
          let td3 = document.createElement('td')
          td3.innerHTML = this.ds[i].ds_estimari_flat[0][_start_date]
          tr.appendChild(td3)
          //add end estimare column from this.ds[0].ds_estimari_flat.row[0][_end_date]
          let td4 = document.createElement('td')
          td4.innerHTML = this.ds[i].ds_estimari_flat[0][_end_date]
          tr.appendChild(td4)
        } catch (e) {
          console.log(e)
        }
        tbody.appendChild(tr)
      }
    }

    return html`${table}`
  }
}
