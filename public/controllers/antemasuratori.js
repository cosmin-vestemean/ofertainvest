import { tables } from '../utils/tables.js'
import {
  ierarhii,
  flatFind,
  selected_ds,
  delimiter,
  trees,
  ds_instanteRetete,
  recipes_ds,
  _nivel_oferta,
  niveluri,
  _start_date,
  client,
  contextOferta,
  DBtoWBS,
  semafoare
} from '../client.js'
import {
  _cantitate_antemasuratori,
  //_cantitate_oferta,
  _cantitate_estimari
} from '../utils/_cantitate_oferta.js'
import { runSQLTransaction } from '../utils/S1.js'

export var ds_antemasuratori = []
export async function setDsAntemasuratori() {
  const sqlQuery = `select * from CCCANTEMASURATORI a inner join cccpaths b on (a.cccpaths=b.cccpaths) inner join cccoferteweblinii c on (c.cccoferteweblinii=a.cccoferteweblinii) where a.cccoferteweb = ${contextOferta.CCCOFERTEWEB} order by A.CCCINSTANTE, b.path, A.CCCACTIVITINSTANTE`
  const response = await client.service('getDataset').find({
    query: {
      sqlQuery: sqlQuery
    }
  })
  if (response.success && response.data && response.data.length > 0) {
    const transf = await convertDBAntemasuratori(response.data)
    ds_antemasuratori = transf
    console.log('ds_antemasuratori', ds_antemasuratori)
    semafoare.antemasuratoriIsLoaded = true
  } else {
    console.log('response', response)
  }
}

export const setDsAntemasuratoriValue = (index, key, value) => {
  ds_antemasuratori[index][key] = value
}

export var newTree = []
export const setNewTree = (value) => {
  newTree = value
}

export const antemasuratoriDisplayMask = {
  old_WBS: { value: 'old_WBS', RW: false, visible: false, label: 'WBS vechi', filter: 'search' },
  WBS: { value: 'WBS', RW: false, visible: false, label: 'WBS', filter: 'search' },
  SERIE_ARTICOL_OFERTA: {
    value: 'SERIE_ARTICOL_OFERTA',
    RW: false,
    visible: false,
    label: 'Serie articol',
    isEnumerable: false,
    filter: 'search'
  },
  DENUMIRE_ARTICOL_OFERTA: {
    value: 'DENUMIRE_ARTICOL_OFERTA',
    RW: false,
    visible: true,
    label: 'Denumire',
    isEnumerable: true,
    filter: 'search'
  },
  TIP_ARTICOL_OFERTA: {
    value: 'TIP_ARTICOL_OFERTA',
    RW: false,
    visible: false,
    label: 'Tip articol',
    isEnumerable: true,
    filter: 'filter'
  },
  SUBTIP_ARTICOL_OFERTA: {
    value: 'SUBTIP_ARTICOL_OFERTA',
    RW: false,
    visible: false,
    label: 'Subtip articol',
    isEnumerable: true,
    filter: 'filter'
  },
  NIVEL_OFERTA_1: { value: 'NIVEL_OFERTA_1', RW: false, visible: true, label: 'Nivel 1', isEnumerable: true, filter: 'filter' },
  NIVEL_OFERTA_2: { value: 'NIVEL_OFERTA_2', RW: false, visible: true, label: 'Nivel 2', isEnumerable: true, filter: 'filter' },
  NIVEL_OFERTA_3: { value: 'NIVEL_OFERTA_3', RW: false, visible: true, label: 'Nivel 3', isEnumerable: true, filter: 'filter' },
  NIVEL_OFERTA_4: { value: 'NIVEL_OFERTA_4', RW: false, visible: true, label: 'Nivel 4', isEnumerable: true, filter: 'filter' },
  NIVEL_OFERTA_5: { value: 'NIVEL_OFERTA_5', RW: false, visible: true, label: 'Nivel 5', isEnumerable: true, filter: 'filter' },
  NIVEL_OFERTA_6: { value: 'NIVEL_OFERTA_6', RW: false, visible: true, label: 'Nivel 6', isEnumerable: true, filter: 'filter' },
  NIVEL_OFERTA_7: { value: 'NIVEL_OFERTA_7', RW: false, visible: true, label: 'Nivel 7', isEnumerable: true, filter: 'filter' },
  NIVEL_OFERTA_8: { value: 'NIVEL_OFERTA_8', RW: false, visible: true, label: 'Nivel 8', isEnumerable: true, filter: 'filter' },
  NIVEL_OFERTA_9: { value: 'NIVEL_OFERTA_9', RW: false, visible: true, label: 'Nivel 9', isEnumerable: true, filter: 'filter' },
  NIVEL_OFERTA_10: {
    value: 'NIVEL_OFERTA_10',
    RW: false,
    visible: true,
    label: 'Nivel 10',
    isEnumerable: true,
    filter: 'filter'
  },
  CANTITATE_ARTICOL_OFERTA: {
    value: 'CANTITATE_ARTICOL_OFERTA',
    RW: false,
    visible: true,
    label: 'Cantitate<br>oferta',
    isEnumerable: false,
    filter: 'search'
  },
  UM_ARTICOL_OFERTA: {
    value: 'UM_ARTICOL_OFERTA',
    RW: false,
    visible: true,
    label: 'UM',
    isEnumerable: false,
    filter: 'filter'
  },
  CANTITATE_ARTICOL_ANTEMASURATORI: {
    value: 'CANITATE_ARTICOL_ANTEMASURATORI',
    RW: true,
    visible: true,
    label: 'Cantitate<br>antemasuratori',
    isEnumerable: false,
    filter: 'search'
  }
}

export async function createAntemasuratori() {
  let btn_antemasuratori = document.getElementById('btn_antemasuratori')
  btn_antemasuratori.disabled = true
  btn_antemasuratori.innerHTML = 'Creare...'
  //add spinner
  let spinner = document.createElement('span')
  spinner.className = 'spinner-border spinner-border-sm'
  spinner.role = 'status'
  spinner.ariaHidden = 'true'
  btn_antemasuratori.appendChild(spinner)
  const activitatiInstanteResponse = await client.service('getDataset').find({
    query: {
      sqlQuery: `select * from CCCACTIVITINSTANTE a inner join cccoferteweblinii b on (a.cccoferteweblinii=b.cccoferteweblinii and a.cccoferteweb=b.cccoferteweb) where a.cccoferteweb = ${contextOferta.CCCOFERTEWEB}`
    }
  })

  const activitatiInstante = activitatiInstanteResponse.data

  const pathsResponse = await client.service('getDataset').find({
    query: {
      sqlQuery: `SELECT * FROM CCCPATHS WHERE CCCOFERTEWEB = ${contextOferta.CCCOFERTEWEB}`
    }
  })

  const paths = pathsResponse.data

  let leafs = []
  for (let i = 0; i < paths.length; i++) {
    //find only leafs; meaning that the path is not a parent of another path by checking if includes another path
    const path = paths[i]
    let isLeaf = true
    for (let j = 0; j < paths.length; j++) {
      if (i !== j) {
        if (paths[j].PATH.includes(path.PATH)) {
          isLeaf = false
          break
        }
      }
    }
    if (isLeaf) {
      leafs.push(path)
    }
  }

  console.log('leafs', leafs)

  const antemasuratori = []

  //find unique INITIAL_PATH in activitatiInstante
  let initialPaths = []
  for (let i = 0; i < activitatiInstante.length; i++) {
    if (!initialPaths.includes(activitatiInstante[i].INITIAL_PATH)) {
      initialPaths.push(activitatiInstante[i].INITIAL_PATH)
    }
  }

  console.log('initialPaths', initialPaths)

  //create antemasuratori
  //1. find all activitati for each initial path
  //2. find all leafs for each initial path (those that include the initial path)
  //3. inner join activitati with leafs
  //4. push into antemasuratori

  for (let i = 0; i < initialPaths.length; i++) {
    const activitati = activitatiInstante.filter((o) => o.INITIAL_PATH === initialPaths[i])
    const leafsForPath = leafs.filter((o) => o.PATH.includes(initialPaths[i]))
    console.log('activitati', activitati, 'leafsForPath', leafsForPath)
    for (let j = 0; j < activitati.length; j++) {
      for (let k = 0; k < leafsForPath.length; k++) {
        antemasuratori.push({
          CCCOFERTEWEB: contextOferta.CCCOFERTEWEB,
          CCCPATHS: leafsForPath[k].CCCPATHS,
          CCCINSTANTE: activitati[j].CCCINSTANTE,
          CCCACTIVITINSTANTE: activitati[j].CCCACTIVITINSTANTE,
          CCCOFERTEWEBLINII: activitati[j].CCCOFERTEWEBLINII,
          CANTITATE: 0
        })
      }
    }
  }

  console.log('antemasuratori', antemasuratori)

  //insert antemasuratori
  insertAntemasuratori(antemasuratori)
    .then(async () => {
      console.log('inserted antemasuratori')
      await setDsAntemasuratori()
      tables.hideAllBut([tables.my_table4])
      tables.my_table4.element.ds = ds_antemasuratori
      btn_antemasuratori.disabled = false
      //remove spinner
      btn_antemasuratori.removeChild(spinner)
      btn_antemasuratori.innerHTML = 'Antemasuratori'
    })
    .catch((error) => {
      console.log('error', error)
    })
}

export async function convertDBAntemasuratori(antemasuratori) {
  let antemasuratoriTransformed = []
  const uniqNodesResponse = await client.service('getDataset').find({
    query: {
      sqlQuery: `SELECT * FROM CCCUNIQNODES WHERE CCCOFERTEWEB = ${contextOferta.CCCOFERTEWEB}`
    }
  })

  if (!uniqNodesResponse.success) {
    console.log('uniqNodesResponse', uniqNodesResponse)
    return
  }

  const uniqNodes = uniqNodesResponse.data

  const pathsResponse = await client.service('getDataset').find({
    query: {
      sqlQuery: `SELECT * FROM CCCPATHS WHERE CCCOFERTEWEB = ${contextOferta.CCCOFERTEWEB}`
    }
  })

  if (!pathsResponse.success) {
    console.log('pathsResponse', pathsResponse)
    return
  }

  const paths = pathsResponse.data

  let maxLevels = 0

  for (let i = 0; i < antemasuratori.length; i++) {
    let a = antemasuratori[i]
    let aTransformed = {}
    let keys = Object.keys(DBtoWBS)
    let values = Object.values(DBtoWBS)
    for (let j = 0; j < keys.length; j++) {
      aTransformed[values[j]] = a[keys[j]]
    }
    //then replace NIVEL_OFERTA_1, NIVEL_OFERTA_2, etc with the actual values from paths INNER JOIN CCCUNIQNODES
    let pathId = a.CCCPATHS
    let path = paths.find((o) => o.CCCPATHS === pathId).PATH
    let crumbs = path.split('/')
    for (let j = 0; j < crumbs.length; j++) {
      let node = uniqNodes.find((o) => parseInt(o.CCCUNIQNODES) === parseInt(crumbs[j]))
      if (node) {
        aTransformed[_nivel_oferta + (j + 1).toString()] = node.NAME
        if (j + 1 > maxLevels) {
          maxLevels = j + 1
        }
      }
    }

    //add all OTHER keys and values from a (which are not in DBtoWBS) to aTransformed
    keys = Object.keys(a)
    for (let j = 0; j < keys.length; j++) {
      if (!Object.keys(DBtoWBS).includes(keys[j])) {
        //rename key CANTITATE to _cantitate_antemasuratori
        if (keys[j] === 'CANTITATE_1' || keys[j] === 'CANTITATE_2' || keys[j] === 'CANTITATE') {
          if (keys[j] === 'CANTITATE_1') {
            aTransformed[_cantitate_antemasuratori] = a[keys[j]]
          } else if (keys[j] === 'CANTITATE_2') {
            aTransformed[_cantitate_estimari] = a[keys[j]]
          } else {
            aTransformed[_cantitate_antemasuratori] = a[keys[j]]
          }
        } else {
          aTransformed[keys[j]] = a[keys[j]]
        }
      }
    }

    antemasuratoriTransformed.push(aTransformed)
  }

  //remove all levels that are not in the maxLevels
  for (let i = 0; i < antemasuratoriTransformed.length; i++) {
    let a = antemasuratoriTransformed[i]
    let keys = Object.keys(a)
    for (let j = 0; j < keys.length; j++) {
      if (keys[j].includes(_nivel_oferta) && parseInt(keys[j].replace(_nivel_oferta, '')) > maxLevels) {
        delete a[keys[j]]
      }
    }
  }

  console.log('antemasuratoriTransformed', antemasuratoriTransformed)

  return antemasuratoriTransformed
}

function insertAntemasuratori(antemasuratori) {
  return new Promise((resolve, reject) => {
    let sqlList = []
    for (let i = 0; i < antemasuratori.length; i++) {
      let sql = `INSERT INTO CCCANTEMASURATORI (CCCOFERTEWEB, CCCPATHS, CCCINSTANTE, CCCACTIVITINSTANTE, CCCOFERTEWEBLINII, CANTITATE) VALUES (${antemasuratori[i].CCCOFERTEWEB}, ${antemasuratori[i].CCCPATHS}, ${antemasuratori[i].CCCINSTANTE},${antemasuratori[i].CCCACTIVITINSTANTE}, ${antemasuratori[i].CCCOFERTEWEBLINII}, ${antemasuratori[i].CANTITATE})`
      sqlList.push(sql)
    }

    console.log('sqlList', sqlList)

    let objList = { sqlList: sqlList }
    runSQLTransaction(objList)
      .then((response) => {
        console.log('response', response)
        resolve(response)
      })
      .catch((error) => {
        console.log('error', error)
        reject(error)
      })
  })
}

export async function deleteAntemasuratore(id) {
  return new Promise((resolve, reject) => {
    let sql = `DELETE FROM CCCANTEMASURATORI WHERE CCCANTEMASURATORI = ${id}`
    runSQLTransaction({ sqlList: [sql] })
      .then((response) => {
        console.log('response', response)
        resolve(response)
      })
      .catch((error) => {
        console.log('error', error)
        reject(error)
      })
  })
}

export async function updateAntemasuratori(antemasuratori) {
  return new Promise((resolve, reject) => {
    let sqlList = []
    for (let i = 0; i < antemasuratori.length; i++) {
      let sql = `UPDATE CCCANTEMASURATORI SET CANTITATE = ${antemasuratori[i].CANTITATE_ARTICOL_ANTEMASURATORI} WHERE CCCANTEMASURATORI = ${antemasuratori[i].CCCANTEMASURATORI}`
      sqlList.push(sql)
    }

    console.log('sqlList', sqlList)

    let objList = { sqlList: sqlList }
    runSQLTransaction(objList)
      .then((response) => {
        console.log('response', response)
        resolve(response)
      })
      .catch((error) => {
        console.log('error', error)
        reject(error)
      })
  })
}

export async function updateAntemasuratoare(linie, cantitate) {
  let sqlList = [`UPDATE CCCANTEMASURATORI SET CANTITATE = ${cantitate} WHERE CCCANTEMASURATORI = ${linie}`]
  let obj = { sqlList: sqlList }
  runSQLTransaction(obj)
    .then((response) => {
      console.log('response', response)
    })
    .catch((error) => {
      console.log('error', error)
    })
}

//instante retete + recipes_ds + trees -> ds_antemasuratori + newTree
export function calculateAntemasAndNewTree() {
  //create ds_antemasuratori from recipes_ds, enum activities only, add CANTITATE_ARTICOL_OFERTA, add CANTITATE_ANTEMASURATORI = 0
  if (ds_instanteRetete.length === 0) {
    detectieRetete()
    showRecipes()
  }

  let ds_antemasuratori_old = [...ds_antemasuratori]
  ds_antemasuratori = []
  console.log('ds_antemasuratori_old', ds_antemasuratori_old, 'ds_antemasuratori', ds_antemasuratori)
  newTree = []
  //find max array length in trees
  let max = 0
  trees.forEach((tree) => {
    tree.forEach((branch) => {
      if (branch.length > max) {
        max = branch.length
      }
    })
  })

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
          keys = Object.keys(activit).filter((key) => Object.prototype.hasOwnProperty.call(antemasuratoriDisplayMask, key))
          delete keys[_cantitate_antemasuratori]
          let values = Object.values(o)
          let keys2 = Object.keys(activit)
          keys2 = Object.keys(activit).filter((key) => Object.prototype.hasOwnProperty.call(antemasuratoriDisplayMask, key))
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

  console.log('ds_antemasuratori', ds_antemasuratori)
}

function processInstanceSpecifics(activit, instanceSpecifics) {
  //activit[_cantitate_oferta] = instanceSpecifics ? instanceSpecifics[_cantitate_oferta] : 0
  //activit.WBS = instanceSpecifics ? instanceSpecifics.WBS : ''
  //add all keys and values from instanceSpecifics to activit
  if (instanceSpecifics) {
    Object.keys(instanceSpecifics).forEach((key) => {
      activit[key] = instanceSpecifics[key]
    })
  }
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
