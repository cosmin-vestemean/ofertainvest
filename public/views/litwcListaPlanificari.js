import { LitwcGenericList } from './litwc-generic-list.js'
import { _cantitate_planificari } from '../utils/def_coloane.js'
import { tables } from '../utils/tables.js'
import {
  planificareDisplayMask,
  planificareSubsDisplayMask,
  planificareHeaderMask,
  listaPlanificariMask
} from './masks.js'
import { planificariService } from '../services/planificariService.js'

/**
 * LitwcListaPlanificari extends the generic list component for planificari functionality.
 */
export class LitwcListaPlanificari extends LitwcGenericList {
    constructor() {
        super()
        
        // Configure generic list properties
        this.DocumentType = 'planificare'
        this.stylesheet = 'planificari.css'
        this.denumireCantitate = _cantitate_planificari
        this.idString = 'CCCPLANIFICARI'
        this.displayMask = listaPlanificariMask
        this.itemComponent = 'litwc-planificare'
        this.dataService = planificariService
        this.tableForNewDocument = tables.tablePlanificareCurenta
        this.denumireResp1 = 'Responsabil planificare'
        this.denumireResp2 = 'Responsabil executie'

        // Configure display masks
        this.displayMask.mainMask = planificareDisplayMask
        this.displayMask.subsMask = planificareSubsDisplayMask 
        this.displayMask.documentHeaderMask = planificareHeaderMask
    }
}

customElements.define('litwc-lista-planificari', LitwcListaPlanificari)