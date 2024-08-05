import { LitElement, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js'
import {
  template,
  _start_date,
  _end_date,
  _cantitate_estimari,
  _cantitate_antemasuratori,
  newTree,
  theadIsSet,
  addOnChangeEvt,
  ierarhii,
  flatFind,
  selected_ds,
  delimiter,
  my_table1,
  my_table2,
  my_table3,
  my_table4,
  my_table5,
  my_table6,
} from './client.js'
import {
  estimariDisplayMask,
  context,
  generateTblRowsFromDsEstimariPool,
  locateTrInEstimariPool
} from './estimari.js'

export class estimari extends LitElement {
  //loop through newTree and create a table with columns according to antemasuratoriDisplayMask
  //newTree is an array Arr containing arrays Arr[i]; each Arr[i] contains arrays: one is object ,let's call it Arr1 and one is antemasuratori (Arr2)
  //Arr1 is in a one to many relationship with Arr2
  //find Arr[i] with isMain = true and the value of key "DENUMIRE_ARTICOL_OFERTA" is the name of the representation of Arr[i] (the root)
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
    /* context.ds_estimari_pool = [];
    context.ds_estimari_flat = [];
    context.ds_estimari = []; */
    estimariDisplayMask[_start_date] = {
      value: _start_date,
      RW: false,
      visible: true,
      label: 'Start<br>estimare',
      type: 'date'
    }

    estimariDisplayMask[_end_date] = {
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
    console.log('estimari element added to the DOM')
  }

  render() {
    my_table1.style.display = 'none'
    my_table2.style.display = 'none'
    my_table3.style.display = 'none'
    my_table4.style.display = 'none'
    my_table5.style.display = 'block'
    my_table6.style.display = 'none'
    console.log('rendering estimari element with following array', this.ds, 'added at', new Date())
    //create a div with buttons for adding new estimari, saving estimari, refreshing estimari, moving to prior/next estimari
    //add buttons
    var buttonsPannel = this.createButtonsPanel()

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
        checkbox.checked = true
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
        for (let key in estimariDisplayMask) {
          //check key vs estimariDisplayMask
          //first check if key exists in estimariDisplayMask
          if (Object.keys(firstLine).includes(key)) {
            //check if visible
            if (estimariDisplayMask[key].visible) {
              if (estimariDisplayMask[key].type !== 'date') {
                let th = document.createElement('th')
                th.scope = 'col'
                th.style.writingMode = 'vertical-rl'
                th.style.rotate = '180deg'
                th.innerHTML = estimariDisplayMask[key].label ? estimariDisplayMask[key].label : key
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
                label.innerHTML = estimariDisplayMask[key].label ? estimariDisplayMask[key].label : key
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
      let indexOfFlat = 0
      this.ds.forEach(function (o) {
        let ramura = o.ramura
        let instanta = ramura.instanta
        let r = ramura.ramura
        let isMain = ramura.isMain
        let counter = ramura.counter
        let counter2 = ramura.counter2
        let counter3 = ramura.counter3
        if (isMain) {
          //add main activity row
          this.addTableRow(tbody, instanta, r, counter, counter2, counter3, o, true, indexOfFlat)
        }
        this.addTableRow(tbody, instanta, r, counter, counter2, counter3, o, false, indexOfFlat)
        indexOfFlat++
      }, this)
    }

    return html`${buttonsPannel}${table}`
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
    this.renderEstimariList(list_icon)
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
    plus_icon.onclick = function () {
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
    btnAdd.appendChild(plus_icon)
    //add validate icon
    var btnValidate = document.createElement('div')
    btnValidate.classList.add('col')
    buttonsPannel.appendChild(btnValidate)
    var validate_icon = document.createElement('i')
    validate_icon.classList.add('bi')
    validate_icon.classList.add('bi-check2', 'text-success', 'fs-4', 'mb-3')
    validate_icon.style.cursor = 'pointer'
    this.handleValidateIconClick(validate_icon)
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
    this.handleSaveIconClick(save_icon)
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
    refresh_icon.onclick = function () {}
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

  renderEstimariList(list_icon) {
    list_icon.onclick = function () {
      //clean
      context.ds_estimari = context.ds_estimari.filter((o) => o.ds_estimari_flat.length > 0)
      my_table1.style.display = 'none'
      my_table2.style.display = 'none'
      my_table3.style.display = 'none'
      my_table4.style.display = 'none'
      my_table5.style.display = 'none'
      my_table6.style.display = 'block'
      //read ds_estimari array and create a list with all estimari
      my_table6.ds = context.ds_estimari
      console.log('ds_estimari', context.ds_estimari)
    }
  }

  handleSaveIconClick(save_icon) {
    save_icon.onclick = () => {
      //filter context.ds_estimari_flat with key ROW_SELECTED = true and parseFloat(_cantitate_estimari) > 0
      const ds_estimari_flat_filterd = context.ds_estimari_flat.filter(
        (o) => o.ROW_SELECTED && parseFloat(o[_cantitate_estimari]) > 0
      )
      //this.ds = ds_estimari_flat_filterd;
      //pseudo code
      //1. save context.ds_estimari_pool to local storage
      //2. filter context.ds_estimari_flat with key ROW_SELECTED = true and parseFloat(_cantitate_estimari) > 0
      //3. push ds_estimari_flat_filterd to context.ds_estimari as an objectwith keys datetime, context.ds_estimari_flat
      //4. save context.ds_estimari to local storage
      //5. update newTree with context.ds_estimari_flat
      //6. save newTree to local storage
      //save context.ds_estimari_pool to local storage
      localStorage.setItem('ds_estimari_pool', JSON.stringify(context.ds_estimari_pool))
      //push context.ds_estimari_flat to context.ds_estimari as an object with keys datetime, context.ds_estimari_flat
      let dt = new Date()
      //TODO: push ds_estimari_flat_filterd to context.ds_estimari as an object with keys datetime, context.ds_estimari_flat
      //but only if ds_estimari_flat_filterd is not empty and does not exist in context.ds_estimari
      //update newTree with context.ds_estimari_flat
      ds_estimari_flat_filterd.forEach(function (object) {
        let refInstanta = object.ramura.instanta
        let refActivitate = object.ramura.activitateIndex
        let antemasuratoriBranch = object.ramura.ramura
        let estimareIndex = Object.keys(object.ramura).find((key) => key.includes('estimareIndex'))
          ? object.ramura.estimareIndex
          : -1
        let newTreeAntemasBranch = newTree[refInstanta][refActivitate].antemasuratori[antemasuratoriBranch]
        if (newTreeAntemasBranch) {
          //create key estimari of antemasuratori branch as an array if does not exist
          if (!newTreeAntemasBranch.estimari) {
            newTreeAntemasBranch.estimari = []
          }
          //create object with keys _start_date = o[_start_date], _end_date = o[_end_date], qty = parseFloat(o[_cantitate_estimari]) and datetime = dt
          let estimare = {}
          estimare[_start_date] = object[_start_date]
          estimare[_end_date] = object[_end_date]
          estimare.qty = parseFloat(object[_cantitate_estimari])
          estimare.datetime = dt

          if (
            estimareIndex > -1 &&
            newTreeAntemasBranch.estimari[estimareIndex][_start_date] === object[_start_date] &&
            newTreeAntemasBranch.estimari[estimareIndex][_end_date] === object[_end_date]
          ) {
            if (newTreeAntemasBranch.estimari[estimareIndex].qty !== estimare.qty) {
              newTreeAntemasBranch.estimari[estimareIndex] = estimare
            }
          } else {
            //push estimare to newTreeAntemasBranch.estimari
            newTreeAntemasBranch.estimari.push(estimare)
            //add estimare to context.ds_estimari_pool
            context.ds_estimari_pool[refInstanta][antemasuratoriBranch][refActivitate].estimareIndex =
              newTreeAntemasBranch.estimari.length - 1
          }

          //add cantitate_estimari to ds_estimari_pool row_data
          context.ds_estimari_pool[refInstanta][antemasuratoriBranch][refActivitate].row_data[
            _cantitate_estimari
          ] = estimare.qty

          //add start_date to ds_estimari_pool row_data
          context.ds_estimari_pool[refInstanta][antemasuratoriBranch][refActivitate].row_data[_start_date] =
            object[_start_date]

          //add end_date to ds_estimari_pool row_data
          context.ds_estimari_pool[refInstanta][antemasuratoriBranch][refActivitate].row_data[_end_date] =
            object[_end_date]
        }
      })

      localStorage.setItem('ds_estimari_pool', JSON.stringify(context.ds_estimari_pool))
      localStorage.setItem('newTree', JSON.stringify(newTree))

      //context.ds_estimari_pool = transformNewTreeIntoEstimariPoolDS(newTree)
      context.ds_estimari_flat = generateTblRowsFromDsEstimariPool()
      this.ds = context.ds_estimari_flat
      console.log('context.ds_estimari_pool after update', context.ds_estimari_pool)
      console.log('context.ds_estimari after update', context.ds_estimari)
      console.log('ds_estimari_flat_filterd after update', ds_estimari_flat_filterd)
      console.log('newTree after update with estimari', newTree)

      //find active in ds_estimari and set ds_estimari_pool
      let active = context.ds_estimari.find((o) => o.active)
      if (active) {
        active.ds_estimari_pool = context.ds_estimari_pool
        active.ds_estimari_flat = context.ds_estimari_flat
        active.updateDate = new Date()
      }

      localStorage.setItem('ds_estimari', JSON.stringify(context.ds_estimari))
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

  handleValidateIconClick(validate_icon) {
    validate_icon.onclick = () => {
      //add class table-danger to table_estimari where _cantitate_estimari is not a number or is 0 and checkboxes are not checked
      var table = document.getElementById('my_table_estimari').shadowRoot.getElementById('table_estimari')
      var tbody = table.getElementsByTagName('tbody')[0]
      var trs = tbody.getElementsByTagName('tr')
      for (let i = 0; i < trs.length; i++) {
        var tds = trs[i].getElementsByTagName('td')
        //get td with class _cantitate_estimari
        var tdEstimari = Array.from(tds).find((o) => o.classList.contains(_cantitate_estimari))
        //get td with class "ROW_SELECTED"
        var tdRowSelected = Array.from(tds).find((o) => o.classList.contains('ROW_SELECTED'))
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
        if (tdEstimari && tdRowSelected) {
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
  }

  updateDateInputs(input1) {
    return function () {
      let key = input1.id === 'start_date' ? _start_date : _end_date
      let inputs = document
        .getElementById('my_table_estimari')
        .shadowRoot.getElementById('tbody_estimari')
        .getElementsByClassName(key === _start_date ? 'start_date' : 'end_date')
      for (let i = 0; i < inputs.length; i++) {
        inputs[i].value = input1.value
        //change context.ds_estimari_pool
        let position = locateTrInEstimariPool(inputs[i].parentElement)
        let instanta = position.instanta
        let ramura = position.ramura
        let activitateIndex = position.activitateIndex
        context.ds_estimari_pool[instanta][ramura][activitateIndex].row_data[key] = input1.value
        //get data-index-of-flat from tr
        let indexOfFlat = inputs[i].parentElement.parentElement.getAttribute('data-index-of-flat')
        //change context.ds_estimari_flat
        let aDate = key === _start_date ? _start_date : _end_date
        if (indexOfFlat) {
          context.ds_estimari_flat[indexOfFlat][aDate] = input1.value
        } else {
          console.log('indexOfFlat is undefined')
        }
      }
      localStorage.setItem('ds_estimari_pool', JSON.stringify(context.ds_estimari_pool))
    }
  }

  addTableRow(tbody, i, k, counter, counter2, counter3, o, isMain, indexOfFlat) {
    let bg_color = counter % 2 == 0 ? 'table-light' : 'table-white'
    let tr = document.createElement('tr')
    let id = ''
    if (isMain) {
      id = i + '@' + k
    } else {
      id = i + '@' + k + '_' + counter3
    }
    tr.id = id
    tr.setAttribute('data-index-of-flat', indexOfFlat)
    if (isMain) {
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
    this.updateCheckboxStatus(checkbox)
    td.appendChild(checkbox)
    tr.appendChild(td)
    td = document.createElement('td')
    if (isMain) {
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
    if (!isMain) {
      td.innerHTML = counter + '.' + counter2 + '.' + counter3
    } else {
      td.innerHTML = counter + '.' + counter2
    }
    tr.appendChild(td)

    //add columns based on estimariDisplayMask
    for (var key in estimariDisplayMask) {
      //check key vs estimariDisplayMask
      //first check if key exists in estimariDisplayMask
      if (Object.keys(o).includes(key)) {
        //check if visible
        if (estimariDisplayMask[key].visible) {
          let td = document.createElement('td')
          //td.innerHTML = o[key] || '';
          //contenteditable if RW
          if (estimariDisplayMask[key].RW) {
            td.contentEditable = true
          }

          if (key == _cantitate_estimari) {
            td.style.fontWeight = 'bold'
          }

          if (estimariDisplayMask[key].type === 'number') {
            td.style.textAlign = 'right'
            td.innerHTML = parseFloat(o[key]) || ''
          } else if (estimariDisplayMask[key].type === 'date') {
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
      let position = locateTrInEstimariPool(input1.parentElement)
      let instanta = position.instanta
      let ramura = position.ramura
      let activitateIndex = position.activitateIndex
      context.ds_estimari_pool[instanta][ramura][activitateIndex].row_data[key] = input1.value
      localStorage.setItem('ds_estimari_pool', JSON.stringify(context.ds_estimari_pool))
    })
  }

  toggleChildrenVisibility(plus_icon, i, k) {
    plus_icon.onclick = function () {
      //show hide all children, identified by same id and a "_some_number"
      var children = document
        .getElementById('my_table_estimari')
        .renderRoot.getElementById('tbody_estimari')
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

  updateCheckboxStatus(checkbox) {
    checkbox.onchange = function () {
      //change context.ds_estimari_pool
      let position = locateTrInEstimariPool(checkbox.parentElement)
      let instanta = position.instanta
      let ramura = position.ramura
      let activitateIndex = position.activitateIndex
      context.ds_estimari_pool[instanta][ramura][activitateIndex].row_data['ROW_SELECTED'] = checkbox.checked
      localStorage.setItem('ds_estimari_pool', JSON.stringify(context.ds_estimari_pool))
    }
  }

  _onFocusIn() {
    return function (e) {
      var range = document.createRange()
      range.selectNodeContents(e.target)
      var sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    }
  }

  _onKeyDown() {
    return function (e) {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        var index = Array.from(
          document
            .getElementById('my_table_estimari')
            .shadowRoot.getElementById('tbody_estimari')
            .querySelectorAll('.' + _cantitate_estimari)
        ).indexOf(e.target)
        if (index > 0) {
          var tds = document
            .getElementById('my_table_estimari')
            .shadowRoot.getElementById('tbody_estimari')
            .querySelectorAll('.' + _cantitate_estimari)
          tds[index - 1].focus()
        }
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        var index = Array.from(
          document
            .getElementById('my_table_estimari')
            .shadowRoot.getElementById('tbody_estimari')
            .querySelectorAll('.' + _cantitate_estimari)
        ).indexOf(e.target)
        if (index < e.target.parentElement.parentElement.children.length - 1) {
          var tds = document
            .getElementById('my_table_estimari')
            .shadowRoot.getElementById('tbody_estimari')
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
        let index = parseInt(e.target.parentElement.getAttribute('data-index-of-flat'))
        //get type from estimariDisplayMask
        let key = e.target.classList[0]
        let type = estimariDisplayMask[key].type
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
        context.ds_estimari_flat[index][key] = val
        let position = locateTrInEstimariPool(e.target)
        let instanta = position.instanta
        let ramura = position.ramura
        let activitateIndex = position.activitateIndex
        context.ds_estimari_pool[instanta][ramura][activitateIndex].row_data[key] = val
        localStorage.setItem('ds_estimari_pool', JSON.stringify(context.ds_estimari_pool))
      }
    }
  }
}