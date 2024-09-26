import { LitElement, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js'
import {
  addOnChangeEvt,
  delimiter,
  ierarhii,
  flatFind,
  _start_date,
  _end_date,
  template,
  contextOferta,
  client,
  DBtoWBS
} from '../client.js'
import { tables } from '../utils/tables.js'
import { context } from '../controllers/estimari.js'
import { runSQLTransaction, saveAntemasuratoriAndTreeToDB } from '../utils/S1.js'
import { newTree } from '../controllers/antemasuratori.js'
import { _cantitate_estimari } from '../utils/_cantitate_oferta.js'
import { convertDBAntemasuratori } from '../controllers/antemasuratori.js'
import { _cantitate_estimari_anterioare } from '../utils/_cantitate_oferta.js'

export async function addNewEstimare() {
  const query = `select a.CCCINSTANTE,
	d.DUPLICATEOF,
	c.id,
	a.CCCACTIVITINSTANTE,
	b.CCCACTIVITRETETE,
	e.CCCANTEMASURATORI,
	e.CCCPATHS,
	e.CANTITATE,
	b.ISMAIN,
	b.ISCUSTOM,
	g.*
from CCCACTIVITINSTANTE a
	inner join CCCINSTANTE d on (d.CCCINSTANTE = a.CCCINSTANTE and d.cccoferteweb=a.cccoferteweb)
	left join CCCACTIVITRETETE b on (a.cccoferteweblinii = b.cccoferteweblinii and a.cccoferteweb=b.cccoferteweb)
	left join cccretete c on (c.cccretete = b.cccretete and c.cccoferteweb=b.cccoferteweb)
	inner join CCCANTEMASURATORI e on ( e.CCCACTIVITINSTANTE=a.CCCACTIVITINSTANTE and e.cccoferteweb=a.cccoferteweb)
	inner join cccpaths f on (f.cccpaths=e.cccpaths and f.cccoferteweb=e.cccoferteweb)
  left join cccoferteweblinii g on (g.cccoferteweblinii=a.cccoferteweblinii and g.cccoferteweb=a.cccoferteweb)
where a.cccoferteweb=${contextOferta.CCCOFERTEWEB}
order by d.DUPLICATEOF, a.CCCINSTANTE, f.path, a.CCCACTIVITINSTANTE`

  const response = await client.service('getDataset').find({
    query: {
      sqlQuery: query
    }
  })
  console.log('response', response)

  let ds = response.data

  let new_ds = []

  //1. pentru fiecare DUPLICATEOF
  let DUPLICATEOF = [...new Set(ds.map((o) => o.DUPLICATEOF))]
  console.log('DUPLICATEOF', DUPLICATEOF)

  for (let i = 0; i < DUPLICATEOF.length; i++) {
    //2. pentru fiecare CCCINSTANTE
    let CCCINSTANTE = ds.filter((o) => o.DUPLICATEOF == DUPLICATEOF[i])
    console.log('CCCINSTANTE', CCCINSTANTE)

    //3. gsseste-o pe cea care are CCCACTIVITRETETE not null
    let cccinstantaCuActivitateReteta = CCCINSTANTE.filter((o) => o.CCCACTIVITRETETE)
    console.log('CCCACTIVITRETETE', cccinstantaCuActivitateReteta)

    new_ds.push(...cccinstantaCuActivitateReteta)

    //4. gaseste-le pe cele care au CCCACTIVITRETETE null si aplica-le CCCACTIVITRETETE din cea gasita la pasul 3 (sunt instantele duplicate ale aceleasi retete)
    let cccinstanteFaraActivitateReteta = CCCINSTANTE.filter((o) => !o.CCCACTIVITRETETE)

    //group cccinstanteFaraActivitateReteta by CCCINSTANTE and loop through groups and apply CCCACTIVITRETETE from cccinstantaCuActivitateReteta
    let grouped = Object.values(
      cccinstanteFaraActivitateReteta.reduce((acc, cur) => {
        if (!acc[cur.CCCINSTANTE]) acc[cur.CCCINSTANTE] = []
        acc[cur.CCCINSTANTE].push(cur)
        return acc
      }, {})
    )

    console.log('grouped', grouped)

    for (let j = 0; j < grouped.length; j++) {
      let cccinstantaFaraActivitateReteta = grouped[j]
      for (let k = 0; k < cccinstantaFaraActivitateReteta.length; k++) {
        cccinstantaFaraActivitateReteta[k].CCCACTIVITRETETE =
          cccinstantaCuActivitateReteta[k].CCCACTIVITRETETE
        cccinstantaFaraActivitateReteta[k].ISMAIN = cccinstantaCuActivitateReteta[k].ISMAIN
        cccinstantaFaraActivitateReteta[k].ISCUSTOM = cccinstantaCuActivitateReteta[k].ISCUSTOM
        //id
        cccinstantaFaraActivitateReteta[k].id = cccinstantaCuActivitateReteta[k].id
      }

      console.log('cccinstantaFaraActivitateReteta', cccinstantaFaraActivitateReteta)

      new_ds.push(...cccinstantaFaraActivitateReteta)
    }
  }

  console.log('new_ds', new_ds)

  let ds_estimari_pool = await convertDBAntemasuratori(new_ds)

  //zero out _start_date and _end_date and _cantitate_estimari in pool
  for (let i = 0; i < ds_estimari_pool.length; i++) {
    let o = ds_estimari_pool[i]
    o[_cantitate_estimari_anterioare] = 0
    o[_cantitate_estimari] = 0
    o[_start_date] = ''
    o[_end_date] = ''
    o['ROW_SELECTED'] = true
  }

  context.ds_estimari_pool = ds_estimari_pool

  console.log('ds_estimari_pool', ds_estimari_pool)

  //extrage din CCCACTIVITESTIMARI suma estimarilor anterioare dupa criteriul CCCOFETEWEB, CCCANTEMASURATORI si adauga la ds_estimari_pool: _cantitate_estimari_anterioare
  const query2 = `select CCCOFERTEWEB, CCCANTEMASURATORI, sum(CANTITATE) as CANTITATE_ESTIMARI_ANTERIOARE from CCCACTIVITESTIMARI where CCCOFERTEWEB=${contextOferta.CCCOFERTEWEB} group by CCCOFERTEWEB, CCCANTEMASURATORI`
  const response2 = await client.service('getDataset').find({
    query: {
      sqlQuery: query2
    }
  })

  let ds_estimari_ant = response2.data
  console.log('ds_estimari_ant', ds_estimari_ant)

  for (let i = 0; i < ds_estimari_ant.length; i++) {
    let o = ds_estimari_ant[i]
    let ant = ds_estimari_pool.find((o2) => o2.CCCANTEMASURATORI == o.CCCANTEMASURATORI)
    if (ant) {
      ant[_cantitate_estimari_anterioare] = o.CANTITATE_ESTIMARI_ANTERIOARE
    } else {
      console.log('ant not found', o)
    }
  }

  //hide all tables except my_table5
  tables.hideAllBut([tables.my_table5])
  tables.my_table5.element.ds = context.ds_estimari_pool
}

let listaEstimariDisplayMask = {
  CCCESTIMARI: { label: 'ID', visible: false, type: 'number' },
  NAME: { label: 'Denumire', visible: true, type: 'string' },
  DATASTART: { label: 'Start', visible: true, type: 'date' },
  DATASTOP: { label: 'Stop', visible: true, type: 'date' }
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

  render() {
    console.log('rendering listaEstimari element with following array', this.ds, 'added at', new Date())

    if (!this.ds || this.ds.length == 0) {
      let div = document.createElement('div')
      div.classList.add('d-flex', 'justify-content-around')
      let h3 = document.createElement('h3')
      h3.classList.add('text-center')
      h3.classList.add('text-danger')
      h3.innerHTML = 'No data'
      div.appendChild(h3)
      let button = document.createElement('button')
      button.classList.add('btn', 'btn-primary-sm')
      //add plus icon
      let plus_icon = document.createElement('i')
      plus_icon.classList.add('bi', 'bi-plus-square', 'fs-4')
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

      //add tbody
      for (let i = 0; i < this.ds.length; i++) {
        //create tr
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
            delete this.ds[id]
            let tr = document
              .getElementById('my_table_lista_estimari')
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
          tr.setAttribute('data-id', this.ds[i].CCCESTIMARI)
          tr.appendChild(td)
        }
        //add on click event for each row
        //load my_table5 with the selected o.ds_estimari_flat
        tr.onclick = async () => {
          let id = tr.getAttribute('data-id') || null
          console.log('id', id)
          if (id) {
            //getDataset from CCCACTIVITESTIMARI
            let query = `select j.*, 	*
from CCCANTEMASURATORI a
	inner join cccpaths b on (a.cccpaths = b.cccpaths)
	inner join cccoferteweblinii c on (c.cccoferteweblinii = a.cccoferteweblinii)
	inner join CCCINSTANTE d on (d.CCCINSTANTE = a.CCCINSTANTE)
	inner join cccretete h on (h.id = d.DUPLICATEOF)
	INNER JOIN CCCACTIVITINSTANTE G ON (
		G.CCCINSTANTE = D.CCCINSTANTE
		AND G.CCCACTIVITINSTANTE = A.CCCACTIVITINSTANTE
	)
	left join CCCACTIVITRETETE i on (
		i.CCCRETETE = h.cccretete
		AND i.cccoferteweblinii = a.cccoferteweblinii
	)
	left join CCCACTIVITESTIMARI j ON (
		j.CCCANTEMASURATORI = a.CCCANTEMASURATORI
	)
	inner join CCCESTIMARI k ON (
		k.CCCESTIMARI = j.CCCESTIMARI
	)
	WHERE a.CCCOFERTEWEB = ${contextOferta.CCCOFERTEWEB}
   and k.CCCESTIMARI = ${id}
order by A.CCCINSTANTE,
	d.DUPLICATEOF,
	A.CCCACTIVITINSTANTE,
	b.path;`
            try {
              const response = await client.service('getDataset').find({
                query: {
                  sqlQuery: query
                }
              })
              console.log('response', response)
              if (!response.success) {
                alert('Error fetching dataset\nWork in progress')
                return
              }
              let ds = response.data
              console.log('ds', ds)
              const transf = await convertDBAntemasuratori(ds)
              console.log('transf', transf)
              // add row_selected to each object
              for (let i = 0; i < transf.length; i++) {
                transf[i].ROW_SELECTED = true
              }
              // hide all tables except my_table5
              tables.hideAllBut([tables.my_table5])
              tables.my_table5.element.ds = transf
            } catch (error) {
              console.error('Error fetching dataset:', error)
            }
          } else {
            console.log('id not found')
          }
        }
        tbody.appendChild(tr)
      }

      var timeline = document.createElement('div')
      timeline.id = 'estimari_timeline'
      var title1 = document.createElement('h5')
      title1.innerHTML = 'Lista'
      var title2 = document.createElement('h5')
      title2.innerHTML = 'Gantt'
    }

    return html`${title1}${table}${title2}${timeline}`
  }
}
