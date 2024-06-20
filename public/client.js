import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js'

const TIP_ARTICOL_OFERTA = ['ARTICOL', 'SUBARTICOL', 'MATERIAL']
const SUBTIP_ARTICOL_OFERTA = [
  'PRINCIPAL',
  'MATERIAL',
  'MANOPERA',
  'TRANSPORT',
  'ECHIPAMENT',
  'UTILAJ',
  'CUSTOM'
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
var ds_instanteRetete = []
var ds_antemasuratori = []
/* var ds_AFL = [
  {
    header: { denumire: 'DS1233354', data: '20.06.2024' },
    linii: [
      {
        WBS_Intern: '',
        WBS_Extern: '',
        Denumire: '',
        Cantitate: '',
        UM: '',
        PretUnitar: '',
        PretTotal: '',
        PretTotalFaraTVA: '',
        PretTotalTVA: '',
        PretTotalRON: '',
        PretTotal
      }
    ]
  }
] */
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
var theadIsSet = true
var retetaCurenta = {}
var activitateCurenta = {}
var nivele = []
const recipeDisplayMask = {
  old_WBS: { value: 'old_WBS', RW: false, visible: false, label: 'WBS vechi' },
  WBS: { value: 'WBS', RW: false, visible: false, label: 'WBS' },
  DENUMIRE_ARTICOL_OFERTA: {
    value: 'DENUMIRE_ARTICOL_OFERTA',
    RW: true,
    visible: true,
    label: 'Denumire articol'
  },
  CANTITATE_ARTICOL_OFERTA: {
    value: 'CANTITATE_ARTICOL_OFERTA',
    RW: true,
    visible: false,
    label: 'Cantitate'
  },
  UM_ARTICOL_OFERTA: { value: 'UM_ARTICOL_OFERTA', RW: true, visible: true, label: 'UM' },
  TIP_ARTICOL_OFERTA: { value: TIP_ARTICOL_OFERTA, RW: true, visible: true, label: 'Tip articol' },
  SUBTIP_ARTICOL_OFERTA: { value: SUBTIP_ARTICOL_OFERTA, RW: true, visible: true, label: 'Subtip articol' }
}

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
    var opts = {
      header: 0,
      raw: true,
      defval: ''
    }
    workbook.SheetNames.forEach(function (sheetName) {
      var XL_row_object = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], opts)
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

      //drawModalDialog(select.value.split(delimiter), selected_ds)
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
/* 
document.getElementById('my_table_antemasuratori').shadowRoot.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    //var inputs = document.querySelectorAll('cantitate_antemasuratori')
    //get inputs from my_table_antemasuratori > shadowRoot > tbody
    var inputs = document.getElementById('my_table_antemasuratori').shadowRoot.querySelectorAll('.cantitate_antemasuratori')
    var index = Array.from(inputs).indexOf(document.activeElement)
    if (index > -1) {
      if (index < inputs.length - 1) {
        inputs[index + 1].focus()
      }
    }
  }
}) */

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

function detectieRetete(my_table1, my_table2, my_table3, my_table4) {
  let rez = createDatasetForRecipes()
  console.log('rez', rez)
  activitati_oferta = []
  recipes_ds = []
  intrari_orfane = []
  ds_antemasuratori = []
  rez.retete.forEach((obj) => {
    let reteta = obj.reteta
    reteta.forEach((activitate) => {
      activitati_oferta.push(activitate.object)
    })
  })

  intrari_orfane = rez.orphans
  let rescuedOrphans = rez.rescuedOrphans
  //scoate din intrari_orfane.object.WBS care sunt in rescuedOrphans.WBS
  intrari_orfane = intrari_orfane.filter((o) => !rescuedOrphans.find((r) => r.WBS === o.object.WBS))
  WBSMap = rez.trees
  recipes_ds = rez.retete
  ds_instanteRetete = rez.instanteRetete

  //hide table1
  my_table1.style.display = 'none'
  my_table4.style.display = 'none'
  //show table2
  my_table2.style.display = 'block'
  my_table3.style.display = 'block'
  let listaRetete = []
  recipes_ds.forEach((o) => {
    listaRetete.push({ Reteta: o.name })
  })
  my_table2.ds = listaRetete
}

//add onload event to window
export function init() {
  const my_table1 = document.getElementById('my_table_oferta_initiala')
  const my_table2 = document.getElementById('my_table_recipes')
  const my_table3 = document.getElementById('my_table_detalii_reteta')
  const my_table4 = document.getElementById('my_table_antemasuratori')
  let btn_top = document.getElementById('btn_top')
  btn_top.onclick = function () {
    window.scrollTo(0, 0)
  }
  let btn_column_filter = document.getElementById('btn_column_filter')
  btn_column_filter.onclick = function () {
    let menu = my_table1.shadowRoot.getElementById('table_menu_content')
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
  let btn_save_graph = document.getElementById('btn_save_graph')
  //btn_save_graph populateSelectIerarhiiFromTrees()
  btn_save_graph.onclick = populateSelectIerarhiiFromTrees
  let scan_oferta_initiala = document.getElementById('scan_oferta_initiala')
  scan_oferta_initiala.onclick = function () {
    detectieRetete(my_table1, my_table2, my_table3, my_table4)
  }
  //lista_retete_scurta
  let lista_retete_scurta = document.getElementById('lista_retete_scurta')
  lista_retete_scurta.onclick = function () {
    let listaRetete = []
    if (recipes_ds && recipes_ds.length > 0) {
      recipes_ds.forEach((o) => {
        listaRetete.push({ Reteta: o.name })
      })
      my_table2.style.display = 'block'
      my_table3.style.display = 'block'
      my_table1.style.display = 'none'
      my_table4.style.display = 'none'
      my_table2.ds = listaRetete
    }
  }
  let orfani = document.getElementById('orfani')
  orfani.onclick = async function () {
    let orfani = []
    if (intrari_orfane && intrari_orfane.length > 0) {
      intrari_orfane.forEach((o) => {
        let orfan = o.object
        orfani.push(orfan)
      })
    }

    my_table2.style.display = 'none'
    my_table3.style.display = 'none'
    my_table4.style.display = 'none'
    my_table1.style.display = 'block'
    my_table1.ds = orfani
  }
  let vizualizare_oferta_optimizata = document.getElementById('vizualizare_oferta_optimizata')
  vizualizare_oferta_optimizata.onclick = function () {
    my_table2.style.display = 'none'
    my_table3.style.display = 'none'
    my_table4.style.display = 'none'
    my_table1.style.display = 'block'
    my_table1.ds = optimal_ds
  }
  let vizulizare_oferta_initiala = document.getElementById('vizualizare_oferta_initiala')
  vizulizare_oferta_initiala.onclick = function () {
    my_table2.style.display = 'none'
    my_table3.style.display = 'none'
    my_table4.style.display = 'none'
    my_table1.style.display = 'block'
    my_table1.ds = original_ds
  }
  //lista_activitati
  let lista_activitati = document.getElementById('lista_activitati')
  lista_activitati.onclick = function () {
    my_table2.style.display = 'none'
    my_table3.style.display = 'none'
    my_table4.style.display = 'none'
    my_table1.style.display = 'block'
    my_table1.ds = activitati_oferta
  }
  //WBSMap
  let WBSMapBtn = document.getElementById('WBSMap')
  WBSMapBtn.onclick = function () {
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
  lista_retete.onclick = function () {
    showRecipesList(recipes_ds)
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

  //add on hover to my_table2 rows and get index of row and look in recipes_ds[index] for reteta to display in my_table2
  //do not forget shadowRoot
  my_table2.shadowRoot.addEventListener('mouseover', function (e) {
    if (e.target.tagName === 'TD') {
      var index = e.target.parentElement.rowIndex - (theadIsSet ? 1 : 0)
      console.log('index', index)
      console.log('recipes_ds[index]', recipes_ds[index])
      retetaCurenta = recipes_ds[index]
      console.log('retetaCurenta', retetaCurenta)
      var reteta = retetaCurenta.reteta
      my_table3.reteta = reteta
    }
  })

  //btn_showHideHeader
  let btn_showHideHeader = document.getElementById('btn_showHideHeader')
  btn_showHideHeader.onclick = function () {
    showHideHeader()
  }

  //antemasuratori
  let nav_antemasuratori = document.getElementById('listaAntemasuratori')
  nav_antemasuratori.onclick = function () {
    //create ds_antemasuratori from recipes_ds, enum activities only, add CANTITATE_ARTICOL_OFERTA, add CANTITATE_ANTEMASURATORI = 0
    const my_table1 = document.getElementById('my_table_oferta_initiala')
    const my_table2 = document.getElementById('my_table_recipes')
    const my_table3 = document.getElementById('my_table_detalii_reteta')
    const my_table4 = document.getElementById('my_table_antemasuratori')
    if (ds_instanteRetete.length === 0) {
      detectieRetete(my_table1, my_table2, my_table3, my_table4)
    }
    console.log('recipes_ds', recipes_ds)
    console.log('instanteRetete', ds_instanteRetete)
    console.log('trees', trees)
    console.log('nivele', nivele)
    ds_antemasuratori = []
    //activitate = reteta.object
    for (let i = 0; i < ds_instanteRetete.length; i++) {
      var pointerToReteta = ds_instanteRetete[i].duplicateOf
      var locate = recipes_ds.find((o) => o.id === pointerToReteta)
      if (locate) {
        var reteta = locate.reteta
      } else {
        console.log('Reteta cu id ', ds_instanteRetete[i].duplicateOf + ' nu a fost gasita')
        continue
      }
      for (var j = 0; j < reteta.length; j++) {
        var activitate = reteta[j].object
        var nivele_activitate = []
        for (let m = 0; m < nivele.length; m++) {
          nivele_activitate.push(activitate[nivele[m]])
        }
        console.log('nivele_activitate', nivele_activitate)
        var temps = []
        for (let k = 0; k < trees.length; k++) {
          var tree = trees[k]
          for (let l = 0; l < tree.length; l++) {
            var branch = tree[l]
            console.log('branch', branch)
            let checker = (arr, target) => target.every((v) => arr.includes(v))
            if (checker(branch, nivele_activitate) === true) {
              console.log('accepted branch', branch)
              temps.push(branch)
            }
          }
        }
        //pastreaza doar nivelele cele mai lungi
        if (temps.length > 1) {
          temps = temps.filter((a) => a.length === Math.max(...temps.map((a) => a.length)))
        }
        console.log('temps', temps)
        for (let n = 0; n < temps.length; n++) {
          var activit = {
            DENUMIRE_ARTICOL_OFERTA: activitate.DENUMIRE_ARTICOL_OFERTA,
            CANTITATE_ARTICOL_OFERTA: activitate.CANTITATE_ARTICOL_OFERTA,
            CANTITATE_ANTEMASURATORI: 0,
            CANTITATE_FL: 0,
            VARIATII: { OFINIT: [], AMTEMASURATORI: [], FL: [], AFL: [] }, //AFL stocate in aplicatie v. ds_AFL
            UM_ARTICOL_OFERTA: activitate.UM_ARTICOL_OFERTA,
            TIP_ARTICOL_OFERTA: activitate.TIP_ARTICOL_OFERTA,
            SUBTIP_ARTICOL_OFERTA: activitate.SUBTIP_ARTICOL_OFERTA
          }
          for (let o = 0; o < temps[n].length; o++) {
            if (o < nivele.length) {
              activit[nivele[o]] = temps[n][o]
            } else {
              activit[_nivel_oferta + (o + 1).toString()] = temps[n][o]
            }
          }
          ds_antemasuratori.push(activit)
        }
      }
    }
    console.log('ds_antemasuratori', ds_antemasuratori)
    if (ds_antemasuratori.length > 0) {
      my_table2.style.display = 'none'
      my_table3.style.display = 'none'
      my_table1.style.display = 'none'
      my_table4.style.display = 'block'
      my_table4.ds = []
      my_table4.ds = ds_antemasuratori
    }
  }

  //btn_antemasuratori
  let btn_antemasuratori = document.getElementById('btn_antemasuratori')
  btn_antemasuratori.onclick = function () {
    if (ds_instanteRetete && ds_instanteRetete.length > 0) {
      console.log('Exista instante retete, se afiseaza antemasuratori')
      let nav_antemasuratori = document.getElementById('listaAntemasuratori')
      nav_antemasuratori.click()
    } else {
      console.log('Nu exista instante retete, se scaneaza oferta initiala')
      //scan_oferta_initiala
      let scan_oferta_initiala = document.getElementById('scan_oferta_initiala')
      scan_oferta_initiala.click()
      console.log('Calcul antemasuratori')
      nav_antemasuratori.click()
    }
  }

  //btn_listaRetete
  let btn_listaRetete = document.getElementById('btn_listaRetete')
  btn_listaRetete.onclick = function () {
    if (recipes_ds && recipes_ds.length > 0) {
      console.log('listing recipes')
      let lista_retete = document.getElementById('lista_retete_scurta')
      lista_retete.click()
    } else {
      console.log('scanning initial offer')
      //scan_oferta_initiala
      let scan_oferta_initiala = document.getElementById('scan_oferta_initiala')
      scan_oferta_initiala.click()
    }
  }
}

function createDatasetForRecipes() {
  return createTreesFromWBS(optimal_ds)
}

const template = document.createElement('template')
template.innerHTML = `
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3" crossorigin="anonymous">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.3.0/font/bootstrap-icons.css"/>`

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
      if (theadIsSet) {
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
      } else {
        thead.style.display = 'none'
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

//create a <recipe> element
//this element is composed from activities and their children as materials
//a receipe has a name and a list of activities
//each activity has a list of materials named children
/*
this is an activity data:
{
    "branch": [
        "1183",
        "7",
        "18",
        "23"
    ],
    "object": {
        "WBS": "1183.7.18.23",
        "DENUMIRE_ARTICOL_OFERTA": "TROTUAR DIN DALE...100 X 100 X 10 CM,BETON SIMPLU C10/8(B 150) TURNATE PE LOC FARA SCLIV PE STRAT NISIP PILONAT 10 CM, ROSTURI UMPLUTE",
        "CANTITATE_ARTICOL_OFERTA": 8.7312,
        "UM_ARTICOL_OFERTA": "mp"
        "TIP_ARTICOL_OFERTA": "ARTICOL",
        "SUBTIP_ARTICOL_OFERTA": "PRINCIPAL"
    },
    "children": [
        {
            "branch": [
                "1183",
                "7",
                "18",
                "23",
                "5"
            ],
            "object": {
                "WBS": "1183.7.18.23.5",
                "DENUMIRE_ARTICOL_OFERTA": "NISIP SORTAT NESPALAT DE RAU SI LACURI 0,0-3,0 MM",
                "CANTITATE_ARTICOL_OFERTA": 8.7312,
                "UM_ARTICOL_OFERTA": "mc",
                "TIP_ARTICOL_OFERTA": "SUBARTICOL",
                "SUBTIP_ARTICOL_OFERTA": "MATERIAL",
            },
            "level": 5,
            "hasChildren": false,
            "virtual": false
        },
        {
            "branch": [
                "1183",
                "7",
                "18",
                "23",
                "6"
            ],
            "object": {
                "WBS": "1183.7.18.23.6",
                "DENUMIRE_ARTICOL_OFERTA": "SARMA OTEL MOALE, NEAGRA, D = 1 MM",
                "CANTITATE_ARTICOL_OFERTA": 2.856,
                "UM_ARTICOL_OFERTA": "kg",
                "TIP_ARTICOL_OFERTA": "SUBARTICOL",
                "SUBTIP_ARTICOL_OFERTA": "MATERIAL"
            },
            "level": 5,
            "hasChildren": false,
            "virtual": false
        },
        {
            "branch": [
                "1183",
                "7",
                "18",
                "23",
                "7"
            ],
            "object": {
                "WBS": "1183.7.18.23.7",
                "DENUMIRE_ARTICOL_OFERTA": "APA INDUSTRIALA PENTRU MORTARE SI BETOANE DE LA RETEA",
                "CANTITATE_ARTICOL_OFERTA": 0.1632,
                "UM_ARTICOL_OFERTA": "mc",
                "TIP_ARTICOL_OFERTA": "SUBARTICOL",
                "SUBTIP_ARTICOL_OFERTA": "MATERIAL",
            },
            "level": 5,
            "hasChildren": false,
            "virtual": false
        }
    ],
    "level": 4,
    "hasChildren": true,
    "virtual": false
}
*/

class Recipe extends LitElement {
  static properties = {
    reteta: { type: Array }
  }

  constructor() {
    super()
    this.reteta = []
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(template.content.cloneNode(true))
  }

  connectedCallback() {
    super.connectedCallback()
    console.log('recipe element added to the DOM')
  }

  render() {
    console.log('rendering recipe element with following array', this.reteta, 'added at', new Date())

    if (!this.reteta || this.reteta.length == 0) {
      return html`<p class="label label-danger">No data</p>`
    } else {
      //add table
      //evidenteaza activitatea de materiale si activitatile intre ele
      var table = document.createElement('table')
      table.classList.add('table')
      table.classList.add('table-sm')
      table.id = 'table_reteta'
      //get or create thead and tbody
      var thead = document.createElement('thead')
      thead.id = 'thead_reteta'
      thead.classList.add('align-middle')
      var tbody = document.createElement('tbody')
      tbody.id = 'tbody_reteta'
      if (theadIsSet) {
        tbody.classList.add('table-group-divider')
      }
      table.appendChild(tbody)
      //add thead
      //a se tine cont de theadIsSet
      if (theadIsSet) {
        table.appendChild(thead)
        var tr = document.createElement('tr')
        thead.appendChild(tr)
        //append counter
        var th = document.createElement('th')
        th.scope = 'col'
        tr.appendChild(th)
        for (let [key, value] of Object.entries(recipeDisplayMask)) {
          let label = value.label
          let visible = value.visible
          let th = document.createElement('th')
          if (!visible) {
            th.classList.add('d-none')
          }
          th.scope = 'col'
          th.innerHTML = label ? label : key
          th.style.writingMode = 'vertical-rl'
          th.style.rotate = '180deg'
          th.style.fontWeight = 'normal'
          tr.appendChild(th)
        }
      }
      //add tbody
      //first add a row for actions
      var tr = document.createElement('tr')
      tbody.appendChild(tr)
      var td = document.createElement('td')
      td.colSpan = 8
      tr.appendChild(td)
      //add icon for plus
      var plus_icon = document.createElement('i')
      plus_icon.classList.add('bi')
      plus_icon.classList.add('bi-plus-square', 'text-primary')
      plus_icon.style.cursor = 'pointer'
      plus_icon.onclick = function () {
        //modal with my-activity
        var popup = document.getElementById('ModalGeneric')
        var genericContainer = document.getElementById('genericContainer')
        genericContainer.classList.remove('modal-lg')
        genericContainer.classList.add('modal-fullscreen')
        var modal = new bootstrap.Modal(popup)
        var modal_body = document.getElementById('modal-body3')
        modal_body.innerHTML = ''
        var my_activity = document.createElement('my-activity')
        my_activity.id = 'adaugare_activitate'
        //creaza o activitate noua in aceasi reteta
        //has branch, object, children, hasChildren = false, isMain = false, virtual = false, (level = reteta > find reteta.object.isMain object's level)
        //adauga activitatea la reteta
        //adauga activitatea la my_activity
        //find the main activity
        let mainActivity = retetaCurenta.reteta.find((o) => o.isMain)
        if (!mainActivity) {
          console.log('Activitatea principala nu a fost gasita')
          return
        } else {
          console.log('Activitatea principala', mainActivity)
        }
        let level = mainActivity.object.level
        let activitate = {
          branch: [],
          object: {
            WBS: '',
            DENUMIRE_ARTICOL_OFERTA: 'Denumire activitate noua',
            CANTITATE_ARTICOL_OFERTA: 0,
            UM_ARTICOL_OFERTA: '',
            TIP_ARTICOL_OFERTA: '',
            SUBTIP_ARTICOL_OFERTA: ''
          },
          children: [],
          hasChildren: false,
          isMain: false,
          virtual: false,
          level: level
        }
        //add it to reteta
        retetaCurenta.reteta.push(activitate)
        activitateCurenta = activitate
        my_activity.activitate = activitate
        //id
        my_activity.id = 'editare_activitate'
        modal_body.appendChild(my_activity)
        modal.show()
      }
      td.appendChild(plus_icon)
      let counter = 0
      for (let i = 0; i < this.reteta.length; i++) {
        let activitate = this.reteta[i]
        let isActivitatePrincipala = activitate.isMain
        counter++
        var tr = document.createElement('tr')
        tr.classList.add('shadow-sm', 'bg-light')
        tbody.appendChild(tr)
        var td = document.createElement('td')
        td.style.fontWeight = 'bold'
        //add fixed width to td
        td.style.width = '80px'
        var edit = document.createElement('i')
        edit.classList.add('bi', 'bi-pencil-square', 'text-primary')
        edit.id = 'edit_' + counter
        edit.style.cursor = 'pointer'
        edit.onclick = function () {
          //edit activitate
          //ModalGeneric + modal_body3 > my-activity with activitate
          //add class fullscreen
          var popup = document.getElementById('ModalGeneric')
          var genericContainer = document.getElementById('genericContainer')
          genericContainer.classList.remove('modal-lg')
          genericContainer.classList.add('modal-fullscreen')
          var modal = new bootstrap.Modal(popup)
          var modal_body = document.getElementById('modal-body3')
          modal_body.innerHTML = ''
          var my_activity = document.createElement('my-activity')
          my_activity.id = 'editare_activitate'
          activitateCurenta = activitate
          my_activity.activitate = activitate
          modal_body.appendChild(my_activity)
          modal.show()
        }
        var trash = document.createElement('i')
        trash.classList.add('bi', 'bi-trash', 'text-danger')
        trash.id = 'trash_' + counter
        trash.style.cursor = 'pointer'
        trash.style.marginLeft = '5px'
        trash.onclick = function () {}
        td.appendChild(edit)
        td.appendChild(trash)
        //activitate principala as as checkbox indiferent de stare
        var checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.id = 'checkbox_' + counter
        checkbox.checked = isActivitatePrincipala
        checkbox.style.marginLeft = '5px'
        //onchange, set activitate.isMain = checkbox.checked
        checkbox.onchange = function () {}
        td.appendChild(checkbox)
        //span with counter
        var span = document.createElement('span')
        //add margin left
        span.style.marginLeft = '5px'
        span.innerHTML = counter
        td.appendChild(span)
        tr.appendChild(td)
        // loop through the keys of interest and create the corresponding table cells
        for (let [key, value] of Object.entries(recipeDisplayMask)) {
          let td = document.createElement('td')
          if (!value.visible) {
            td.classList.add('d-none')
          }
          td.innerHTML = activitate.object[key] || ''
          tr.appendChild(td)
        }
        //add children
        var mCounter = 0
        for (let j = 0; j < activitate.children.length; j++) {
          mCounter++
          let material = activitate.children[j]
          var tr = document.createElement('tr')
          tr.style.borderBottomColor = 'lightgray'
          tbody.appendChild(tr)
          var td = document.createElement('td')
          td.classList.add('text-secondary')
          td.innerHTML = counter + '.' + mCounter
          tr.appendChild(td)

          // loop through the keys of interest and create the corresponding table cells
          for (let [key, value] of Object.entries(recipeDisplayMask)) {
            let td = document.createElement('td')
            if (!value.visible) {
              td.classList.add('d-none')
            }
            td.innerHTML = material.object[key] || ''
            tr.appendChild(td)
          }
        }
      }

      return html`${table}`
    }
  }
}

customElements.define('my-recipe', Recipe)

//create a <my-activity> element
//this element is composed from a single activity and its children as materials
//you can add custom materials to an activity, edit mataerials (rename, for eg), delete materials
//it relates to retetaCurenta, changes are made to retetaCurenta when saving

class Activity extends LitElement {
  static properties = {
    activitate: { type: Object },
    hasChanged: { type: Boolean }
  }

  constructor() {
    super()
    this.activitate = {}
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(template.content.cloneNode(true))
    //add a listener any cell text change resulting hasChanged = true
    this.shadowRoot.addEventListener('input', function (e) {
      console.log('input event', e.target)
      this.hasChanged = true
      //get id save_icon and change color to red
      var buttonsPannel = document
          .getElementById('editare_activitate')
          .shadowRoot.getElementById('buttonsPannel')
      var save_icon = buttonsPannel.querySelector('#save_icon')
      save_icon.classList.remove('text-success')
      save_icon.classList.add('text-danger')
    })
  }

  connectedCallback() {
    super.connectedCallback()
    console.log('activity element added to the DOM')
  }

  render() {
    console.log('rendering activity element with following object', this.activitate, 'added at', new Date())

    if (!this.activitate || Object.keys(this.activitate).length == 0) {
      return html`<p class="label label-danger">No data</p>`
    } else {
      //add activity then add children in a rw table (contenteditable)
      //TIP_ARTICOL_OFERTA and SUBTIP_ARTICOL_OFERTA are select elements

      //add buttons
      let buttonsPannel = document.createElement('div')
      buttonsPannel.classList.add('d-flex', 'flex-row', 'justify-content-between', 'align-items-center')
      buttonsPannel.id = 'buttonsPannel'
      //add plus-square icon
      let btnAdd = document.createElement('div')
      btnAdd.classList.add('col')
      buttonsPannel.appendChild(btnAdd)
      var plus_icon = document.createElement('i')
      plus_icon.classList.add('bi')
      plus_icon.classList.add('bi-plus-square', 'text-primary', 'fs-4', 'mb-3')
      plus_icon.style.cursor = 'pointer'
      plus_icon.onclick = function () {
        //add a new material
        var tbody = document
          .getElementById('editare_activitate')
          .shadowRoot.getElementById('tbody_activitate')
        var tr = document.createElement('tr')
        tr.style.borderBottomColor = 'lightgray'
        tbody.appendChild(tr)
        var td = document.createElement('td')
        td.classList.add('text-primary')
        var trash = document.createElement('i')
        trash.classList.add('bi')
        trash.classList.add('bi-trash', 'text-danger')
        trash.style.cursor = 'pointer'
        trash.onclick = function () {
          var tr = trash.parentElement.parentElement
          tr.remove()
        }
        td.appendChild(trash)
        var span = document.createElement('span')
        span.style.marginLeft = '5px'
        mCounter++
        span.innerHTML = mCounter
        td.appendChild(span)
        tr.appendChild(td)
        for (const [key, value] of Object.entries(recipeDisplayMask)) {
          let props = value
          let td = document.createElement('td')
          let visibility = props.visible
          if (visibility === false) {
            td.classList.add('d-none')
          }
          let innerValue = props.value
          if (Array.isArray(innerValue)) {
            //select element
            let select = document.createElement('select')
            select.id = 'material_' + key
            select.classList.add('form-select')
            select.classList.add('form-select-sm')
            //vezi key array (for let)
            for (let i = 0; i < innerValue.length; i++) {
              var option = document.createElement('option')
              option.value = innerValue[i]
              option.text = innerValue[i]
              select.appendChild(option)
            }
            //if key is TIP_ARTICOL_OFERTA, select same option like the above child
            if (key === 'TIP_ARTICOL_OFERTA') {
              //'SUBARTICOL'
              select.selectedIndex = innerValue.indexOf('SUBARTICOL')
            }

            if (key === 'SUBTIP_ARTICOL_OFERTA') {
              //'CUSTOM'
              select.selectedIndex = innerValue.indexOf('CUSTOM')
            }
            td.appendChild(select)
          } else {
            td.contentEditable = true
            td.spellcheck = false
            td.innerHTML = ''
          }
          tr.appendChild(td)
        }
      }
      //add save icon
      let btnSave = document.createElement('div')
      btnSave.classList.add('col')
      buttonsPannel.appendChild(btnSave)
      var save_icon = document.createElement('i')
      save_icon.id = 'save_icon'
      save_icon.classList.add('bi')
      save_icon.classList.add('bi-save', 'text-success', 'fs-4', 'mb-3')
      save_icon.style.cursor = 'pointer'
      save_icon.style.marginLeft = '5px'
      save_icon.onclick = function () {
        //update activitateCurenta with values from tbody_activitate
        var tbody = document
          .getElementById('editare_activitate')
          .shadowRoot.getElementById('tbody_activitate')
        var trs = tbody.getElementsByTagName('tr')
        for (let i = 0; i < trs.length; i++) {
          var tr = trs[i]
          var tds = tr.getElementsByTagName('td')
          for (let j = 0; j < tds.length; j++) {
          }
        }
      }
      btnSave.appendChild(save_icon)
      //add plus-square icon
      btnAdd.appendChild(plus_icon)
      let btnRefresh = document.createElement('div')
      btnRefresh.classList.add('col')
      buttonsPannel.appendChild(btnRefresh)
      //add refresh icon for reloading my-activity with retetaCurenta
      var refresh_icon = document.createElement('i')
      refresh_icon.classList.add('bi')
      refresh_icon.classList.add('bi-arrow-clockwise', 'text-primary', 'fs-4', 'mb-3')
      refresh_icon.style.cursor = 'pointer'
      refresh_icon.style.marginLeft = '5px'
      refresh_icon.onclick = function () {
        //reload my-activity with currentRecipe
        var my_activity = document.getElementById('editare_activitate')
        my_activity.activitate = activitateCurenta
      }
      btnRefresh.appendChild(refresh_icon)
      let btnBack = document.createElement('div')
      btnBack.classList.add('col')
      buttonsPannel.appendChild(btnBack)
      //add forward and backward icons for navigation between activities
      var backward_icon = document.createElement('i')
      backward_icon.classList.add('bi')
      backward_icon.classList.add('bi-arrow-left-circle', 'text-primary', 'fs-4', 'mb-3')
      backward_icon.style.cursor = 'pointer'
      backward_icon.style.marginLeft = '5px'
      backward_icon.onclick = function () {
        //find previous activity
      }
      btnBack.appendChild(backward_icon)
      let btnForward = document.createElement('div')
      btnForward.classList.add('col')
      buttonsPannel.appendChild(btnForward)
      var forward_icon = document.createElement('i')
      forward_icon.classList.add('bi')
      forward_icon.classList.add('bi-arrow-right-circle', 'text-primary', 'fs-4', 'mb-3')
      forward_icon.style.cursor = 'pointer'
      forward_icon.style.marginLeft = '5px'
      forward_icon.onclick = function () {
        //find next activity
      }
      btnForward.appendChild(forward_icon)

      var table = document.createElement('table')
      table.classList.add('table')
      table.classList.add('table-sm')
      table.id = 'table_activitate'
      //get or create thead and tbody
      var thead = document.createElement('thead')
      thead.id = 'thead_activitate'
      thead.classList.add('align-middle')
      var tbody = document.createElement('tbody')
      tbody.id = 'tbody_activitate'
      if (theadIsSet) {
        tbody.classList.add('table-group-divider')
      }
      table.appendChild(tbody)
      //add thead
      if (theadIsSet) {
        table.appendChild(thead)
        var tr = document.createElement('tr')
        thead.appendChild(tr)
        //append counter
        var th = document.createElement('th')
        th.scope = 'col'
        tr.appendChild(th)
        //append columns based on recipeDisplayMask
        for (const [key, value] of Object.entries(recipeDisplayMask)) {
          let props = value
          let th = document.createElement('th')
          if (!props.visible) {
            th.classList.add('d-none')
          }
          th.scope = 'col'
          th.innerHTML = props.label ? props.label : key
          th.style.writingMode = 'vertical-rl'
          th.style.rotate = '180deg'
          th.style.fontWeight = 'normal'
          tr.appendChild(th)
        }
      }

      //add tbody
      tr = document.createElement('tr')
      tr.classList.add('shadow-sm', 'bg-light')
      tbody.appendChild(tr)
      //append counter
      let counter = document.createElement('td')
      counter.innerHTML = ''
      tr.appendChild(counter)
      for (const [key, value] of Object.entries(recipeDisplayMask)) {
        let props = value
        let visibility = props.visible
        let td = document.createElement('td')
        if (visibility === false) {
          td.classList.add('d-none')
        }
        //add class as th name
        td.classList.add(key)
        td.scope = 'col'
        td.innerHTML = this.activitate.object[key] || ''
        td.contentEditable = true
        tr.appendChild(td)
      }

      //add children
      var mCounter = 0
      for (let i = 0; i < this.activitate.children.length; i++) {
        let material = this.activitate.children[i]
        mCounter++
        var tr = document.createElement('tr')
        tr.style.borderBottomColor = 'lightgray'
        tbody.appendChild(tr)
        var td = document.createElement('td')
        td.classList.add('text-secondary')
        td.style.width = '50px'
        //add trash icon and span with counter
        var trash = document.createElement('i')
        trash.classList.add('bi')
        trash.classList.add('bi-trash', 'text-danger')
        trash.style.cursor = 'pointer'
        trash.onclick = function () {
          var tr = trash.parentElement.parentElement
          tr.remove()
        }
        td.appendChild(trash)
        var span = document.createElement('span')
        span.style.marginLeft = '5px'
        span.innerHTML = mCounter
        td.appendChild(span)
        tr.appendChild(td)
        for (const [key, value] of Object.entries(recipeDisplayMask)) {
          let props = value
          let td = document.createElement('td')
          if (props.visible === false) {
            td.classList.add('d-none')
          }
          td.innerHTML = material.object[key] || ''
          td.spellcheck = false
          td.contentEditable = true
          tr.appendChild(td)
        }
      }

      return html`${buttonsPannel}${table}`
    }
  }
}

customElements.define('my-activity', Activity)

class antemasuratori extends LitElement {
  static properties = {
    ds: { type: Array }
  }

  constructor() {
    super()
    this.ds = []
    this.attachShadow({ mode: 'open' })
    this.shadowRoot.appendChild(template.content.cloneNode(true))
    //add event listener for keydown for td class cantitate_antemasuratori
    this.shadowRoot.addEventListener('keydown', function (e) {
      if (e.target.classList.contains('cantitate_antemasuratori')) {
        if (e.key === 'Enter') {
          e.preventDefault()
          e.target.blur()
        }
      }

      //arrow up and down
      if (e.target.classList.contains('cantitate_antemasuratori')) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault()
          let td = e.target
          let tr = td.parentElement
          let tbody = tr.parentElement
          let tds = tbody.getElementsByTagName('td')
          let index = Array.prototype.indexOf.call(tds, td)
          let trs = tbody.getElementsByTagName('tr')
          let trIndex = Array.prototype.indexOf.call(trs, tr)
          let nextTr = e.key === 'ArrowDown' ? trs[trIndex + 1] : trs[trIndex - 1]
          let nextTd = nextTr.getElementsByTagName('td')[index]
          if (nextTd) {
            nextTd.focus()
          }
        }
      }
    })
  }

  connectedCallback() {
    super.connectedCallback()
    console.log('antemasuratori element added to the DOM')
  }

  render() {
    console.log('rendering antemasuratori element with following array', this.ds, 'added at', new Date())

    if (!this.ds || this.ds.length == 0) {
      return html`<p class="label label-danger">No data</p>`
    } else {
      //add table
      var table = document.createElement('table')
      table.classList.add('table')
      table.classList.add('table-sm')
      table.id = 'table_antemasuratori'
      //get or create thead and tbody
      var thead = document.createElement('thead')
      thead.id = 'thead_antemasuratori'
      thead.classList.add('align-middle')
      var tbody = document.createElement('tbody')
      tbody.id = 'tbody_antemasuratori'
      if (theadIsSet) {
        tbody.classList.add('table-group-divider')
      }
      table.appendChild(tbody)
      //add thead
      if (theadIsSet) {
        table.appendChild(thead)
        var tr = document.createElement('tr')
        thead.appendChild(tr)
        //append counter
        var th = document.createElement('th')
        th.scope = 'col'
        tr.appendChild(th)
        for (var key in this.ds[0]) {
          if (key != 'VARIATII') {
            var th = document.createElement('th')
            th.scope = 'col'
            th.style.writingMode = 'vertical-rl'
            th.style.rotate = '180deg'
            th.innerHTML = key
            tr.appendChild(th)
          }
        }
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
          if (key != 'VARIATII') {
            var td = document.createElement('td')
            td.innerHTML = typeof object[key] === 'number' ? object[key].toFixed(2) : object[key]
            if (key == 'CANTITATE_ARTICOL_OFERTA' || key == 'CANTITATE_ANTEMASURATORI') {
              td.style.fontWeight = 'bold'
            }
            //cantitate antemasuratori contenteditable
            if (key == 'CANTITATE_ANTEMASURATORI') {
              let customClass = 'cantitate_antemasuratori'
              td.contentEditable = true
              td.spellcheck = false
              td.classList.add('border', 'text-primary')
              td.classList.add(customClass)
              td.style.borderColor = 'lightgray'
            }
          }
          tr.appendChild(td)
        }
      })

      return html`${table}`
    }
  }
}

customElements.define('my-antemasuratori', antemasuratori)

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

  let instanteRetete = applyFilterTipSubTip(resultPlus)

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
  //compare resultPlusVirtualFalseNoDuplicates with retete and find differences; push differences to orphans
  resultPlusVirtualFalseNoDuplicates.forEach(function (obj) {
    let obj2 = instanteRetete.find((o) => o.branch.join('.') == obj.branch.join('.'))
    if (!obj2) {
      orphans.push(obj)
    }
  })

  //returns old WBS and newly created WBS, if any
  instanteRetete = applyFilterChildrenEndsWith0(instanteRetete)

  instanteRetete = prepareForMultipleActivities(instanteRetete)

  instanteRetete = applyFilterEndsWithL(instanteRetete)

  //applyFilterByGrupareArticolOferta to optimal_ds and merge with retete
  let reteteGrupateArtificial = applyFilterByGrupareArticolOferta(optimal_ds, instanteRetete)
  let rescuedOrphans = []
  if (reteteGrupateArtificial.rescuedOrphans && reteteGrupateArtificial.rescuedOrphans.length > 0) {
    rescuedOrphans = reteteGrupateArtificial.rescuedOrphans
  }
  let instanteRetete1 = []
  if (reteteGrupateArtificial.length > 0 && reteteGrupateArtificial.result.length > 0) {
    instanteRetete1 = [...instanteRetete, ...reteteGrupateArtificial.result]
  } else {
    instanteRetete1 = instanteRetete
  }

  let rez = eleminateDuplicates(instanteRetete1)
  let retete = rez.retete
  instanteRetete = rez.instanteRetete

  return {
    trees,
    result: resultPlus,
    arrayResult: result,
    retete,
    instanteRetete,
    resultPlusVirtualFalse,
    resultPlusVirtualFalseNoDuplicates,
    orphans,
    rescuedOrphans
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

function applyFilterByGrupareArticolOferta(data, retete) {
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

  //1. detect every row with GRUPARE_ARTICOL_OFERTA with the same value; can be 5 rows with 1, 3 rows with 2, 2 rows with 3, etc.
  //2. detect if it's a principal or a material
  //3. if it's a principal, add it to the result array
  //4. if it's a material, add it to the children array of the principal

  let result = []
  let grupari = []
  let rescuedOrphans = []

  data.forEach(function (obj) {
    if (obj.GRUPARE_ARTICOL_OFERTA) {
      let grupare = obj.GRUPARE_ARTICOL_OFERTA
      if (!grupari.includes(grupare)) {
        var newObj = {}
        grupari.push(grupare)
        let related = data.filter((child) => child.GRUPARE_ARTICOL_OFERTA == grupare)
        rescuedOrphans.push(...related)
        console.log('related', related)
        if (related.length > 1) {
          let principal = related.find(
            (child) =>
              child.TIP_ARTICOL_OFERTA.toLowerCase() == 'articol' &&
              child.SUBTIP_ARTICOL_OFERTA.toLowerCase() == 'principal'
          )
          if (principal) {
            //look for principal in retete
            //obj > reteta > loop through array elements looking for emelent.object.WBS
            let reteta = retete.find((obj) =>
              obj.reteta.find((element) => element.object.WBS == principal.WBS)
            )
            if (reteta) {
              console.log('reteta exista', reteta)
              //delete from related
              related = related.filter((child) => child.WBS != principal.WBS)
              //add each related to reteta array as object using for (let...)
              adaugaInReteta(reteta, related)
              reteta.name =
                'Reteta ' + (retete.indexOf(reteta) + 1).toString() + ' (include gruparea ' + grupare + ')'
            } else {
              console.log('reteta nu exista', principal)
              //creaza reteta in retete
              reteta = []
              adaugaInReteta(reteta, related)
              result.push({
                name: 'Reteta ' + (retete.length + 1).toString() + ' (include gruparea ' + grupare + ')',
                reteta
              })
            }
          } else {
            console.log('Principal not found for grupare', grupare)
          }
        }
      }
    }
  })

  return { result, rescuedOrphans }
}

function adaugaInReteta(reteta, related) {
  for (let i = 0; i < related.length; i++) {
    let newObj1 = { object: { ...related[i] } }
    let newObj2 = { object: { ...related[i] } }
    newObj1.object.old_WBS = related[i].WBS
    newObj1.object.WBS = related[i].WBS.split('.').join('.') + '.' + '1'
    newObj1.branch = newObj1.object.WBS.split('.')
    newObj1.level = newObj1.branch.length
    newObj1.virtual = true
    newObj1.hasChildren = false
    newObj2.children = []
    newObj2.children.push(newObj1)
    newObj2.object.old_WBS = ''
    newObj2.hasChildren = true
    newObj2.branch = related[i].WBS.split('.')
    newObj2.level = newObj2.branch.length
    newObj2.virtual = false
    reteta.reteta.push(newObj2)
  }
}

function prepareForMultipleActivities(data) {
  //push every obj in data into it's own array as in {retete: [{nr, reteta: [obj]}]}, ude nr is an indexed number
  let result = []
  data.forEach(function (obj, index) {
    let reteta = []
    reteta.push(obj)
    result.push({ name: 'Reteta ' + parseInt(index + 1).toString(), reteta: reteta })
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
        activitate.isMain = true
        childrenEndsWithL.forEach(function (child) {
          let newActivitateInReteta = JSON.parse(JSON.stringify(child))
          nr++
          newActivitateInReteta.nr = nr
          newActivitateInReteta.level = activitate.level
          newActivitateInReteta.children = []
          newActivitateInReteta.hasChildren = true
          newActivitateInReteta.children.push(child)
          newActivitateInReteta.isMain = false
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

  let innerData = [...data]
  innerData.forEach(function (obj) {
    if (obj.children && obj.children.length > 0) {
      let children = obj.children
      let newChildren = []
      let last = children[0].branch[children[0].branch.length - 1]
      let identical = children.every((child) => child.branch[child.branch.length - 1] == last)
      if (identical && last == 0) {
        children.forEach(function (child, index) {
          let newChild = JSON.parse(JSON.stringify(child))
          newChild.branch[child.branch.length - 1] = index + 1
          newChild.object.old_WBS = child.object.WBS
          //change WBS
          newChild.object.WBS = newChild.branch.join('.')
          newChildren.push(newChild)
        })
        obj.children = newChildren
      }
    } else {
      //console.log('no children')
    }
  })

  return innerData
}

function eleminateDuplicates(data) {
  //choose one reteta, get [reteta.object.DENUMIRE_ARTICOL_OFERTA, reteta.object.UM_ARTICOL_OFERTA, reteta.object.TIP_ARTICOL_OFERTA, reteta.object.SUBTIP_ARTICOL_OFERTA]
  //and his children [reteta.object.children.DENUMIRE_ARTICOL_OFERTA, reteta.object.children.UM_ARTICOL_OFERTA, reteta.object.children.TIP_ARTICOL_OFERTA, reteta.object.children.SUBTIP_ARTICOL_OFERTA]
  //cauta restul retetelor cu aceleasi proprietati si elimina-le

  let innerData = [...data]
  let instanteRetete = JSON.parse(JSON.stringify(innerData))

  for (let i = 0; i < innerData.length; i++) {
    innerData[i].id = i
    if (innerData[i].toRemove) {
      continue
    }
    let reteta = innerData[i].reteta
    let activitati = []
    for (let j = 0; j < reteta.length; j++) {
      let obj = reteta[j]
      let children = obj.children
      activitati.push({
        DENUMIRE_ARTICOL_OFERTA: obj.object.DENUMIRE_ARTICOL_OFERTA,
        UM_ARTICOL_OFERTA: obj.object.UM_ARTICOL_OFERTA,
        TIP_ARTICOL_OFERTA: obj.object.TIP_ARTICOL_OFERTA,
        SUBTIP_ARTICOL_OFERTA: obj.object.SUBTIP_ARTICOL_OFERTA
      })
      if (children) {
        children.forEach(function (child) {
          activitati[activitati.length - 1].children = children.map(function (child) {
            return {
              DENUMIRE_ARTICOL_OFERTA: child.object.DENUMIRE_ARTICOL_OFERTA,
              UM_ARTICOL_OFERTA: child.object.UM_ARTICOL_OFERTA,
              TIP_ARTICOL_OFERTA: child.object.TIP_ARTICOL_OFERTA,
              SUBTIP_ARTICOL_OFERTA: child.object.SUBTIP_ARTICOL_OFERTA
            }
          })
        })
      }
      for (let k = i + 1; k < innerData.length; k++) {
        if (innerData[k].toRemove) {
          continue
        }
        let reteta2 = innerData[k].reteta
        let activitati2 = []
        for (let l = 0; l < reteta2.length; l++) {
          let obj2 = reteta2[l]
          let children2 = obj2.children
          activitati2.push({
            DENUMIRE_ARTICOL_OFERTA: obj2.object.DENUMIRE_ARTICOL_OFERTA,
            UM_ARTICOL_OFERTA: obj2.object.UM_ARTICOL_OFERTA,
            TIP_ARTICOL_OFERTA: obj2.object.TIP_ARTICOL_OFERTA,
            SUBTIP_ARTICOL_OFERTA: obj2.object.SUBTIP_ARTICOL_OFERTA
          })
          if (children2) {
            children2.forEach(function (child2) {
              activitati2[activitati2.length - 1].children = children2.map(function (child2) {
                return {
                  DENUMIRE_ARTICOL_OFERTA: child2.object.DENUMIRE_ARTICOL_OFERTA,
                  UM_ARTICOL_OFERTA: child2.object.UM_ARTICOL_OFERTA,
                  TIP_ARTICOL_OFERTA: child2.object.TIP_ARTICOL_OFERTA,
                  SUBTIP_ARTICOL_OFERTA: child2.object.SUBTIP_ARTICOL_OFERTA
                }
              })
            })
          }
        }

        //comapre activitati and activitati2 (chidren included); if they are identical, remove reteta2 from innerData
        let identical = activitati.every((activitate, index) => {
          return (
            activitate.DENUMIRE_ARTICOL_OFERTA == activitati2[index].DENUMIRE_ARTICOL_OFERTA &&
            activitate.UM_ARTICOL_OFERTA == activitati2[index].UM_ARTICOL_OFERTA &&
            activitate.TIP_ARTICOL_OFERTA == activitati2[index].TIP_ARTICOL_OFERTA &&
            activitate.SUBTIP_ARTICOL_OFERTA == activitati2[index].SUBTIP_ARTICOL_OFERTA &&
            JSON.stringify(activitate.children) == JSON.stringify(activitati2[index].children)
          )
        })

        if (identical) {
          innerData[k].toRemove = true
          //mark reteta2 as duplicate in instanteRetete
          instanteRetete[k].duplicate = true
          //point to the original reteta
          instanteRetete[k].duplicateOf = i
          //transform reteta in instanta sa proprie
          instanteRetete[i].duplicate = true
          instanteRetete[i].duplicateOf = i
        }
      }
    }
  }

  //instantele reteta care nu sunt marcate ca duplicate in acest moment trebuiesc marcate ca instante singulare, citeriul fiind name
  for (let i = 0; i < instanteRetete.length; i++) {
    let obj = instanteRetete[i]
    if (!obj.hasOwnProperty('duplicate')) {
      obj.duplicate = false
      obj.duplicateOf = i
    }
  }

  //remove property reteta from instanteRetete, it will have just the pointer to the original reteta
  instanteRetete.forEach(function (obj) {
    delete obj.reteta
  })

  //remove duplicates from innerData
  innerData = innerData.filter((obj) => !obj.toRemove)

  //add to each innerData.reteta[i] property isMain = false
  innerData.forEach(function (obj) {
    var nrActivitati = obj.reteta.length
    obj.reteta.forEach(function (activity) {
      if (!activity.isMain) activity.isMain = nrActivitati == 1 ? true : false
    })
  })

  return { retete: innerData, instanteRetete: instanteRetete }
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
function showRecipesList(data) {
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
          td4.innerHTML = '<span class="text-primary">' + object3.object.WBS + '</span>'
          td4.classList.add('border-0')
          tr4.appendChild(td4)
          //add old_WBS
          if (object3.object.old_WBS) {
            var tr4 = document.createElement('tr')
            tbody4.appendChild(tr4)
            var td4 = document.createElement('td')
            td4.classList.add('border-0')
            td4.innerHTML = `<span class="text-secondary"><del>${object3.object.old_WBS}</del></span>`
            tr4.appendChild(td4)
          }
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

function showHideHeader() {
  theadIsSet = !theadIsSet
  console.log('theadIsSet', theadIsSet)
  let btn_showHideHeader = document.getElementById('btn_showHideHeader')
  if (theadIsSet) {
    btn_showHideHeader.classList.remove('btn-secondary')
    btn_showHideHeader.classList.add('btn-primary')
  } else {
    btn_showHideHeader.classList.remove('btn-primary')
    btn_showHideHeader.classList.add('btn-secondary')
  }
}
