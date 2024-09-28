import { LitElement, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js'
import { template, _start_date, _end_date, theadIsSet, _nivel_oferta, contextOferta } from '../client.js'
import {
  _cantitate_estimari,
  _cantitate_antemasuratori,
  _cantitate_estimari_anterioare
} from '../utils/_cantitate_oferta.js'
import { tables } from '../utils/tables.js'
import { context } from '../controllers/estimari.js'
import { runSQLTransaction, getValFromS1Query } from '../utils/S1.js'
import moment from 'https://unpkg.com/moment@2.29.4/dist/moment.js'
import { ds_antemasuratori } from '../controllers/antemasuratori.js'
import { addNewEstimare } from './listaEstimari.js'

export class estimari extends LitElement {
  //loop through newTree and create a table with columns according to antemasuratoriDisplayMask
  //newTree is an array Arr containing arrays Arr[i]; each Arr[i] contains arrays: one is object ,let's call it Arr1 and one is antemasuratori (Arr2)
  //Arr1 is in a one to many relationship with Arr2
  //find Arr[i] with ISMAIN = true and the value of key "DENUMIRE_ARTICOL_OFERTA" is the name of the representation of Arr[i] (the root)
  //each Arr has a plus/minus icon for unfolding/folding Arr[i]
  //each Arr[i] has a plus/minus icon for unfolding/folding Arr3
  //the keys of interest for representation of object are in antemasuratoriDisplayMask
  //Arr2 contains the following keys: branch, qty
  //every row of the table has two more columns: start date and end date with calendar icons
  static properties = {
    ds: { type: Array }
  }

  constructor() {
    super()
    this.ds = []
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(template.content.cloneNode(true))
    context.estimariDisplayMask[_start_date] = {
      value: _start_date,
      RW: false,
      visible: true,
      label: 'Start<br>estimare',
      type: 'date'
    }

    context.estimariDisplayMask[_end_date] = {
      value: _end_date,
      RW: false,
      visible: true,
      label: 'End<br>estimare',
      type: 'date'
    }

    console.log('events added to estimari element')
  }

  connectedCallback() {
    super.connectedCallback()
    //console.log('estimari element added to the DOM')
  }

  render() {
    console.log('rendering estimari element with following array', this.ds, 'added at', new Date())
    //create a div with buttons for adding new estimari, saving estimari, refreshing estimari, moving to prior/next estimari
    //add buttons
    var buttonsPannel = this.createButtonsPanel()
    var floatingTableFilter = this.createFloatingTableFilter()

    if (!this.ds || this.ds.length == 0) {
      return html`${buttonsPannel}
        <div class="container"><h3 class="text-center text-danger">No data</h3></div>`
    } else {
      //add table
      var table = document.createElement('table')
      table.classList.add('table')
      table.classList.add('table-sm')
      table.classList.add('table-hover')
      //table.classList.add('table-mobile-responsive');
      table.id = 'table_estimari'
      //font size
      table.style.fontSize = 'small'
      //get or create thead and tbody
      var thead = document.createElement('thead')
      thead.id = 'thead_estimari'
      thead.classList.add('align-middle')
      var tbody = document.createElement('tbody')
      tbody.id = 'tbody_estimari'
      if (theadIsSet) {
        tbody.classList.add('table-group-divider')
      }
      table.appendChild(tbody)
      //add thead
      if (theadIsSet) {
        table.appendChild(thead)
        let tr = document.createElement('tr')
        thead.appendChild(tr)
        //add checkbox for main activity
        let th = document.createElement('th')
        th.scope = 'col'
        let checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.id = 'checkbox_all'
        checkbox.classList.add('form-check-input')
        checkbox.checked = false
        th.appendChild(checkbox)
        tr.appendChild(th)
        //append plus/minus icon
        th = document.createElement('th')
        let plus_icon = document.createElement('i')
        plus_icon.classList.add('bi', 'bi-dash-square', 'text-primary', 'fs-6', 'align-middle')
        plus_icon.style.cursor = 'pointer'
        this.toggleExpandAllIcon(plus_icon)
        th.appendChild(plus_icon)
        th.scope = 'col'
        tr.appendChild(th)
        //append counter
        th = document.createElement('th')
        th.scope = 'col'
        tr.appendChild(th)
        let firstLine = this.ds[0]
        for (let key in context.estimariDisplayMask) {
          //check key vs estimariDisplayMask
          //first check if key exists in estimariDisplayMask
          if (Object.keys(firstLine).includes(key)) {
            //check if visible
            if (context.estimariDisplayMask[key].visible) {
              if (context.estimariDisplayMask[key].type !== 'date') {
                let th = document.createElement('th')
                th.scope = 'col'
                th.style.writingMode = 'vertical-rl'
                th.style.rotate = '180deg'
                th.innerHTML = context.estimariDisplayMask[key].label
                  ? context.estimariDisplayMask[key].label
                  : key
                tr.appendChild(th)
              } else {
                //refactor code bellow to a function
                //add start date and end date
                let th = document.createElement('th')
                th.scope = 'col'
                //create type="date" input
                //cerate label
                let label = document.createElement('label')
                label.for = key === _start_date ? 'start_date' : 'end_date'
                label.innerHTML = context.estimariDisplayMask[key].label
                  ? context.estimariDisplayMask[key].label
                  : key
                th.appendChild(label)
                let input1 = document.createElement('input')
                input1.type = 'date'
                input1.id = key === _start_date ? 'start_date' : 'end_date'
                input1.classList.add('form-control', 'form-control-sm')
                input1.value = firstLine[key] || ''
                input1.onchange = this.updateDateInputs(input1)
                th.appendChild(input1)
                tr.appendChild(th)
              }
            }
          }
        }
      }

      //add activitati to table
      let arrayIndex = 0
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

        let CCCPATHS = Object.hasOwnProperty.call(o, 'CCCPATHS') ? o.CCCPATHS : null
        let INITIAL_PATH = Object.hasOwnProperty.call(o, 'INITIAL_PATH') ? o.INITIAL_PATH : null

        let a = CCCANTEMASURATORI ? CCCANTEMASURATORI : arrayIndex
        let b = CCCESTIMARI ? CCCESTIMARI : arrayIndex
        let c = CCCACTIVITESTIMARI ? CCCACTIVITESTIMARI : arrayIndex
        let d = CCCACTIVITESTIMARI ? true : false
        let e = CCCPATHS ? CCCPATHS : arrayIndex
        let f = INITIAL_PATH ? INITIAL_PATH : arrayIndex

        if (ISMAIN) {
          //add main activity row
          this.addTableRow(tbody, instanta, r, counter, counter2, counter3, o, true, a, b, c, d, e, f)
        }
        this.addTableRow(tbody, instanta, r, counter, counter2, counter3, o, false, a, b, c, d, e, f)

        arrayIndex++
      }, this)
    }

    return html`${buttonsPannel}${floatingTableFilter}${table}`
  }

  async addFromAntemasuratori() {
    //get html elem ModalGeneric
    let popup = document.getElementById('ModalGeneric')
    var modal = new bootstrap.Modal(popup)
    var genericContainer = document.getElementById('genericContainer')
    //socate clasa modal-lg si adauga clasa modal-fullscreen
    genericContainer.classList.remove('modal-lg')
    genericContainer.classList.add('modal-fullscreen')
    var modal_body = document.getElementById('modal-body3')
    modal_body.innerHTML = ''
    let litwcSelectAntemasuratori = document.createElement('litwc-select-antemasuratori')
    litwcSelectAntemasuratori.id = 'litwcSelectAntemasuratori'
    await addNewEstimare(false)
    //TODO: nu apela addNewEstimare de fiecare data
    tables.hideAllBut([tables.my_table5])
    //TODO: add event listener to litwcSelectAntemasuratori to update current estimare with selected antemasuratori
    let copy = immer.produce(context.ds_estimari_pool, (draft) => {})
    let articoleOferta = this.ds.filter((o) => o.ISMAIN)
    //remove from copy all rows with articoleOferta.CCCINSTANTE, articoleOferta.CCCPATHS, articoleOferta.CCCANTEMASURATORI, articoleOferta.CCCINSTANTE, articoleOferta.CCCESTIMARI, articoleOferta.CCCACTIVITESTIMARI
    articoleOferta.forEach((articol) => {
      copy = copy.filter(
        (o) =>
          o.CCCINSTANTE !== articol.CCCINSTANTE &&
          o.CCCPATHS !== articol.CCCPATHS &&
          o.CCCANTEMASURATORI !== articol.CCCANTEMASURATORI &&
          o.CCCINSTANTE !== articol.CCCINSTANTE &&
          o.CCCESTIMARI !== articol.CCCESTIMARI &&
          o.CCCACTIVITESTIMARI !== articol.CCCACTIVITESTIMARI
      )
    })
    litwcSelectAntemasuratori.ds = copy
    modal_body.appendChild(litwcSelectAntemasuratori)
    modal.show()
  }

  createButtonsPanel() {
    var buttonsPannel = document.createElement('div')
    buttonsPannel.classList.add('d-flex', 'flex-row', 'justify-content-between', 'align-items-center')
    buttonsPannel.id = 'buttonsPannel'
    //add list icon
    var btnList = document.createElement('div')
    btnList.classList.add('col')
    buttonsPannel.appendChild(btnList)
    var list_icon = document.createElement('i')
    list_icon.classList.add('bi')
    list_icon.classList.add('bi-list-ol', 'text-success', 'fs-4', 'mb-3')
    list_icon.style.cursor = 'pointer'
    list_icon.onclick = function () {
      //btn_estimari click
      let btn_estimari = document.getElementById('btn_estimari')
      btn_estimari.click()
    }
    btnList.appendChild(list_icon)
    buttonsPannel.appendChild(btnList)
    //add plus-square icon
    var btnAdd = document.createElement('div')
    btnAdd.classList.add('col')
    buttonsPannel.appendChild(btnAdd)
    var plus_icon = document.createElement('i')
    plus_icon.classList.add('bi')
    plus_icon.classList.add('bi-plus-square', 'text-primary', 'fs-4', 'mb-3')
    plus_icon.style.cursor = 'pointer'
    //add tooltip
    plus_icon.setAttribute('data-bs-toggle', 'tooltip')
    plus_icon.setAttribute('data-bs-placement', 'top')
    plus_icon.setAttribute('title', 'Adauga din antemasuratori')
    plus_icon.onclick = async () => {
      await this.addFromAntemasuratori()
    }
    btnAdd.appendChild(plus_icon)
    //add validate icon
    var btnValidate = document.createElement('div')
    btnValidate.classList.add('col')
    buttonsPannel.appendChild(btnValidate)
    var validate_icon = document.createElement('i')
    validate_icon.classList.add('bi')
    validate_icon.classList.add('bi-check2', 'text-success', 'fs-4', 'mb-3')
    validate_icon.style.cursor = 'pointer'
    validate_icon.onclick = () => {
      //add class table-danger to table_estimari where _cantitate_estimari is not a number or is 0 and checkboxes are not checked
      var table = document.getElementById('my_table_estimari').shadowRoot.getElementById('table_estimari')
      var tbody = table.getElementsByTagName('tbody')[0]
      var trs = tbody.getElementsByTagName('tr')
      for (let i = 0; i < trs.length; i++) {
        var tds = trs[i].getElementsByTagName('td')
        //get td with class _cantitate_estimari
        var tdEstimari = Array.from(tds).find((o) => o.classList.contains(_cantitate_estimari))
        //_cantitate_antemasuratori
        var tdCantitateAntemasuratori = Array.from(tds).find((o) =>
          o.classList.contains(_cantitate_antemasuratori)
        )
        //antemasuratori - estimari != 0 => add class table-warning
        if (tdEstimari && tdCantitateAntemasuratori) {
          if (parseFloat(tdEstimari.textContent) !== parseFloat(tdCantitateAntemasuratori.textContent)) {
            tdEstimari.classList.add('table-warning')
          } else {
            tdEstimari.classList.remove('table-warning')
          }
        }
        var iputInside = tdRowSelected.getElementsByTagName('input')[0]
        if (tdEstimari) {
          if (
            isNaN(parseFloat(tdEstimari.textContent)) ||
            parseFloat(tdEstimari.textContent) === 0 ||
            !iputInside.checked
          ) {
            tdEstimari.classList.add('table-danger')
            //iputInside.checked = false
          } else {
            tdEstimari.classList.remove('table-danger')
          }
        }
      }
    }
    btnValidate.appendChild(validate_icon)
    //add save icon
    var btnSave = document.createElement('div')
    btnSave.classList.add('col')
    buttonsPannel.appendChild(btnSave)
    var save_icon = document.createElement('i')
    save_icon.id = 'save_icon'
    save_icon.classList.add('bi')
    save_icon.classList.add('bi-save', 'text-success', 'fs-4', 'mb-3')
    save_icon.style.cursor = 'pointer'
    save_icon.style.marginLeft = '5px'
    save_icon.onclick = () => {
      this.filterAndSaveSelectedEstimari()
    }
    btnSave.appendChild(save_icon)
    //add thrahs icon
    var btnTrash = document.createElement('div')
    btnTrash.classList.add('col')
    buttonsPannel.appendChild(btnTrash)
    var trash_icon = document.createElement('i')
    trash_icon.classList.add('bi')
    trash_icon.classList.add('bi-trash', 'text-danger', 'fs-4', 'mb-3')
    trash_icon.style.cursor = 'pointer'
    trash_icon.onclick = function () {}
    btnTrash.appendChild(trash_icon)
    buttonsPannel.appendChild(btnTrash)
    //add plus-square icon
    var btnRefresh = document.createElement('div')
    btnRefresh.classList.add('col')
    buttonsPannel.appendChild(btnRefresh)
    var refresh_icon = document.createElement('i')
    refresh_icon.classList.add('bi')
    refresh_icon.classList.add('bi-arrow-clockwise', 'text-primary', 'fs-4', 'mb-3')
    refresh_icon.style.cursor = 'pointer'
    refresh_icon.style.marginLeft = '5px'
    refresh_icon.onclick = function () {
      //refresh ds_estimari_flat
      context.ds_estimari_flat = context.generateTblRowsFromDsEstimariPool()
      this.ds = context.ds_estimari_flat
      //refresh ds_estimari
      let active = context.ds_estimari.find((o) => o.active)
      if (active) {
        active.ds_estimari_pool = context.ds_estimari_pool
        active.ds_estimari_flat = context.ds_estimari_flat
        active.updateDate = new Date()
      }
    }
    btnRefresh.appendChild(refresh_icon)
    //add forward and backward icons for navigation between estimari
    var btnBack = document.createElement('div')
    btnBack.classList.add('col')
    buttonsPannel.appendChild(btnBack)
    var backward_icon = document.createElement('i')
    backward_icon.classList.add('bi')
    backward_icon.classList.add('bi-arrow-left-circle', 'text-primary', 'fs-4', 'mb-3')
    backward_icon.style.cursor = 'pointer'
    backward_icon.style.marginLeft = '5px'
    backward_icon.onclick = function () {}
    btnBack.appendChild(backward_icon)
    var btnForward = document.createElement('div')
    btnForward.classList.add('col')
    buttonsPannel.appendChild(btnForward)
    var forward_icon = document.createElement('i')
    forward_icon.classList.add('bi')
    forward_icon.classList.add('bi-arrow-right-circle', 'text-primary', 'fs-4', 'mb-3')
    forward_icon.style.cursor = 'pointer'
    forward_icon.style.marginLeft = '5px'
    forward_icon.onclick = function () {}
    btnForward.appendChild(forward_icon)
    buttonsPannel.appendChild(btnForward)
    return buttonsPannel
  }

  async filterAndSaveSelectedEstimari() {
    //filter context.ds_estimari_pool for _cantitate_estimari > 0
    const ds_estimari_pool_filterd = context.ds_estimari_pool.filter(
      (o) => parseFloat(o[_cantitate_estimari]) > 0
    )

    let sqlList = []
    //context.ds_estimari_pool[0].CCCESTIMARI
    let CCCESTIMARI = Object.hasOwnProperty.call(context.ds_estimari_pool[0], 'CCCESTIMARI')
      ? context.ds_estimari_pool[0].CCCESTIMARI
      : null
    let start_date = context.ds_estimari_pool[0][_start_date]
    //use moment.js to format date
    let start_date_formatted = moment(start_date).format('YYYY-MM-DD')
    let end_date = context.ds_estimari_pool[0][_end_date]
    let end_date_formatted = moment(end_date).format('YYYY-MM-DD')
    let right_now = moment().format('DD-MM-YYYY HH:mm:ss')
    let newEstimariId = CCCESTIMARI

    //TODO: update does not work
    if (CCCESTIMARI) {
      //update CCCESTIMARI
      let estimariQuery = `UPDATE CCCESTIMARI SET DATASTART = '${start_date_formatted}', DATASTOP = '${end_date_formatted}' WHERE CCCESTIMARI = ${CCCESTIMARI};`
      sqlList.push(estimariQuery)
    } else {
      // Prepare the SQL query to insert into CCCESTIMARI
      let estimariQuery = `
    INSERT INTO CCCESTIMARI (
      CCCOFERTEWEB, NAME, DATASTART, DATASTOP
    ) VALUES (
      ${contextOferta.CCCOFERTEWEB}, '${right_now}', '${start_date_formatted}', '${end_date_formatted}'
    ); `

      // Execute the query to get the new CCCESTIMARI ID
      let result
      try {
        result = await runSQLTransaction({ sqlList: [estimariQuery] })
      } catch (error) {
        console.error('Error inserting into CCCESTIMARI:', error)
        return
      }

      if (!result.success) {
        console.error('Error inserting into CCCESTIMARI', result)
        return
      }

      //get the new CCCESTIMARI ID
      const newEstimari = await getValFromS1Query(`SELECT IDENT_CURRENT('CCCESTIMARI') as value;`)
      if (!newEstimari.success) {
        console.error('Error getting new CCCESTIMARI ID', newEstimari)
        return
      }
      newEstimariId = newEstimari.value
    }

    // Prepare the SQL queries to insert into CCCACTIVITESTIMARI
    for (let i = 0; i < ds_estimari_pool_filterd.length; i++) {
      let CCCACTIVITESTIMARI = Object.hasOwnProperty.call(ds_estimari_pool_filterd[i], 'CCCACTIVITESTIMARI')
        ? ds_estimari_pool_filterd[i].CCCACTIVITESTIMARI
        : null
      let o = ds_estimari_pool_filterd[i]
      let activitEstimariQuery = !CCCACTIVITESTIMARI
        ? `
      INSERT INTO CCCACTIVITESTIMARI (
        CCCESTIMARI, CCCOFERTEWEB, CCCANTEMASURATORI, CANTITATE, DATASTART, DATASTOP
      ) VALUES (
        ${newEstimariId}, ${contextOferta.CCCOFERTEWEB}, ${o.CCCANTEMASURATORI}, ${o[_cantitate_estimari]}, '${o[_start_date]}', '${o[_end_date]}' );`
        : `UPDATE CCCACTIVITESTIMARI SET CANTITATE = ${o[_cantitate_estimari]}, DATASTART = '${o[_start_date]}', DATASTOP = '${o[_end_date]}' WHERE CCCESTIMARI = ${newEstimariId} AND CCCOFERTEWEB = ${contextOferta.CCCOFERTEWEB} AND CCCANTEMASURATORI = ${o.CCCANTEMASURATORI} and CCCACTIVITESTIMARI = ${o.CCCACTIVITESTIMARI};`
      sqlList.push(activitEstimariQuery)
    }

    // Execute the SQL queries
    try {
      const result = await runSQLTransaction({ sqlList: sqlList })
      if (result.success) {
        console.log('Estimations saved successfully:', result)
      } else {
        console.error('Error saving estimations:', result)
      }
    } catch (error) {
      console.error('Error saving estimations:', error)
    }
  }

  toggleExpandAllIcon(plus_icon) {
    plus_icon.onclick = function () {
      //show hide all children, identified by same id and a "_some_number"
      //change icon
      if (plus_icon.classList.contains('bi-dash-square')) {
        plus_icon.classList.remove('bi-dash-square')
        plus_icon.classList.add('bi-plus-square')
      } else {
        plus_icon.classList.remove('bi-plus-square')
        plus_icon.classList.add('bi-dash-square')
      }
    }
  }

  createFloatingTableFilter() {
    //a box with filters for table designed as a floating div with radio buttons
    //1. only rows with _cantitate_estimari > 0
    //2. only rows with _cantitate_estimari = 0
    //3. only rows with _cantitate_estimari != _cantitate_antemasuratori
    //4. only rows with _cantitate_estimari = _cantitate_antemasuratori

    let floatingTableFilter = document.createElement('div')
    //radio buttons are stacked vertically4
    //panel floats on the right side of the table, scroll independent
    floatingTableFilter.classList.add(
      'd-flex',
      'flex-column',
      'position-fixed',
      'top-50',
      'end-0',
      'p-2',
      'bg-light',
      'border',
      'rounded'
    )
    //add radio buttons
    let div1 = document.createElement('div')
    div1.classList.add('form-check')
    floatingTableFilter.appendChild(div1)
    let radio1 = document.createElement('input')
    radio1.type = 'radio'
    radio1.id = _cantitate_estimari + '_gt_0'
    radio1.name = 'filter'
    radio1.value = 'gt_0'
    radio1.classList.add('form-check-input')
    //add function to filter rows with _cantitate_estimari > 0
    radio1.onchange = filterRowsByColumnName(true, _cantitate_estimari)
    let label1 = document.createElement('label')
    label1.innerHTML = 'e > 0'
    label1.htmlFor = _cantitate_estimari + '_gt_0'
    label1.classList.add('form-check-label')
    div1.appendChild(radio1)
    div1.appendChild(label1)
    let div2 = document.createElement('div')
    div2.classList.add('form-check')
    floatingTableFilter.appendChild(div2)
    let radio2 = document.createElement('input')
    radio2.type = 'radio'
    radio2.id = _cantitate_estimari + '_eq_0'
    radio2.name = 'filter'
    radio2.value = 'e_eq_0'
    radio2.classList.add('form-check-input')
    radio2.onchange = filterRowsByColumnName(false, _cantitate_estimari)
    let label2 = document.createElement('label')
    label2.innerHTML = 'e = 0'
    label2.htmlFor = _cantitate_estimari + '_eq_0'
    label2.classList.add('form-check-label')
    div2.appendChild(radio2)
    div2.appendChild(label2)
    let div3 = document.createElement('div')
    div3.classList.add('form-check')
    floatingTableFilter.appendChild(div3)
    let radio3 = document.createElement('input')
    radio3.type = 'radio'
    radio3.id = _cantitate_estimari + '_neq_antemas'
    radio3.name = 'filter'
    radio3.value = 'neq_antemas'
    radio3.classList.add('form-check-input')
    radio3.onchange = filterRowsByAntemasuratori(true)
    let label3 = document.createElement('label')
    label3.innerHTML = 'e<>a'
    label3.htmlFor = _cantitate_estimari + '_neq_antemas'
    label3.classList.add('form-check-label')
    div3.appendChild(radio3)
    div3.appendChild(label3)
    let div4 = document.createElement('div')
    div4.classList.add('form-check')
    floatingTableFilter.appendChild(div4)
    let radio4 = document.createElement('input')
    radio4.type = 'radio'
    radio4.id = _cantitate_estimari + '_eq_antemas'
    radio4.name = 'filter'
    radio4.value = 'eq_antemas'
    radio4.classList.add('form-check-input')
    radio4.onchange = filterRowsByAntemasuratori(false)
    let label4 = document.createElement('label')
    label4.innerHTML = 'e=a'
    label4.htmlFor = _cantitate_estimari + '_eq_antemas'
    label4.classList.add('form-check-label')
    div4.appendChild(radio4)
    div4.appendChild(label4)
    let div5 = document.createElement('div')
    div5.classList.add('form-check')
    floatingTableFilter.appendChild(div5)
    //all
    let radio5 = document.createElement('input')
    radio5.type = 'radio'
    radio5.id = 'all'
    radio5.name = 'filter'
    radio5.value = 'all'
    radio5.classList.add('form-check-input')
    radio5.checked = true
    let label5 = document.createElement('label')
    label5.innerHTML = 'All'
    label5.htmlFor = 'all'
    label5.classList.add('form-check-label')
    radio5.onchange = function () {
      let table = tables.my_table5.element.shadowRoot.getElementById('table_estimari')
      let tbody = table.getElementsByTagName('tbody')[0]
      let trs = tbody.getElementsByTagName('tr')
      for (let i = 0; i < trs.length; i++) {
        trs[i].style.display = 'table-row'
      }
    }
    div5.appendChild(radio5)
    div5.appendChild(label5)
    //add radio for _cantitate_antemasuratori = 0
    let div6 = document.createElement('div')
    div6.classList.add('form-check')
    floatingTableFilter.appendChild(div6)
    let radio6 = document.createElement('input')
    radio6.type = 'radio'
    radio6.id = _cantitate_antemasuratori + '_eq_0'
    radio6.name = 'filter'
    radio6.value = 'a_eq_0'
    radio6.classList.add('form-check-input')
    radio6.onchange = filterRowsByColumnName(false, _cantitate_antemasuratori)
    let label6 = document.createElement('label')
    label6.innerHTML = 'a = 0'
    label6.htmlFor = _cantitate_antemasuratori + '_eq_0'
    label6.classList.add('form-check-label')
    div6.appendChild(radio6)
    div6.appendChild(label6)
    return floatingTableFilter

    function filterRowsByColumnName(isEqual, columnName) {
      return function () {
        //filter rows with _cantitate_estimari > 0 when isEqual = true and _cantitate_estimari = 0 when isEqual = false
        let table = tables.my_table5.element.shadowRoot.getElementById('table_estimari')
        let tbody = table.getElementsByTagName('tbody')[0]
        let trs = tbody.getElementsByTagName('tr')
        for (let i = 0; i < trs.length; i++) {
          let tds = trs[i].getElementsByTagName('td')
          let td = Array.from(tds).find((o) => o.classList.contains(columnName))
          let val = td.textContent.trim() === '' ? 0 : parseFloat(td.textContent)
          if (td) {
            if (isEqual) {
              if (val > 0) {
                trs[i].style.display = 'table-row'
              } else {
                trs[i].style.display = 'none'
              }
            } else {
              if (val === 0) {
                trs[i].style.display = 'table-row'
              } else {
                trs[i].style.display = 'none'
              }
            }
          }
        }
      }
    }

    function filterRowsByAntemasuratori(isEqual) {
      return function () {
        //filter rows with _cantitate_estimari > 0 when isEqual = true and _cantitate_estimari = 0 when isEqual = false
        let table = tables.my_table5.shadowRoot.getElementById('table_estimari')
        let tbody = table.getElementsByTagName('tbody')[0]
        let trs = tbody.getElementsByTagName('tr')
        for (let i = 0; i < trs.length; i++) {
          let tds = trs[i].getElementsByTagName('td')
          let td = Array.from(tds).find((o) => o.classList.contains(_cantitate_estimari))
          //let val = parseFloat(td.textContent)
          let val = td.textContent.trim() === '' ? 0 : parseFloat(td.textContent)
          let tda = Array.from(tds).find((o) => o.classList.contains(_cantitate_antemasuratori))
          let vala = tda.textContent.trim() === '' ? 0 : parseFloat(tda.textContent)
          if (td) {
            if (isEqual) {
              if (val !== vala) {
                trs[i].style.display = 'table-row'
              } else {
                trs[i].style.display = 'none'
              }
            } else {
              if (val === vala) {
                trs[i].style.display = 'table-row'
              } else {
                trs[i].style.display = 'none'
              }
            }
          }
        }
      }
    }
  }

  updateDateInputs(input1) {
    return function () {
      let key = input1.id === 'start_date' ? _start_date : _end_date
      let inputs = tables.my_table5.element.shadowRoot
        .getElementById('tbody_estimari')
        .getElementsByClassName(key === _start_date ? 'start_date' : 'end_date')
      for (let i = 0; i < inputs.length; i++) {
        inputs[i].value = input1.value
        //change context.ds_estimari_pool
        let arrayIndex = inputs[i].parentElement.parentElement.getAttribute('data-cccactivitestimari')
        context.setValuesOfDsEstimari(arrayIndex, key, input1.value)
      }
    }
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
    isDB,
    CCCPATHS,
    INITIAL_PATH
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
    tr.setAttribute('data-cccpaths', CCCPATHS)
    tr.setAttribute('data-initial-path', INITIAL_PATH)
    tr.setAttribute('data-cccinstante', i)
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

    //add columns based on estimariDisplayMask
    for (var key in context.estimariDisplayMask) {
      //check key vs estimariDisplayMask
      //first check if key exists in estimariDisplayMask
      if (Object.keys(o).includes(key)) {
        //check if visible
        if (context.estimariDisplayMask[key].visible) {
          let td = document.createElement('td')
          //td.innerHTML = o[key] || '';
          //contenteditable if RW
          if (context.estimariDisplayMask[key].RW) {
            td.contentEditable = true
          }

          if (key == _cantitate_estimari) {
            td.style.fontWeight = 'bold'
          }

          if (context.estimariDisplayMask[key].type === 'number') {
            td.style.textAlign = 'right'
            td.innerHTML = parseFloat(o[key]) || ''
          } else if (context.estimariDisplayMask[key].type === 'date') {
            let input1 = document.createElement('input')
            input1.type = 'date'
            input1.classList.add('form-control', 'form-control-sm', 'rounded')
            if (key === _start_date) {
              input1.classList.add('start_date')
            } else if (key === _end_date) {
              input1.classList.add('end_date')
            }
            input1.value = o[key] || ''
            //readonly
            input1.readOnly = true
            this.updateEstimariDate(input1)
            td.appendChild(input1)
          } else {
            td.innerHTML = o[key] || ''
          }

          td.classList.add(key)

          //add event listener for input for td class cantitate_estimari
          td.addEventListener('focusout', this._onFocusOut())

          //add keydown event arrow up/down to move to prior/next td _cantitate_estimari
          td.addEventListener('keydown', this._onKeyDown())

          //select all inner html in cell on focusin
          td.addEventListener('focusin', this._onFocusIn())

          tr.appendChild(td)
        }
      }
    }
  }

  updateEstimariDate(input1) {
    input1.addEventListener('change', function () {
      const key = input1.classList.contains('start_date') ? _start_date : _end_date
      //update context.ds_estimari_pool and newTree
      let position = context.locateTrInEstimariPool(input1.parentElement)
      let instanta = position.instanta
      let ramura = position.ramura
      let activitateIndex = position.activitateIndex
      //context.ds_estimari_pool[instanta][ramura][activitateIndex].row_data[key] = input1.value
      context.setValueOfDsEstimariPoolByKey(instanta, ramura, activitateIndex, key, input1.value)
    })
  }

  toggleChildrenVisibility(plus_icon, i, k) {
    plus_icon.onclick = function () {
      //show hide all children, identified by same id and a "_some_number"
      var children = tables.my_table5.element.shadowRoot
        .getElementById('tbody_estimari')
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

  _onFocusIn() {
    return function (e) {
      const target = e.target
      console.log('FocusIn target class:', target.classList)
      if (target && target.innerHTML) {
        if (target.tagName === 'TD') {
          if (target.classList.contains(_cantitate_estimari)) {
            //insert table with two columns, one for _cantitate_estimari and one is a select for people to choose from
            const table = document.createElement('table')
            table.classList.add('table', 'table-sm', 'table-light')
            const tbody = document.createElement('tbody')
            table.appendChild(tbody)
            const tr = document.createElement('tr')
            tbody.appendChild(tr)
            const td1 = document.createElement('td')
            //contenteditable
            td1.contentEditable = true
            //width
            td1.placeholder = 'Cantitate'
            tr.appendChild(td1)
            const td2 = document.createElement('td')
            tr.appendChild(td2)
            const select = document.createElement('select')
            select.classList.add('form-select', 'form-select-sm')
            //add options from contextOferta.angajati
            //for ex: [{PRSN: 99, NAME2: 'Mihai'}, {PRSN: 100, NAME2: 'Ion'}, {PRSN: 101, NAME2: 'Gheorghe'}]
            const options = contextOferta.angajati
            options.forEach((option) => {
              const opt = document.createElement('option')
              opt.value = option.PRSN
              opt.innerHTML = option.NAME2
              select.appendChild(opt)
            })
            td2.appendChild(select)
            target.innerHTML = ''
            target.appendChild(table)
          } else {
            const range = document.createRange()
            range.selectNodeContents(target)
            const selection = window.getSelection()
            selection.removeAllRanges()
            selection.addRange(range)
          }
        }
      }
    }
  }

  _onKeyDown() {
    return function (e) {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        var index = Array.from(
          tables.my_table5.element.shadowRoot
            .getElementById('tbody_estimari')
            .querySelectorAll('.' + _cantitate_estimari)
        ).indexOf(e.target)
        if (index > 0) {
          var tds = tables.my_table5.element.shadowRoot
            .getElementById('tbody_estimari')
            .querySelectorAll('.' + _cantitate_estimari)
          tds[index - 1].focus()
        }
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        var index = Array.from(
          tables.my_table5.element.shadowRoot
            .getElementById('tbody_estimari')
            .querySelectorAll('.' + _cantitate_estimari)
        ).indexOf(e.target)
        if (index < e.target.parentElement.parentElement.children.length - 1) {
          var tds = tables.my_table5.element.shadowRoot
            .getElementById('tbody_estimari')
            .querySelectorAll('.' + _cantitate_estimari)
          tds[index + 1].focus()
        }
      }
      if (e.key == 'Enter') {
        e.preventDefault()
        e.target.blur()
      }
    }
  }

  _onFocusOut() {
    return function (e) {
      // Get cell with class _cantitate_antemasuratori
      let cantitateAntemasuratoriCell =
        e.target.parentElement.getElementsByClassName(_cantitate_antemasuratori)[0]
      let cantitateAntemasuratori = cantitateAntemasuratoriCell.textContent.trim()
      let diff = parseFloat(cantitateAntemasuratori) - parseFloat(e.target.textContent)
      cantitateAntemasuratoriCell.style.color = diff === 0 ? 'green' : 'red'
      var tagName = e.target.tagName
      if (tagName === 'TD') {
        //get index of tr in tbody
        let index = parseInt(e.target.parentElement.getAttribute('data-cccactivitestimari'))
        //get type from estimariDisplayMask
        let key = e.target.classList[0]
        let type = context.estimariDisplayMask[key].type
        let val = null
        switch (type) {
          case 'number':
            val = parseFloat(e.target.textContent.trim().length > 0 ? e.target.textContent.trim() : 0)
            break
          case 'string':
            val = e.target.textContent.trim().length > 0 ? e.target.textContent.trim() : null
            break
          case 'date':
            val = e.target.textContent.trim().length > 0 ? e.target.textContent.trim() : null
            break
          default:
            val = e.target.textContent.trim().length > 0 ? e.target.textContent.trim() : null
            end
        }
        context.setValuesOfDsEstimari(index, key, val)
      }
    }
  }
}
