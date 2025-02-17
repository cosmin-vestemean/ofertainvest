import UI1 from './UI1.js'
import { contextOferta } from '../client.js'
import { upsertDocument } from '../controllers/insertDocInDB.js'
import { _cantitate_planificari } from '../utils/def_coloane.js'

export class PlanificareDetails extends UI1 {
  // ...existing code...
}

export default PlanificareDetails

customElements.define('litwc-planificare-details', PlanificareDetails)
