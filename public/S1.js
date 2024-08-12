import { client } from './client.js'

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
                    sqlQuery:
                      'select FILENAME, PRJC from CCCOFERTEWEB ORDER by trndate desc'
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
                        option.value = object['PRJC']
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
export async function insertDocument(UIElement) {
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
      const result = await connectToS1Service();
      const clientID = result.token;
      console.log('clientID', clientID);
      const queryResult = await client
        .service('getValFromQuery')
        .find({
          query: {
            clientID: clientID,
            appId: 1001,
            sqlQuery: query
          }
        });
      console.log('result', queryResult);
      resolve(queryResult);
    } catch (error) {
      console.log('error', error);
      reject({ success: false, error: error });
    }
  });
}

export function runSQLTransaction(objSqlList) {
  return new Promise(async (resolve, reject) => {
    if (!objSqlList || !objSqlList.sqlList || objSqlList.sqlList.length == 0) {
      console.log('No sql query transmited.')
      reject({ success: false, error: 'No sql query transmited.' })
    }
    try {
      const result = await connectToS1Service();
      const clientID = result.token;
      const response = await client
        .service('runSQLTransaction')
        .create({
          clientID: clientID,
          sqlList: objSqlList.sqlList
        });
      //console.log('result', response)
      resolve(response);
    } catch (error) {
      console.log('error', error);
      reject({ success: false, error: error });
    }
  });
}

export function getOferta(filename) {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await connectToS1Service();
      const clientID = result.token;
      const response = await client
        .service('getDataset')
        .find({
          query: {
            clientID: clientID,
            sqlQuery: `select * from CCCOFERTEWEB where FILENAME='${filename}'`
          }
        });
      //console.log('result', response)
      resolve(response);
    } catch (error) {
      console.log('error', error);
      reject({ success: false, error: error });
    }
  });
}