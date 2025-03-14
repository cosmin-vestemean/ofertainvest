import { client, contextOferta, ds_instanteRetete, recipes_ds, trees, semafoare } from '../client.js'
import { ds_antemasuratori, newTree } from '../controllers/antemasuratori.js'

/* global X */

async function connectToS1Service() {
  if (!client) {
    console.log('client not found')
    return { error: 'client not found' }
  }
  const connectToS1 = client.service('connectToS1')
  if (!connectToS1) {
    console.log('connectToS1 service not found')
    return
  }
  const result = await connectToS1.find()
  return result
}

export async function usrPwdValidate(module, refid, pwd) {
  const response = await connectToS1Service()
  const clientID = response.token
  if (!clientID) {
    console.log('clientID not found')
    return
  } else {
    //connect to S1 service to validate user and password
    const result = await client.service('usrPwdValidate').find({
      clientID: clientID,
      module: module,
      refid: refid,
      pwd: pwd
    })
    return result
  }
}

export async function populateSelects() {
  await connectToS1Service()
    .then(async (result) => {
      const clientID = result.token
      console.log('clientID', clientID)
      let params = {
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
          //console.log('result', result)
          if (result.success) {
            var select_trdr = document.getElementById('trdr')
            //populate select_trdr
            result.data.forEach(function (object) {
              var option = document.createElement('option')
              option.value = object['TRDR']
              option.text = object['NAME']
              select_trdr.appendChild(option)
            })
            select_trdr.selectedIndex = -1
          } else {
            //console.log('error', result.error)
          }
          //select id="prjc" populate by calling S1 service getDataset
          let params = {
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
              //console.log('result', result)
              if (result.success) {
                var select_prjc = document.getElementById('prjc')
                //populate select_prjc
                result.data.forEach(function (object) {
                  var option = document.createElement('option')
                  option.value = object['PRJC']
                  option.text = object['NAME']
                  select_prjc.appendChild(option)
                })
                select_prjc.selectedIndex = -1
                //populate saldoc by calling S1 service getDataset
                let params = {
                  query: {
                    clientID: clientID,
                    appID: '1001',
                    sqlQuery: 'select * from CCCOFERTEWEB ORDER by trndate desc'
                  }
                }

                client
                  .service('getDataset')
                  .find(params)
                  .then((result) => {
                    //console.log('result', result)
                    if (result.success) {
                      var select_saldoc = document.getElementById('saldoc')
                      //populate select_saldoc
                      result.data.forEach(function (object) {
                        var option = document.createElement('option')
                        option.value = object['CCCOFERTEWEB']
                        option.text = object['FILENAME']
                        select_saldoc.appendChild(option)
                      })
                      //select first item by default is last added
                      if (result.data.length > 0) {
                        select_saldoc.selectedIndex = 0
                        select_saldoc.dispatchEvent(new Event('change'))
                      }
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
export async function insertDocument(jsonToSend, UIElement) {
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
            UIElement.innerHTML = 'Oferta salvata'
            UIElement.classList.remove('btn-info')
            UIElement.classList.add('btn-success')
            //disable button
            UIElement.disabled = true
          } else {
            UIElement.innerHTML = 'Eroare salvare oferta'
            UIElement.classList.remove('btn-info')
            UIElement.classList.add('btn-danger')
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

export async function getValFromS1Query(query) {
  try {
    const result = await connectToS1Service()
    const response = await client.service('getValFromQuery').find({
      query: {
        clientID: result.token,
        appId: 1001,
        sqlQuery: query
      }
    })
    return response
  } catch (error) {
    console.error('Error getting value from query:', error) 
    throw {
      success: false,
      error: error
    }
  }
}

export async function runSQLTransaction(objSqlList) {
  if (!objSqlList?.sqlList?.length) {
    throw new Error('No SQL queries provided')
  }

  try {
    const result = await connectToS1Service()
    const response = await client.service('runSQLTransaction').create({
      clientID: result.token,
      sqlList: objSqlList.sqlList
    })

    return response
  } catch (error) {
    console.error('SQL transaction error:', error)
    throw {
      success: false,
      error: error,
      sql: objSqlList.sqlList
    }
  }
}

export async function getOferta(filename) {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await connectToS1Service()
      const clientID = result.token
      const response = await client.service('getDataset').find({
        query: {
          clientID: clientID,
          sqlQuery: `select * from CCCOFERTEWEB where FILENAME='${filename}'`
        }
      })
      //console.log('result', response)
      semafoare.oferta_is_loaded = true
      resolve(response)
    } catch (error) {
      console.log('error', error)
      reject({ success: false, error: error })
    }
  })
}

export async function saveAntemasuratoriAndTreeToDB() {
  return new Promise(async (resolve, reject) => {
    try {
      // UPDATE CCCOFERTEWEB:JSONANTESTR with ds_antemasuratori using runSQLTransaction
      let sqlList = []
      sqlList.push(
        `UPDATE CCCOFERTEWEB SET JSONANTESTR='${JSON.stringify(ds_antemasuratori)}', JSONTREESTR = '${JSON.stringify(newTree)}' WHERE FILENAME='${contextOferta.FILENAME}'`
      )
      let objSqlList = { sqlList: sqlList }
      let result = await runSQLTransaction(objSqlList)
      if (result.success) {
        console.log('Antemasuratorile actualizate in baza de date')
        resolve(result)
      } else {
        console.log('Eroare actualizare antemasuratori in baza de date')
        reject(result)
      }
    } catch (error) {
      console.log('error', error)
      reject({ success: false, error: error })
    }
  })
}
export async function saveRecipesAndInstanteAndTrees() {
  salveazaReteteInDB()
  salveazaInstanteInDB()
  // Update CCCOFERTEWEB with the new values by calling runSQLTransaction
  let sqlList = []
  //update CCCOFERTEWEB with the new values
  sqlList.push(
    `UPDATE CCCOFERTEWEB SET JSONRETETESTR='${JSON.stringify(recipes_ds)}', JSONINSTRETSTR='${JSON.stringify(
      ds_instanteRetete
    )}', JSONTREESSTR='${JSON.stringify(trees)}' WHERE FILENAME='${contextOferta.FILENAME}'`
  )

  let objSqlList = { sqlList: sqlList }
  return runSQLTransaction(objSqlList)
    .then((result) => {
      if (result.success) {
        console.log('Recipes, Instante and Trees updated in database')
        return result
      } else {
        console.log('Error updating Recipes, Instante and Trees in database')
        throw result
      }
    })
    .catch((error) => {
      console.log('Error updating Recipes, Instante and Trees in database')
      throw error
    })
}

export async function salveazaReteteInDB() {
  //DB insert/update IN tables CCCRETETE, CCCACTIVITRETETE, CCCMATRETETE
  let sqlList = []
  //Get MAX(CCCRETETE) from CCCRETETE
  const response = await getValFromS1Query('select ISNULL(max(CCCRETETE), 0) + 1 as CCCRETETE from CCCRETETE')
  if (!response.success) {
    console.log('Error getting max(CCCRETETE) from CCCRETETE')
    return
  }
  if (!response.value) {
    console.log('Error getting max(CCCRETETE) from CCCRETETE')
    return
  }
  const max = parseInt(response.value)
  const nrRetete = recipes_ds.length
  let maxActivitati =
    parseInt(
      await getValFromS1Query(
        'select ISNULL(max(CCCACTIVITRETETE), 0) + 1 as CCCACTIVITRETETE from CCCACTIVITRETETE'
      ).value
    ) || 1
  //insert/update retete in CCCRETETE
  recipes_ds.forEach((reteta) => {
    let sql = `insert into CCCRETETE (CCCOFERTEWEB, NAME, ID, TYPE) values (${contextOferta.CCCOFERTEWEB}, '${reteta.name}', ${reteta.id}, '${reteta.reteta.type || 'null'}')`
    sqlList.push(sql)
  })
  //insert/update activitati in CCCACTIVITRETETE
  for (let j = 0; j < nrRetete; j++) {
    let reteta = recipes_ds[j]
    let r = reteta.reteta
    for (let i = 0; i < r.length; i++) {
      let activitate = r[i].object
      let mWBSTemp = activitate.WBS.split('.')
      let sWBS = mWBSTemp.slice(0, mWBSTemp.length - 1).join('.')
      let mWBS0 = mWBSTemp.slice(0, mWBSTemp.length - 1).join('.') + '.0'
      let mWBSL = mWBSTemp.slice(0, mWBSTemp.length - 1).join('.') + '.L'
      let mWBS = `(WBS='${mWBS0}' OR WBS='${mWBSL}' OR WBS='${activitate.WBS}' OR WBS='${sWBS}')`
      let ISMAIN = r[i].ISMAIN
      let CCCOFERTEWEBLINII = await getValFromS1Query(
        `select CCCOFERTEWEBLINII from CCCOFERTEWEBLINII where CCCOFERTEWEB=${contextOferta.CCCOFERTEWEB} and DENUMIRE_ART_OF='${activitate.DENUMIRE_ARTICOL_OFERTA}' AND TIP_ART_OF='${activitate.TIP_ARTICOL_OFERTA}' AND SUBTIP_ART_OF='${activitate.SUBTIP_ARTICOL_OFERTA}' AND ${mWBS}`
      )
      let sql =
        `insert into CCCACTIVITRETETE (CCCOFERTEWEB, CCCRETETE, CCCOFERTEWEBLINII, AVGNORMUNITOREMAN, SUMOREMAN, ISMAIN, ISCUSTOM, SUMCANTANTE) ` +
        `values (${contextOferta.CCCOFERTEWEB}, ${max + j}, ${CCCOFERTEWEBLINII.value}, ${activitate.MEDIE_NORMA_UNITARA_ORE_MANOPERA_ARTICOL_OFERTA || 0}, ${activitate.SUMA_TOTAL_ORE_MANOPERA_ARTICOL_OFERTA || 0}, ${ISMAIN ? 1 : 0}, 0, ${activitate.SUMA_CANTITATE_ARTICOL_ANTEMASURATORI_RETETA || 0})`
      sqlList.push(sql)
      if (r[i].hasChildren) {
        //insert/update materiale in CCCMATRETETE
        let m = r[i].children
        for (let k = 0; k < m.length; k++) {
          let material = m[k].object
          let mWBSTemp = material.WBS.split('.')
          let sWBS = mWBSTemp.slice(0, mWBSTemp.length - 1).join('.')
          let mWBS0 = mWBSTemp.slice(0, mWBSTemp.length - 1).join('.') + '.0'
          let mWBSL = mWBSTemp.slice(0, mWBSTemp.length - 1).join('.') + '.L'
          let mWBS = `(WBS='${mWBS0}' OR WBS='${mWBSL}' OR WBS='${material.WBS}' OR WBS='${sWBS}')`
          let CCCOFERTEWEBLINII = await getValFromS1Query(
            `select CCCOFERTEWEBLINII from CCCOFERTEWEBLINII where CCCOFERTEWEB=${contextOferta.CCCOFERTEWEB} and DENUMIRE_ART_OF='${material.DENUMIRE_ARTICOL_OFERTA}' AND TIP_ART_OF='${material.TIP_ARTICOL_OFERTA}' AND SUBTIP_ART_OF='${material.SUBTIP_ARTICOL_OFERTA}' AND ${mWBS}`
          )
          let sql =
            `insert into CCCMATRETETE (CCCOFERTEWEB, CCCRETETE, CCCACTIVITRETETE, CCCOFERTEWEBLINII, CANTUNIT, CANTREAL, CANTTOTAL, CANTREALUNIT, NORMUNITMAN, TOTALOREMAN, PONNORMMAN, ISCUSTOM) ` +
            `values (${contextOferta.CCCOFERTEWEB}, ${max + j}, ${maxActivitati + i}, ${CCCOFERTEWEBLINII.value}, ${material.CANTITATE_UNITARA_SUBARTICOL_RETETA || 0}, ${material.CANTITATE_REALIZARE_ARTICOL_RETETA || 0}, ${material.CANTITATE_SUBARTICOL_RETETA || 0} , ${material.CANTITATE_REALIZARE_UNITARA_ARTICOL_RETETA || 0}, ${material.NORMA_UNITARA_ORE_MANOPERA_ARTICOL_OFERTA || 0}, ${material.SUMA_TOTAL_ORE_MANOPERA_ARTICOL_OFERTA || 0}, ${material.PONDERE_NORMA_ACTIVITATE_ARTICOL_RETETA || 0}, 0)`
          sqlList.push(sql)
        }
      }
    }
    maxActivitati += r.length
  }
  let objSqlList = { sqlList: sqlList }
  runSQLTransaction(objSqlList)
    .then((result) => {
      if (result.success) {
        console.log('Retete actualizate in baza de date', result)
      } else {
        console.log('Eroare actualizare retete in baza de date', result)
      }
    })
    .catch((error) => {
      console.log('Eroare actualizare retete in baza de date', error)
    })
}
export async function salveazaInstanteInDB() {
  let sqlList = []
  let maxInstante = await getValFromS1Query(
    `select ISNULL(max(CCCINSTANTE), 0) + 1 as CCCINSTANTE from CCCINSTANTE`
  )
  maxInstante = parseInt(maxInstante.value) || 1
  let maxActivitati = await getValFromS1Query(
    `select ISNULL(max(CCCACTIVITINSTANTE), 0) + 1 as CCCACTIVITINSTANTE from CCCACTIVITINSTANTE`
  )
  maxActivitati = parseInt(maxActivitati.value) || 1
  for (let i = 0; i < ds_instanteRetete.length; i++) {
    let instanta = ds_instanteRetete[i]
    let sql = `insert into CCCINSTANTE(CCCOFERTEWEB, NAME, ISDUPLICATE, DUPLICATEOF) values (${contextOferta.CCCOFERTEWEB}, 'instanta${i + 1}', ${instanta.duplicate ? 1 : 0}, ${instanta.duplicateOf || 0})`
    sqlList.push(sql)
    const instanceSpecifics = instanta.instanceSpecifics
    for (let j = 0; j < instanceSpecifics.length; j++) {
      let activitate = instanceSpecifics[j].object
      let mWBSTemp = activitate.WBS.split('.')
      let sWBS = mWBSTemp.slice(0, mWBSTemp.length - 1).join('.')
      let mWBS0 = mWBSTemp.slice(0, mWBSTemp.length - 1).join('.') + '.0'
      let mWBSL = mWBSTemp.slice(0, mWBSTemp.length - 1).join('.') + '.L'
      let mWBS = `(WBS='${mWBS0}' OR WBS='${mWBSL}' OR WBS='${activitate.WBS}' OR WBS='${sWBS}')`
      let CCCOFERTEWEBLINII = await getValFromS1Query(
        `select CCCOFERTEWEBLINII from CCCOFERTEWEBLINII where CCCOFERTEWEB=${contextOferta.CCCOFERTEWEB} and DENUMIRE_ART_OF='${activitate.DENUMIRE_ARTICOL_OFERTA}' AND TIP_ART_OF='${activitate.TIP_ARTICOL_OFERTA}' AND SUBTIP_ART_OF='${activitate.SUBTIP_ARTICOL_OFERTA}' AND ${mWBS}`
      )
      let sql = `insert into CCCACTIVITINSTANTE(CCCOFERTEWEB, CCCINSTANTE, CCCOFERTEWEBLINII) values (${contextOferta.CCCOFERTEWEB}, ${maxInstante + i}, ${CCCOFERTEWEBLINII.value})`
      sqlList.push(sql)
      let children = instanceSpecifics[j].children
      if (children && children.length > 0) {
        for (let k = 0; k < children.length; k++) {
          let material = children[k].object
          let mWBSTemp = material.WBS.split('.')
          let sWBS = mWBSTemp.slice(0, mWBSTemp.length - 1).join('.')
          let mWBS0 = mWBSTemp.slice(0, mWBSTemp.length - 1).join('.') + '.0'
          let mWBSL = mWBSTemp.slice(0, mWBSTemp.length - 1).join('.') + '.L'
          let mWBS = `(WBS='${mWBS0}' OR WBS='${mWBSL}' OR WBS='${material.WBS}' OR WBS='${sWBS}')`
          let CCCOFERTEWEBLINII = await getValFromS1Query(
            `select CCCOFERTEWEBLINII from CCCOFERTEWEBLINII where CCCOFERTEWEB=${contextOferta.CCCOFERTEWEB} and DENUMIRE_ART_OF='${material.DENUMIRE_ARTICOL_OFERTA}' AND TIP_ART_OF='${material.TIP_ARTICOL_OFERTA}' AND SUBTIP_ART_OF='${material.SUBTIP_ARTICOL_OFERTA}' AND ${mWBS}`
          )
          let sql = `insert into CCCMATINSTANTE(CCCOFERTEWEB, CCCINSTANTE, CCCACTIVITINSTANTE, CCCOFERTEWEBLINII, ISARTOF) values (${contextOferta.CCCOFERTEWEB}, ${maxInstante + i}, ${maxActivitati + j}, ${CCCOFERTEWEBLINII.value}, ${children[k].ISARTOF || 0})`
          sqlList.push(sql)
        }
      }
    }
    maxActivitati += instanceSpecifics.length
  }

  let objSqlList = { sqlList: sqlList }
  runSQLTransaction(objSqlList)
    .then((result) => {
      if (result.success) {
        console.log('Instante actualizate in baza de date', result)
      } else {
        console.log('Eroare actualizare instante in baza de date', result)
      }
    })
    .catch((error) => {
      console.log('Eroare actualizare instante in baza de date', error)
    })
}

export async function getEstimariFromDB(CCCOFERTEWEB) {
  //CCCESTIMARIH WHERE CCCOFERTEWEB = CCCOFERTEWEB => DSESTIMARIFLAT, CREATEDATE, UPDATEDATE, STARTDATE, ENDDATE, ID, ACTIVE
  return new Promise(async (resolve, reject) => {
    try {
      const result = await connectToS1Service()
      const clientID = result.token
      const response = await client.service('getDataset').find({
        query: {
          clientID: clientID,
          sqlQuery: `select CCCESTIMARI, NAME, FORMAT(DATASTART, 'yyyy-MM-dd') as DATASTART, FORMAT(DATASTOP, 'yyyy-MM-dd') as DATASTOP from CCCESTIMARI where CCCOFERTEWEB='${CCCOFERTEWEB}'`
        }
      })
      //console.log('result', response)
      if (response.success) {
        let estimari = response.data
        let dsEstimari = []
        estimari.forEach((estimare) => {
          console.log('estimare', estimare)
          let estimareObj = {
            CCCESTIMARI: estimare.CCCESTIMARI,
            NAME: estimare.NAME,
            DATASTART: estimare.DATASTART,
            DATASTOP: estimare.DATASTOP
          }
          dsEstimari.push(estimareObj)
        })
        semafoare.estimari_is_loaded = true
        resolve({ success: true, data: dsEstimari })
      } else {
        reject({ success: false, error: response.error })
      }
    } catch (error) {
      console.log('error', error)
      reject({ success: false, error: error })
    }
  })
}

export async function saveTreesInDB() {
  /*
  example of trees data:
  [
    [
        [
            "Constructii",
            "Lucrari de readucere a terenului in starea naturala"
        ],
        [
            "Constructii",
            "Exterior cladire"
        ],
        [
            "Constructii",
            "Exterior cladire",
            "A1"
        ],
        [
            "Constructii",
            "Exterior cladire",
            "A2"
        ]
    ],
    [
        [
            "Provizorate",
            "Alimentare SPcc+SPca"
        ]
    ],
    [
        [
            "Telecomunicatii-SCADA",
            "Echipamente"
        ]
    ]
]
  */

  const res = await connectToS1Service()
  const clientID = res.token
  let uniqueNodes = []
  let uniqueNodesDB = []
  let responsePaths = []

  // Insert or update unique nodes
  gatherUniqueNodes()

  //get all unique nodes from DB
  await fetchUniqueNodesFromDB()

  let sqlList = syncNodeNames()

  let objSqlList = { sqlList: sqlList }
  if (sqlList.length > 0) {
    await runSQLTransaction(objSqlList)
      .then(async (result) => {
        if (result.success) {
          console.log('Uniques updated in database')
          const response = await syncPathsInDB()
          console.log('syncPathsInDB', response)
        } else {
          console.log('Error updating uniques in database')
          throw result
        }
      })
      .catch((error) => {
        console.log('Error updating uniques in database')
        throw error
      })
  } else {
    console.log('No uniques to update in database')
    const response = await syncPathsInDB()
    console.log('syncPathsInDB', response)
  }

  function syncNodeNames() {
    let sqlList = []
    //compare uniqueNodes with uniqueNodesDB and insert the missing ones or update the existing ones by name
    for (let i = 0; i < uniqueNodes.length; i++) {
      const node = uniqueNodes[i]
      const nodeDB = uniqueNodesDB.find((n) => n.NAME === node)
      if (!nodeDB) {
        //insert node
        sqlList.push(
          `INSERT INTO CCCUNIQNODES (NAME, CCCOFERTEWEB) VALUES ('${node}', ${contextOferta.CCCOFERTEWEB})`
        )
      } else {
        //update node if name is different
        if (nodeDB.NAME === node) {
          continue
        }
        sqlList.push(
          `UPDATE CCCUNIQNODES SET NAME='${node}' WHERE CCCUNIQNODES=${nodeDB.CCCUNIQNODES} AND CCCOFERTEWEB=${contextOferta.CCCOFERTEWEB}`
        )
      }
    }
    return sqlList
  }

  async function fetchUniqueNodesFromDB() {
    const response = await client.service('getDataset').find({
      query: {
        clientID: clientID,
        sqlQuery: `select * from CCCUNIQNODES where CCCOFERTEWEB=${contextOferta.CCCOFERTEWEB}`
      }
    })

    if (response.success && response.total > 0) {
      uniqueNodesDB = response.data
    } else {
      console.log('No unique nodes from DB')
    }
  }

  function gatherUniqueNodes() {
    trees.forEach(async (tree) => {
      for (let i = 0; i < tree.length; i++) {
        const branch = tree[i]
        for (let j = 0; j < branch.length; j++) {
          const node = branch[j]
          if (!uniqueNodes.includes(node)) {
            uniqueNodes.push(node)
          }
        }
      }
    })
  }

  async function syncPathsInDB() {
    let sqlList = []

    //get all unique nodes from DB, we've updated/inserted them in the previous step
    await fetchUniqueNodesFromDB()
    // Insert or update paths using Path Enumeration
    //get all paths from DB
    await fetchPathsFromDB()
    trees.forEach(async (tree) => {
      for (let i = 0; i < tree.length; i++) {
        let branch = tree[i]
        const path = getPathFromBranch(branch)
        let pathDB =
          responsePaths.success && responsePaths.total > 0
            ? responsePaths.data.find((p) => p.PATH === path)
            : null
        if (!pathDB) {
          //insert path
          sqlList.push(
            `INSERT INTO CCCPATHS (PATH, CCCOFERTEWEB) VALUES ('${path}', ${contextOferta.CCCOFERTEWEB})`
          )
        }
      }
    })

    let objSqlList = { sqlList: sqlList }
    try {
      const result =
        sqlList.length > 0
          ? await runSQLTransaction(objSqlList)
          : { success: true, message: 'No paths to update' }
      console.log('Trees updated in database')
      return result
    } catch (error) {
      console.error('Error updating Trees in database:', error)
      throw error
    }

    function getPathFromBranch(branch) {
      //get CCCUNIQNODES for each node in branch
      let branchNodesAsIds = []
      for (let j = 0; j < branch.length; j++) {
        const node = branch[j]
        const nodeDB = uniqueNodesDB.find((n) => n.NAME === node)
        if (nodeDB) {
          branchNodesAsIds.push(nodeDB.CCCUNIQNODES)
        }
      }
      const path = branchNodesAsIds.join('/')
      return path
    }

    async function fetchPathsFromDB() {
      responsePaths = await client.service('getDataset').find({
        query: {
          clientID: clientID,
          sqlQuery: `select * from CCCPATHS where CCCOFERTEWEB=${contextOferta.CCCOFERTEWEB}`
        }
      })
    }

    async function fetchUniqueNodesFromDB() {
      const response1 = await client.service('getDataset').find({
        query: {
          clientID: clientID,
          sqlQuery: `select * from CCCUNIQNODES where CCCOFERTEWEB=${contextOferta.CCCOFERTEWEB}`
        }
      })

      if (response1.success && response1.total > 0) {
        uniqueNodesDB = response1.data
      }
    }
  }
}
