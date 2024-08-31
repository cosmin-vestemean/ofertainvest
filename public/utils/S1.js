import { client, contextOferta, ds_instanteRetete, recipes_ds, trees } from '../client.js'
import { ds_antemasuratori, newTree } from '../controllers/antemasuratori.js'

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
export async function populateSelects() {
  await connectToS1Service()
    .then(async (result) => {
      const clientID = result.token
      //console.log('clientID', clientID)
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
  return new Promise(async (resolve, reject) => {
    try {
      const result = await connectToS1Service()
      const clientID = result.token
      //console.log('clientID', clientID);
      const queryResult = await client.service('getValFromQuery').find({
        query: {
          clientID: clientID,
          appId: 1001,
          sqlQuery: query
        }
      })
      console.log('result', queryResult)
      resolve(queryResult)
    } catch (error) {
      console.log('error', error)
      reject({ success: false, error: error })
    }
  })
}

export async function runSQLTransaction(objSqlList) {
  return new Promise(async (resolve, reject) => {
    if (!objSqlList || !objSqlList.sqlList || objSqlList.sqlList.length == 0) {
      console.log('No sql query transmited.')
      reject({ success: false, error: 'No sql query transmited.' })
    }
    try {
      const result = await connectToS1Service()
      const clientID = result.token
      const response = await client.service('runSQLTransaction').create({
        clientID: clientID,
        sqlList: objSqlList.sqlList
      })
      //console.log('result', response)
      resolve(response)
    } catch (error) {
      console.log('error', error)
      reject({ success: false, error: error, sql: objSqlList.sqlList })
    }
  })
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

export async function getEstimariFromDB(CCCOFERTEWEB) {
  //CCCESTIMARIH WHERE CCCOFERTEWEB = CCCOFERTEWEB => DSESTIMARIFLAT, CREATEDATE, UPDATEDATE, STARTDATE, ENDDATE, ID, ACTIVE
  return new Promise(async (resolve, reject) => {
    try {
      const result = await connectToS1Service()
      const clientID = result.token
      const response = await client.service('getDataset').find({
        query: {
          clientID: clientID,
          sqlQuery: `select CCCOFERTEWEB, CCCESTIMARIH, DSESTIMARIFLAT, FORMAT(CREATEDATE, 'yyyy-MM-dd') as CREATEDATE, FORMAT(UPDATEDATE, 'yyyy-MM-dd') as UPDATEDATE, FORMAT(STARTDATE, 'yyyy-MM-dd') as STARTDATE, FORMAT(ENDDATE, 'yyyy-MM-dd') as ENDDATE, ID, ACTIVE from CCCESTIMARIH where CCCOFERTEWEB='${CCCOFERTEWEB}'`
        }
      })
      //console.log('result', response)
      if (response.success) {
        let estimari = response.data
        let dsEstimari = []
        estimari.forEach((estimare) => {
          console.log('estimare', estimare)
          let estimareObj = {
            ds_estimari_flat: JSON.parse(estimare.DSESTIMARIFLAT),
            id: estimare.ID,
            startDate: estimare.STARTDATE,
            endDate: estimare.ENDDATE,
            createDate: estimare.CREATEDATE,
            updateDate: estimare.UPDATEDATE,
            active: estimare.ACTIVE,
            CCCESTIMARIH: estimare.CCCESTIMARIH
          }
          dsEstimari.push(estimareObj)
        })
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

export async function saveTreesInDB(trees) {
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
          return await syncPathsInDB()
        } else {
          console.log('Error updating Trees in database')
          throw result
        }
      })
      .catch((error) => {
        console.log('Error updating uniques in database')
        throw error
      })
  } else {
    console.log('No uniques to update in database')
    return await syncPathsInDB()
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
          //update path if path is different
          if (pathDB && Object.keys(pathDB).includes('PATH') && pathDB.PATH !== path) {
            sqlList.push(
              `UPDATE CCCPATHS SET PATH='${path}' WHERE CCCPATHS=${pathDB.CCCPATHS} AND CCCOFERTEWEB=${contextOferta.CCCOFERTEWEB}`
            )
          }
      }
    })

    let objSqlList = { sqlList: sqlList }
    await runSQLTransaction(objSqlList)
      .then((result) => {
        if (result.success) {
          console.log('Trees updated in database')
        } else {
          console.log('Error updating Trees in database')
          throw result
        }
      })
      .catch((error) => {
        console.log('Error updating Trees in database')
        throw error
      })

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
