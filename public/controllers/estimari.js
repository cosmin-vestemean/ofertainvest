import {
  _start_date,
  _end_date,
  _nivel_oferta} from '../client.js'
import {
  _cantitate_estimari,
  _cantitate_estimari_anterioare,
  _cantitate_antemasuratori, _cantitate_oferta
} from '../utils/_cantitate_oferta.js'


function setValueOfDsEstimariPoolByKey(instanta, ramura, activitate, key, value) {
  context.ds_estimari_pool[instanta][ramura][activitate].row_data[key] = value
}

function setValueOfDsEstimariPool(instanta, ramura, activitate, key, value) {
  context.ds_estimari_pool[instanta][ramura][activitate][key] = value
}

function getValOfDsEstimariPoolByKey(instanta, ramura, activitate, key) {
  return context.ds_estimari_pool[instanta][ramura][activitate].row_data[key] || 0
}

function setValuesOfDsEstimari(index, key, value) {
  //context.ds_estimari_flat[index][key] = value
  context.ds_estimari_pool[index][key] = value
}

var estimariDisplayMask = {
  WBS: { value: 'WBS', RW: false, visible: true, label: 'WBS', type: 'string', filter: 'text' },
  DENUMIRE_ARTICOL_OFERTA: {
    value: 'DENUMIRE_ARTICOL_OFERTA',
    RW: false,
    visible: true,
    label: 'Denumire',
    type: 'string',
    filter: 'text'
  },
  NIVEL_OFERTA_1: { value: 'NIVEL_OFERTA_1', RW: false, visible: true, label: 'Nivel 1', type: 'string', filter: 'select' },
  NIVEL_OFERTA_2: { value: 'NIVEL_OFERTA_2', RW: false, visible: true, label: 'Nivel 2', type: 'string', filter: 'select' },
  NIVEL_OFERTA_3: { value: 'NIVEL_OFERTA_3', RW: false, visible: true, label: 'Nivel 3', type: 'string', filter: 'select' },
  NIVEL_OFERTA_4: { value: 'NIVEL_OFERTA_4', RW: false, visible: true, label: 'Nivel 4', type: 'string', filter: 'select' },
  NIVEL_OFERTA_5: { value: 'NIVEL_OFERTA_5', RW: false, visible: true, label: 'Nivel 5', type: 'string', filter: 'select' },
  NIVEL_OFERTA_6: { value: 'NIVEL_OFERTA_6', RW: false, visible: true, label: 'Nivel 6', type: 'string', filter: 'select' },
  NIVEL_OFERTA_7: { value: 'NIVEL_OFERTA_7', RW: false, visible: true, label: 'Nivel 7', type: 'string', filter: 'select' },
  NIVEL_OFERTA_8: { value: 'NIVEL_OFERTA_8', RW: false, visible: true, label: 'Nivel 8', type: 'string', filter: 'select' },
  NIVEL_OFERTA_9: { value: 'NIVEL_OFERTA_9', RW: false, visible: true, label: 'Nivel 9', type: 'string', filter: 'select' },
  NIVEL_OFERTA_10: { value: 'NIVEL_OFERTA_10', RW: false, visible: true, label: 'Nivel 10', type: 'string', filter: 'select' },
  UM_ARTICOL_OFERTA: { value: 'UM_ARTICOL_OFERTA', RW: false, visible: true, label: 'UM', type: 'string', filter: 'none' },
}

function addParametricDisplayMask(key, value) {
  estimariDisplayMask[key] = value
}

addParametricDisplayMask(_cantitate_oferta, {
  value: _cantitate_oferta,
  RW: false,
  visible: true,
  label: 'Cantitate<br>oferta',
  type: 'number'
})

addParametricDisplayMask(_cantitate_antemasuratori, {
  value: _cantitate_antemasuratori,
  RW: false,
  visible: true,
  label: 'Cantitate<br>antemasuratori',
  type: 'number'
})

addParametricDisplayMask(_cantitate_estimari_anterioare, {
  value: _cantitate_estimari_anterioare,
  RW: false,
  visible: true,
  label: 'Total<br>estimare<br>anterioara',
  type: 'number'
})

addParametricDisplayMask(_cantitate_estimari, {
  value: _cantitate_estimari,
  RW: true,
  visible: true,
  label: 'Cantitate<br>estimari',
  type: 'number'
})

function setDsEstimari(obj) {
  context.ds_estimari = obj
}

function getDsEstimari() {
  return context.ds_estimari
}

function setDsEstimariPool(obj) {
  context.ds_estimari_pool = obj
}

function getDsEstimariPool() {
  return context.ds_estimari_pool
}

function setDsEstimariFlat(obj) {
  context.ds_estimari_flat = obj
}

function getDsEstimariFlat() {
  return context.ds_estimari_flat
}

function createNewEstimariPool(newTree) {
  context.ds_estimari_pool = transformNewTreeIntoEstimariPoolDS(newTree)
  console.log('new ds_estimari_pool', context.ds_estimari_pool)
}

function createNewEstimariFlat() {
  context.ds_estimari_flat = generateTblRowsFromDsEstimariPool()
}

function generateTblRowsFromDsEstimariPool() {
  //create table rows instanta by instanta with addTableRow
  //get instante in ds, then get ramura in instanta and then get activitate in ramura
  let ds = []
  let counter = 0
  for (let key in context.ds_estimari_pool) {
    let instanta = context.ds_estimari_pool[key]
    counter++
    let counter2 = 0
    for (let k in instanta) {
      let ramura = instanta[k]
      counter2++
      let counter3 = 0
      for (let i = 0; i < ramura.length; i++) {
        let o = ramura[i].row_data
        counter3++
        let ramura_obj = {
          instanta: ramura[i].instanta,
          ramura: ramura[i].ramura,
          activitateIndex: i,
          ISMAIN: ramura[i].ISMAIN,
          counter: counter,
          counter2: counter2,
          counter3: counter3,
          estimareIndex: ramura[i].estimareIndex
        }
        ds.push({ ...o, ramura: ramura_obj })
      }
    }
  }

  return ds
}

function transformNewTreeIntoEstimariPoolDS(ds) {
  let ds_e = []
  let firstLine = ds[0][0].object
  let maxLevelA = ds[0][0].antemasuratori[0].branch.length
  //gaseste nivelul maxim din o; adica numara cate _nivel_oferta sunt in o
  //adauga la o diferenta de niveluri
  let keys = Object.keys(firstLine)
  let maxLevelObject = 0
  for (let key of keys) {
    if (key.includes(_nivel_oferta)) {
      maxLevelObject++
    }
  }
  console.log('maxLevelA', maxLevelA, 'maxLevelObject', maxLevelObject)
  let temp = []

  for (let i = 0; i < ds.length; i++) {
    let mainExists = false

    for (let j = 0; j < ds[i].length; j++) {
      let activitate = {}
      activitate = { ...ds[i][j] }
      let o = {}
      o = { ...activitate.object }
      let antemasuratori = []
      activitate.antemasuratori.forEach(function (a) {
        antemasuratori.push({ branch: a.branch, qty: a.qty })
      })
      if (activitate.ISMAIN) {
        mainExists = true
        //console.log('Activitatea principala a fost gasita:', o.DENUMIRE_ARTICOL_OFERTA)
        for (let k = 0; k < antemasuratori.length; k++) {
          let branch = antemasuratori[k]
          let ret_obj = createNewRow(branch, { ...o }, i, j, k, true, maxLevelA, maxLevelObject)
          if (ret_obj) {
            temp.push(ret_obj)
          } else {
            console.log('createNewRow returned null at ' + i + ' ' + j)
          }
        }
      } else {
        for (let k = 0; k < antemasuratori.length; k++) {
          let branch = antemasuratori[k]
          let ret_obj = createNewRow(branch, { ...o }, i, j, k, false, maxLevelA, maxLevelObject)
          if (ret_obj) {
            temp.push(ret_obj)
          } else {
            console.log('createNewRow returned null at ' + i + ' ' + j)
          }
        }
      }
    }

    if (!mainExists) {
      console.log('Activitatea principala nu a fost gasita pentru instanta ', i)
    }
  }

  //sort temp by instanta, ramura
  temp.sort(function (a, b) {
    if (a.instanta < b.instanta) {
      return -1
    }
    if (a.instanta > b.instanta) {
      return 1
    }
    if (a.ramura < b.ramura) {
      return -1
    }
    if (a.ramura > b.ramura) {
      return 1
    }
    return 0
  })

  console.log('temp', temp)
  //recreate dataset but grouped by instanta and ramura in own object; above is an example of dataset temp
  ds_e = temp.reduce(function (acc, object) {
    if (!acc[object.instanta]) {
      acc[object.instanta] = []
    }
    acc[object.instanta].push(object)
    return acc
  }, {})

  //get rid of temp
  temp = null

  //and then each instanta reduce by ramura
  for (let key in ds_e) {
    ds_e[key] = ds_e[key].reduce(function (acc, object) {
      if (!acc[object.ramura]) {
        acc[object.ramura] = []
      }
      acc[object.ramura].push(object)
      return acc
    }, {})
  }

  //console.log('ds_e', ds_e)
  return ds_e
}

function locateTrInEstimariPool(htmlElement) {
  //check for undefined, null, empty or NaN
  if (!htmlElement) {
    return null
  }
  if (!htmlElement.parentElement) {
    return null
  }

  let tr = htmlElement.parentElement
  const positionCoords = tr.id
  const position = positionCoords.split('@')
  const instanta = position[0]
  let ramura = 0
  let activitateIndex = 0
  if (position[1].includes('_')) {
    const s = position[1].split('_')
    ramura = s[0]
    activitateIndex = s[1] - 1
  } else {
    ramura = position[1]
  }

  return { instanta: instanta, ramura: ramura, activitateIndex: activitateIndex }
}

function createNewRow(a, o, i, indexActivit, k, ISMAIN, maxLevelA, maxLevelObject) {
  //adauga la o niveluri noi
  for (let i = maxLevelObject + 1; i < maxLevelA + 1; i++) {
    o[_nivel_oferta + i] = a.branch[i - 1]
  }
  o[_cantitate_antemasuratori] = a.qty
  o[_cantitate_estimari] = 0
  o[_cantitate_estimari_anterioare] = 0
  o[_start_date] = ''
  o[_end_date] = ''
  o.ROW_SELECTED = false
  //create main activity row
  //addTableRow(i, k, counter, o)
  return {
    instanta: i,
    ramura: k,
    activitate: indexActivit,
    denumire: o.DENUMIRE_ARTICOL_OFERTA,
    row_data: o,
    ISMAIN: ISMAIN
  }
}

export let context = {
  ds_estimari_pool: [],
  ds_estimari_flat: [],
  ds_estimari: [],
  createNewEstimariPool,
  createNewEstimariFlat,
  setDsEstimari,
  getDsEstimari,
  setDsEstimariPool,
  getDsEstimariPool,
  setDsEstimariFlat,
  getDsEstimariFlat,
  setValueOfDsEstimariPoolByKey,
  getValOfDsEstimariPoolByKey,
  setValuesOfDsEstimari,
  setValueOfDsEstimariPool,
  estimariDisplayMask,
  locateTrInEstimariPool,
  generateTblRowsFromDsEstimariPool
}