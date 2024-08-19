import { tables } from './tables.js'
import {
  ierarhii,
  flatFind,
  selected_ds,
  delimiter,
  trees,
  ds_instanteRetete,
  recipes_ds,
  _cantitate_antemasuratori,
  _nivel_oferta,
  niveluri,
  _cantitate_oferta,
  _cantitate_estimari,
  _start_date
} from './client.js'

export var ds_antemasuratori = []
export const setDsAntemasuratori = (value) => {
  ds_antemasuratori = value
}

export const setDsAntemasuratoriValue = (index, key, value) => {
    ds_antemasuratori[index][key] = value
}

export var newTree = []

export const antemasuratoriDisplayMask = {
  old_WBS: { value: 'old_WBS', RW: false, visible: false, label: 'WBS vechi' },
  WBS: { value: 'WBS', RW: false, visible: false, label: 'WBS' },
  SERIE_ARTICOL_OFERTA: {
    value: 'SERIE_ARTICOL_OFERTA',
    RW: false,
    visible: false,
    label: 'Serie articol',
    isEnumerable: false
  },
  DENUMIRE_ARTICOL_OFERTA: {
    value: 'DENUMIRE_ARTICOL_OFERTA',
    RW: false,
    visible: true,
    label: 'Denumire',
    isEnumerable: true
  },
  TIP_ARTICOL_OFERTA: {
    value: "TIP_ARTICOL_OFERTA",
    RW: false,
    visible: false,
    label: 'Tip articol',
    isEnumerable: true
  },
  SUBTIP_ARTICOL_OFERTA: {
    value: "SUBTIP_ARTICOL_OFERTA",
    RW: false,
    visible: false,
    label: 'Subtip articol',
    isEnumerable: true
  },
  NIVEL_OFERTA_1: { value: 'NIVEL_OFERTA_1', RW: false, visible: true, label: 'Nivel 1', isEnumerable: true },
  NIVEL_OFERTA_2: { value: 'NIVEL_OFERTA_2', RW: false, visible: true, label: 'Nivel 2', isEnumerable: true },
  NIVEL_OFERTA_3: { value: 'NIVEL_OFERTA_3', RW: false, visible: true, label: 'Nivel 3', isEnumerable: true },
  NIVEL_OFERTA_4: { value: 'NIVEL_OFERTA_4', RW: false, visible: true, label: 'Nivel 4', isEnumerable: true },
  NIVEL_OFERTA_5: { value: 'NIVEL_OFERTA_5', RW: false, visible: true, label: 'Nivel 5', isEnumerable: true },
  NIVEL_OFERTA_6: { value: 'NIVEL_OFERTA_6', RW: false, visible: true, label: 'Nivel 6', isEnumerable: true },
  NIVEL_OFERTA_7: { value: 'NIVEL_OFERTA_7', RW: false, visible: true, label: 'Nivel 7', isEnumerable: true },
  NIVEL_OFERTA_8: { value: 'NIVEL_OFERTA_8', RW: false, visible: true, label: 'Nivel 8', isEnumerable: true },
  NIVEL_OFERTA_9: { value: 'NIVEL_OFERTA_9', RW: false, visible: true, label: 'Nivel 9', isEnumerable: true },
  NIVEL_OFERTA_10: {
    value: 'NIVEL_OFERTA_10',
    RW: false,
    visible: true,
    label: 'Nivel 10',
    isEnumerable: true
  },
  CANTITATE_ARTICOL_OFERTA: {
    value: 'CANTITATE_ARTICOL_OFERTA',
    RW: false,
    visible: true,
    label: 'Cantitate<br>oferta',
    isEnumerable: false
  },
  UM_ARTICOL_OFERTA: {
    value: 'UM_ARTICOL_OFERTA',
    RW: false,
    visible: true,
    label: 'UM',
    isEnumerable: false
  },
  CANTITATE_ARTICOL_ANTEMASURATORI: {
    value: 'CANITATE_ARTICOL_ANTEMASURATORI',
    RW: true,
    visible: true,
    label: 'Cantitate<br>antemasuratori',
    isEnumerable: false
  }
}

export function calculateAntemasAndNewTree() {
  //create ds_antemasuratori from recipes_ds, enum activities only, add CANTITATE_ARTICOL_OFERTA, add CANTITATE_ANTEMASURATORI = 0
  if (ds_instanteRetete.length === 0) {
    detectieRetete()
    showRecipes()
  }
  //console.log('recipes_ds', recipes_ds)
  //console.log('instanteRetete', ds_instanteRetete)
  //console.log('trees', trees)
  console.log('niveluri', niveluri)
  let ds_antemasuratori_old = [...ds_antemasuratori]
  ds_antemasuratori = []
  newTree = []
  //find max array length in temps
  let max = 0
  trees.forEach((tree) => {
    tree.forEach((branch) => {
      if (branch.length > max) {
        max = branch.length
      }
    })
  })
  //console.log('max', max)
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
    //console.log('reteta', reteta)

    newTree.push([...reteta])
    for (var j = 0; j < reteta.length; j++) {
      var activitate = { ...reteta[j] }
      newTree[i][j] = { ...activitate }
      var instanceSpecifics = null
      if (ds_instanteRetete[i].instanceSpecifics[j] !== undefined) {
        if (Object.keys(ds_instanteRetete[i].instanceSpecifics[j]).includes('object')) {
          instanceSpecifics = ds_instanteRetete[i].instanceSpecifics[j].object
          //console.log('instanceSpecifics', instanceSpecifics)
        }
      }
      var niveluri_activitate = []
      for (let m = 0; m < niveluri.length; m++) {
        niveluri_activitate.push(activitate.object[niveluri[m]])
      }
      //console.log('niveluri_activitate', niveluri_activitate)
      var temps = []
      for (let k = 0; k < trees.length; k++) {
        var tree = trees[k]
        for (let l = 0; l < tree.length; l++) {
          var branch = tree[l]
          //console.log('branch', branch)
          let checker = (arr, target) => target.every((v) => arr.includes(v))
          if (checker(branch, niveluri_activitate) === true) {
            //console.log('accepted branch', branch)
            temps.push(branch)
          }
        }
      }
      //remove redundant branches
      //de ex, daca gasesct ['Constructii', 'Exterioare']; ['Constructii', 'Exterioare', 'P1']; ['Constructii', 'Exterioare', 'P1', 'P1.1']
      //pastrez doar ['Constructii', 'Exterioare', 'P1', 'P1.1'], restul este redundant
      if (temps.length > 1) {
        let tempsToBeRemoved = []
        for (let n = 0; n < temps.length; n++) {
          var temp = temps[n]
          var o = {}
          for (let m = 0; m < temp.length; m++) {
            if (niveluri[m] === undefined) {
              //create property
              var new_key = _nivel_oferta + (m + 1).toString()
              o[new_key] = temp[m]
            } else {
              o[niveluri[m]] = temp[m]
            }
          }
          for (let p = n + 1; p < temps.length; p++) {
            var temp2 = temps[p]
            var o2 = {}
            for (let q = 0; q < temp2.length; q++) {
              if (niveluri[q] === undefined) {
                //create property
                var new_key = _nivel_oferta + (q + 1).toString()
                o2[new_key] = temp2[q]
              } else {
                o2[niveluri[q]] = temp2[q]
              }
            }
            if (Object.keys(o).length < Object.keys(o2).length) {
              var keys = Object.keys(o)
              var values = Object.values(o)
              var keys2 = Object.keys(o2)
              var values2 = Object.values(o2)
              var checker = (arr, target) => target.every((v) => arr.includes(v))
              if (checker(keys2, keys) === true && checker(values2, values) === true) {
                //console.log('remove', o, 'beacause of', o2)
                tempsToBeRemoved.push(n)
                break
              }
            }
          }
        }
        temps = temps.filter((o, index) => !tempsToBeRemoved.includes(index))
      }
      //console.log('temps', temps)
      let antemas_branches = []
      for (let n = 0; n < temps.length; n++) {
        /* var activit =  {
            DENUMIRE_ARTICOL_OFERTA: activitate.object.DENUMIRE_ARTICOL_OFERTA,
            CANTITATE_ARTICOL_OFERTA: instanceSpecifics ? instanceSpecifics[_cantitate_oferta] : 0,
            UM_ARTICOL_OFERTA: activitate.object.UM_ARTICOL_OFERTA,
            TIP_ARTICOL_OFERTA: activitate.object.TIP_ARTICOL_OFERTA,
            SUBTIP_ARTICOL_OFERTA: activitate.object.SUBTIP_ARTICOL_OFERTA
          } */
        let activit = { ...activitate.object }
        processInstanceSpecifics(activit, instanceSpecifics)
        //update _cantitate_oferta in newTree
        newTree[i][j].object = { ...activit }
        for (let o = 0; o < temps[n].length; o++) {
          activit[_nivel_oferta + (o + 1).toString()] = temps[n][o]
          //push to niveluri too
          //niveluri.push(_nivel_oferta + (o + 1).toString())
        }
        //add empty string to niveluri for each missing level
        if (temps[n].length < max) {
          for (let p = temps[n].length; p < max; p++) {
            activit[_nivel_oferta + (p + 1).toString()] = ''
            //niveluri.push(_nivel_oferta + (p + 1).toString())
            temps[n].push('')
          }
        }
        //find old value for CANTITATE_ARTICOL_ANTEMASURATORI
        let old = ds_antemasuratori_old.find((o) => {
          let keys = Object.keys(o)
          //keep keys according to antemasuratoriDisplayMask
          keys = Object.keys(activit).filter((key) => antemasuratoriDisplayMask.hasOwnProperty(key))
          delete keys[_cantitate_antemasuratori]
          let values = Object.values(o)
          let keys2 = Object.keys(activit)
          keys2 = Object.keys(activit).filter((key) => antemasuratoriDisplayMask.hasOwnProperty(key))
          delete keys2[_cantitate_antemasuratori]
          //console.log('keys', keys, 'keys2', keys2)
          let values2 = Object.values(activit)
          let checker = (arr, target) => target.every((v) => arr.includes(v))
          return checker(keys, keys2) && checker(values, values2)
        })

        if (old) {
          activit[_cantitate_antemasuratori] = old[_cantitate_antemasuratori]
          //update newTree
          if (branch) branch.qty = old[_cantitate_antemasuratori]
        } else {
          activit[_cantitate_antemasuratori] = 0
        }

        /* //push up _cantitate_antemasuratori, just below CANTITATE_ARTICOL_OFERTA
          let keys = Object.keys(activit)
          let values = Object.values(activit)
          let index = keys.indexOf(_cantitate_oferta)
          keys.splice(index + 1, 0, _cantitate_antemasuratori)
          values.splice(index + 1, 0, activit[_cantitate_antemasuratori])
          //delete key _cantitate_antemasuratori from the last position
          let last = keys.pop()
          //reconstruct object
  
          let new_activit = {}
          for (let p = 0; p < keys.length; p++) {
            new_activit[keys[p]] = values[p]
          } */

        activit.refInstanta = i
        activit.refActivitate = j
        activit.refBranch = temps[n]
        ds_antemasuratori.push(activit)
        //push to antemas_branches max numar niveluri / cantitate_articol_antemasuratori
        let path = []
        for (let p = 0; p < max; p++) {
          path.push(activit[_nivel_oferta + (p + 1).toString()])
        }
        antemas_branches.push({
          branch: path,
          qty: activit[_cantitate_antemasuratori],
          refInAnte: ds_antemasuratori.length - 1
        })
      }
      //add to newTree
      newTree[i][j].antemasuratori = antemas_branches
      if (antemas_branches.length > 0) {
        newTree[i][j].hasAntemas = true
      } else {
        newTree[i][j].hasAntemas = false
      }
      delete newTree[i][j].branch
      //delete level
      delete newTree[i][j].level
      //delete virtual
      delete newTree[i][j].virtual
    }
  }

  console.log('newTree', newTree)
}

function processInstanceSpecifics(activit, instanceSpecifics) {
  activit[_cantitate_oferta] = instanceSpecifics ? instanceSpecifics[_cantitate_oferta] : 0
  activit.WBS = instanceSpecifics ? instanceSpecifics.WBS : ''
}

export function showAntemasuratori() {
  if (ds_antemasuratori.length > 0) {
    tables.hideAllBut([tables.my_table4])
    let selected_options_arr = ierarhii.getValue()
    if (selected_options_arr && selected_options_arr.length > 0) {
      flatFind(selected_options_arr, ds_antemasuratori, delimiter)
      tables.my_table4.element.ds = selected_ds
    } else {
      tables.my_table4.element.ds = ds_antemasuratori
    }
  }
}
