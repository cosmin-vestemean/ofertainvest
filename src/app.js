// For more information about this file see https://dove.feathersjs.com/guides/cli/application.html
import { feathers } from '@feathersjs/feathers'
import configuration from '@feathersjs/configuration'
import { koa, rest, bodyParser, errorHandler, parseAuthentication, cors, serveStatic } from '@feathersjs/koa'
import socketio from '@feathersjs/socketio'

import { configurationValidator } from './configuration.js'
import { logError } from './hooks/log-error.js'
import { mssql } from './mssql.js'

import { services } from './services/index.js'
import { channels } from './channels.js'

const app = koa(feathers())

// Load our app configuration (see config/ folder)
app.configure(configuration(configurationValidator))

// Set up Koa middleware
app.use(cors())
app.use(serveStatic(app.get('public')))
app.use(errorHandler())
app.use(parseAuthentication())
app.use(bodyParser())

// Configure services and transports
app.configure(rest())
app.configure(
  socketio({
    cors: {
      origin: app.get('origins')
    }
  })
)
app.configure(mssql)

app.configure(services)
app.configure(channels)

// Register hooks that run on all service methods
app.hooks({
  around: {
    all: [logError]
  },
  before: {},
  after: {},
  error: {}
})
// Register application setup and teardown hooks here
app.hooks({
  setup: [],
  teardown: []
})

const mainURL = 'https://investdej.oncloud.gr/s1services'

class connectToS1ServiceClass {
  async find(params) {
    const url = mainURL
    const username = 'Serra'
    const password = '5151'
    const method = 'POST'
    const body = {
      service: 'login',
      username: username,
      password: password,
      appId: 1001
    }
    console.log(body)
    const response = await fetch(url, { method: method, body: JSON.stringify(body) })
    const json = await response.json()
    console.log(json)
    const clientID = json.clientID
    const REFID = json.objs[0].REFID
    const MODULE = json.objs[0].MODULE
    const COMPANY = json.objs[0].COMPANY
    const BRANCH = json.objs[0].BRANCH
    const authenticateBody = {
      service: 'authenticate',
      clientID: clientID,
      COMPANY: COMPANY,
      BRANCH: BRANCH,
      MODULE: MODULE,
      REFID: REFID
    }
    console.log(authenticateBody)
    const authenticateResponse = await fetch(url, { method: method, body: JSON.stringify(authenticateBody) })
    const authenticateJson = await authenticateResponse.json()
    console.log(authenticateJson)
    const token = authenticateJson.clientID
    return { token: token }
  }
}

//register the service
app.use('connectToS1', new connectToS1ServiceClass())

class setDocumentServiceClass {
  async create(data, params) {
    console.log(data)
    const url = mainURL
    const method = 'POST'
    const body = data
    const response = await fetch(url, { method: method, body: JSON.stringify(body) })
    const json = await response.json()
    console.log(json)
    return json
  }
}

//register the service
app.use('setDocument', new setDocumentServiceClass())

class getS1ObjData {
  async find(params) {
    const id = params.query.KEY
    const clientID = params.query.clientID
    const appID = params.query.appID
    const OBJECT = params.query.OBJECT
    const FORM = params.query.FORM || ''
    const KEY = id || ''
    const service = 'getData'
    const LOCATEINFO = params.query.LOCATEINFO
    const url = mainURL
    const method = 'POST'
    const body = {
      service: service,
      clientID: clientID,
      appID: appID,
      OBJECT: OBJECT,
      FORM: FORM,
      KEY: KEY,
      LOCATEINFO: LOCATEINFO
    }
    console.log(body)
    const response = await fetch(url, { method: method, body: JSON.stringify(body) })
    const json = await response.json()
    //console.log(json)
    return json
  }
}

//register the service
app.use('getS1ObjData', new getS1ObjData())

//create a service called getDataset that gets a dataset from S1 in return to a token and a string containing a sql query
class getDatasetServiceClass {
  async find(params) {
    const url = mainURL + '/JS/WS/processSqlAsDataset'
    const method = 'POST'
    const sqlQuery = params.query.sqlQuery
    console.log('sqlQuery', sqlQuery)
    const response = await fetch(url, { method: method, body: JSON.stringify({ sqlQuery: sqlQuery }) })
    const json = await response.json()
    console.log(json)
    return json
  }
}

//register the service
app.use('getDataset', new getDatasetServiceClass())

class getValFromQueryServiceClass {
  async find(params) {
    const url = mainURL + '/JS/WS/getValFromQuery'
    const method = 'POST'
    const sqlQuery = params.query.sqlQuery
    console.log('sqlQuery', sqlQuery)
    const response = await fetch(url, { method: method, body: JSON.stringify({ sqlQuery: sqlQuery }) })
    const json = await response.json()
    console.log(json)
    return json
  }
}

//register the service
app.use('getValFromQuery', new getValFromQueryServiceClass())

class runSQLTransactionServiceClass {
  async create(data, params) {
    const url = mainURL + '/JS/WS/runSQLTransaction'
    const method = 'POST'
    const body = data
    const response = await fetch(url, { method: method, body: JSON.stringify(body) })
    const json = await response.json()
    console.log(json)
    return json
  }
}

// Register the service
app.use('runSQLTransaction', new runSQLTransactionServiceClass())

export { app }