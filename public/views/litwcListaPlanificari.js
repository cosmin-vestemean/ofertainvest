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
        
        Object.assign(this, {
            // Generic list properties
            DocumentType: 'planificare',
            stylesheet: 'planificari.css',
            denumireCantitate: _cantitate_planificari,
            idString: 'CCCPLANIFICARI',
            displayMask: listaPlanificariMask,
            itemComponent: 'litwc-planificare',
            dataService: planificariService,
            tableForNewDocument: tables.tablePlanificareCurenta,
            denumireResp1: 'Responsabil planificare',
            denumireResp2: 'Responsabil executie'
        })

        // Configure display masks
        Object.assign(this.displayMask, {
            mainMask: planificareDisplayMask,
            subsMask: planificareSubsDisplayMask,
            documentHeaderMask: planificareHeaderMask
        })
    }
}

customElements.define('litwc-lista-planificari', LitwcListaPlanificari)