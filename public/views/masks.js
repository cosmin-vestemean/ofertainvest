import { _cantitate_planificari, _cantitate_antemasuratori } from '../utils/def_coloane.js'

const TIP_ARTICOL_OFERTA = ['ARTICOL', 'SUBARTICOL', 'MATERIAL']
const SUBTIP_ARTICOL_OFERTA = [
  'PRINCIPAL',
  'MATERIAL',
  'MANOPERA',
  'TRANSPORT', 
  'ECHIPAMENT',
  'UTILAJ',
  'CUSTOM'
]

// Base display mask with common fields
const baseDisplayMask = {
  // Common identification fields
  old_WBS: {
    value: 'old_WBS',
    usefull: true,
    visible: false,
    RW: false,
    label: 'WBS vechi',
    filter: 'search',
    type: 'string',
    DBName: '',
    linkOferta: ''
  },
  WBS: {
    value: 'WBS',
    usefull: true, 
    visible: false,
    RW: false,
    label: 'WBS',
    filter: 'search',
    type: 'string',
    DBName: '',
    linkOferta: 'WBS'
  },
  DENUMIRE_ARTICOL_OFERTA: {
    value: 'DENUMIRE_ARTICOL_OFERTA',
    usefull: true,
    visible: true, 
    RW: false,
    label: 'Denumire',
    isFilterable: true,
    filter: 'search',
    width: '50%',
    type: 'string',
    verticalDelimiterStyleClass: 'zone1VerticalDelimiter'
  },
  // Common type fields
  TIP_ARTICOL_OFERTA: {
    value: TIP_ARTICOL_OFERTA,
    usefull: true,
    visible: true,
    RW: false,
    label: 'Tip articol',
    filter: 'filter',
    width: '5%',
    type: 'string'
  },
  SUBTIP_ARTICOL_OFERTA: {
    value: SUBTIP_ARTICOL_OFERTA,
    usefull: true,
    visible: true,
    RW: false, 
    label: 'Subtip articol',
    filter: 'filter',
    width: '5%',
    type: 'string'
  },
  // Common quantity fields
  UM_ARTICOL_OFERTA: {
    value: 'UM_ARTICOL_OFERTA',
    usefull: true,
    visible: true,
    RW: false,
    label: 'UM',
    filter: 'filter',
    type: 'string',
    verticalDelimiterStyleClass: 'zone2VerticalDelimiter'
  },
  CANTITATE_ARTICOL_OFERTA: {
    value: 'CANTITATE_ARTICOL_OFERTA',
    usefull: true,
    visible: true,
    RW: false,
    label: 'Cantitate oferta',
    filter: 'compare',
    type: 'number'
  },
  // Common flags
  ISARTOF: {
    value: 'ISARTOF',
    usefull: true,
    visible: false,
    RW: false,
    label: 'Articol oferta',
    type: 'boolean',
    UI: { true: '<i class="bi bi-check2"></i>', false: '' }
  },
  // Common meta fields
  CCCANTEMASURATORI: {
    value: 'CCCANTEMASURATORI',
    usefull: true,
    visible: false,
    RW: false,
    label: 'CCCANTEMASURATORI',
    useAsMeta: true,
    type: 'number'
  },
  CCCPATHS: {
    value: 'CCCPATHS',
    usefull: true,
    visible: false,
    RW: false,
    label: 'CCCPATHS',
    useAsMeta: true
  },
  CCCINSTANTE: {
    value: 'CCCINSTANTE', 
    usefull: true,
    visible: false,
    RW: false,
    label: 'CCCINSTANTE',
    useAsMeta: true
  },
  CCCACTIVITINSTANTE: {
    value: 'CCCACTIVITINSTANTE',
    usefull: true,
    visible: false,
    RW: false,
    label: 'CCCACTIVITINSTANTE',
    useAsMeta: true
  }
}

// Helper function to merge masks
const createMask = (additionalFields = {}, options = {}) => {
  const newMask = JSON.parse(JSON.stringify(baseDisplayMask))
  
  if (options.isSub) {
    // Add master property to all fields for sub masks
    Object.keys(newMask).forEach(key => {
      if (newMask[key].usefull) {
        newMask[key].master = key
      }
    })
  }

  return { ...newMask, ...additionalFields }
}

// Recipe specific fields
const recipeFields = {
  SUMA_CANTITATE_ARTICOL_ANTEMASURATORI_RETETA: {
    value: 'SUMA_CANTITATE_ARTICOL_ANTEMASURATORI_RETETA',
    usefull: true,
    visible: true,
    RW: true,
    label: 'Cantitate totala',
    DBName: 'SUMCANTANTE',
    type: 'number',
    verticalDelimiterStyleClass: 'zone2VerticalDelimiter'
  },
  // ...other recipe specific fields...
}

// Create masks using helper function
const recipeDisplayMask = createMask(recipeFields)
const recipeSubsDisplayMask = createMask(recipeFields, { isSub: true })

const antemasuratoriDisplayMask = createMask({
  [_cantitate_antemasuratori]: {
    value: _cantitate_antemasuratori,
    RW: true,
    visible: true,
    label: 'Cantitate antemasuratori',
    filter: 'search',
    usefull: true,
    type: 'number'
  }
})

const antemasuratoriSubsDisplayMask = createMask({
  [_cantitate_antemasuratori]: {
    value: _cantitate_antemasuratori,
    RW: true,
    visible: true,
    label: 'Cantitate antemasuratori',
    filter: 'search',
    usefull: true,
    type: 'number'
  }
}, { isSub: true })

// Create planificare masks with both antemasuratori and planificari fields
const planificareFields = {
  [_cantitate_antemasuratori]: {
    value: _cantitate_antemasuratori,
    RW: false,
    visible: true,
    label: 'Cantitate antemasuratori',
    filter: 'search',
    usefull: true,
    type: 'number'
  },
  [_cantitate_planificari]: {
    value: _cantitate_planificari,
    RW: true,
    visible: true,
    usefull: true,
    type: 'number', 
    label: 'Cantitate planificare'
  }
}

const planificareDisplayMask = createMask(planificareFields)
const planificareSubsDisplayMask = createMask(planificareFields, { isSub: true })

export {
  recipeDisplayMask,
  recipeSubsDisplayMask, 
  antemasuratoriDisplayMask,
  antemasuratoriSubsDisplayMask,
  planificareDisplayMask,
  planificareSubsDisplayMask
}
