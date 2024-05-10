import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js'

const TIP_ACTIVITATE_ARTICOL_RETETA = ['ARTICOL', 'SUBARTICOL', 'MATERIAL']
const SUBTIP_ACTIVITATE_ARTICOL_RETETA = [
  'PRINCIPAL',
  'MATERIAL',
  'MANOPERA',
  'TRANSPORT',
  'ECHIPAMENT',
  'UTILAJ'
]

console.log('client.js loaded')

//const socket = io('https://retailers-ac9953f6caca.herokuapp.com')
const socket = io('https://ofertainvest-6e1a879e95f3.herokuapp.com/')
const client = feathers()
const socketClient = feathers.socketio(socket)

client.configure(socketClient)

client.use('connectToS1', socketClient.service('connectToS1'), {
  methods: ['find', 'get', 'create', 'update', 'patch', 'remove']
})

client.use('setDocument', socketClient.service('setDocument'), {
  methods: ['find', 'get', 'create', 'update', 'patch', 'remove']
})

client.use('getS1ObjData', socketClient.service('getS1ObjData'), {
  methods: ['find', 'get', 'create', 'update', 'patch', 'remove']
})

client.use('getDataset', socketClient.service('getDataset'), {
  methods: ['find', 'get', 'create', 'update', 'patch', 'remove']
})

//use getValFromQuery
client.use('getValFromQuery', socketClient.service('getValFromQuery'), {
  methods: ['find', 'get', 'create', 'update', 'patch', 'remove']
})

async function connectToS1Service() {
  const connectToS1 = client.service('connectToS1')
  const result = await connectToS1.find()
  return result
}

var extra_nivele_count = 0
var original_ds = []
var compacted_ds = []
var optimal_ds = []
var recipes_ds = []
var combinatii_unice = []
var selected_ds = []
var ds_antemasuratori = []
var trees = []
var nivele = []
var _nivel_oferta = 'NIVEL_OFERTA_'
var _nivel_cantitate_articol_oferta = 'CANTITATE_ARTICOL_OFERTA'
var _cantitate_antemasuratori = 'CANTITATE_ARTICOL_ANTEMASURATORI'
var visible_columns = []
var denumireUnica_ds = []

// 1. load excel file by file chooser xlsx.js
function loadDataFromFile(evt) {
  var file = document.getElementById('file_oferta_initiala').files[0]
  var reader = new FileReader()
  reader.onload = function (e) {
    var excel_object = null
    original_ds = []
    compacted_ds = []
    optimal_ds = []
    combinatii_unice = []
    var data = e.target.result
    var workbook = XLSX.read(data, {
      type: 'binary'
    })
    workbook.SheetNames.forEach(function (sheetName) {
      var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName])
      excel_object = JSON.stringify(XL_row_object)
    })
    //console.log("excel_object", excel_object);

    //each key represents a column, copy all objecys in compacted_ds but remove the ones with empty values
    original_ds = JSON.parse(excel_object)
    console.log('original_ds', original_ds)

    compacted_ds = removeEmpty(original_ds)
    //console.log("compacted_ds", compacted_ds);

    const unique_key = 'SERIE_ARTICOL_OFERTA'
    //optimal_ds = sortByUniqueKey(compacted_ds, unique_key)
    optimal_ds = sortByUniqueKey(original_ds, unique_key)
    //refresh ds in my-table component
    document.getElementById('my_table_oferta_initiala').ds = optimal_ds
    //tableId
    document.getElementById('my_table_oferta_initiala').tableId = 'oferta_initiala'
    console.log('optimal_ds', optimal_ds)

    //pushDataToTable(optimal_ds, 'thead_oferta_initiala', 'tbody_oferta_initiala')

    var delimiter = '~~~~~~~~~~~~~~~'
    var result = creazaIerarhii(optimal_ds, delimiter)
    nivele = result.nivele
    var combinatii_unice_as_str = result.combinatii_unice_as_str
    combinatii_unice = result.combinatii_unice

    populateSelect(nivele, combinatii_unice_as_str, optimal_ds, delimiter)

    createGraphs(combinatii_unice)
  }

  reader.onerror = function (ex) {
    console.log(ex)
  }

  reader.readAsBinaryString(file)

  var btn_oferta = document.getElementById('btn_oferta')
  var dl =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">' +
    '<path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>' +
    '<path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/>' +
    '</svg>'
  btn_oferta.innerHTML = 'Salveaza oferta initiala ' + dl
  btn_oferta.classList.remove('btn-success')
  btn_oferta.classList.add('btn-danger')
}

function removeEmpty(original_ds) {
  var keys = Object.keys(original_ds[0])
  var compacted_ds = []
  original_ds.forEach(function (object) {
    var obj = {}
    keys.forEach(function (key) {
      if (object[key]) {
        obj[key] = object[key]
      }
    })
    compacted_ds.push(obj)
  })

  return compacted_ds
}

function sortByUniqueKey(compacted_ds, unique_key) {
  //return [...array.reduce((r, o) => r.set(o[key], o), new Map()).values()];

  //rearrange data so all objects with same key unique_key are displayed together
  let optimal_ds = []
  var distinct = [...new Set(compacted_ds.map((x) => x[unique_key]))]
  distinct.forEach(function (item) {
    compacted_ds.forEach(function (object) {
      if (object[unique_key] == item) {
        optimal_ds.push(object)
      }
    })
  })

  return optimal_ds
}

function creazaIerarhii(optimal_ds, delimiter = ' ') {
  /*
NIVEL_OFERTA_1  NIVEL_OFERTA_2 NIVEL_OFERTA_3 ... NIVEL_OFERTA_N
SUPRATERAN  INSTALATII ELECTRICE	DISTRIBUTIE
SUBSOLURI	INSTALATII ELECTRICE	DISTRIBUTIE   
SUBSOLURI	INSTALATII ELECTRICE	DISTRIBUTIE  

=>

distincy combinations of values for combo NIVEL_OFERTA_1, NIVEL_OFERTA_2, NIVEL_OFERTA_3 ... NIVEL_OFERTA_N
SUPRATERAN  INSTALATII ELECTRICE	DISTRIBUTIE
SUBSOLURI	INSTALATII ELECTRICE	DISTRIBUTIE 
*/

  var nivele = []
  let keys = Object.keys(optimal_ds[0])
  keys.forEach(function (key) {
    if (key.includes('NIVEL_OFERTA')) {
      nivele.push(key)
    }
  })

  console.log('nivele detectate', nivele)

  //scan optimal_ds and create distinct combinations of values for combo NIVEL_OFERTA_1, NIVEL_OFERTA_2, NIVEL_OFERTA_3 ... NIVEL_OFERTA_N
  var all_combos_for_nivele = []
  optimal_ds.forEach(function (object) {
    var combo = []
    nivele.forEach(function (nivel) {
      //if trimmed object[nivel] is not empty add it to combo
      if (object[nivel] && object[nivel].trim()) combo.push(object[nivel])
    })
    all_combos_for_nivele.push(combo)
  })

  //console.log("all_combos_for_nivele", all_combos_for_nivele);

  //remove duplicates from all_combos_for_nivele
  var combinatii_unice_as_str = []
  all_combos_for_nivele.forEach(function (combo) {
    const combo_str = combo.join(delimiter)
    if (!combinatii_unice_as_str.includes(combo_str)) {
      combinatii_unice_as_str.push(combo_str)
    }
  })

  //console.log("combinatii_unice_as_str", combinatii_unice_as_str);

  var combinatii_unice = []
  combinatii_unice_as_str.forEach(function (combo_str) {
    combinatii_unice.push(combo_str.split(delimiter))
  })

  //console.log("combinatii_unice", combinatii_unice);

  return { nivele, combinatii_unice_as_str, combinatii_unice }
}

function populateSelect(nivele, combinatii_unice_as_str, optimal_ds, delimiter) {
  //add combinatii_unice_as_str to select id="ierarchii"
  var select = document.getElementById('ierarhii')
  //add default option
  var option = document.createElement('option')
  option.value = '1'
  option.text = 'Toate ierarhiile'
  select.appendChild(option)
  //add combinatii_unice_as_str as options
  combinatii_unice_as_str.forEach(function (combo_str) {
    var option = document.createElement('option')
    option.value = combo_str
    //option.text = combo_str;
    //replace delimiter with " -> "
    option.text = combo_str.split(delimiter).join(' - ')
    select.appendChild(option)
    select.onchange = function () {
      selected_ds = []
      if (select.value == '1') {
        //pushDataToTable(optimal_ds, 'thead_oferta_initiala', 'tbody_oferta_initiala')
        //my-table component
        document.getElementsByTagName('my-table')[0].ds = optimal_ds
        return
      }

      filterOptimalDs(select.value, optimal_ds, delimiter)

      //create table rows
      if (selected_ds.length > 0) {
        //pushDataToTable(selected_ds, 'thead_oferta_initiala', 'tbody_oferta_initiala')
        //my-table component
        document.getElementsByTagName('my-table')[0].ds = selected_ds
      } else {
        //display a message in table
        alert('Nu exista date pentru ierarhia selectata')
      }

      drawModalDialog(select.value.split(delimiter), selected_ds)
    }
  })
}

function filterOptimalDs(selected_option, optimal_ds, delimiter) {
  console.log('selected_option', selected_option)
  //filter optimal_ds by selected option and display it in table
  optimal_ds.forEach(function (object) {
    var combo = []
    nivele.forEach(function (nivel) {
      if (object[nivel]) combo.push(object[nivel])
    })
    if (combo.join(delimiter) == selected_option) {
      selected_ds.push(object)
    } else {
      if (selected_option.includes(combo.join(delimiter))) {
        selected_ds.push(object)
      }
    }
  })

  console.log('selected_ds', selected_ds)
}

function createGraphs(combinatii_unice) {
  //create a graph for each root

  //sort combinatii_unice by first element
  combinatii_unice.sort(function (a, b) {
    return a[0] > b[0] ? 1 : -1
  })

  console.log('combinatii_unice sorted', combinatii_unice)

  //delete empty elements
  combinatii_unice = combinatii_unice.filter(function (el) {
    return el.length != 0
  })

  //delete elements with empty strings
  combinatii_unice = combinatii_unice.filter(function (el) {
    return el != ''
  })

  var tree = []
  var roots = []
  //find unique roots
  combinatii_unice.forEach(function (combo) {
    if (!roots.includes(combo[0])) {
      roots.push(combo[0])
    }
  })
  console.log('roots', roots)

  //create trees by roots
  roots.forEach(function (root) {
    tree = []
    combinatii_unice.forEach(function (combo) {
      if (combo[0] == root) {
        tree.push(combo)
      }
    })
    trees.push(tree)
  })

  console.log('trees', trees)

  //create a new select with tree roots
  var select = document.createElement('select')
  select.id = 'select_tree'
  select.classList.add('form-select')
  select.classList.add('form-select-sm')
  //add options
  trees.forEach(function (tree, index) {
    var option = document.createElement('option')
    option.value = index
    option.text = tree[0][0]
    select.appendChild(option)
  })

  //no selected value
  select.selectedIndex = -1

  //add select to div id="cytoscape_graphs"
  var div = document.getElementById('select_graphs')
  div.appendChild(select)
  //on change select value create graph
  select.onchange = function () {
    var index = select.value
    var tree = trees[index]
    var id = document.getElementById('cytoscape_graphs').id
    createGraph(tree, id)
  }

  function createGraph(tree, id) {
    console.log('selected tree', tree)
    //create a graph for tree
    var cy = cytoscape({
      container: document.getElementById(id),
      elements: elementify(tree),
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#2ecc71',
            label: 'data(label)'
          }
        },
        {
          selector: 'edge',
          style: {
            'line-color': '#95a5a6'
          }
        }
      ]
    })

    cy.on('cxttapstart', 'node', (e) => {
      var node = e.target
      console.log('node id=' + node.id())
      //find elements[id].label
      var elements = cy.elements()
      var label = elements.filter((el) => el.id() == node.id())[0].data('label')
      console.log('label', label)
      console.log('tree', tree)
      // 1. check if it's a leaf
      var isLeaf = false
      var myBranch
      for (var i = 0; i < tree.length; i++) {
        var branch = tree[i]
        if (branch[branch.length - 1] == label) {
          isLeaf = true
          myBranch = branch
          break
        }
      }
      console.log(isLeaf, myBranch)

      if (isLeaf && myBranch) {
        var newLeaf = prompt('New leaf\ncam[1..10] or simple string')
        if (newLeaf) {
          //can be "XXX[1..10]" or simple string
          var regex = /\[(.*?)\]/
          var found = newLeaf.match(regex)
          console.log('found', found)
          if (found) {
            //replace [1..10] with numbers
            var numbers = found[1].split('..')
            var start = parseInt(numbers[0])
            var end = parseInt(numbers[1])
            var range = Array.from({ length: end - start + 1 }, (_, i) => i + start)
            console.log('range', range)
            range.forEach(function (number) {
              var leaf = newLeaf.replace(found[0], number)
              var cl = [...myBranch]
              cl.push(leaf)
              tree.push(cl)
            })
          } else {
            var cl = [...myBranch]
            cl.push(newLeaf)
            tree.push(cl)
          }
        }

        //redraw graph
        var id = document.getElementById('cytoscape_graphs').id
        createGraph(tree, id)
      }

      console.log(tree)
    })

    cy.layout({
      name: 'breadthfirst',
      fit: true,
      directed: true,
      padding: 10,
      circle: false,
      spacingFactor: 2,
      avoidOverlap: true,
      grid: false,
      // a sorting function to order nodes at equal depth. e.g. function(a, b){ return a.data('weight') - b.data('weight') }
      depthSort: function (a, b) {
        return a.data('rank') - b.data('rank')
      },
      //ready: undefined, // callback on layoutready
      ready: function () {
        console.log('layoutready:' + id)
      }
    }).run()
  }
}

function elementify(combinatii_unice) {
  /*
 [
    [
        "SUPRATERAN",
        "INSTALATII ELECTRICE",
        "DISTRIBUTIE"
    ],
    [
        "SUPRATERAN",
        "INSTALATII ELECTRICE",
        "DISTRIBUTIE",
        "ETAJ 1"
    ],
    [
        "SUPRATERAN",
        "INSTALATII ELECTRICE",
        "DISTRIBUTIE",
        "ETAJ 2"
    ],
    [
        "SUBSOLURI",
        "INSTALATII ELECTRICE",
        "DISTRIBUTIE"
    ]
]

create tree branches: SUPRATERAN -> INSTALATII ELECTRICE -> DISTRIBUTIE -> ETAJ 1
                                                                        -> ETAJ 2
  SUBSOLURI -> INSTALATII ELECTRICE -> DISTRIBUTIE 
  
  every root has it's own branch
 */

  var elements = [],
    nodes = [],
    edges = [],
    rank = 0,
    combinatii_unice_with_id = []

  combinatii_unice.forEach((combo) => {
    let combo_id = []
    combo.forEach((nivel) => {
      var i = combinatii_unice.indexOf(combo) + 1
      var j = combo.indexOf(nivel) + 1
      var id = 'n' + i + j
      //if nivel already exists in combinatii_unice_with_id/combo then get it's id
      //don't look for the last element of combo
      if (j < combo.length) {
        var found = combinatii_unice_with_id.flat().find((o) => o.label === nivel)
        if (found) {
          id = found.id
          //console.log("found", found);
        }
      }
      var label = nivel
      var o = { id, label }
      combo_id.push(o)
    })
    combinatii_unice_with_id.push(combo_id)
  })

  console.log('combinatii_unice_with_id', combinatii_unice_with_id)

  combinatii_unice_with_id.forEach((combo) => {
    //console.log("combo", combo);
    rank = 0
    var parent = null
    combo.forEach((nivel) => {
      rank++
      var node = { data: { id: nivel.id, label: nivel.label, rank } }
      if (parent) {
        var edge = { data: { source: parent.data.id, target: node.data.id } }
        edges.push(edge)
      }
      nodes.push(node)
      parent = node
    })
  })

  //remove duplicates from nodes and edges
  nodes = nodes.filter((v, i, a) => a.findIndex((t) => t.data.id === v.data.id) === i)
  edges = edges.filter(
    (v, i, a) => a.findIndex((t) => t.data.source === v.data.source && t.data.target === v.data.target) === i
  )

  elements = nodes.concat(edges)

  //sort elements by rank
  elements.sort(function (a, b) {
    return a.data.rank - b.data.rank
  })

  console.log('elements', elements)

  return elements
}

function pushDataToTable(data, thead_name, tbody_name) {
  //create html table from array
  //data > table id="table_oferta_initiala"
  //thead id="thead_oferta_initiala" < first object's keys
  //tbody id="tbody_oferta_initiala" < all objects as rows
  var pg = document.getElementById('progress_bar')
  var lbl = document.getElementById('progress_bar_label')
  var thead = document.getElementById(thead_name)
  thead.innerHTML = ''
  var tbody = document.getElementById(tbody_name)
  tbody.innerHTML = ''
  //add delete icon to thead
  var th = document.createElement('td')
  //add class
  //add burger icon
  var enumKeys = ''
  var keys = Object.keys(data[0])
  keys.forEach(function (key) {
    var is_checked = visible_columns.find((o) => o.column === key)
      ? visible_columns.find((o) => o.column === key).state
      : true
    var state = is_checked ? 'checked' : ''
    enumKeys += '<div class="form-check">'
    enumKeys +=
      '<input class="form-check-input" type="checkbox" value="" id="h' +
      key +
      '" ' +
      state +
      ' onclick="showHideColumn(this.checked, ' +
      "'" +
      key +
      "', " +
      "'" +
      thead_name +
      "', " +
      "'" +
      tbody_name +
      "'" +
      ')">'
    enumKeys += '<label class="form-check-label w-100" for="h' + key + '">' + key + '</label>'
    enumKeys += '</div>'
  })
  //add close icon
  enumKeys += '<div><button type="button" class="btn-close" aria-label="Close"></button></div>'
  th.innerHTML =
    '<span id="table_menu" class="bi bi-list" style="cursor: pointer;"><div id="table_menu_content" class="text-decoration-none fw-lighter bg-light" style="display: none;">' +
    enumKeys +
    '</div></span>'
  th.onclick = function () {
    //show/hide menu
    var menu = document.getElementById('table_menu')
    var menu_content = document.getElementById('table_menu_content')
    if (menu_content.style.display === 'none') {
      menu_content.style.display = 'block'
    } else {
      menu_content.style.display = 'none'
    }
  }
  thead.appendChild(th)
  //add line number to thead
  var th = document.createElement('td')
  th.innerHTML = 'Nr'
  thead.appendChild(th)
  var keys = Object.keys(data[0])
  keys.forEach(function (key) {
    var th = document.createElement('td')
    th.style.writingMode = 'vertical-rl'
    th.style.rotate = '180deg'
    /* //sticky top
    th.style.position = "sticky";
    th.style.top = "0";
    th.style.backgroundColor = "white"; */
    th.innerHTML = key
    //add class header
    th.classList.add('header')
    //add scope col
    th.setAttribute('scope', 'col')
    thead.appendChild(th)
  })

  //create table rows
  //prepare progress bar by setting attributes: aria-valuenow, aria-valuemin, aria-valuemax, inner html
  pg.setAttribute('aria-valuenow', 0)
  pg.setAttribute('aria-valuemin', 0)
  pg.setAttribute('aria-valuemax', data.length)
  pg.style.width = '0%'
  lbl.innerHTML = '0%'
  let linesCount = 0
  data.forEach(function (object) {
    linesCount++
    //update progress bar
    pg.setAttribute('aria-valuenow', data.indexOf(object) + 1)
    pg.style.width = ((data.indexOf(object) + 1) / data.length) * 100 + '%'
    lbl.innerHTML = ((data.indexOf(object) + 1) / data.length) * 100 + '%'
    //create row
    var tr = document.createElement('tr')
    //add td with delete icon
    var td = document.createElement('td')
    var icon = document.createElement('i')
    icon.classList.add('bi')
    icon.classList.add('bi-trash')
    icon.classList.add('text-danger')
    icon.style.cursor = 'pointer'
    icon.onclick = function () {
      //delete row
    }
    td.appendChild(icon)
    tr.appendChild(td)
    var td = document.createElement('td')
    td.innerHTML = linesCount
    tr.appendChild(td)
    keys.forEach(function (key) {
      var td = document.createElement('td')
      var val = 0
      //if object[key] is a number format it to 2 decimals
      if (object[key]) {
        val = object[key]
        if (!isNaN(val)) {
          val = parseFloat(val).toFixed(2)
        } else {
          val = object[key]
        }
      }
      if (key == 'DENUMIRE_ARTICOL_OFERTA') {
        //create small a button for each row. When clicked filter optimal_ds by selected_option resulting in denumireUnica_ds and display it in table
        var button = document.createElement('button')
        button.type = 'button'
        button.classList.add('btn')
        button.classList.add('btn-secondary')
        button.classList.add('btn-sm')
        //add filter icon
        var filter_icon = document.createElement('i')
        filter_icon.classList.add('bi')
        filter_icon.classList.add('bi-filter')
        button.appendChild(filter_icon)
        //add event listener
        button.onclick = function () {
          //daca nr linii tabel < optimal_ds.length incarca din nou optimal_ds
          if (document.getElementById(tbody_name).rows.length < optimal_ds.length) {
            pushDataToTable(optimal_ds, thead_name, tbody_name)
          } else {
            var selected_option = object[key]
            denumireUnica_ds = []
            optimal_ds.forEach(function (object) {
              if (object[key] == selected_option) {
                denumireUnica_ds.push(object)
              }
            })
            console.log('denumireUnica_ds', denumireUnica_ds)
            pushDataToTable(denumireUnica_ds, thead_name, tbody_name)
          }
        }
        td.appendChild(button)
        //add another button named Retetare
        var button = document.createElement('button')
        button.type = 'button'
        button.classList.add('btn')
        button.classList.add('btn-primary')
        button.classList.add('btn-sm')
        //add list icon
        var list_icon = document.createElement('i')
        list_icon.classList.add('bi')
        list_icon.classList.add('bi-list')
        button.appendChild(list_icon)
        //add event listener
        button.onclick = function () {
          //alert('Reteta pentru ' + object[key])
          creazaReteta(object)
        }
        td.appendChild(button)
      }
      //add val to td as span
      var span = document.createElement('span')
      span.innerHTML = val || ''
      td.appendChild(span)
      tr.appendChild(td)
    })
    tbody.appendChild(tr)
  })

  //config according to visible_columns
  visible_columns.forEach((o) => {
    showHideColumn(o.state, o.column, thead_name, tbody_name)
  })

  console.log('visible_columns', visible_columns)
}

function showHideColumn(checkbox_state, column, thead_name, tbody_name) {
  //visible_columns
  //if exists update it's state
  try {
    visible_columns.find((o) => o.column === column).state = checkbox_state
  } catch (error) {
    visible_columns.push({ column: column, state: checkbox_state })
  } finally {
    console.log('visible_columns', visible_columns)
  }
  var thead = document.getElementById(thead_name)
  var ths = thead.getElementsByTagName('td')
  var columnIndex = -1
  Array.from(ths).forEach((th) => {
    if (th.innerHTML == column) {
      columnIndex = Array.from(ths).indexOf(th)
      //hide
      th.style.display = checkbox_state ? '' : 'none'
    }
  })
  //tbody
  var tbody = document.getElementById(tbody_name)
  var rows = tbody.rows
  Array.from(rows).forEach((row) => {
    row.cells[columnIndex].style.display = checkbox_state ? '' : 'none'
  })
}

function drawModalDialog(selected_combo, selected_ds) {
  extra_nivele_count = 0
  console.log('selected_combo', selected_combo)
  //add to modal id="modal-body"; 1. split combo by delimiter  2.add each part as a text input
  var modal_body = document.getElementById('modal-body')
  var modal_header = document.getElementById('modal-header')
  modal_body.innerHTML = ''
  modal_header.innerHTML = ''
  //add div container
  var container = document.createElement('div')
  container.classList.add('container')
  modal_header.appendChild(container)
  //create div for all selected_combo
  var row = document.createElement('div')
  row.classList.add('row')
  row.id = 'nivele_ofertare'
  container.appendChild(row)
  selected_combo.forEach(function (part) {
    var niv = document.createElement('h6')
    niv.id = _nivel_oferta + (selected_combo.indexOf(part) + 1)
    niv.classList.add('col-sm')
    niv.classList.add('text-primary')
    niv.innerHTML = part
    row.appendChild(niv)
  })

  //add all selected_ds['DENUMIRE_ARTICOL_OFERTA'] to modal id="modal-body" as a newly created select
  //create a div for select, label and button
  var row1 = document.createElement('div')
  row1.classList.add('row')
  row1.id = 'articole_antemasuratori'
  container.appendChild(row1)
  var div2 = document.createElement('div')
  div2.classList.add('col-sm-8')
  var select_articole = document.createElement('select')
  select_articole.id = 'articole'
  select_articole.name = 'articole'
  select_articole.classList.add('form-select')
  select_articole.classList.add('form-select-sm')
  //multiselect
  select_articole.multiple = true
  //8 rows
  select_articole.size = 8
  selected_ds.forEach(function (object) {
    var option = document.createElement('option')
    option.value = object['WBS']
    option.text =
      object['DENUMIRE_ARTICOL_OFERTA'] +
      ' - ' +
      object['CANTITATE_ARTICOL_OFERTA'] +
      ' [' +
      object['UM_ARTICOL_OFERTA'] +
      ']'
    select_articole.appendChild(option)
  })
  div2.appendChild(select_articole)
  row1.appendChild(div2)

  //add button Adauga in antemasuratori
  var div_btn = document.createElement('div')
  div_btn.classList.add('col-sm')
  var button = document.createElement('button')
  button.type = 'button'
  button.classList.add('btn')
  button.classList.add('btn-primary')
  button.classList.add('btn-sm')
  var arrow_down =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-down" viewBox="0 0 16 16">' +
    '<path fill-rule="evenodd" d="M8 1a.5.5 0 0 1 .5.5v11.793l3.146-3.147a.5.5 0 0 1 .708.708l-4 4a.5.5 0 0 1-.708 0l-4-4a.5.5 0 0 1 .708-.708L7.5 13.293V1.5A.5.5 0 0 1 8 1"></path>' +
    '</svg>'
  button.innerHTML = 'Antemasuratori' + arrow_down
  div_btn.appendChild(button)
  row1.appendChild(div_btn)
  button.onclick = function () {
    //adauga in ds_antemasuratori
    var selected_articole = []
    for (var i = 0; i < select_articole.options.length; i++) {
      if (select_articole.options[i].selected) {
        selected_articole.push(select_articole.options[i].value)
      }
    }
    console.log('selected_articole', selected_articole)
    //find selected WBS  in selected_ds['WBS'] => a new ds with only selected WBS
    selected_ds.forEach(function (object) {
      if (selected_articole.includes(object['WBS'])) {
        ds_antemasuratori.push(object)
      }
    })
    console.log('ds_antemasuratori', ds_antemasuratori)

    var new_levels = []
    for (var i = 0; i < selected_combo.length; i++) {
      new_levels.push(_nivel_oferta + (i + 1))
    }

    console.log('new_levels', new_levels)

    //enumarate keys din ds_antemasuratori
    var cut1,
      cut2,
      keys = Object.keys(ds_antemasuratori[0])
    console.log('keys', keys)
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].includes(_nivel_oferta)) {
        cut1 = i
      }
      if (keys[i].includes(_nivel_cantitate_articol_oferta)) {
        if (!document.getElementById('tbody_antemasuratori')) {
          cut2 = i
        } else {
          cut2 = i - 1
        }
      }
    }

    console.log('cut1', cut1)
    console.log('cut1', cut2)

    var rearranged_ds_antemasuratori = []
    //=> ds_antemasuratori keys: 0 ... cut1 ramains the same + add unique new_levels: selected_combo + add remaining cut1+1 ... end
    ds_antemasuratori.forEach(function (object) {
      var new_object = {}
      for (var i = 0; i < cut1 + 1; i++) {
        new_object[keys[i]] = object[keys[i]]
      }
      for (var i = 0; i < new_levels.length; i++) {
        new_object[new_levels[i]] = selected_combo[i].toString()
      }
      for (var i = cut1 + 1; i <= cut2; i++) {
        new_object[keys[i]] = object[keys[i]]
      }
      new_object[_cantitate_antemasuratori] =
        `<input type="text" class="form-control form-control-sm bg-warning cantitate_articol_antemasuratori" value="0" />`
      for (var i = cut2 + 1; i < keys.length; i++) {
        new_object[keys[i]] = object[keys[i]]
      }
      rearranged_ds_antemasuratori.push(new_object)
    })

    ds_antemasuratori = [...rearranged_ds_antemasuratori]

    console.log('ds_antemasuratori', ds_antemasuratori)

    //create table

    var table = document.getElementById('table_antemasuratori') || document.createElement('table')
    table.classList.add('table')
    table.classList.add('table-sm')
    table.classList.add('table-bordered')
    table.classList.add('table-hover')
    table.classList.add('table-striped')
    table.classList.add('table-responsive')
    table.id = 'table_antemasuratori'
    //get or create thead and tbody antemasuratori
    var thead_antemasuratori =
      document.getElementById('thead_antemasuratori') || document.createElement('thead')
    thead_antemasuratori.id = 'thead_antemasuratori'
    var tbody_antemasuratori =
      document.getElementById('tbody_antemasuratori') || document.createElement('tbody')
    tbody_antemasuratori.id = 'tbody_antemasuratori'
    table.appendChild(thead_antemasuratori)
    table.appendChild(tbody_antemasuratori)
    modal_body.appendChild(table)
    pushDataToTable(ds_antemasuratori, 'thead_antemasuratori', 'tbody_antemasuratori')
  }
}

function saveChanges() {
  document.getElementById('modal-body').innerHTML = ''
  //close modal
  var modal = new bootstrap.Modal(document.getElementById('AntemasuratoriModal'))
  modal.hide()
}

async function saveOferta() {
  var trdr = document.getElementById('trdr').value
  var trndate = document.getElementById('trndate').value
  var prjc = document.getElementById('prjc').value
  if (!trdr) {
    alert('Selectati un client')
    return
  }

  if (!trndate) {
    alert('Selectati o data')
    return
  }

  if (!prjc) {
    alert('Selectati un proiect')
    return
  }

  //CCCOFERTELINII array of objects, a object is a row from original_ds astfel (mapare original_ds => CCCOFERTELINII)
  //1. original_ds ARTICOL => ART
  //2. OFERTA => OFRT
  //3. replace all "_" with "" in keys
  //4. NORMA => NORM
  //5. MATERIAL => MTRL
  //5. UNTITARA => UNITA
  //6. MANOPERA => MANOP
  //7. VANZARE => VANZ
  //8. TRANSPORT => TRANSP

  if (!original_ds.length) {
    alert('Nu exista date pentru salvare')
    return
  }

  var hourglassIcon =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-hourglass-split" viewBox="0 0 16 16">' +
    '<path d="M2.5 15a.5.5 0 1 1 0-1h1v-1a4.5 4.5 0 0 1 2.557-4.06c.29-.139.443-.377.443-.59v-.7c0-.213-.154-.451-.443-.59A4.5 4.5 0 0 1 3.5 3V2h-1a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1h-1v1a4.5 4.5 0 0 1-2.557 4.06c-.29.139-.443.377-.443.59v.7c0 .213.154.451.443.59A4.5 4.5 0 0 1 12.5 13v1h1a.5.5 0 0 1 0 1zm2-13v1c0 .537.12 1.045.337 1.5h6.326c.216-.455.337-.963.337-1.5V2zm3 6.35c0 .701-.478 1.236-1.011 1.492A3.5 3.5 0 0 0 4.5 13s.866-1.299 3-1.48zm1 0v3.17c2.134.181 3 1.48 3 1.48a3.5 3.5 0 0 0-1.989-3.158C8.978 9.586 8.5 9.052 8.5 8.351z"/>' +
    '</svg>'
  var btn_oferta = document.getElementById('btn_oferta')
  btn_oferta.innerHTML = hourglassIcon + ' Salvare...'
  //bg-warning
  btn_oferta.classList.remove('btn-danger')
  btn_oferta.classList.add('btn-info')
  //exec getValFromQuery and get findoc from result.value
  var findoc = 0
  await connectToS1Service().then(async (result) => {
    const clientID = result.token
    console.log('clientID', clientID)
    await client
      .service('getValFromQuery')
      .find({
        query: {
          clientID: clientID,
          appId: 1001,
          sqlQuery: "select ident_current('findoc') + ident_incr('findoc')"
        }
      })
      .then((result) => {
        console.log('result', result)
        findoc = result.value
      })
      .catch((error) => {
        console.log('error', error)
      })
  })

  var CCCOFERTELINII = []
  original_ds.forEach(function (object) {
    //read object key, apply 1..8
    var new_object = {}
    var keys = Object.keys(object)
    keys.forEach(function (key) {
      var new_key = key
      new_key = new_key.replace('ARTICOL', 'ART')
      new_key = new_key.replace('OFERTA', 'OFRT')
      new_key = new_key.replace('NORMA', 'NORM')
      new_key = new_key.replace('MATERIAL', 'MTRL')
      new_key = new_key.replace('UNTITARA', 'UNITA')
      new_key = new_key.replace('MANOPERA', 'MANOP')
      new_key = new_key.replace('VANZARE', 'VANZ')
      new_key = new_key.replace('TRANSPORT', 'TRANSP')
      //replace all _
      new_key = new_key.replace(/_/g, '')
      new_object[new_key] = object[key]
      new_object['PRJC'] = prjc
      new_object['FINDOC'] = findoc
    })
    CCCOFERTELINII.push(new_object)
  })

  console.log('CCCOFERTELINII', CCCOFERTELINII)

  var jsonToSend = {
    service: 'setData',
    appId: 1001,
    OBJECT: 'CCCOFERTE',
    FORM: 'Oferte',
    KEY: '',
    DATA: {
      SALDOC: [
        {
          SERIES: '4002',
          TRDR: trdr,
          TRNDATE: trndate,
          PRJC: prjc,
          COMMENTS: 'From the web app'
        }
      ],
      CCCOFERTELINII: CCCOFERTELINII
    }
  }

  console.log('jsonToSend', jsonToSend)

  await connectToS1Service()
    .then(async (result) => {
      const clientID = result.token
      console.log('clientID', clientID)
      jsonToSend.clientID = clientID
      await client
        .service('setDocument')
        .create(jsonToSend)
        .then((result) => {
          console.log('result', result)
          if (result.success) {
            btn_oferta.innerHTML = 'Oferta salvata cu findoc=' + result.id
            btn_oferta.classList.remove('btn-info')
            btn_oferta.classList.add('btn-success')
            //disable button
            btn_oferta.disabled = true
          } else {
            btn_oferta.innerHTML = 'Eroare'
            btn_oferta.classList.remove('btn-info')
            btn_oferta.classList.add('btn-danger')
          }
        })
        .catch((error) => {
          console.log('error', error)
        })
    })
    .catch((error) => {
      console.log('error', error)
    })
}

function populateSelectIerarhiiFromTrees() {
  var select = document.getElementById('ierarhii')
  select.innerHTML = ''
  //add default option
  var option = document.createElement('option')
  option.value = '1'
  option.text = 'Toate ierarhiile'
  select.appendChild(option)
  trees.forEach(function (tree, index) {
    tree.forEach(function (branch) {
      var option = document.createElement('option')
      option.value = branch.join('~~~~~~~~~~~~~~~')
      option.text = branch.join(' - ')
      select.appendChild(option)
    })
  })
}

//add to .cantitate_articol_antemasuratori on arrow up/down => move to next/previous input
document.addEventListener('keydown', function (e) {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    var inputs = document.querySelectorAll('.cantitate_articol_antemasuratori')
    var index = Array.from(inputs).indexOf(document.activeElement)
    if (index > -1) {
      if (e.key === 'ArrowUp') {
        if (index > 0) {
          inputs[index - 1].focus()
        }
      } else if (e.key === 'ArrowDown') {
        if (index < inputs.length - 1) {
          inputs[index + 1].focus()
        }
      }
    }
  }
})

//add to .cantitate_articol_antemasuratori on enter => move to next input
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    var inputs = document.querySelectorAll('.cantitate_articol_antemasuratori')
    var index = Array.from(inputs).indexOf(document.activeElement)
    if (index > -1) {
      if (index < inputs.length - 1) {
        inputs[index + 1].focus()
      }
    }
  }
})

//add to .cantitate_articol_antemasuratori on focus => select all text
document.addEventListener('focus', function (e) {
  if (e.target.classList.contains('cantitate_articol_antemasuratori')) {
    e.target.select()
  }
})

//add to .cantitate_articol_antemasuratori on input => ds_antemasuratori[index][CANTITATE_ARTICOL_ANTEMASURATORI] = input.value
document.addEventListener('input', function (e) {
  if (e.target.classList.contains('cantitate_articol_antemasuratori')) {
    var index = Array.from(document.querySelectorAll('.cantitate_articol_antemasuratori')).indexOf(e.target)
    console.log('index', index)
    ds_antemasuratori[index][_cantitate_antemasuratori] = parseFloat(e.target.value)
    console.log('ds_antemasuratori', ds_antemasuratori)
  }
})

//add onload event to window
export function init() {
  let btn_top = document.getElementById('btn_top')
  btn_top.onclick = function () {
    window.scrollTo(0, 0)
  }
  let btn_column_filter = document.getElementById('btn_column_filter')
  btn_column_filter.onclick = function () {
    let tbl = document.getElementById('my_table_oferta_initiala')
    let menu = tbl.shadowRoot.getElementById('table_menu_content')
    if (menu.style.display === 'none') {
      menu.style.display = 'block'
    } else {
      menu.style.display = 'none'
    }
  }
  let btn_oferta = document.getElementById('btn_oferta')
  btn_oferta.onclick = saveOferta
  let file_oferta_initiala = document.getElementById('file_oferta_initiala')
  file_oferta_initiala.onchange = loadDataFromFile
  //btn_oferta text = 'left arrow' + 'Incarca oferta initiala'
  const al =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-left" viewBox="0 0 16 16">' +
    '<path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8"></path>' +
    '</svg>'
  btn_oferta.innerHTML = al + 'Incarca oferta initiala'
  btn_oferta.classList.remove('btn-danger')
  btn_oferta.classList.add('btn-success')
  let btn_save_antemasuratori = document.getElementById('btn_save_antemasuratori')
  btn_save_antemasuratori.onclick = saveChanges
  let btn_save_graph = document.getElementById('btn_save_graph')
  //btn_save_graph populateSelectIerarhiiFromTrees()
  btn_save_graph.onclick = populateSelectIerarhiiFromTrees
  let scan_oferta_initiala = document.getElementById('scan_oferta_initiala')
  scan_oferta_initiala.onclick = async function () {
    let rez = await createDatasetForRecipes()
    console.log('rez', rez)
    let roots = rez.roots
    recipes_ds = rez.recipes_dset
    pushDataToTable(roots, 'thead_oferta_initiala', 'tbody_oferta_initiala')
    fillInRecipes()
  }
  let vizualizare_oferta_optimizata = document.getElementById('vizualizare_oferta_optimizata')
  vizualizare_oferta_optimizata.onclick = function () {
    pushDataToTable(optimal_ds, 'thead_oferta_optimizata', 'tbody_oferta_optimizata')
  }
  let vizulizare_oferta_initiala = document.getElementById('vizualizare_oferta_initiala')
  vizulizare_oferta_initiala.onclick = function () {
    pushDataToTable(original_ds, 'thead_oferta_initiala', 'tbody_oferta_initiala')
  }
  document.getElementById('trndate').valueAsDate = new Date()
  let select_trdr = document.getElementById('trdr')
  //populate select_trdr by calling S1 service getDataset
  connectToS1Service()
    .then(async (result) => {
      const clientID = result.token
      console.log('clientID', clientID)
      var params = {
        query: {
          clientID: clientID,
          appID: '1001',
          sqlQuery: 'select TRDR, NAME from trdr where sodtype=13 and isactive=1 order by NAME asc'
        }
      }

      await client
        .service('getDataset')
        .find(params)
        .then((result) => {
          console.log('result', result)
          if (result.success) {
            //populate select_trdr
            result.data.forEach(function (object) {
              var option = document.createElement('option')
              option.value = object['TRDR']
              option.text = object['NAME']
              select_trdr.appendChild(option)
            })
            select_trdr.selectedIndex = -1
          } else {
            console.log('error', result.error)
          }
          //select id="prjc" populate by calling S1 service getDataset
          var select_prjc = document.getElementById('prjc')
          var params = {
            query: {
              clientID: clientID,
              appID: '1001',
              sqlQuery:
                'select PRJC, NAME from prjc where isactive=1 and ' +
                //not olde than 2 years
                'insdate > dateadd(year, -2, getdate()) ' +
                'order by insdate desc'
            }
          }

          client
            .service('getDataset')
            .find(params)
            .then((result) => {
              console.log('result', result)
              if (result.success) {
                //populate select_prjc
                result.data.forEach(function (object) {
                  var option = document.createElement('option')
                  option.value = object['PRJC']
                  option.text = object['NAME']
                  select_prjc.appendChild(option)
                })
                select_prjc.selectedIndex = -1
                //populate saldoc by calling S1 service getDataset
                var select_saldoc = document.getElementById('saldoc')
                var params = {
                  query: {
                    clientID: clientID,
                    appID: '1001',
                    sqlQuery:
                      'select FINDOC, FINCODE from findoc where iscancel=0 and sosource=1351 and fprms=4001 and series=4002 order by trndate desc, findoc desc'
                  }
                }

                client
                  .service('getDataset')
                  .find(params)
                  .then((result) => {
                    console.log('result', result)
                    if (result.success) {
                      //populate select_saldoc
                      result.data.forEach(function (object) {
                        var option = document.createElement('option')
                        option.value = object['FINDOC']
                        option.text = object['FINCODE']
                        select_saldoc.appendChild(option)
                      })
                      select_saldoc.selectedIndex = -1
                    } else {
                      console.log('error', result.error)
                    }
                  })
                  .catch((error) => {
                    console.log('error', error)
                  })
              } else {
                console.log('error', result.error)
              }
            })
            .catch((error) => {
              console.log('error', error)
            })
        })
        .catch((error) => {
          console.log('error', error)
        })
    })
    .catch((error) => {
      console.log('error', error)
    })
}

function creazaReteta(object) {
  //object = {DENUMIRE_ARTICOL_OFERTA: "SUPRATERAN", CANTITATE_ARTICOL_OFERTA: 1, UM_ARTICOL_OFERTA: "buc", WBS: "1.1.1"}
  //show modal ModalReteta with object
  var modalReteta = new bootstrap.Modal(document.getElementById('ModalReteta'))
  var modal_body = document.getElementById('modal-body2')
  modal_body.innerHTML = ''
  //headerLabel2
  var headerLabel2 = document.getElementById('headerLabel2')
  headerLabel2.innerHTML =
    'Reteta pentru ' +
    object.WBS +
    ' ' +
    object.DENUMIRE_ARTICOL_OFERTA +
    ' - ' +
    object.CANTITATE_ARTICOL_OFERTA +
    ' [' +
    object.UM_ARTICOL_OFERTA +
    ']'
  //add button Adauga activitate
  var div_btn = document.createElement('div')
  div_btn.classList.add('col-sm')
  var button = document.createElement('button')
  button.type = 'button'
  button.classList.add('btn')
  button.classList.add('btn-primary')
  button.classList.add('btn-sm')
  //add plus icon
  var plus_icon = document.createElement('i')
  plus_icon.classList.add('bi')
  plus_icon.classList.add('bi-plus')
  button.appendChild(plus_icon)
  button.innerHTML += ' Adauga activitate'
  div_btn.appendChild(button)
  headerLabel2.appendChild(div_btn)
  button.onclick = function () {
    //adauga activitate
    //add empty row to table_activitati_reteta, contenteditable
    var tbody = document.getElementById('tbody_reteta')
    var tr = document.createElement('tr')
    tbody.appendChild(tr)
    //add td with delete icon
    var td = document.createElement('td')
    var icon = document.createElement('i')
    icon.classList.add('bi')
    icon.classList.add('bi-trash')
    icon.classList.add('text-danger')
    icon.style.cursor = 'pointer'
    icon.onclick = function () {
      //delete row
      tbody.removeChild(tr)
    }
    td.appendChild(icon)
    //add list icon
    var icon = document.createElement('i')
    icon.classList.add('bi')
    icon.classList.add('bi-list')
    icon.classList.add('text-primary')
    icon.style.cursor = 'pointer'
    icon.onclick = function () {
      alert('Materiale pentru ' + object.WBS)
    }
    td.appendChild(icon)
    tr.appendChild(td)
    //add td with contenteditable
    for (var i = 0; i < 11; i++) {
      var td = document.createElement('td')
      //spellcheck = false
      td.spellcheck = false
      td.contentEditable = true
      if (i == 0) {
        //WBS
        td.innerHTML = object.WBS + '.' + tbody.rows.length
      } else if (i == 2) {
        //select with TIP_ACTIVITATE_ARTICOL_RETETA
        var select = document.createElement('select')
        select.classList.add('form-select')
        select.classList.add('form-select-sm')
        select.id = 'TIP_ACTIVITATE_ARTICOL_RETETA'
        for (var j = 0; j < TIP_ACTIVITATE_ARTICOL_RETETA.length; j++) {
          var option = document.createElement('option')
          option.value = j
          option.text = TIP_ACTIVITATE_ARTICOL_RETETA[j]
          select.appendChild(option)
        }
        td.appendChild(select)
      } else if (i == 3) {
        //select with SUBTIP_ACTIVITATE_ARTICOL_RETETA
        var select = document.createElement('select')
        select.classList.add('form-select')
        select.classList.add('form-select-sm')
        select.id = 'SUBTIP_ACTIVITATE_ARTICOL_RETETA'
        for (var j = 0; j < SUBTIP_ACTIVITATE_ARTICOL_RETETA.length; j++) {
          var option = document.createElement('option')
          option.value = j
          option.text = SUBTIP_ACTIVITATE_ARTICOL_RETETA[j]
          select.appendChild(option)
        }
        td.appendChild(select)
      } else {
        td.innerHTML = ''
      }
      tr.appendChild(td)
    }
  }
  //create table with header: WBS, DENUMIRE_ACTIVITATE_ARTICOL_RETETA, TIP_ACTIVITATE_ARTICOL_RETETA, SUBTIP_ACTIVITATE_ARTICOL_RETETA, UM_ACTIVITATE_ARTICOL_RETETA, CANTITATE_UNITARA_ACTIVITATE_ARTICOL_RETETA, TOTAL_CANTITATE_ACTIVITATE_ARTICOL_RETETA, PONDERE_DECONT_ACTIVITATE_ARTICOL_RETETA, PONDERE_NORMA_ACTIVITATE_ARTICOL_RETETA, TOTAL_ORE_MANOPERA_ACTIVITATE_ARTICOL_RETETA,NORMA_UNITARA_ORE_MANOPERA_ACTIVITATE_ARTICOL_RETETA
  var table = document.createElement('table')
  //id
  table.id = 'table_activitati_reteta'
  table.classList.add('table')
  table.classList.add('table-sm')
  table.classList.add('table-bordered')
  table.classList.add('table-hover')
  table.classList.add('table-striped')
  table.classList.add('table-responsive')
  var thead = document.createElement('thead')
  thead.id = 'thead_reteta'
  var tbody = document.createElement('tbody')
  tbody.id = 'tbody_reteta'
  table.appendChild(thead)
  table.appendChild(tbody)
  modal_body.appendChild(table)
  //create thead
  var tr = document.createElement('tr')
  thead.appendChild(tr)
  //add Actions column: lines will contain a +, an edit and a trash icon
  var th = document.createElement('th')
  th.style.writingMode = 'vertical-rl'
  th.style.rotate = '180deg'
  th.classList.add('header')
  //add scope col
  th.setAttribute('scope', 'col')
  th.innerHTML = 'Actions'
  tr.appendChild(th)
  th = document.createElement('th')
  th.style.writingMode = 'vertical-rl'
  th.style.rotate = '180deg'
  th.classList.add('header')
  //add scope col
  th.setAttribute('scope', 'col')
  th.innerHTML = 'WBS'
  tr.appendChild(th)
  th = document.createElement('th')
  th.style.writingMode = 'vertical-rl'
  th.style.rotate = '180deg'
  th.classList.add('header')
  //add scope col
  th.setAttribute('scope', 'col')
  th.innerHTML = 'DENUMIRE_ACTIVITATE_ARTICOL_RETETA'
  tr.appendChild(th)
  th = document.createElement('th')
  th.style.writingMode = 'vertical-rl'
  th.style.rotate = '180deg'
  th.classList.add('header')
  //add scope col
  th.setAttribute('scope', 'col')
  th.innerHTML = 'TIP_ACTIVITATE_ARTICOL_RETETA'
  tr.appendChild(th)
  th = document.createElement('th')
  th.style.writingMode = 'vertical-rl'
  th.style.rotate = '180deg'
  th.classList.add('header')
  //add scope col
  th.setAttribute('scope', 'col')
  th.innerHTML = 'SUBTIP_ACTIVITATE_ARTICOL_RETETA'
  tr.appendChild(th)
  th = document.createElement('th')
  th.style.writingMode = 'vertical-rl'
  th.style.rotate = '180deg'
  th.classList.add('header')
  //add scope col
  th.setAttribute('scope', 'col')
  th.innerHTML = 'UM_ACTIVITATE_ARTICOL_RETETA'
  tr.appendChild(th)
  th = document.createElement('th')
  th.style.writingMode = 'vertical-rl'
  th.style.rotate = '180deg'
  th.classList.add('header')
  //add scope col
  th.setAttribute('scope', 'col')
  th.innerHTML = 'CANTITATE_UNITARA_ACTIVITATE_ARTICOL_RETETA'
  tr.appendChild(th)
  th = document.createElement('th')
  th.style.writingMode = 'vertical-rl'
  th.style.rotate = '180deg'
  th.classList.add('header')
  //add scope col
  th.setAttribute('scope', 'col')
  th.innerHTML = 'TOTAL_CANTITATE_ACTIVITATE_ARTICOL_RETETA'
  tr.appendChild(th)
  var th = document.createElement('th')
  th.style.writingMode = 'vertical-rl'
  th.style.rotate = '180deg'
  th.classList.add('header')
  //add scope col
  th.setAttribute('scope', 'col')
  th.innerHTML = 'PONDERE_DECONT_ACTIVITATE_ARTICOL_RETETA'
  tr.appendChild(th)
  th = document.createElement('th')
  th.style.writingMode = 'vertical-rl'
  th.style.rotate = '180deg'
  th.classList.add('header')
  //add scope col
  th.setAttribute('scope', 'col')
  th.innerHTML = 'PONDERE_NORMA_ACTIVITATE_ARTICOL_RETETA'
  tr.appendChild(th)
  th = document.createElement('th')
  th.style.writingMode = 'vertical-rl'
  th.style.rotate = '180deg'
  th.classList.add('header')
  //add scope col
  th.setAttribute('scope', 'col')
  th.innerHTML = 'TOTAL_ORE_MANOPERA_ACTIVITATE_ARTICOL_RETETA'
  tr.appendChild(th)
  th = document.createElement('th')
  th.style.writingMode = 'vertical-rl'
  th.style.rotate = '180deg'
  th.classList.add('header')
  //add scope col
  th.setAttribute('scope', 'col')
  th.innerHTML = 'NORMA_UNITARA_ORE_MANOPERA_ACTIVITATE_ARTICOL_RETETA'
  tr.appendChild(th)
  modalReteta.show()
}

async function createDatasetForRecipes() {
  //push from optimal_ds  to recipes_ds with (TIP_ARTICOL_OFERTA; SUBTIP_ARTICOL_OFERTA) one of these combinations: (Articol;Principal), (Articol;Manopera), (Articol; Transport) si (Articol; Utilaj)
  //pushDataToTable
  var mainCombo = [
    ['Articol', 'Principal'],
    ['Articol', 'Manopera'],
    ['Articol', 'Transport'],
    ['Articol', 'Utilaj']
  ]

  let recipes_dset = []
  for (const object of optimal_ds) {
    if (
      //object has key TIP_ARTICOL_OFERTA and SUBTIP_ARTICOL_OFERTA
      Object.keys(object).includes('TIP_ARTICOL_OFERTA') &&
      Object.keys(object).includes('SUBTIP_ARTICOL_OFERTA')
    ) {
      if (object['TIP_ARTICOL_OFERTA'] && object['SUBTIP_ARTICOL_OFERTA']) {
        for (const combo of mainCombo) {
          if (
            object['TIP_ARTICOL_OFERTA'].toLowerCase() == combo[0].toLowerCase() &&
            object['SUBTIP_ARTICOL_OFERTA'].toLowerCase() == combo[1].toLowerCase()
          ) {
            recipes_dset.push({ root: object })
          }
        }
      } else {
        console.log('object does not have values for TIP_ARTICOL_OFERTA and SUBTIP_ARTICOL_OFERTA', object)
      }
    } else {
      console.log('object does not have keys TIP_ARTICOL_OFERTA and SUBTIP_ARTICOL_OFERTA', object)
    }
  }

  console.log('recipes_dset', recipes_dset)

  //get array of roots to display
  let roots = []
  recipes_dset.forEach(function (object) {
    roots.push(object.root)
  })

  return { recipes_dset, roots }
}

async function fillInRecipes() {
  for (const object of recipes_ds) {
    const root = object.root
    const children = []
    for (const obj of optimal_ds) {
      if (Object.keys(obj).includes('WBS')) {
        if (obj['WBS']) {
          if (
            obj['WBS'].startsWith(root['WBS']) &&
            obj['WBS'].split('.').length == root['WBS'].split('.').length + 1 &&
            Number.isInteger(parseInt(obj['WBS'].split('.').pop()))
          ) {
            children.push(obj)
          }
        } else {
          console.log('object does not have value for key WBS', obj)
        }
      } else {
        console.log('object does not have key WBS', obj)
      }
    }
    object.children = children
  }
}

const template = document.createElement('template')
template.innerHTML = `
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.0-beta1/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-0evHe/X+R7YkIZDRvuzKMRqM+OrBnVFBL6DOitfPri4tjfHxaWutUpFmBp4vmVor" crossorigin="anonymous">`

class myTable extends LitElement {
  //see https://pwp.stevecassidy.net/javascript/lit/ => custom class myTable -with ds as a reactive propertiy that would trigger a re-render when it changes; uses connectedCallback to set up the initial render
  static properties = {
    ds: { type: Array }
  }

  constructor() {
    super()
    this.tableId = 'my-table'
    this.ds = []
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(template.content.cloneNode(true))
  }

  //css
  static styles = css`
    .table td {
      border-bottom: 1px solid #e9ecef;
      border-right: 1px solid #e9ecef;
    }

    .table th {
      font-weight: normal;
      border-right: 1px solid #e9ecef;
    }

    #table_menu_content {
      position: absolute;
      left: 0;
      top: 0;
      padding: 10px;
      border-radius: 5px;
    }
  `

  connectedCallback() {
    super.connectedCallback()
    console.log('my-table element added to the DOM')
  }

  render() {
    console.log('rendering my-table element with following array', this.ds, 'added at', new Date())
    console.log('tableId', this.tableId)

    var my_table_oferta_initiala = document.getElementById('my_table_oferta_initiala')
    //if this element has div with id = table_menu_content, remove it
    var table_menu_content = my_table_oferta_initiala.shadowRoot.getElementById('table_menu_content')
    if (table_menu_content) {
      my_table_oferta_initiala.shadowRoot.removeChild(table_menu_content)
    }

    if (!this.ds || this.ds.length == 0) {
      return html`<p class="label label-danger">No data</p>`
    } else {
      //add table
      var table = document.getElementById('table_' + this.tableId) || document.createElement('table')
      table.classList.add('table')
      table.classList.add('table-sm')
      table.classList.add('table-hover')
      table.id = 'table_' + this.tableId
      //get or create thead and tbody
      var thead = document.getElementById('thead_' + this.tableId) || document.createElement('thead')
      thead.id = 'thead_' + this.tableId
      thead.classList.add('align-middle')
      var tbody = document.getElementById('tbody_' + this.tableId) || document.createElement('tbody')
      tbody.id = 'tbody_' + this.tableId
      tbody.classList.add('table-group-divider')
      table.appendChild(thead)
      table.appendChild(tbody)
      //create a way to handle column visibility
      //1. create a hidden div with id = table_menu_content
      //2. when btn btn_column_filter is clicked, toggle display of table_menu_content
      var table_menu_content =
        my_table_oferta_initiala.shadowRoot.getElementById('table_menu_content') ||
        document.createElement('div')
      table_menu_content.id = 'table_menu_content'
      table_menu_content.style.display = 'none'
      table_menu_content.innerHTML = ''
      //add checkboxes for each column
      var keys = Object.keys(this.ds[0])
      keys.forEach(function (key) {
        var div = document.createElement('div')
        var input = document.createElement('input')
        input.type = 'checkbox'
        input.id = key
        input.checked = true
        div.appendChild(input)
        var label = document.createElement('label')
        label.for = key
        label.innerHTML = key
        div.appendChild(label)
        table_menu_content.appendChild(div)
      })

      //add table_menu_content to my_table_oferta_initiala
      my_table_oferta_initiala.shadowRoot.appendChild(table_menu_content)

      //add thead
      var tr = document.createElement('tr')
      thead.appendChild(tr)
      //append counter
      var th = document.createElement('th')
      th.scope = 'col'
      tr.appendChild(th)
      for (var key in this.ds[0]) {
        var th = document.createElement('th')
        th.scope = 'col'
        th.style.writingMode = 'vertical-rl'
        th.style.rotate = '180deg'
        th.innerHTML = key
        tr.appendChild(th)
      }
      //add tbody
      let counter = 0
      this.ds.forEach(function (object) {
        counter++
        var tr = document.createElement('tr')
        tbody.appendChild(tr)
        var td = document.createElement('td')
        td.style.fontWeight = 'bold'
        td.innerHTML = counter
        tr.appendChild(td)
        for (var key in object) {
          var td = document.createElement('td')
          td.innerHTML = typeof object[key] === 'number' ? object[key].toFixed(2) : object[key]
          tr.appendChild(td)
        }
      })

      return html`${table}`
    }
  }
}

customElements.define('my-table', myTable)
