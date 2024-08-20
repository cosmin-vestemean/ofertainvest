import { client, contextOferta, ds_instanteRetete, recipes_ds, trees } from '../client.js'
import { ds_antemasuratori } from '../controllers/antemasuratori.js'

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
      reject({ success: false, error: error })
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

export async function saveAntemasuratoriToDB() {
  return new Promise(async (resolve, reject) => {
    try {
      // UPDATE CCCOFERTEWEB:JSONANTESTR with ds_antemasuratori using runSQLTransaction
      let sqlList = []
      sqlList.push(
        `UPDATE CCCOFERTEWEB SET JSONANTESTR='${JSON.stringify(ds_antemasuratori)}' WHERE FILENAME='${contextOferta.FILENAME}'`
      )
      let objSqlList = { sqlList: sqlList }
      let result = await runSQLTransaction(objSqlList)
      if (result.success) {
        console.log('Antemasuratori actualizati in baza de date')
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
export function saveRecipesAndInstanteAndTrees() {
  // Update CCCOFERTEWEB with the new values by calling runSQLTransaction
  let sqlList = []
  //update CCCOFERTEWEB with the new values
  sqlList.push(
    `UPDATE CCCOFERTEWEB SET JSONRECIPE='${JSON.stringify(recipes_ds)}', JSONINSTANTA='${JSON.stringify(
      ds_instanteRetete
    )}', JSONTREE='${JSON.stringify(trees)}' WHERE FILENAME='${contextOferta.FILENAME}'`
  )
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
            createDate: estimare.CREATEDATE,
            updateDate: estimare.UPDATEDATE,
            startDate: estimare.STARTDATE,
            endDate: estimare.ENDDATE,
            id: estimare.ID,
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
