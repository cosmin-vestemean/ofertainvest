import { LitElement, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js'
import { estimari } from './views/litwc-estimari.js'
import { myTable } from './views/myTable.js'
import { antemasuratori } from './views/litwc-antemasuratori.js'
import { saveRecipesAndInstanteAndTrees, getValFromS1Query, runSQLTransaction } from './utils/S1.js'
import { listaEstimari } from './views/listaEstimari.js'
import { tables } from './utils/tables.js'
import { selectedTheme } from './utils/init.js'
import { setDsAntemasuratori } from './controllers/antemasuratori.js'
import { ds_antemasuratori } from './controllers/antemasuratori.js'
import { _cantitate_oferta } from './utils/_cantitate_oferta.js'

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
export const client = feathers()
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

//runSQLTransaction
client.use('runSQLTransaction', socketClient.service('runSQLTransaction'), {
  methods: ['find', 'get', 'create', 'update', 'patch', 'remove']
})

export const ierarhii = new UseBootstrapSelect(document.getElementById('ierarhii'))
export var contextOferta = {
  PRJC: 0,
  TRDR: 0,
  FILENAME: ''
}

export var optimal_ds = []
export function setOptimalDs(value) {
  optimal_ds = value
}
export var recipes_ds = []
export function setRecipesDs(value) {
  recipes_ds = value
}
export var selected_ds = []
export var ds_instanteRetete = []
export function setDsInstanteRetete(value) {
  ds_instanteRetete = value
}
export var trees = []
export function setTrees(value) {
  trees = value
}
export var niveluri = []
export var _nivel_oferta = 'NIVEL_OFERTA_'
export var _grupare_oferta = 'GRUPARE_ARTICOL_OFERTA'
export var _start_date = 'DATA_START'
export var _end_date = 'DATA_END'
export var activitati_oferta = []
export var intrari_orfane = []
export var WBSMap = []
export var theadIsSet = true
export var retetaCurenta = {}

var activitateCurenta = {}
var combinatii_unice = []
var visible_columns = []
var denumireUnica_ds = []

const recipeDisplayMask = {
  old_WBS: { value: 'old_WBS', RW: false, visible: false, label: 'WBS vechi' },
  WBS: { value: 'WBS', RW: false, visible: false, label: 'WBS' },
  DENUMIRE_ARTICOL_OFERTA: {
    value: 'DENUMIRE_ARTICOL_OFERTA',
    RW: true,
    visible: true,
    label: 'Denumire'
  },
  CANTITATE_ARTICOL_OFERTA: {
    value: 'CANTITATE_ARTICOL_OFERTA',
    RW: true,
    visible: false,
    label: 'Cantitate'
  },
  UM_ARTICOL_OFERTA: { value: 'UM_ARTICOL_OFERTA', RW: true, visible: true, label: 'UM' },
  TIP_ARTICOL_OFERTA: { value: TIP_ARTICOL_OFERTA, RW: true, visible: true, label: 'Tip articol' },
  SUBTIP_ARTICOL_OFERTA: { value: SUBTIP_ARTICOL_OFERTA, RW: true, visible: true, label: 'Subtip articol' },
  CANTITATE_UNITARA_ARTICOL_RETETA: {
    value: 'CANTITATE_UNITARA_ARTICOL_RETETA',
    RW: true,
    visible: true,
    label: 'Cantitate unitara'
  },
  PONDERE_DECONT_ACTIVITATE_ARTICOL_RETETA: {
    value: 'PONDERE_DECONT_ACTIVITATE_ARTICOL_RETETA',
    RW: true,
    visible: true,
    label: 'Pondere decont'
  },
  PONDERE_NORMA_ACTIVITATE_ARTICOL_RETETA: {
    value: 'PONDERE_NORMA_ACTIVITATE_ARTICOL_RETETA',
    RW: true,
    visible: true,
    label: 'Pondere norma'
  }
}

export const delimiter = '~~~~~~~~~~~~~~~'

export const themes = ['default', 'cerulean', 'flatly', 'sandstone', 'stylish', 'yeti']
export var template = document.createElement('template')
template.id = 'shadowRootTemplate'
let themeLink =
  selectedTheme === 'default'
    ? ''
    : `<link id="theme_link" rel="stylesheet" href="./css/${selectedTheme}.css">`
template.innerHTML = `
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3" crossorigin="anonymous">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.3.0/font/bootstrap-icons.css"/>${themeLink}
<script
  src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"
  integrity="sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p"
  crossorigin="anonymous">
</script>`

// 1. load excel file by file chooser xlsx.js
export function loadDataFromFile(evt) {
  var file = document.getElementById('file_oferta_initiala').files[0]
  contextOferta.FILENAME = file.name
  //check if CCCOFERTEWEB has FILENAME for this file with S1/getValFromQuery
  getValFromS1Query(`select count(*) from CCCOFERTEWEB where FILENAME = '${contextOferta.FILENAME}'`).then(
    (result) => {
      if (result.success) {
        if (result.value > 0) {
          alert('Oferta cu acest nume exista deja in baza de date')
        } else {
          var reader = new FileReader()
          reader.onload = function (e) {
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
              fromXls2Recipes(XL_row_object)
            })
          }

          reader.onerror = function (ex) {
            console.log(ex)
          }

          reader.readAsArrayBuffer(file)

          changeBtnOferta()
        }
        return
      } else {
        console.log('error', result.error)
      }
    }
  )
  var reader = new FileReader()
  reader.onload = function (e) {
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
      fromXls2Recipes(XL_row_object)
    })
  }

  reader.onerror = function (ex) {
    console.log(ex)
  }

  reader.readAsArrayBuffer(file)

  changeBtnOferta()

  function changeBtnOferta() {
    var btn_oferta = document.getElementById('btn_oferta')
    var dl = `<i class="bi bi-download"></i>`
    btn_oferta.innerHTML = 'Salveaza oferta ' + dl
    btn_oferta.classList.remove('btn-success')
    btn_oferta.classList.add('btn-danger')
  }
}

export function fromXls2Recipes(excel_object) {
  optimal_ds = excel_object
  tables.hideAllBut([tables.my_table1])
  tables.my_table1.tableId = 'oferta_initiala'
  tables.my_table1.element.ds = optimal_ds
  processExcelData(optimal_ds)
  detectieRetete() //recipes_ds, instanteRetete
}

export function processExcelData(optimal_ds) {
  var combinatii_unice_as_str = []
  if (trees.length == 0) {
    var result = creazaIerarhii(optimal_ds, delimiter)
    niveluri = result.niveluri
    combinatii_unice_as_str = result.combinatii_unice_as_str
    combinatii_unice = result.combinatii_unice
  } else {
    //recalculate combinatii_unice_as_str, niveluri, combinatii_unice from trees
    niveluri = []
    combinatii_unice_as_str = []
    combinatii_unice = []
    trees.forEach(function (tree) {
      tree.forEach(function (branch) {
        var combo = []
        branch.forEach(function (nivel) {
          if (nivel.includes(_nivel_oferta)) {
            niveluri.push(nivel)
            combo.push(nivel)
          }
        })
        combinatii_unice.push(combo)
      })
    })
    combinatii_unice.forEach(function (combo) {
      combinatii_unice_as_str.push(combo.join(delimiter))
    })
  }

  populateSelect(combinatii_unice_as_str, delimiter)
  addOnChangeEvt(optimal_ds, delimiter, 'my_table_oferta_initiala')

  createGraphs(combinatii_unice)
}

async function salveazaOfertaInDB(ds) {
  let sqlList = []
  const ofertaExista = await getValFromS1Query(
    `select count(*) from CCCOFERTEWEB where PRJC = ${contextOferta.PRJC}`
  )
  if (!ofertaExista.success) {
    console.log('error', ofertaExista.error)
    return ofertaExista
  }
  if (ofertaExista.value > 0) {
    sqlList.push(
      `UPDATE CCCOFERTEWEB SET JSONSTR = '${JSON.stringify(ds)}', FILENAME = '${contextOferta.FILENAME}', TRDR = ${contextOferta.TRDR}, PRJC = ${contextOferta.PRJC} WHERE PRJC = ${contextOferta.PRJC}`
    )
  } else {
    sqlList.push(
      `INSERT INTO CCCOFERTEWEB (NAME, FILENAME, TRDR, PRJC, JSONSTR) VALUES ('${contextOferta.FILENAME}', '${contextOferta.FILENAME}', ${contextOferta.TRDR}, ${contextOferta.PRJC}, '${JSON.stringify(ds)}')`
    )
  }

  // Delete existing records in CCCOFERTEWEBLINII for the given PRJC
  sqlList.push(
    `DELETE FROM CCCOFERTEWEBLINII WHERE CCCOFERTEWEB = (SELECT CCCOFERTEWEB FROM CCCOFERTEWEB WHERE PRJC = ${contextOferta.PRJC})`
  )

  // Insert new records from ds into CCCOFERTEWEBLINII
  ds.forEach((item) => {
    /*
    sqlList.push(
      `INSERT INTO CCCOFERTEWEBLINII (CCCOFERTEWEB, WBS, GRUPARE_ART_OF, DENUMIRE_ART_OF, SERIE_ART_OF, TIP_ART_OF, SUBTIP_ART_OF, NIVEL_OF_1, NIVEL_OF_2, NIVEL_OF_3, NIVEL_OF_4, NIVEL_OF_5, NIVEL_OF_6, NIVEL_OF_7, NIVEL_OF_8, NIVEL_OF_9, NIVEL_OF_10, UM_ART_OF, CANT_ART_OF, COST_UNTR_MTRL_ART_OF, COST_UNTR_MAN_ART_OF, COST_UNTR_UTL_ART_OF, COST_UNTR_TRNS_ART_OF, NORMA_UNTR_ORE_MAN_ART_OF, COST_UNTR_ART_OF, COST_TOTAL_MTRL_ART_OF, COST_TOTAL_MAN_ART_OF, COST_TOTAL_UTL_ART_OF, COST_TOTAL_TRNS_ART_OF, COST_TOTAL_ART_OF, TOTAL_ORE_MAN_ART_OF, PRET_UNTR_MTRL_ART_OF, PRET_UNTR_MAN_ART_OF, PRET_UNTR_UTL_ART_OF, PRET_UNTR_TRNS_ART_OF, PRET_UNTR_ART_ART_OF, PRET_TOTAL_MTRL_ART_OF, PRET_TOTAL_MAN_ART_OF, PRET_TOTAL_UTL_ART_OF, PRET_TOTAL_TRNS_ART_OF, PRET_TOTAL_ART_ART_OF) VALUES ((SELECT CCCOFERTEWEB FROM CCCOFERTEWEB WHERE PRJC = ${contextOferta.PRJC}), '${item.WBS}', '${item.GRUPARE_ARTICOL_OFERTA}', '${item.DENUMIRE_ARTICOL_OFERTA}', '${item.SERIE_ARTICOL_OFERTA}', '${item.TIP_ARTICOL_OFERTA}', '${item.SUBTIP_ARTICOL_OFERTA}', '${item.NIVEL_OFERTA_1}', '${item.NIVEL_OFERTA_2}', '${item.NIVEL_OFERTA_3}', '${item.NIVEL_OFERTA_4}', '${item.NIVEL_OFERTA_5}', '${item.NIVEL_OFERTA_6}', '${item.NIVEL_OFERTA_7}', '${item.NIVEL_OFERTA_8}', '${item.NIVEL_OFERTA_9}', '${item.NIVEL_OFERTA_10}', '${item.UM_ARTICOL_OFERTA}', '${item.CANTITATE_ARTICOL_OFERTA}', '${item.COST_UNITAR_MATERIAL_ARTICOL_OFERTA}', '${item.COST_UNITAR_MANOPERA_ARTICOL_OFERTA}', '${item.COST_UNITAR_UTILAJ_ARTICOL_OFERTA}', '${item.COST_UNITAR_TRANSPORT_ARTICOL_OFERTA}', '${item.NORMA_UNITARA_ORE_MANOPERA_ARTICOL_OFERTA}', '${item.COST_UNITAR_ARTICOL_OFERTA}', '${item.COST_TOTAL_MATERIAL_ARTICOL_OFERTA}', '${item.COST_TOTAL_MANOPERA_ARTICOL_OFERTA}', '${item.COST_TOTAL_UTILAJ_ARTICOL_OFERTA}', '${item.COST_TOTAL_TRANSPORT_ARTICOL_OFERTA}', '${item.COST_TOTAL_ARTICOL_OFERTA}', '${item.TOTAL_ORE_MANOPERA_ARTICOL_OFERTA}', '${item.PRET_UNITAR_MATERIAL_ARTICOL_OFERTA}', '${item.PRET_UNITAR_MANOPERA_ARTICOL_OFERTA}', '${item.PRET_UNITAR_UTILAJ_ARTICOL_OFERTA}', '${item.PRET_UNITAR_TRANSPORT_ARTICOL_OFERTA}', '${item.PRET_UNITAR_ARTICOL_ARTICOL_OFERTA}', '${item.PRET_TOTAL_MATERIAL_ARTICOL_OFERTA}', '${item.PRET_TOTAL_MANOPERA_ARTICOL_OFERTA}', '${item.PRET_TOTAL_UTILAJ_ARTICOL_OFERTA}', '${item.PRET_TOTAL_TRANSPORT_ARTICOL_OFERTA}', '${item.PRET_TOTAL_ARTICOL_ARTICOL_OFERTA}');`
    )
    */
    //keep in mind that nivel_oferta_n can be empty so we do not insert it
    let n1 = item.NIVEL_OFERTA_1
      ? { insertName: 'NIVEL_OF_1, ', insertValue: `'${item.NIVEL_OFERTA_1}', ` }
      : { insertName: '', insertValue: '' }
    let n2 = item.NIVEL_OFERTA_2
      ? { insertName: 'NIVEL_OF_2, ', insertValue: `'${item.NIVEL_OFERTA_2}', ` }
      : { insertName: '', insertValue: '' }
    let n3 = item.NIVEL_OFERTA_3
      ? { insertName: 'NIVEL_OF_3, ', insertValue: `'${item.NIVEL_OFERTA_3}', ` }
      : { insertName: '', insertValue: '' }
    let n4 = item.NIVEL_OFERTA_4
      ? { insertName: 'NIVEL_OF_4, ', insertValue: `'${item.NIVEL_OFERTA_4}', ` }
      : { insertName: '', insertValue: '' }
    let n5 = item.NIVEL_OFERTA_5
      ? { insertName: 'NIVEL_OF_5, ', insertValue: `'${item.NIVEL_OFERTA_5}', ` }
      : { insertName: '', insertValue: '' }
    let n6 = item.NIVEL_OFERTA_6
      ? { insertName: 'NIVEL_OF_6, ', insertValue: `'${item.NIVEL_OFERTA_6}', ` }
      : { insertName: '', insertValue: '' }
    let n7 = item.NIVEL_OFERTA_7
      ? { insertName: 'NIVEL_OF_7, ', insertValue: `'${item.NIVEL_OFERTA_7}', ` }
      : { insertName: '', insertValue: '' }
    let n8 = item.NIVEL_OFERTA_8
      ? { insertName: 'NIVEL_OF_8, ', insertValue: `'${item.NIVEL_OFERTA_8}', ` }
      : { insertName: '', insertValue: '' }
    let n9 = item.NIVEL_OFERTA_9
      ? { insertName: 'NIVEL_OF_9, ', insertValue: `'${item.NIVEL_OFERTA_9}', ` }
      : { insertName: '', insertValue: '' }
    let n10 = item.NIVEL_OFERTA_10
      ? { insertName: 'NIVEL_OF_10, ', insertValue: `'${item.NIVEL_OFERTA_10}', ` }
      : { insertName: '', insertValue: '' }

    sqlList.push(
      `INSERT INTO CCCOFERTEWEBLINII (CCCOFERTEWEB, WBS, GRUPARE_ART_OF, DENUMIRE_ART_OF, SERIE_ART_OF, TIP_ART_OF, SUBTIP_ART_OF, ${n1.insertName}${n2.insertName}${n3.insertName}${n4.insertName}${n5.insertName}${n6.insertName}${n7.insertName}${n8.insertName}${n9.insertName}${n10.insertName} UM_ART_OF, CANT_ART_OF, COST_UNITAR_MATERIAL_ART_OF, COST_UNTR_MTRL_ART_OF, 
      COST_UNTR_MAN_ART_OFUTL,
	COST_UNTR_UTL_ART_OF,
	COST_UNTR_TRNS_ART_OF,
	NORMA_UNTR_ORE_MAN_ART_OF,
	COST_UNTR_ART_OF,
	COST_TOTAL_MTRL_ART_OF,
	COST_TOTAL_MAN_ART_OF,
	COST_TOTAL_UTL_ART_OF,
	COST_TOTAL_TRNS_ART_OF,
	COST_TOTAL_ART_OF,
	TOTAL_ORE_MAN_ART_OF,
	PRET_UNTR_MTRL_ART_OF,
	PRET_UNTR_MAN_ART_OF,
	PRET_UNTR_UTL_ART_OF,
	PRET_UNTR_TRNS_ART_OF,
	PRET_UNTR_ART_ART_OF,
	PRET_TOTAL_MTRL_ART_OF,
	PRET_TOTAL_MAN_ART_OF,
	PRET_TOTAL_UTL_ART_OF,
	PRET_TOTAL_TRNS_ART_OF,
	PRET_TOTAL_ART_ART_OF) VALUES ((SELECT CCCOFERTEWEB FROM CCCOFERTEWEB WHERE PRJC = ${contextOferta.PRJC}), '${item.WBS}', '${item.GRUPARE_ARTICOL_OFERTA}', '${item.DENUMIRE_ARTICOL_OFERTA}', '${item.SERIE_ARTICOL_OFERTA}', '${item.TIP_ARTICOL_OFERTA}', '${item.SUBTIP_ARTICOL_OFERTA}', ${n1.insertValue}${n2.insertValue}${n3.insertValue}${n4.insertValue}${n5.insertValue}${n6.insertValue}${n7.insertValue}${n8.insertValue}${n9.insertValue}${n10.insertValue} '${item.UM_ARTICOL_OFERTA}', ${item.CANTITATE_ARTICOL_OFERTA}, ${item.COST_UNITAR_MATERIAL_ARTICOL_OFERTA}, ${item.COST_UNITAR_MANOPERA_ARTICOL_OFERTA}, ${item.COST_UNITAR_UTILAJ_ARTICOL_OFERTA}, ${item.COST_UNITAR_TRANSPORT_ARTICOL_OFERTA}, ${item.NORMA_UNITARA_ORE_MANOPERA_ARTICOL_OFERTA}, ${item.COST_UNITAR_ARTICOL_OFERTA}, ${item.COST_TOTAL_MATERIAL_ARTICOL_OFERTA}, ${item.COST_TOTAL_MANOPERA_ARTICOL_OFERTA}, ${item.COST_TOTAL_UTILAJ_ARTICOL_OFERTA}, ${item.COST_TOTAL_TRANSPORT_ARTICOL_OFERTA}, ${item.COST_TOTAL_ARTICOL_OFERTA}, ${item.TOTAL_ORE_MANOPERA_ARTICOL_OFERTA}, ${item.PRET_UNITAR_MATERIAL_ARTICOL_OFERTA}, ${item.PRET_UNITAR_MANOPERA_ARTICOL_OFERTA}, ${item.PRET_UNITAR_UTILAJ_ARTICOL_OFERTA}, ${item.PRET_UNITAR_TRANSPORT_ARTICOL_OFERTA}, ${item.PRET_UNITAR_ARTICOL_ARTICOL_OFERTA}, ${item.PRET_TOTAL_MATERIAL_ARTICOL_OFERTA}, ${item.PRET_TOTAL_MANOPERA_ARTICOL_OFERTA}, ${item.PRET_TOTAL_UTILAJ_ARTICOL_OFERTA}, ${item.PRET_TOTAL_TRANSPORT_ARTICOL_OFERTA}, ${item.PRET_TOTAL_ARTICOL_ARTICOL_OFERTA})`
    )
  })

  return new Promise(async (resolve, reject) => {
    try {
      const result = await runSQLTransaction({ sqlList: sqlList })
      console.log('result', result)
      resolve(result)
    } catch (error) {
      console.log('error', error)
      reject(error)
    }
  })
}

export function addOnChangeEvt(ds, delimiter, tableId) {
  //var select = document.getElementById('ierarhii')
  let select = ierarhii.selectElement
  select.onchange = function () {
    let selected_options_arr = ierarhii.getValue()
    console.log('selected_options_arr', selected_options_arr)
    if (selected_options_arr && selected_options_arr.length > 0) {
      flatFind(selected_options_arr, ds, delimiter)
    }

    console.log('selected_ds', selected_ds)

    //create table rows
    if (selected_ds.length > 0) {
      //pushDataToTable(selected_ds, 'thead_oferta_initiala', 'tbody_oferta_initiala')
      //my-table component
      document.getElementById(tableId).ds = selected_ds
    } else {
      //all rows
      document.getElementById(tableId).ds = ds
    }

    //drawModalDialog(select.value.split(delimiter), selected_ds)
  }
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
    if (key.includes(_nivel_oferta)) {
      niveluri.push(key)
    }
  })

  console.log('niveluri detectate', niveluri)

  //scan optimal_ds and create distinct combinations of values for combo NIVEL_OFERTA_1, NIVEL_OFERTA_2, NIVEL_OFERTA_3 ... NIVEL_OFERTA_N
  var all_combos_for_niveluri = []
  optimal_ds.forEach(function (object) {
    var combo = []
    niveluri.forEach(function (nivel) {
      //if trimmed object[nivel] is not empty add it to combo
      if (object[nivel] && object[nivel].trim()) combo.push(object[nivel])
    })
    all_combos_for_niveluri.push(combo)
  })

  //console.log("all_combos_for_niveluri", all_combos_for_niveluri);

  //remove duplicates from all_combos_for_niveluri
  var combinatii_unice_as_str = []
  all_combos_for_niveluri.forEach(function (combo) {
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

  return { niveluri, combinatii_unice_as_str, combinatii_unice }
}

function populateSelect(combinatii_unice_as_str, delimiter) {
  UseBootstrapSelect.clearAll(document.getElementById('ierarhii'))
  //add combinatii_unice_as_str as options
  combinatii_unice_as_str.forEach(function (combo_str) {
    ierarhii.addOption(combo_str, combo_str.split(delimiter).join(' - '))
  })
}

export function flatFind(selected_options_arr, ds, delimiter) {
  selected_ds = []
  console.log('selected_options', selected_options_arr)
  if (!selected_options_arr || selected_options_arr.length == 0) {
    return
  }
  //filter optimal_ds by selected option and display it in table
  var maxNiv = 0
  //find lengthest tree in trees array of arrays
  trees.forEach(function (tree) {
    tree.forEach(function (branch) {
      if (branch.length > maxNiv) {
        maxNiv = branch.length
      }
    })
  })

  console.log('maxNiv', maxNiv)
  if (niveluri.length < maxNiv) {
    //add extra niveluri
    for (var i = niveluri.length; i < maxNiv; i++) {
      niveluri.push(_nivel_oferta + (i + 1))
    }
  }
  ds.forEach(function (object) {
    var combo = []
    niveluri.forEach(function (nivel) {
      if (object[nivel]) combo.push(object[nivel])
    })
    var comboStr = combo.join(delimiter)
    if (selected_options_arr.includes(comboStr)) {
      selected_ds.push(object)
    } else {
      //try to find selected_options_arr in comboStr
      var found = false
      selected_options_arr.forEach(function (selected_option) {
        if (comboStr.includes(selected_option)) {
          found = true
        }
      })
      if (found) {
        selected_ds.push(object)
      }
    }
  })

  //console.log('selected_ds', selected_ds)
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

export async function saveOferta() {
  let trdr = document.getElementById('trdr').value
  let trndate = document.getElementById('trndate').value
  let prjc = document.getElementById('prjc').value
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

  if (!optimal_ds.length) {
    alert('Nu exista date pentru salvare')
    return
  }

  let hourglassIcon = '<i class="bi bi-hourglass-split"></i>'
  let btn_oferta = document.getElementById('btn_oferta')
  btn_oferta.innerHTML = hourglassIcon + ' Salvare...'
  //bg-warning
  btn_oferta.classList.remove('btn-danger')
  btn_oferta.classList.add('btn-info')

  salveazaOfertaInDB(optimal_ds)
    .then((result) => {
      if (result.success) {
        btn_oferta.innerHTML = 'Oferta'
        btn_oferta.classList.remove('btn-info')
        btn_oferta.classList.add('btn-success')
        btn_oferta.setAttribute('data-saved', 'true')
      } else {
        btn_oferta.innerHTML = 'Eroare la salvare'
        btn_oferta.classList.remove('btn-info')
        btn_oferta.classList.add('btn-danger')
        console.log('Eroare la savarea ofertei', result.error)
      }
    })
    .catch((error) => {
      btn_oferta.innerHTML = 'Eroare la salvare'
      btn_oferta.classList.remove('btn-info')
      btn_oferta.classList.add('btn-danger')
      console.log('Eroare la savarea ofertei', error)
    })
}

export function populateSelectIerarhiiFromTrees() {
  //var select = document.getElementById('ierarhii')
  UseBootstrapSelect.clearAll(document.getElementById('ierarhii'))
  trees.forEach(function (tree, index) {
    tree.forEach(function (branch) {
      ierarhii.addOption(branch.join(delimiter), branch.join(' - '))
    })
  })
}

export function showRecipes() {
  //hide table1
  tables.hideAllBut([tables.my_table2, tables.my_table3])
  let listaRetete = []
  recipes_ds.forEach((o) => {
    listaRetete.push({ Reteta: o.name })
  })
  tables.my_table2.element.ds = listaRetete
}

export function detectieRetete() {
  let rez = createDatasetForRecipes()
  console.log('rez', rez)
  activitati_oferta = []
  recipes_ds = []
  intrari_orfane = []
  setDsAntemasuratori([])
  console.log(ds_antemasuratori)
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

  autocompleteRetete_1()

  saveRecipesAndInstanteAndTrees()

  function autocompleteRetete_1() {
    /*
Pentru Articole Principale care au doar Subarticole Material.
CANTITATE_UNITARA_ACTIVITATE_ARTICOL_RETETA. Completat automat cu 1
PONDERE_DECONT_ACTIVITATE_ARTICOL_RETETA. Completat automat cu 1 cu avertisment rosu la de pasire max = 1 cand adaug Activitati Noi.
PONDERE_NORMA_ACTIVITATE_ARTICOL_RETETA. Completat automat cu 1, editabil.
CANTITATE_UNITARA_MATERIAL_ACTIVITATE_ARTICOL_RETETA. Completat automat cu CANTITATE_ARTICOL_OFERTA al tuturor instantelor Subarticolului Material impartita la suma CANTITATE_ARTICOL_OFERTA al tuturor instantelor Articolului Principal (Activitate), pentru fiecare Subarticol.
*/
    //1. loop through recipes_ds
    //2. loop through every reteta's activities (reteta.object)
    //3. find if activity has TIP_ARTICOL = 'ARTICOL' and SUBTIP_ARTICOL = 'PRINCIPAL' (lowercase), if not skip
    //4. loop through reteta.object's children and skip if TIP_ARTICOL <> 'SUBARTICOL' and SUBTIP_ARTICOL <> 'MATERIAL' (lowercase)
    //5. if all children are SUBARTICOL MATERIAL then set CANTITATE_UNITARA_ACTIVITATE_ARTICOL_RETETA = 1 in reteta.object, else skip
    //6. set PONDERE_DECONT_ACTIVITATE_ARTICOL_RETETA = 1 in reteta.object
    //7. set PONDERE_NORMA_ACTIVITATE_ARTICOL_RETETA = 1 in reteta.object
    //8. for these type of children:
    //9. find by WBS all instances of the parent and sum their CANTITATE_ARTICOL_OFERTA
    //10. find by WBS all instances of the child and sum their CANTITATE_ARTICOL_OFERTA
    //11. set CANTITATE_UNITARA_MATERIAL_ACTIVITATE_ARTICOL_RETETA = sum_child / sum_parent
    //GO

    recipes_ds.forEach((reteta) => {
      let reteta_obj = reteta.reteta
      let duplicateParent = reteta.id
      reteta_obj.forEach((activitate) => {
        if (
          activitate.object.TIP_ARTICOL_OFERTA.toLowerCase() === 'articol' &&
          activitate.object.SUBTIP_ARTICOL_OFERTA.toLowerCase() === 'principal'
        ) {
          let children = activitate.children
          let isMaterial = true
          children.forEach((child) => {
            if (
              child.object.TIP_ARTICOL_OFERTA.toLowerCase() !== 'subarticol' ||
              child.object.SUBTIP_ARTICOL_OFERTA.toLowerCase() !== 'material'
            ) {
              isMaterial = false
            }
          })
          //skip if not all children are SUBARTICOL MATERIAL
          if (!isMaterial) {
            return
          } else {
            activitate.object.CANTITATE_UNITARA_ARTICOL_RETETA = 1
            activitate.object.PONDERE_DECONT_ACTIVITATE_ARTICOL_RETETA = 1
            activitate.object.PONDERE_NORMA_ACTIVITATE_ARTICOL_RETETA = 1
            children.forEach((child) => {
              let parent = activitate.object.WBS
              let sum_parent = 0
              let sum_child = 0
              ds_instanteRetete.forEach((instance) => {
                if (instance.duplicateOf === duplicateParent) {
                  //loop through instanceSpecifics and find by WBS parent and sum their CANTITATE_ARTICOL_OFERTA
                  let foundParent = instance.instanceSpecifics.find((o) => o.object.WBS === parent)
                  if (foundParent) {
                    sum_parent += foundParent.object[_cantitate_oferta]
                    //find by WBS child and sum their CANTITATE_ARTICOL_OFERTA
                    let foundChild = foundParent.children.find((o) => o.object.WBS === child.object.WBS)
                    if (foundChild) {
                      sum_child += foundChild.object[_cantitate_oferta]
                    }
                  }
                }
              })
              child.object.CANTITATE_UNITARA_ARTICOL_RETETA = sum_child / sum_parent
            })
          }
        }
      })
    })
  }
}

function createDatasetForRecipes() {
  return createTreesFromWBS(optimal_ds)
}

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
      //console.log('input event', e.target)
      //find tag name id and class
      var tagName = e.target.tagName
      //var id = e.target.id
      //var className = e.target.className
      if (tagName === 'TD') {
        /*
        console.log(
          'hey, a td was clicked',
          className + ' ' + 'id: ' + id + ' ' + 'text: ' + e.target.textContent
        )
        */
        //save to activitateCurenta
        //check if activitate or material
        //if material find index in activitateCurenta.children and update; if not found add
        //if activitate, update activitateCurenta
        var td = e.target
        var key = e.target.id.split('@')[1]
        if (td.classList.contains('activitate')) {
          //update activitateCurenta
          activitateCurenta.object[key] = e.target.textContent
        } else if (td.classList.contains('material')) {
          //update material
          var indexOfChild = e.target.id.split('@')[0] - 1
          var tr = e.target.parentElement
          var tds = tr.getElementsByTagName('td')
          var index = -1
          for (let i = 0; i < tds.length; i++) {
            if (tds[i] === e.target) {
              index = i
              break
            }
          }
          //find material in activitateCurenta.children
          if (index > -1) {
            var material = activitateCurenta.children[indexOfChild]
            material.object[key] = e.target.textContent
          }
        }
      }
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
    //console.log('activity element added to the DOM')
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
        tbody.style.fontSize = 'small'
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
          //create a new child material
          var material = {
            branch: [],
            object: {
              WBS: '',
              DENUMIRE_ARTICOL_OFERTA: '',
              CANTITATE_ARTICOL_OFERTA: 0,
              UM_ARTICOL_OFERTA: '',
              TIP_ARTICOL_OFERTA: '',
              SUBTIP_ARTICOL_OFERTA: ''
            },
            level: -1,
            hasChildren: false,
            virtual: false
          }
          activitateCurenta.children.push(material)
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
          for (let j = 0; j < tds.length; j++) {}
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
          th.classList.add(key)
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
        td.classList.add('activitate')
        td.id = '0@' + key
        td.scope = 'col'
        td.innerHTML = this.activitate.object[key] || ''
        td.contentEditable = true
        td.spellcheck = false
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
          td.classList.add(key)
          td.classList.add('material')
          td.classList.add(mCounter - 1)
          td.id = mCounter.toString() + '@' + key
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

  //console.log('cloneDs', cloneDs)

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

  //sunt maxLevels niveluri in tree
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
  //console.log('result', [...result])

  //take result and add it to resultPlus array as branch property and add possible cloneDs object with the same WBS
  let resultPlus = []
  result.forEach(function (branch) {
    let matches = cloneDs.filter((object) => object.WBS == branch.join('.'))
    matches.forEach(function (match) {
      //check if branch/match is already in resultPlus
      let found = resultPlus.find(
        (obj) =>
          obj.branch.join('.') == branch.join('.') &&
          obj.object.DENUMIRE_ARTICOL_OFERTA == match.DENUMIRE_ARTICOL_OFERTA
      )
      if (!found) {
        resultPlus.push({ branch: branch, object: match })
      }
    })
  })

  //console.log('instanteRetete4', [...resultPlus])
  let instanteRetete = applyFilterTipSubTip(resultPlus)
  //console.log('instanteRetete3', [...instanteRetete])

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

  //console.log('instanteRetete2', [...instanteRetete])

  //returns old WBS and newly created WBS, if any
  instanteRetete = applyFilterChildrenEndsWith0(instanteRetete)
  //console.log('instanteRetete1', [...instanteRetete])

  instanteRetete = prepareForMultipleActivities(instanteRetete)
  //console.log('instanteRetete', [...instanteRetete])

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

  let rez = eliminateDuplicates(instanteRetete1)
  let retete = rez.retete
  instanteRetete = rez.instanteRetete

  //add to retete > reteta > object CANTITATE_UNITARA_ACTIVITATE_ARTICOL_RETETA, PONDERE_DECONT_ACTIVITATE_ARTICOL_RETETA, PONDERE_NORMA_ACTIVITATE_ARTICOL_RETETA
  for (let i = 0; i < retete.length; i++) {
    let reteta = retete[i].reteta
    for (let j = 0; j < reteta.length; j++) {
      let object = reteta[j].object
      if (!object.CANTITATE_UNITARA_ARTICOL_RETETA) object.CANTITATE_UNITARA_ARTICOL_RETETA = 0
      if (!object.PONDERE_DECONT_ACTIVITATE_ARTICOL_RETETA)
        object.PONDERE_DECONT_ACTIVITATE_ARTICOL_RETETA = 0
      if (!object.PONDERE_NORMA_ACTIVITATE_ARTICOL_RETETA) object.PONDERE_NORMA_ACTIVITATE_ARTICOL_RETETA = 0
      let materiale = reteta[j].children
      //add CANTITATE_UNITARA_ACTIVITATE_ARTICOL_RETETA to every material
      for (let k = 0; k < materiale.length; k++) {
        let material = materiale[k]
        if (!material.object.CANTITATE_UNITARA_ARTICOL_RETETA)
          material.object.CANTITATE_UNITARA_ARTICOL_RETETA = 0
        if (!material.object.PONDERE_DECONT_ACTIVITATE_ARTICOL_RETETA)
          material.object.PONDERE_DECONT_ACTIVITATE_ARTICOL_RETETA = null
        if (!material.object.PONDERE_NORMA_ACTIVITATE_ARTICOL_RETETA)
          material.object.PONDERE_NORMA_ACTIVITATE_ARTICOL_RETETA = null
      }
    }
  }

  //add field FInalizat to instantele de reteta
  /* for (let i = 0; i < instanteRetete.length; i++) {
    let obj = instanteRetete[i]
    obj.object.Finalizat = false
  } */

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
    newObj1.object.CANTITATE_UNITARA_ARTICOL_RETETA = 1
    newObj2.children = []
    newObj2.children.push(newObj1)
    newObj2.object.old_WBS = ''
    newObj2.object.CANTITATE_UNITARA_ARTICOL_RETETA = 1
    newObj2.object.PONDERE_DECONT_ACTIVITATE_ARTICOL_RETETA = 1
    if (
      (newObj2.object.TIP_ARTICOL_OFERTA.toLowerCase() == 'articol' &&
        newObj2.object.SUBTIP_ARTICOL_OFERTA.toLowerCase() == 'principal') ||
      (newObj2.object.TIP_ARTICOL_OFERTA.toLowerCase() == 'articol' &&
        newObj2.object.SUBTIP_ARTICOL_OFERTA.toLowerCase() == 'manopera')
    ) {
      newObj2.object.PONDERE_NORMA_ACTIVITATE_ARTICOL_RETETA = 1
    } else {
      newObj2.object.PONDERE_NORMA_ACTIVITATE_ARTICOL_RETETA = 0
    }
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
    reteta.forEach(function (activitate) {
      let children = activitate.children
      //console.log('children', children)
      let childrenEndsWithL = children.filter((child) => child.branch[child.branch.length - 1] == 'L')
      //console.log('childrenEndsWithL', childrenEndsWithL)
      if (childrenEndsWithL.length > 0) {
        activitate.isMain = true
        childrenEndsWithL.forEach(function (child) {
          child.object.CANTITATE_UNITARA_ARTICOL_RETETA = 1
          child.object.PONDERE_DECONT_ACTIVITATE_ARTICOL_RETETA = 1
          child.object.PONDERE_NORMA_ACTIVITATE_ARTICOL_RETETA = 0
          let newActivitateInReteta = JSON.parse(JSON.stringify(child))
          newActivitateInReteta.level = activitate.level
          newActivitateInReteta.children = []
          newActivitateInReteta.hasChildren = true
          child.object.CANTITATE_UNITARA_ARTICOL_RETETA = 1
          child.object.PONDERE_DECONT_ACTIVITATE_ARTICOL_RETETA = null
          child.object.PONDERE_NORMA_ACTIVITATE_ARTICOL_RETETA = null
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

function eliminateDuplicates(data) {
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
    //clone reteta in instanceSpecifics
    obj.instanceSpecifics = JSON.parse(JSON.stringify(obj.reteta))
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
export function showRecipesList(data) {
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

export function showHideHeader() {
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
    //console.log('recipe element added to the DOM')
  }

  render() {
    console.log('rendering recipe element with following array', this.reteta, 'added at', new Date())

    if (!this.reteta || this.reteta.length == 0) {
      return html`<p class="label label-danger">No data</p>`
    } else {
      //add table
      //evidenteaza activitatea de materiale si activitatile intre ele
      var table = document.createElement('table')
      table.style.fontSize = 'small'
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
      plus_icon.classList.add('bi-plus-square', 'text-primary', 'fs-4', 'mb-3')
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
        let activitateNoua = {
          branch: mainActivity.branch,
          object: {
            WBS: '',
            DENUMIRE_ARTICOL_OFERTA: 'Denumire activitate noua',
            CANTITATE_ARTICOL_OFERTA: 0,
            UM_ARTICOL_OFERTA: '',
            TIP_ARTICOL_OFERTA: '',
            SUBTIP_ARTICOL_OFERTA: '',
            CANTITATE_UNITARA_ARTICOL_RETETA: 1,
            PONDERE_DECONT_ACTIVITATE_ARTICOL_RETETA: 1,
            PONDERE_NORMA_ACTIVITATE_ARTICOL_RETETA: 1
          },
          children: [],
          hasChildren: false,
          isMain: false,
          virtual: false,
          level: level
        }
        //adauga niveluri oferta/antemasuratori
        for (let [key, value] of Object.entries(mainActivity.object)) {
          if (key.includes(_nivel_oferta)) {
            activitateNoua.object[key] = value
          }
        }
        //add it to reteta
        retetaCurenta.reteta.push(activitateNoua)
        activitateCurenta = activitateNoua
        my_activity.activitate = activitateCurenta
        //id
        my_activity.id = 'editare_activitate'
        modal_body.appendChild(my_activity)
        modal.show()
      }
      td.appendChild(plus_icon)
      //adauga pictograma ascunde/arata toate materiale <=> td with class='material' > display none/block
      var material_icon = document.createElement('i')
      material_icon.classList.add('bi')
      material_icon.classList.add('bi-eye-slash', 'text-primary', 'fs-4', 'mb-3')
      material_icon.style.cursor = 'pointer'
      material_icon.style.marginLeft = '5px'
      material_icon.onclick = function () {
        var tbody = document
          .getElementById('my_table_detalii_reteta')
          .shadowRoot.getElementById('tbody_reteta')
        var tds = tbody.getElementsByTagName('td')
        for (let i = 0; i < tds.length; i++) {
          if (tds[i].classList.contains('material')) {
            if (tds[i].style.display === 'none') {
              tds[i].style.display = 'table-cell'
            } else {
              tds[i].style.display = 'none'
            }
          }
        }
      }
      td.appendChild(material_icon)
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
        checkbox.classList.add('form-check-input')
        checkbox.classList.add('activitati_reteta')
        checkbox.checked = isActivitatePrincipala
        checkbox.style.marginLeft = '5px'
        //onchange, set activitate.isMain = checkbox.checked
        checkbox.onchange = function () {
          //unchecked all checkboxes from activitati_reteta; keep in mind shadowRoot of 'table_reteta
          var checkboxes = document
            .getElementById('my_table_detalii_reteta')
            .shadowRoot.getElementById('tbody_reteta')
            .getElementsByClassName('activitati_reteta')
          for (let i = 0; i < checkboxes.length; i++) {
            if (checkboxes[i].id !== this.id) {
              checkboxes[i].checked = false
              //find object in retetaCurenta[i] and set isMain = false
              var a = retetaCurenta.reteta[i]
              if (a) {
                a.isMain = false
              }
            }
          }
          activitate.isMain = this.checked
        }
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
          td.classList.add('activitate')
          td.id = counter + '@' + key
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
          td.classList.add('material')
          tr.appendChild(td)

          // loop through the keys of interest and create the corresponding table cells
          for (let [key, value] of Object.entries(recipeDisplayMask)) {
            let td = document.createElement('td')
            if (!value.visible) {
              td.classList.add('d-none')
            }
            td.innerHTML = material.object[key] || ''
            td.classList.add('material')
            td.id = (mCounter - 1).toString() + '@' + key
            tr.appendChild(td)
          }
        }
      }

      return html`${table}`
    }
  }
}

export function setRetetaCurenta(oReteta) {
  retetaCurenta = oReteta
}

export function getRetetaCurenta() {
  return retetaCurenta
}

customElements.define('my-lista-estimari', listaEstimari)
customElements.define('my-table', myTable)
customElements.define('my-recipe', Recipe)
customElements.define('my-antemasuratori', antemasuratori)
customElements.define('my-estimari', estimari)
