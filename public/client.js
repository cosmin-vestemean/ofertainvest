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
var activitati_oferta = []
var intrari_orfane = []
var WBSMap = []

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
        document.getElementById('my_table_oferta_initiala').ds = optimal_ds
        return
      }

      filterOptimalDs(select.value, optimal_ds, delimiter)

      //create table rows
      if (selected_ds.length > 0) {
        //pushDataToTable(selected_ds, 'thead_oferta_initiala', 'tbody_oferta_initiala')
        //my-table component
        document.getElementById('my_table_oferta_initiala').ds = selected_ds
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

function pushDataToTable(data, thead, tbody) {
  //create html table from array
  //data > table id="table_oferta_initiala"
  //thead id="thead_oferta_initiala" < first object's keys
  //tbody id="tbody_oferta_initiala" < all objects as rows
  var pg = document.getElementById('progress_bar')
  var lbl = document.getElementById('progress_bar_label')
  //var thead = document.getElementById(thead_name)
  const thead_name = thead.id
  thead.innerHTML = ''
  //var tbody = document.getElementById(tbody_name)
  const tbody_name = tbody.id
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
            //pushDataToTable(optimal_ds, thead_name, tbody_name)
            document.getElementById('my_table_oferta_initiala').ds = optimal_ds
          } else {
            var selected_option = object[key]
            denumireUnica_ds = []
            optimal_ds.forEach(function (object) {
              if (object[key] == selected_option) {
                denumireUnica_ds.push(object)
              }
            })
            console.log('denumireUnica_ds', denumireUnica_ds)
            //pushDataToTable(denumireUnica_ds, thead_name, tbody_name)
            document.getElementById('my_table_oferta_initiala').ds = denumireUnica_ds
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
    let rez = createDatasetForRecipes()
    console.log('rez', rez)
    activitati_oferta = []
    WBSMap = []
    recipes_ds = []
    intrari_orfane = []
    rez.resultFiltered.forEach((obj) => {
      let reteta = obj.reteta
      reteta.forEach((activitate) => {
        activitati_oferta.push(activitate.object)
      })
    })

    intrari_orfane = rez.orphans
    WBSMap = rez.trees
    recipes_ds = rez.resultFiltered

    const my_table = document.getElementById('my_table_oferta_initiala')
    /* const thead = my_table.shadowRoot.getElementById('thead_oferta_initiala')
    const tbody = my_table.shadowRoot.getElementById('tbody_oferta_initiala')
    pushDataToTable(roots, thead, tbody) */
    my_table.ds = activitati_oferta
  }
  let orfani = document.getElementById('orfani')
  orfani.onclick = async function () {
    let orfani = []
    if (intrari_orfane && intrari_orfane.length > 0) {
      intrari_orfane.forEach((o) => {
        let orfan = o.object
        orfani.push(orfan)
      })
    } else {
      orfani = [
        {
          WBS: 0,
          DENUMIRE_ARTICOL_OFERTA: 'Nu exista intrari orfane',
          TIP_ARTICOL_OFERTA: '',
          SUBTIP_ARTICOL_OFERTA: '',
          UM_ARTICOL_OFERTA: ''
        }
      ]
    }

    const my_table = document.getElementById('my_table_oferta_initiala')
    /* const thead = my_table.shadowRoot.getElementById('thead_oferta_initiala')
    const tbody = my_table.shadowRoot.getElementById('tbody_oferta_initiala')
    pushDataToTable(orfani, thead, tbody) */
    my_table.ds = orfani
  }
  let vizualizare_oferta_optimizata = document.getElementById('vizualizare_oferta_optimizata')
  vizualizare_oferta_optimizata.onclick = function () {
    /* const my_table = document.getElementById('my_table_oferta_initiala')
    const thead = my_table.shadowRoot.getElementById('thead_oferta_initiala')
    const tbody = my_table.shadowRoot.getElementById('tbody_oferta_initiala')
    pushDataToTable(optimal_ds, thead, tbody) */
    const my_table = document.getElementById('my_table_oferta_initiala')
    my_table.ds = optimal_ds
  }
  let vizulizare_oferta_initiala = document.getElementById('vizualizare_oferta_initiala')
  /* const my_table = document.getElementById('my_table_oferta_initiala')
  const thead = my_table.shadowRoot.getElementById('thead_oferta_initiala')
  const tbody = my_table.shadowRoot.getElementById('tbody_oferta_initiala') */
  vizulizare_oferta_initiala.onclick = function () {
    //pushDataToTable(original_ds, thead, tbody)
    const my_table = document.getElementById('my_table_oferta_initiala')
    my_table.ds = original_ds
  }
  //WBSMap
  let WBSMap = document.getElementById('WBSMap')
  WBSMap.onclick = function () {
    const levels = WBSMap.length
    console.log('levels', levels)

    var modal = new bootstrap.Modal(document.getElementById('ModalGeneric'))
    var modal_body = document.getElementById('modal-body3')
    modal_body.innerHTML = ''

    //for each level, create a table with 1 row and n columns, each column containing a node
    for (let i = 0; i < levels; i++) {
      var table = document.createElement('table')
      table.classList.add('table')
      table.classList.add('table-sm')
      table.classList.add('table-bordered')
      table.classList.add('table-hover')
      table.classList.add('table-striped')
      table.classList.add('table-responsive')
      var thead = document.createElement('thead')
      table.appendChild(thead)
      var tr = document.createElement('tr')
      thead.appendChild(tr)
      WBSMap[i].forEach(function (node) {
        var th = document.createElement('th')
        th.innerHTML = node
        tr.appendChild(th)
      })
      //show modal id ModalGeneric
      modal_body.appendChild(table)
    }

    modal.show()
  }
  let lista_retete = document.getElementById('lista_retete')
  lista_retete.onclick = function() {
    showRecipesList(recipes_ds);
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

function createDatasetForRecipes() {
  return createTreesFromWBS(optimal_ds)
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
      opacity: 0.9;
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
      //stylish
      table_menu_content.classList.add('bg-dark')
      table_menu_content.classList.add('text-light')
      table_menu_content.classList.add('rounded')
      table_menu_content.classList.add('shadow')
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
        //add event listener to input
        input.addEventListener('change', function () {
          //toggle display of column
          var index = keys.indexOf(key) + 1 //beacause of counter
          var ths = thead.getElementsByTagName('th')
          var tds = tbody.getElementsByTagName('td')
          if (input.checked) {
            ths[index].style.display = 'table-cell'
            for (var i = index; i < tds.length; i += keys.length) {
              tds[i].style.display = 'table-cell'
            }
          } else {
            ths[index].style.display = 'none'
            for (var i = index; i < tds.length; i += keys.length) {
              tds[i].style.display = 'none'
            }
          }
        })
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

function compareWBS(a, b) {
  const aParts = a.WBS.split('.').map(Number)
  const bParts = b.WBS.split('.').map(Number)

  for (let i = 0; i < aParts.length && i < bParts.length; i++) {
    if (aParts[i] < bParts[i]) {
      return -1
    }
    if (aParts[i] > bParts[i]) {
      return 1
    }
  }

  // If we made it through the loop without returning, then the arrays are equal up to the shared length.
  // In this case, the longer array is considered greater.
  if (aParts.length < bParts.length) {
    return -1
  }
  if (aParts.length > bParts.length) {
    return 1
  }

  // If neither array is longer, they're equal.
  return 0
}

function createTreesFromWBS(ds) {
  //sort ds by WBS splited by '.' si interpretat ca numere
  let cloneDs = JSON.parse(JSON.stringify(ds))
  cloneDs.sort(compareWBS)

  console.log('cloneDs', cloneDs)

  const options = cloneDs.reduce(function (acc, object) {
    //create a tree for each object
    let tree = []
    let branches = object.WBS.split('.')
    branches.forEach(function (branch, index) {
      if (index == 0) {
        tree.push([branch])
      } else {
        let new_branch = tree[index - 1].slice()
        new_branch.push(branch)
        tree.push(new_branch)
      }
    })
    acc.push(tree)
    return acc
  }, [])

  console.log('options', options)

  //merge trees: for each array arr1 in options, for each array arr2 in arr1, if arr2 does not exist in result, push it to result
  let result = []
  options.forEach(function (arr1) {
    arr1.forEach(function (arr2) {
      //exceptie daca ultimul element din arr2 este 0 sau litera; in acest caz adauga-l oricum
      if (arr2[arr2.length - 1] == 0 || isNaN(arr2[arr2.length - 1])) {
        result.push(arr2)
      } else {
        if (!result.some((r) => r.join('') == arr2.join(''))) {
          result.push(arr2)
        }
      }
    })
  })

  //console.log('result', result)

  var maxLevels = 0
  result.forEach(function (branch) {
    if (branch.length > maxLevels) {
      maxLevels = branch.length
    }
  })

  console.log('maxLevels', maxLevels)

  //sunt maxLevels nivele in tree
  //pornind de la primul nivel, pentru fiecare nivel, creeaza un array cu toate nodurile unice de pe acel nivel
  let trees = []
  for (let i = 0; i < maxLevels; i++) {
    let nodes = []
    result.forEach(function (branch) {
      if (branch.length > i) {
        let node = branch[i]
        if (!nodes.includes(node)) {
          nodes.push(node)
        }
      }
    })
    trees.push(nodes)
  }

  //sort trees as numbers, if possible, letters otherwise
  trees.forEach(function (tree) {
    tree.sort(function (a, b) {
      if (!isNaN(a) && !isNaN(b)) {
        return a - b
      } else {
        return a.localeCompare(b)
      }
    })
  })

  //console.log('trees', trees)
  //console.log('result', result)

  //take result and add it to resultPlus array as branch property and add possible cloneDs object with the same WBS
  let resultPlus = []
  result.forEach(function (branch) {
    let obj = {}
    obj.branch = branch
    obj.object = cloneDs.find((object) => object.WBS == branch.join('.'))
    resultPlus.push(obj)
  })

  let resultFiltered = applyFilterTipSubTip(resultPlus)

  resultPlus.forEach(function (obj) {
    obj.level = obj.branch.length
    if (obj.children && obj.children.length > 0) {
      obj.hasChildren = true
    } else {
      obj.hasChildren = false
    }
    if (obj.object) {
      obj.virtual = false
    } else {
      obj.virtual = true
    }
  })

  let resultPlusVirtualFalse = resultPlus.filter((obj) => obj.virtual == false)

  //remove duplicates from resultPlusVirtualFalse
  //better: if obj1 has children, loop thru children and find obj2 in resultPlusVirtualFalse with the same branch and hasChildren == false
  let resultPlusVirtualFalseNoDuplicates = [...resultPlusVirtualFalse]
  resultPlusVirtualFalse.forEach(function (obj1) {
    if (obj1.hasChildren) {
      obj1.children.forEach(function (child) {
        let obj2 = resultPlusVirtualFalse.find(
          (obj) => obj.branch.join('.') == child.branch.join('.') && obj.hasChildren == false
        )
        if (obj2) {
          resultPlusVirtualFalseNoDuplicates = resultPlusVirtualFalseNoDuplicates.filter(
            (obj) => obj.branch.join('.') != obj2.branch.join('.')
          )
        }
      })
    }
  })

  var orphans = []
  //compare resultPlusVirtualFalseNoDuplicates with resultFiltered and find differences; push differences to orphans
  resultPlusVirtualFalseNoDuplicates.forEach(function (obj) {
    let obj2 = resultFiltered.find((o) => o.branch.join('.') == obj.branch.join('.'))
    if (!obj2) {
      orphans.push(obj)
    }
  })

  resultFiltered = applyFilterChildrenEndsWith0(resultFiltered)

  resultFiltered = prepareForMultipleActivities(resultFiltered)

  resultFiltered = applyFilterEndsWithL(resultFiltered)

  //console.log('resultPlusVirtualFalseNoDuplicates', resultPlusVirtualFalseNoDuplicates)

  return {
    trees,
    result: resultPlus,
    arrayResult: result,
    resultFiltered,
    resultPlusVirtualFalse,
    resultPlusVirtualFalseNoDuplicates,
    orphans
  }
}

function applyFilterTipSubTip(data) {
  //look into resultPlus and create a new array with only the objects listening of the following filter's conditions simultaneously
  //and keep their children (eg: ["1183","7","18","23"] and children ["1183","7","18","23","1"], ["1183","7","18","23","2"], ["1183","7","18","23","3"], etc.)
  const objFilter = {
    TIP_ARTICOL_OFERTA: ['articol'],
    SUBTIP_ARTICOL_OFERTA: ['principal', 'manopera', 'transport', 'utilaj']
  }
  let arr = []
  data.forEach(function (obj) {
    if (
      obj.object &&
      objFilter.TIP_ARTICOL_OFERTA.includes(obj.object.TIP_ARTICOL_OFERTA.toLowerCase()) &&
      objFilter.SUBTIP_ARTICOL_OFERTA.includes(obj.object.SUBTIP_ARTICOL_OFERTA.toLowerCase())
    ) {
      //add children
      obj.children = []
      data.forEach(function (child) {
        if (
          child.branch.join('.').startsWith(obj.branch.join('.')) &&
          child.branch.length == obj.branch.length + 1
        ) {
          obj.children.push(child)
        }
      })
      arr.push(obj)
    }
  })

  return arr
}

function applyFilterByGrupareArticolOferta() {
  //pseudo code
  //daca coloana GRUPARE_ARTICOL_OFERTA are i pe mai multe randuri am urmatoarea situatie:
  /*
1183.9.1.20	CABLU PENTRU REALIZARE PROVIZORATE SERVICII PROPRII DE CURENT CONTINUU	EC04G#	ARTICOL	PRINCIPAL
1183.9.1.20.0	BANDA ALUMINIU M 1 X 10 AL99 S5681	3704841	SUBARTICOL	MATERIAL
1183.9.1.21	CABLU ENERGIE CYABY 0,6/ 1 KV 1X 50 M S.8778	4802286	ARTICOL	MATERIAL
1183.9.1.22	CABLU ENERGIE CYABY 0,6/ 1 KV 2X 2,5 U S 8778	4802482	ARTICOL	MATERIAL
1183.9.1.23	CABLU ENERGIE CYABY 0,6/ 1 KV 2X 4 U S 8778	4802509	ARTICOL	MATERIAL
1183.9.1.24	CABLU ENERGIE CYABY 0,6/ 1 KV 2X 6 U S 8778	4802523	ARTICOL	MATERIAL
1183.9.1.25	CABLU ENERGIE CYABY 0,6/ 1 KV 3X 2,5 U S 8778	4802602	ARTICOL	MATERIAL
1183.9.1.26	CABLU ENERGIE CYABY 0,6/ 1 KV 3X 6 U S 8778	4802640	ARTICOL	MATERIAL
1183.9.1.27	CABLU CSYABY MASIV 7 X 1,5 S 8779	4810269	ARTICOL	MATERIAL
1183.9.1.28	ETICHETA DIN ALUMINIU PENTRU MARCARE TRASEULUI DE CABLE (200X20X2) FAI 1	6718417	ARTICOL	MATERIAL

.20, .21, .22, .23, .24, .25, .26, .27, .28 sunt activitati in reteta
.20 este Articol principal; acest criteriu este suficient si obligatoriu pentru a selecta activitatea .20
.20.0 este material pentru activitatea .20
.21, .22, .23, .24, .25, .26, .27, .28 sunt activitati cu materialele .21.1, .22.1, .23.1, .24.1, .25.1, .26.1, .27.1, .28.1 cu denumirea activitatii
*/
}

function prepareForMultipleActivities(data) {
  //push every obj in data into it's own array as in {retete: [{nr, reteta: [obj]}]}, ude nr is an indexed number
  let result = []
  data.forEach(function (obj, index) {
    let reteta = []
    reteta.push(obj)
    result.push({ name: index + 1, reteta: reteta })
  })

  return result
}

function applyFilterEndsWithL(data) {
  /*
1183.7.18.23	TROTUAR DIN DALE...100 X 100 X 10 CM,BETON SIMPLU C10/8(B 150) TURNATE PE LOC FARA SCLIV PE STRAT NISIP PILONAT 10 CM, ROSTURI UMPLUTE	CO01B#	ARTICOL	PRINCIPAL
1183.7.18.23.5	NISIP SORTAT NESPALAT DE RAU SI LACURI 0,0-3,0 MM	2200513	SUBARTICOL	MATERIAL
1183.7.18.23.6	SARMA OTEL MOALE, NEAGRA, D = 1 MM	3803881	SUBARTICOL	MATERIAL
1183.7.18.23.7	APA INDUSTRIALA PENTRU MORTARE SI BETOANE DE LA RETEA	6202818	SUBARTICOL	MATERIAL
1183.7.18.23.L	SCINDURA RASIN LUNGA TIV CLS D GR = 18MM L = 3,00M S 942	2903907	MATERIAL	PRINCIPAL
1183.7.18.23.L	BETON MARFA CLASA C 25/30 ( BC 30/ B 400)	2100916	MATERIAL	PRINCIPAL

Reteta
Activitate 1183.7.18.23
+ materialele aferente care se termina in L devin activitati:
Activitate 1183.7.18.23.L
*/

  //1 detect every child that ends with L, that is in it's chidren array
  //2 add child to it's parent's outer array
  //3 level of it's parent
  //4 and a new single child in it's children
  //branch remains the same

  let result = []
  result = JSON.parse(JSON.stringify(data))
  result.forEach(function (obj) {
    let reteta = obj.reteta //array of objects
    let nr = obj.nr
    reteta.forEach(function (activitate) {
      let children = activitate.children
      let childrenEndsWithL = children.filter((child) => child.branch[child.branch.length - 1] == 'L')
      if (childrenEndsWithL.length > 0) {
        childrenEndsWithL.forEach(function (child) {
          let newActivitateInReteta = JSON.parse(JSON.stringify(child))
          nr++
          newActivitateInReteta.nr = nr
          newActivitateInReteta.level = activitate.level
          newActivitateInReteta.children = []
          newActivitateInReteta.hasChildren = true
          newActivitateInReteta.children.push(child)
          reteta.push(newActivitateInReteta)
          //delete the newly created activitate from reteta's children
          activitate.children = activitate.children.filter(
            (child) => child.branch[child.branch.length - 1] != 'L'
          )
        })
      }
    })
  })

  return result
}

function findDuplicatesInOfertaInitiala() {}

function applyFilterChildrenEndsWith0(data) {
  //1.look into every obj's data.chidren
  //2. if ALL chidren are identical and end with 0, create another children array with the same children but with the last element indexed properly
  /*
  1183.9.1.29.0	BANDA ALUMINIU M 1 X 20 AL99,5 S5681	SUBARTICOL	MATERIAL	kg
1183.9.1.29.0	BANDA ALUMINIU M 1 X 20 AL99,5 S5681	SUBARTICOL	MATERIAL	kg
1183.9.1.29.0	BANDA ALUMINIU M 1 X 20 AL99,5 S5681	SUBARTICOL	MATERIAL	kg
1183.9.1.29.0	BANDA ALUMINIU M 1 X 20 AL99,5 S5681	SUBARTICOL	MATERIAL	kg
1183.9.1.29.0	BANDA ALUMINIU M 1 X 20 AL99,5 S5681	SUBARTICOL	MATERIAL	kg
1183.9.1.29.0	BANDA ALUMINIU M 1 X 20 AL99,5 S5681	SUBARTICOL	MATERIAL	kg
1183.9.1.29.0	BANDA ALUMINIU M 1 X 20 AL99,5 S5681	SUBARTICOL	MATERIAL	kg
*/

  let result = []
  data.forEach(function (obj) {
    if (obj.children && obj.children.length > 0) {
      let children = obj.children
      let last = children[0].branch[children[0].branch.length - 1]
      let identical = children.every((child) => child.branch[child.branch.length - 1] == last)
      if (identical && last == 0) {
        let newChildren = []
        children.forEach(function (child, index) {
          let newChild = JSON.parse(JSON.stringify(child))
          newChild.branch[newChild.branch.length - 1] = index + 1
          //change WBS
          newChild.object.WBS = newChild.branch.join('.')
          newChildren.push(newChild)
        })
        obj.childrenEndsInZero = newChildren
      }
    }
    result.push(obj)
  })

  return result
}
/*

/*
l4:1183.1.1.1.5
1183
l3 1183.1.1.1


1183.1.1.1 = n

n.1
n.2
n.3
n.4
n.5

n.m activatate

1.5.1
1.5.2

n.m.{i} materiale aferente activitatii


reteta: {activitate: n.m, matrialeActivitate: {n.m.i}}

scanare automata dupa retete
manipulare manuala retete scanate SAU creare retete noi (orfanii)

[retete] de tip {activitate: n.m, matrialeActivitate: {n.m.i}}

orfani: nu se pot reteta automat

buton radio cu switch intre retete si orfani


*/
function showRecipesList (data) {
  //afiseaza recipes_ds in table; root and children
  let modal = new bootstrap.Modal(document.getElementById('ModalGeneric'))
  let modal_body = document.getElementById('modal-body3')
  modal_body.innerHTML = ''

  //create div container
  var container = document.createElement('div')
  container.classList.add('container')

  var table = document.createElement('table')
  table.classList.add('table')
  table.classList.add('table-sm')
  table.classList.add('table-responsive')
  var thead = document.createElement('thead')
  table.appendChild(thead)
  var tr = document.createElement('tr')
  thead.appendChild(tr)
  var th = document.createElement('th')
  th.innerHTML = '#'
  tr.appendChild(th)
  var th = document.createElement('th')
  th.innerHTML = 'Reteta'
  tr.appendChild(th)
  var tbody = document.createElement('tbody')
  table.appendChild(tbody)
  data.forEach(function (object) {
    var tr = document.createElement('tr')
    tbody.appendChild(tr)
    var td = document.createElement('td')
    //make it fancy
    td.classList.add('bg-light')
    td.classList.add('text-primary')
    //bold
    td.classList.add('fw-bold')
    //padding 3
    td.innerHTML = object.name
    tr.appendChild(td)
    var td = document.createElement('td')
    tr.appendChild(td)
    var table2 = document.createElement('table')
    table2.classList.add('table')
    table2.classList.add('table-sm')
    table2.classList.add('table-responsive')
    td.appendChild(table2)
    var tbody2 = document.createElement('tbody')
    table2.appendChild(tbody2)
    object.reteta.forEach(function (object2) {
      var tr2 = document.createElement('tr')
      //add d-flex
      tr2.classList.add('d-flex')
      //flex-basis 100%
      //add shadow
      tr2.classList.add('shadow-sm')
      //margin-bottom 1
      tr2.classList.add('mb-1')
      //border 0
      tr2.classList.add('border-0')
      tbody2.appendChild(tr2)
      //add wbs, denumire_articol_oferta, um_articol_oferta, tip_articol_oferta, subtip_articol_oferta in a table
      var td2 = document.createElement('td')
      //add class col-2
      td2.classList.add('col')
      tr2.appendChild(td2)
      var table3 = document.createElement('table')
      table3.classList.add('table')
      table3.classList.add('table-sm')
      table3.classList.add('table-responsive')
      //no thead
      td2.appendChild(table3)
      var tbody3 = document.createElement('tbody')
      table3.appendChild(tbody3)
      var tr3 = document.createElement('tr')
      tbody3.appendChild(tr3)
      var td3 = document.createElement('td')
      //border 0
      td3.classList.add('border-0')
      td3.innerHTML = '<span class="text-primary">' + object2.object.WBS + '</span>'
      tr3.appendChild(td3)
      var tr3 = document.createElement('tr')
      tbody3.appendChild(tr3)
      var td3 = document.createElement('td')
      td3.innerHTML = object2.object.DENUMIRE_ARTICOL_OFERTA
      td3.classList.add('border-0')
      tr3.appendChild(td3)
      var tr3 = document.createElement('tr')
      tbody3.appendChild(tr3)
      var td3 = document.createElement('td')
      td3.classList.add('border-0')
      td3.innerHTML = object2.object.UM_ARTICOL_OFERTA
      tr3.appendChild(td3)
      var tr3 = document.createElement('tr')
      tbody3.appendChild(tr3)
      var td3 = document.createElement('td')
      td3.classList.add('border-0')
      td3.innerHTML = object2.object.TIP_ARTICOL_OFERTA
      tr3.appendChild(td3)
      var tr3 = document.createElement('tr')
      tbody3.appendChild(tr3)
      var td3 = document.createElement('td')
      td3.classList.add('border-0')
      td3.innerHTML = object2.object.SUBTIP_ARTICOL_OFERTA
      tr3.appendChild(td3)
      var td2 = document.createElement('td')
      td2.classList.add('col')
      tr2.appendChild(td2)
      var table3 = document.createElement('table')
      table3.classList.add('table')
      table3.classList.add('table-sm')
      table3.classList.add('table-responsive')
      //margin-bottom 0
      table3.classList.add('mb-0')
      td2.appendChild(table3)
      var tbody3 = document.createElement('tbody')
      table3.appendChild(tbody3)
      if (object2.children && object2.children.length) {
        for (var i = 0; i < object2.children.length; i++) {
          var object3 = object2.children[i]
          var tr3 = document.createElement('tr')
          //if i even => add style="background-color: whie;" else style="background-color: BOOTSTRAP(bg-light);"
          if (i % 2 == 0) {
            tr3.style.backgroundColor = 'white'
          } else {
            tr3.style.backgroundColor = 'rgb(248, 249, 250)'
          }
          tbody3.appendChild(tr3)
          var td3 = document.createElement('td')
          td3.classList.add('border-0')
          var table4 = document.createElement('table')
          table4.classList.add('table')
          table4.classList.add('table-sm')
          table4.classList.add('table-responsive')
          //add margin-bottom 0
          table4.classList.add('mb-0')
          td3.appendChild(table4)
          var tbody4 = document.createElement('tbody')
          table4.appendChild(tbody4)
          var tr4 = document.createElement('tr')
          tbody4.appendChild(tr4)
          var td4 = document.createElement('td')
          if (object2.childrenEndsInZero) {
            td4.innerHTML =
              '<span class="text-primary">' +
              object2.childrenEndsInZero[i].object.WBS +
              '</span><br><del>' +
              object3.object.WBS +
              '</del>'
          } else {
            td4.innerHTML = '<span class="text-primary">' + object3.object.WBS + '</span>'
          }
          td4.classList.add('border-0')
          tr4.appendChild(td4)
          //add denumire_articol_oferta, um_articol_oferta, tip_articol_oferta, subtip_articol_oferta too
          var tr4 = document.createElement('tr')
          tbody4.appendChild(tr4)
          var td4 = document.createElement('td')
          td4.classList.add('border-0')
          td4.innerHTML = object3.object.DENUMIRE_ARTICOL_OFERTA
          tr4.appendChild(td4)
          var tr4 = document.createElement('tr')
          tbody4.appendChild(tr4)
          var td4 = document.createElement('td')
          td4.classList.add('border-0')
          td4.innerHTML = object3.object.UM_ARTICOL_OFERTA
          tr4.appendChild(td4)
          var tr4 = document.createElement('tr')
          tbody4.appendChild(tr4)
          var td4 = document.createElement('td')
          td4.classList.add('border-0')
          td4.innerHTML = object3.object.TIP_ARTICOL_OFERTA
          tr4.appendChild(td4)
          var tr4 = document.createElement('tr')
          tbody4.appendChild(tr4)
          var td4 = document.createElement('td')
          td4.classList.add('border-0')
          td4.innerHTML = object3.object.SUBTIP_ARTICOL_OFERTA
          tr4.appendChild(td4)
          tr3.appendChild(td3)
        }
      } else {
        var tr3 = document.createElement('tr')
        tbody3.appendChild(tr3)
        var td3 = document.createElement('td')
        td3.classList.add('border-0')
        td3.innerHTML = '<i class="bi bi-emoji-sunglasses"></i>'
        tr3.appendChild(td3)
      }
    })
  })
  container.appendChild(table)
  modal_body.appendChild(container)

  modal.show()
}