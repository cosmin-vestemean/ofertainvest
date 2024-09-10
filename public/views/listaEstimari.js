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
  /* cleanupEstimari()

  //la prima estimare pot presupune ca ai inceput sa creezi estimari fiindca ai antemasuratorile dimensionate, deci le salvez in baza de date
  if (context.ds_estimari.length == 0) {
    let result = saveAntemasuratoriAndTreeToDB()
    console.log('result', result)
  }

  //active = false for all objects in ds_estimari
  context.ds_estimari.forEach((o) => (o.active = false))
  //create new empty object in ds_estimari
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
  //zero out _start_date and _end_date and _cantitate_estimari in pool
  for (let instanta of Object.values(context.getDsEstimariPool())) {
    for (let ramura of Object.values(instanta)) {
      for (let activitate of Object.values(ramura)) {
        activitate.row_data[_start_date] = '';
        activitate.row_data[_end_date] = '';
        activitate.row_data[_cantitate_estimari] = 0;
      }
    }
  }
    
  context.createNewEstimariFlat()
  context.ds_estimari[context.ds_estimari.length - 1].ds_estimari_pool = context.getDsEstimariPool()
  context.ds_estimari[context.ds_estimari.length - 1].ds_estimari_flat = context.getDsEstimariFlat()
  addOnChangeEvt(context.getDsEstimariFlat(), delimiter, 'my_table_estimari')
  console.log('context.getDsEstimariPool', context.getDsEstimariPool())
  tables.hideAllBut([tables.my_table5])
  //just to create propperly commit message
  let selected_options_arr = ierarhii.getValue()
  if (selected_options_arr && selected_options_arr.length > 0) {
    flatFind(selected_options_arr, context.getDsEstimariFlat(), delimiter)
    tables.my_table5.element.ds = selected_ds
  } else {
    tables.my_table5.element.ds = context.getDsEstimariFlat()
  }

  console.log('context.getDsEstimariFlat', context.getDsEstimariFlat()) */

  /*
  select a.cccinstante,
	d.duplicateof,
	c.id,
	a.cccactivitinstante,
	b.cccactivitretete,
	a.cccoferteweblinii,
	e.cccantemasuratori,
	e.cccpaths,
	e.cantitate
from cccactivitinstante a
	inner join cccinstante d on (d.cccinstante = a.cccinstante and d.cccoferteweb=a.cccoferteweb)
	left join cccactivitretete b on (a.cccoferteweblinii = b.cccoferteweblinii and a.cccoferteweb=b.cccoferteweb)
	left join cccretete c on (c.cccretete = b.cccretete and c.cccoferteweb=b.cccoferteweb)
	inner join cccantemasuratori e on ( e.cccactivitinstante=a.cccactivitinstante and e.cccoferteweb=a.cccoferteweb)
	inner join cccpaths f on (f.cccpaths=e.cccpaths and f.cccoferteweb=e.cccoferteweb)
where a.cccoferteweb=1
order by a.cccinstante, d.duplicateof, a.cccactivitinstante, f.path

  */
  const query = `select a.cccinstante,
	d.duplicateof,
	c.id,
	a.cccactivitinstante,
	b.cccactivitretete,
	e.cccantemasuratori,
	e.CCCPATHS,
	e.CANTITATE,
	b.ismain,
	b.iscustom,
	g.*
from cccactivitinstante a
	inner join cccinstante d on (d.cccinstante = a.cccinstante and d.cccoferteweb=a.cccoferteweb)
	left join cccactivitretete b on (a.cccoferteweblinii = b.cccoferteweblinii and a.cccoferteweb=b.cccoferteweb)
	left join cccretete c on (c.cccretete = b.cccretete and c.cccoferteweb=b.cccoferteweb)
	inner join cccantemasuratori e on ( e.cccactivitinstante=a.cccactivitinstante and e.cccoferteweb=a.cccoferteweb)
	inner join cccpaths f on (f.cccpaths=e.cccpaths and f.cccoferteweb=e.cccoferteweb)
  left join cccoferteweblinii g on (g.cccoferteweblinii=a.cccoferteweblinii and g.cccoferteweb=a.cccoferteweb)
where a.cccoferteweb=${contextOferta.CCCOFERTEWEB}
order by a.cccinstante, d.duplicateof, a.cccactivitinstante, f.path`

  const response = await client.service('getDataset').find({
    query: {
      sqlQuery: query
    }
  })
  console.log('response', response)

  let ds = response.data

  /*
  exemplu de ds
  cccinstante	duplicateof	id	cccactivitinstante	cccactivitretete	cccantemasuratori	cccpaths	cantitate	ismain	iscustom
1	0	0	1	1	2	7	60.0	1	0
1	0	0	1	1	3	8	20.0	1	0
1	0	0	1	1	1	6	20.0	1	0
1	0	0	2	2	5	7		0	0
1	0	0	2	2	6	8		0	0
1	0	0	2	2	4	6		0	0
1	0	0	3	3	8	7		0	0
1	0	0	3	3	9	8		0	0
1	0	0	3	3	7	6		0	0
2	1	1	4	4	11	7		1	0
2	1	1	4	4	12	8		1	0
2	1	1	4	4	10	6		1	0
3	2	2	5	5	14	7		1	0
3	2	2	5	5	15	8		1	0
3	2	2	5	5	13	6		1	0
4	0		6		17	7			
4	0		6		18	8			
4	0		6		16	6			
4	0		7		20	7			
4	0		7		21	8			
4	0		7		19	6			
4	0		8		23	7			
4	0		8		24	8			
4	0		8		22	6			
5	0		9		26	7			
5	0		9		27	8			
5	0		9		25	6			
5	0		10		29	7			
5	0		10		30	8			
5	0		10		28	6			
5	0		11		32	7			
5	0		11		33	8			
5	0		11		31	6			
6	0		12		35	7			
6	0		12		36	8			
6	0		12		34	6			
6	0		13		38	7			
6	0		13		39	8			
6	0		13		37	6			
6	0		14		41	7			
6	0		14		42	8			
6	0		14		40	6			
7	6	6	15	6	43	1		1	0
8	7	7	16	7	44	3		1	0
8	7	7	17	8	45	3		0	0
8	7	7	18	9	46	3		0	0
8	7	7	19	10	47	3		0	0
8	7	7	20	11	48	3		0	0
8	7	7	21	12	49	3		0	0
8	7	7	22	13	50	3		0	0
8	7	7	23	14	51	3		0	0
8	7	7	24	15	52	3		0	0
9	8	8	25	16	53	3		1	0
10	8		26		54	3			
*/

  //pseduo code
  //1. pentru fiecare duplicateof
  //2. pentru fiecare cccinstante
  //3. gsseste-o pe cea care are cccactivitretete not null
  //4. gaseste-le pe cele care au cccactivitretete null si aplica-le cccactivitretete din cea gasita la pasul 3 (sunt instantele duplicate ale aceleasi retete)
  //5. la fel si ismain si iscustom

  //astfel rezultand
  /*
cccinstante	duplicateof	id	cccactivitinstante	cccactivitretete	cccantemasuratori	cccpaths	cantitate	ismain	iscustom
1	0	0	1	1	2	7	60.0	1	0
1	0	0	1	1	3	8	20.0	1	0
1	0	0	1	1	1	6	20.0	1	0
1	0	0	2	2	5	7		0	0
1	0	0	2	2	6	8		0	0
1	0	0	2	2	4	6		0	0
1	0	0	3	3	8	7		0	0
1	0	0	3	3	9	8		0	0
1	0	0	3	3	7	6		0	0
4	0		6	1	17	7		1	0
4	0		6	1	18	8		1	0
4	0		6	1	16	6		1	0
4	0		7	2	20	7		0	0
4	0		7	2	21	8		0	0
4	0		7	2	19	6		0	0
4	0		8	3	23	7		0	0
4	0		8	3	24	8		0	0
4	0		8	3	22	6		0	0
5	0		9	1	26	7		1	0
5	0		9	1	27	8		1	0
5	0		9	1	25	6		1	0
5	0		10	2	29	7		0	0
5	0		10	2	30	8		0	0
5	0		10	2	28	6		0	0
5	0		11	3	32	7		0	0
5	0		11	3	33	8		0	0
5	0		11	3	31	6		0	0
6	0		12	1	35	7		1	0
6	0		12	1	36	8		1	0
6	0		12	1	34	6		1	0
6	0		13	2	38	7		0	0
6	0		13	2	39	8		0	0
6	0		13	2	37	6		0	0
6	0		14	3	41	7		0	0
6	0		14	3	42	8		0	0
6	0		14	3	40	6		0	0
2	1	1	4	4	11	7		1	0
2	1	1	4	4	12	8		1	0
2	1	1	4	4	10	6		1	0
3	2	2	5	5	14	7		1	0
3	2	2	5	5	15	8		1	0
3	2	2	5	5	13	6		1	0
7	6	6	15	6	43	1		1	0
8	7	7	16	7	44	3		1	0
8	7	7	17	8	45	3		0	0
8	7	7	18	9	46	3		0	0
8	7	7	19	10	47	3		0	0
8	7	7	20	11	48	3		0	0
8	7	7	21	12	49	3		0	0
8	7	7	22	13	50	3		0	0
8	7	7	23	14	51	3		0	0
8	7	7	24	15	52	3		0	0
9	8	8	25	16	53	3		1	0
10	8		26	16	54	3		1	0
*/

  let new_ds = []

  //1. pentru fiecare duplicateof
  let duplicateof = [...new Set(ds.map((o) => o.duplicateof))]
  console.log('duplicateof', duplicateof)

  for (let i = 0; i < duplicateof.length; i++) {
    //2. pentru fiecare cccinstante
    let cccinstante = ds.filter((o) => o.duplicateof == duplicateof[i])
    console.log('cccinstante', cccinstante)

    //3. gsseste-o pe cea care are cccactivitretete not null
    let cccinstanteCuActivitateReteta = cccinstante.filter((o) => o.cccactivitretete)
    console.log('cccactivitretete', cccinstanteCuActivitateReteta)

    //4. gaseste-le pe cele care au cccactivitretete null si aplica-le cccactivitretete din cea gasita la pasul 3 (sunt instantele duplicate ale aceleasi retete)
    let cccinstanteFaraActivitateReteta = cccinstante.filter((o) => !o.cccactivitretete)

    //group cccinstanteFaraActivitateReteta by cccinstante and loop through groups and apply cccactivitretete from cccinstanteCuActivitateReteta
    let grouped = Object.values(
      cccinstanteFaraActivitateReteta.reduce((acc, cur) => {
        if (!acc[cur.cccinstante]) acc[cur.cccinstante] = []
        acc[cur.cccinstante].push(cur)
        return acc
      }, {})
    )

    console.log('grouped', grouped)

    for (let j = 0; j < grouped.length; j++) {
      let cccinstanteFaraActivitateReteta = grouped[j]
      for (let k = 0; k < cccinstanteFaraActivitateReteta.length; k++) {
          cccinstanteFaraActivitateReteta[k].cccactivitretete =
            cccinstanteCuActivitateReteta[k].cccactivitretete
          cccinstanteFaraActivitateReteta[k].ismain = cccinstanteCuActivitateReteta[k].ismain
          cccinstanteFaraActivitateReteta[k].iscustom = cccinstanteCuActivitateReteta[k].iscustom
          //id
          cccinstanteFaraActivitateReteta[k].id = cccinstanteCuActivitateReteta[k].id
      }
    }

    console.log('cccinstanteFaraActivitateReteta', cccinstanteFaraActivitateReteta)

    new_ds.push(...cccinstanteCuActivitateReteta, ...cccinstanteFaraActivitateReteta)
  }

  console.log('new_ds', new_ds)

  let transf = convertDBAntemasuratori(new_ds)

  //zero out _start_date and _end_date and _cantitate_estimari in pool
  for (let i = 0; i < transf.length; i++) {
    let o = transf[i]
    o[_cantitate_estimari_anterioare] = 0
    o[_cantitate_estimari] = 0
    o[_start_date] = ''
    o[_end_date] = ''
  }

  let ds_estimari_pool = [...transf]

  console.log('ds_estimari_pool', ds_estimari_pool)

  tables.hideAllBut([tables.my_table5])
  tables.my_table5.element.ds = ds_estimari_pool
}

let listaEstimariDisplayMask = {
  id: { label: 'ID', visible: false, type: 'number' },
  startDate: { label: 'Start', visible: true, type: 'date' },
  endDate: { label: 'Stop', visible: true, type: 'date' },
  createDate: { label: 'Creata la', visible: true, type: 'date' },
  updateDate: { label: 'Ultima actualizare', visible: true, type: 'date' },
  active: { label: 'Activ', visible: false, type: 'boolean' }
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
            context.setDsEstimariFlat(ds)
            //set active false for all ds_estimari
            context.ds_estimari.forEach(function (o) {
              o.active = false
            })
            tables.hideAllBut([tables.my_table5])
            context.ds_estimari[id].active = true
            tables.my_table5.element.ds = ds
            //CANTITATE_ARTICOL_ESTIMARI_gt_0 checked
            let CANTITATE_ARTICOL_ESTIMARI_gt_0 = tables.my_table5.element.shadowRoot.getElementById(
              'CANTITATE_ARTICOL_ESTIMARI_gt_0'
            )
            if (CANTITATE_ARTICOL_ESTIMARI_gt_0) CANTITATE_ARTICOL_ESTIMARI_gt_0.click()
          } else {
            console.log('id not found')
          }
        }
        tbody.appendChild(tr)
      }
    }

    return html`${table}`
  }
}
function cleanupEstimari() {
  //delete from ds_estimari all objects with key ds_estimari_flat = [] and ds_estimari_pool = []
  context.ds_estimari = context.ds_estimari.filter((o) => o.ds_estimari_flat.length > 0)
}
