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

const recipeDisplayMask = {
  old_WBS: {
    value: 'old_WBS',
    usefull: true,
    visible: false,
    RW: false,
    label: 'WBS vechi',
    DBName: '',
    type: 'string',
    linkOferta: ''
  },
  WBS: {
    value: 'WBS',
    usefull: true,
    visible: false,
    RW: false,
    label: 'WBS',
    DBName: '',
    linkOferta: 'WBS',
    type: 'string'
  },
  DENUMIRE_ARTICOL_OFERTA: {
    value: 'DENUMIRE_ARTICOL_OFERTA',
    usefull: true,
    visible: true,
    RW: false,
    label: 'Denumire',
    linkOferta: 'DENUMIRE_ART_OF',
    width: '50%',
    DBName: '',
    type: 'string'
  },
  CANTITATE_ARTICOL_OFERTA: {
    value: 'CANTITATE_ARTICOL_OFERTA',
    usefull: true,
    visible: false,
    RW: false,
    label: 'Cantitate',
    linkOferta: 'CANT_ART_OF',
    DBName: '',
    type: 'number'
  },
  TIP_ARTICOL_OFERTA: {
    value: TIP_ARTICOL_OFERTA,
    usefull: true,
    visible: true,
    RW: false,
    label: 'Tip articol',
    linkOferta: 'TIP_ART_OF',
    width: '5%',
    DBName: '',
    type: 'string'
  },
  SUBTIP_ARTICOL_OFERTA: {
    value: SUBTIP_ARTICOL_OFERTA,
    usefull: true,
    visible: true,
    RW: false,
    label: 'Subtip articol',
    linkOferta: 'SUBTIP_ART_OF',
    width: '5%',
    DBName: '',
    type: 'string'
  },
  UM_ARTICOL_OFERTA: {
    value: 'UM_ARTICOL_OFERTA',
    usefull: true,
    visible: true,
    RW: false,
    label: 'UM',
    linkOferta: 'UM_ART_OF',
    width: '5%',
    DBName: '',
    type: 'string',
    verticalDelimiterStyleClass: 'zone1VerticalDelimiter'
  },
  SUMA_CANTITATE_ARTICOL_ANTEMASURATORI_RETETA: {
    value: 'SUMA_CANTITATE_ARTICOL_ANTEMASURATORI_RETETA',
    usefull: true,
    visible: true,
    RW: true,
    label: 'Cant. total',
    linkOferta: 'CANT_UNITARA_ART_OF',
    width: '5%',
    DBName: 'SUMCANTANTE',
    type: 'number',
    verticalDelimiterStyleClass: 'zone2VerticalDelimiter'
  },
  MEDIE_NORMA_UNITARA_ORE_MANOPERA_ARTICOL_OFERTA: {
    value: 'MEDIE_NORMA_UNITARA_ORE_MANOPERA_ARTICOL_OFERTA',
    usefull: true,
    visible: true,
    RW: true,
    label: 'Norma unitara',
    linkOferta: 'PONDERE_DECONT_ACTIVITATE_ARTICOL_RETETA',
    width: '5%',
    DBName: 'AVGNORMUNITOREMAN',
    type: 'number',
    verticalDelimiterStyleClass: 'zone3VerticalDelimiter'
  },
  SUMA_TOTAL_ORE_MANOPERA_ARTICOL_OFERTA: {
    value: 'SUMA_TOTAL_ORE_MANOPERA_ARTICOL_OFERTA',
    usefull: true,
    visible: true,
    RW: true,
    label: 'Total ore',
    linkOferta: 'PONDERE_NORMA_ACTIVITATE_ARTICOL_RETETA',
    width: '5%',
    DBName: 'SUMOREMAN',
    type: 'number'
  },
  ISARTOF: {
    value: 'ISARTOF',
    usefull: true,
    visible: false,
    RW: false,
    label: 'Articol oferta',
    linkOferta: '',
    width: '5%',
    DBName: 'ISARTOF',
    type: 'boolean',
    UI: { true: '<i class="bi bi-check2"></i>', false: '' }
  },
  CCCRETETE: {
    value: 'CCCRETETE',
    usefull: true,
    visible: false,
    RW: false,
    label: 'CCCRETETE',
    useAsMeta: true
  },
  CCCACTIVITRETETE: {
    value: 'CCCACTIVITRETETE',
    usefull: true,
    visible: false,
    RW: false,
    label: 'CCCACTIVITRETETE',
    useAsMeta: true
  },
  ISCUSTOM: {
    value: 'ISCUSTOM',
    usefull: true,
    visible: false,
    RW: false,
    label: 'ISCUSTOM',
    useAsMeta: true
  }
}

const recipeSubsDisplayMask = {
  old_WBS: {
    value: 'old_WBS',
    usefull: true,
    visible: false,
    RW: false,
    label: 'WBS vechi',
    DBName: '',
    linkOferta: '',
    type: 'string',
    master: 'old_WBS'
  },
  WBS: {
    value: 'WBS',
    usefull: true,
    visible: false,
    RW: false,
    label: 'WBS',
    DBName: '',
    linkOferta: '',
    type: 'string',
    master: 'WBS'
  },
  DENUMIRE_ARTICOL_OFERTA: {
    value: 'DENUMIRE_ARTICOL_OFERTA',
    usefull: true,
    visible: true,
    RW: false,
    label: 'Denumire',
    linkOferta: 'DENUMIRE_ART_OF',
    width: '50%',
    DBName: '',
    type: 'string',
    master: 'DENUMIRE_ARTICOL_OFERTA',
    hasActions: true
  },
  CANTITATE_ARTICOL_OFERTA: {
    value: 'CANTITATE_ARTICOL_OFERTA',
    usefull: true,
    visible: false,
    RW: false,
    label: 'Cantitate',
    linkOferta: 'CANT_ART_OF',
    DBName: '',
    type: 'number',
    master: 'CANTITATE_ARTICOL_OFERTA'
  },
  TIP_ARTICOL_OFERTA: {
    value: TIP_ARTICOL_OFERTA,
    usefull: true,
    visible: true,
    RW: false,
    label: 'Tip articol',
    linkOferta: 'TIP_ART_OF',
    width: '5%',
    DBName: '',
    type: 'string',
    master: 'TIP_ARTICOL_OFERTA'
  },
  SUBTIP_ARTICOL_OFERTA: {
    value: SUBTIP_ARTICOL_OFERTA,
    usefull: true,
    visible: true,
    RW: false,
    label: 'Subtip articol',
    linkOferta: 'SUBTIP_ART_OF',
    width: '5%',
    DBName: '',
    type: 'string',
    master: 'SUBTIP_ARTICOL_OFERTA'
  },
  UM_ARTICOL_OFERTA: {
    value: 'UM_ARTICOL_OFERTA',
    usefull: true,
    visible: true,
    RW: false,
    label: 'UM',
    linkOferta: 'UM_ART_OF',
    width: '5%',
    DBName: '',
    type: 'string',
    master: 'UM_ARTICOL_OFERTA',
    verticalDelimiterStyleClass: 'zone1VerticalDelimiter'
  },
  CANTITATE_SUBARTICOL_RETETA: {
    value: 'CANTITATE_SUBARTICOL_RETETA',
    usefull: true,
    visible: true,
    RW: true,
    label: 'Cant. total',
    linkOferta: 'CANT_UNITARA_ART_OF',
    width: '5%',
    DBName: 'CANTTOTAL',
    type: 'number',
    master: 'SUMA_CANTITATE_ARTICOL_ANTEMASURATORI_RETETA'
  },
  CANTITATE_UNITARA_SUBARTICOL_RETETA: {
    value: 'CANTITATE_UNITARA_SUBARTICOL_RETETA',
    usefull: true,
    visible: true,
    RW: true,
    label: 'Cant. unit.',
    linkOferta: 'PONDERE_DECONT_ACTIVITATE_ARTICOL_RETETA',
    width: '5%',
    DBName: 'CANTUNIT',
    type: 'number',
    master: 'SUMA_CANTITATE_ARTICOL_ANTEMASURATORI_RETETA'
  },
  CANTITATE_REALIZARE_ARTICOL_RETETA: {
    value: 'CANTITATE_REALIZARE_ARTICOL_RETETA ',
    usefull: true,
    visible: true,
    RW: true,
    label: 'Realizare cant.',
    linkOferta: 'PONDERE_NORMA_ACTIVITATE_ARTICOL_RETETA',
    width: '5%',
    DBName: 'CANTREAL',
    type: 'number',
    master: 'SUMA_CANTITATE_ARTICOL_ANTEMASURATORI_RETETA'
  },
  CANTITATE_UNITARA_REALIZARE_ARTICOL_RETETA: {
    value: 'CANTITATE_UNITARA_REALIZARE_ARTICOL_RETETA',
    usefull: true,
    visible: true,
    RW: true,
    label: 'Realizare unit.',
    linkOferta: '',
    width: '5%',
    DBName: '',
    type: 'number',
    master: 'SUMA_CANTITATE_ARTICOL_ANTEMASURATORI_RETETA',
    verticalDelimiterStyleClass: 'zone2VerticalDelimiter'
  },
  NORMA_UNITARA_ORE_MANOPERA_SUBARTICOL_RETETA: {
    value: 'NORMA_UNITARA_ORE_MANOPERA_SUBARTICOL_RETETA',
    usefull: true,
    visible: true,
    RW: true,
    label: 'Norma unitara',
    linkOferta: '',
    width: '5%',
    DBName: 'NORMUNITMAN',
    type: 'number',
    master: 'MEDIE_NORMA_UNITARA_ORE_MANOPERA_ARTICOL_OFERTA'
  },
  PONDERE_NORMA_ORE_MANOPERA_SUBARTICOL_RETETA: {
    value: 'PONDERE_NORMA_ORE_MANOPERA_SUBARTICOL_RETETA',
    usefull: true,
    visible: true,
    RW: true,
    label: 'Pondere ore',
    linkOferta: '',
    width: '5%',
    DBName: '',
    type: 'number',
    master: 'MEDIE_NORMA_UNITARA_ORE_MANOPERA_ARTICOL_OFERTA',
    verticalDelimiterStyleClass: 'zone3VerticalDelimiter'
  },
  TOTAL_ORE_MANOPERA_SUBARTICOL_RETETA: {
    value: 'TOTAL_ORE_MANOPERA_SUBARTICOL_RETETA',
    usefull: true,
    visible: true,
    RW: true,
    label: 'Total ore',
    linkOferta: '',
    width: '5%',
    DBName: 'TOTALOREMAN',
    type: 'number',
    master: 'SUMA_TOTAL_ORE_MANOPERA_ARTICOL_OFERTA'
  },
  ISARTOF: {
    value: 'ISARTOF',
    usefull: true,
    visible: false,
    RW: false,
    label: 'Articol oferta',
    linkOferta: '',
    width: '5%',
    DBName: 'ISARTOF',
    type: 'boolean',
    UI: { true: '<i class="bi bi-check2"></i>', false: '' },
    master: 'ISARTOF'
  },
  CCCRETETE: {
    value: 'CCCRETETE',
    usefull: true,
    visible: false,
    RW: false,
    label: 'CCCRETETE',
    useAsMeta: true
  },
  CCCACTIVITRETETE: {
    value: 'CCCACTIVITRETETE',
    usefull: true,
    visible: false,
    RW: false,
    label: 'CCCACTIVITRETETE',
    useAsMeta: true
  },
  CCCMATRETETE: {
    value: 'CCCMATRETETE',
    usefull: true,
    visible: false,
    RW: false,
    label: 'CCCMATRETETE',
    useAsMeta: true
  },
  ISCUSTOM: {
    value: 'ISCUSTOM',
    usefull: true,
    visible: false,
    RW: false,
    label: 'ISCUSTOM',
    useAsMeta: true
  }
}

const antemasuratoriDisplayMask = {
  ISDUPLICATE: {
    value: 'ISDUPLICATE',
    RW: false,
    visible: false,
    label: 'Duplicat',
    isEnumerable: false,
    usefull: true,
    UI: { true: '<i class="bi bi-check2"></i>', false: '' }
  },
  DUPLICATEOF: {
    value: 'DUPLICATEOF',
    RW: false,
    visible: false,
    label: 'Reteta',
    usefull: true,
    hasActions: false
  },
  old_WBS: {
    value: 'old_WBS',
    RW: false,
    visible: false,
    label: 'WBS vechi',
    filter: 'search',
    usefull: true,
    hasActions: false
  },
  WBS: {
    value: 'WBS',
    RW: false,
    visible: false,
    label: 'WBS',
    filter: 'search',
    usefull: true,
    hasActions: false
  },
  SERIE_ARTICOL_OFERTA: {
    value: 'SERIE_ARTICOL_OFERTA',
    RW: false,
    visible: false,
    label: 'Serie articol',
    isEnumerable: false,
    filter: 'search',
    usefull: true
  },
  DENUMIRE_ARTICOL_OFERTA: {
    value: 'DENUMIRE_ARTICOL_OFERTA',
    RW: false,
    visible: true,
    label: 'Denumire',
    isEnumerable: true,
    isFilterable: true,
    filter: 'search',
    usefull: true,
    hasActions: true,
    verticalDelimiterStyleClass: 'zone1VerticalDelimiter'
  },
  TIP_ARTICOL_OFERTA: {
    value: 'TIP_ARTICOL_OFERTA',
    RW: false,
    visible: true,
    label: 'Tip articol',
    isEnumerable: true,
    filter: 'filter',
    usefull: true
  },
  SUBTIP_ARTICOL_OFERTA: {
    value: 'SUBTIP_ARTICOL_OFERTA',
    RW: false,
    visible: true,
    label: 'Subtip articol',
    isEnumerable: true,
    filter: 'filter',
    usefull: true
  },
  NIVEL_OFERTA_1: {
    value: 'NIVEL_OFERTA_1',
    RW: false,
    visible: true,
    label: 'Nivel 1',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    usefull: true
  },
  NIVEL_OFERTA_2: {
    value: 'NIVEL_OFERTA_2',
    RW: false,
    visible: true,
    label: 'Nivel 2',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_1',
    usefull: true
  },
  NIVEL_OFERTA_3: {
    value: 'NIVEL_OFERTA_3',
    RW: false,
    visible: true,
    label: 'Nivel 3',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_2',
    usefull: true
  },
  NIVEL_OFERTA_4: {
    value: 'NIVEL_OFERTA_4',
    RW: false,
    visible: true,
    label: 'Nivel 4',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_3',
    usefull: true
  },
  NIVEL_OFERTA_5: {
    value: 'NIVEL_OFERTA_5',
    RW: false,
    visible: true,
    label: 'Nivel 5',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_4',
    usefull: true
  },
  NIVEL_OFERTA_6: {
    value: 'NIVEL_OFERTA_6',
    RW: false,
    visible: true,
    label: 'Nivel 6',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_5',
    usefull: true
  },
  NIVEL_OFERTA_7: {
    value: 'NIVEL_OFERTA_7',
    RW: false,
    visible: true,
    label: 'Nivel 7',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_6',
    usefull: true
  },
  NIVEL_OFERTA_8: {
    value: 'NIVEL_OFERTA_8',
    RW: false,
    visible: true,
    label: 'Nivel 8',
    isFilterable: true,
    isEnumerable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_7',
    usefull: true
  },
  NIVEL_OFERTA_9: {
    value: 'NIVEL_OFERTA_9',
    RW: false,
    visible: true,
    label: 'Nivel 9',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_8',
    usefull: true
  },
  NIVEL_OFERTA_10: {
    value: 'NIVEL_OFERTA_10',
    RW: false,
    visible: true,
    label: 'Nivel 10',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_9',
    usefull: true
  },
  UM_ARTICOL_OFERTA: {
    value: 'UM_ARTICOL_OFERTA',
    RW: false,
    visible: true,
    label: 'UM',
    isEnumerable: false,
    filter: 'filter',
    usefull: true,
    verticalDelimiterStyleClass: 'zone2VerticalDelimiter'
  },
  CANTITATE_ARTICOL_OFERTA: {
    value: 'CANTITATE_ARTICOL_OFERTA',
    RW: false,
    visible: true,
    label: 'Cant. oferta',
    isEnumerable: false,
    filter: 'compare',
    usefull: true
  },
  ISARTOF: {
    value: 'ISARTOF',
    RW: false,
    visible: false,
    label: 'Articol oferta',
    isEnumerable: false,
    usefull: true,
    UI: { true: '<i class="bi bi-check2"></i>', false: '' }
  },
  CCCANTEMASURATORI: {
    value: 'CCCANTEMASURATORI',
    RW: false,
    visible: false,
    label: 'CCCANTEMASURATORI',
    useAsMeta: true,
    usefull: true,
    type: 'number'
  },
  CCCPATHS: {
    value: 'CCCPATHS',
    RW: false,
    visible: false,
    label: 'CCCPATHS',
    useAsMeta: true,
    usefull: true
  },
  CCCINSTANTE: {
    value: 'CCCINSTANTE',
    RW: false,
    visible: false,
    label: 'CCCINSTANTE',
    useAsMeta: true,
    usefull: true
  },
  CCCACTIVITINSTANTE: {
    value: 'CCCACTIVITINSTANTE',
    RW: false,
    visible: false,
    label: 'CCCACTIVITINSTANTE',
    useAsMeta: true,
    usefull: true
  },
  CCCOFERTEWEBLINII: {
    value: 'CCCOFERTEWEBLINII',
    RW: false,
    visible: false,
    label: 'CCCOFERTEWEBLINII',
    useAsMeta: true,
    usefull: true
  }
}

antemasuratoriDisplayMask[_cantitate_antemasuratori] = {
  value: _cantitate_antemasuratori,
  RW: true,
  visible: true,
  label: 'Cant. antemas.',
  isEnumerable: false,
  filter: 'search',
  usefull: true,
  type: 'number'
}

const antemasuratoriSubsDisplayMask = {
  ISDUPLICATE: {
    value: 'ISDUPLICATE',
    RW: false,
    visible: false,
    label: 'Duplicat',
    isEnumerable: false,
    usefull: true,
    UI: { true: '<i class="bi bi-check2"></i>', false: '' },
    master: 'ISDUPLICATE'
  },
  DUPLICATEOF: {
    value: 'DUPLICATEOF',
    RW: false,
    visible: false,
    label: 'Reteta',
    usefull: true,
    hasActions: false,
    master: 'DUPLICATEOF'
  },
  old_WBS: {
    value: 'old_WBS',
    RW: false,
    visible: false,
    label: 'WBS vechi',
    filter: 'search',
    usefull: true,
    hasActions: false,
    master: 'old_WBS'
  },
  WBS: {
    value: 'WBS',
    RW: false,
    visible: false,
    label: 'WBS',
    filter: 'search',
    usefull: true,
    hasActions: false,
    master: 'WBS'
  },
  SERIE_ARTICOL_OFERTA: {
    value: 'SERIE_ARTICOL_OFERTA',
    RW: false,
    visible: false,
    label: 'Serie articol',
    isEnumerable: false,
    filter: 'search',
    usefull: true,
    master: 'SERIE_ARTICOL_OFERTA'
  },
  DENUMIRE_ARTICOL_OFERTA: {
    value: 'DENUMIRE_ARTICOL_OFERTA',
    RW: false,
    visible: true,
    label: 'Denumire',
    isEnumerable: true,
    isFilterable: true,
    filter: 'search',
    usefull: true,
    master: 'DENUMIRE_ARTICOL_OFERTA',
    hasActions: true,
    verticalDelimiterStyleClass: 'zone1VerticalDelimiter'
  },
  TIP_ARTICOL_OFERTA: {
    value: 'TIP_ARTICOL_OFERTA',
    RW: false,
    visible: true,
    label: 'Tip articol',
    isEnumerable: true,
    filter: 'filter',
    usefull: true,
    master: 'TIP_ARTICOL_OFERTA'
  },
  SUBTIP_ARTICOL_OFERTA: {
    value: 'SUBTIP_ARTICOL_OFERTA',
    RW: false,
    visible: true,
    label: 'Subtip articol',
    isEnumerable: true,
    filter: 'filter',
    usefull: true,
    master: 'SUBTIP_ARTICOL_OFERTA'
  },
  NIVEL_OFERTA_1: {
    value: 'NIVEL_OFERTA_1',
    RW: false,
    visible: true,
    label: 'Nivel 1',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    usefull: true,
    master: 'NIVEL_OFERTA_1'
  },
  NIVEL_OFERTA_2: {
    value: 'NIVEL_OFERTA_2',
    RW: false,
    visible: true,
    label: 'Nivel 2',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_1',
    usefull: true,
    master: 'NIVEL_OFERTA_2'
  },
  NIVEL_OFERTA_3: {
    value: 'NIVEL_OFERTA_3',
    RW: false,
    visible: true,
    label: 'Nivel 3',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_2',
    usefull: true,
    master: 'NIVEL_OFERTA_3'
  },
  NIVEL_OFERTA_4: {
    value: 'NIVEL_OFERTA_4',
    RW: false,
    visible: true,
    label: 'Nivel 4',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_3',
    usefull: true,
    master: 'NIVEL_OFERTA_4'
  },
  NIVEL_OFERTA_5: {
    value: 'NIVEL_OFERTA_5',
    RW: false,
    visible: true,
    label: 'Nivel 5',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_4',
    usefull: true,
    master: 'NIVEL_OFERTA_5'
  },
  NIVEL_OFERTA_6: {
    value: 'NIVEL_OFERTA_6',
    RW: false,
    visible: true,
    label: 'Nivel 6',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_5',
    usefull: true,
    master: 'NIVEL_OFERTA_6'
  },
  NIVEL_OFERTA_7: {
    value: 'NIVEL_OFERTA_7',
    RW: false,
    visible: true,
    label: 'Nivel 7',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_6',
    usefull: true,
    master: 'NIVEL_OFERTA_7'
  },
  NIVEL_OFERTA_8: {
    value: 'NIVEL_OFERTA_8',
    RW: false,
    visible: true,
    label: 'Nivel 8',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_7',
    usefull: true,
    master: 'NIVEL_OFERTA_8'
  },
  NIVEL_OFERTA_9: {
    value: 'NIVEL_OFERTA_9',
    RW: false,
    visible: true,
    label: 'Nivel 9',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_8',
    usefull: true,
    master: 'NIVEL_OFERTA_9'
  },
  NIVEL_OFERTA_10: {
    value: 'NIVEL_OFERTA_10',
    RW: false,
    visible: true,
    label: 'Nivel 10',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_9',
    usefull: true,
    master: 'NIVEL_OFERTA_10'
  },
  UM_ARTICOL_OFERTA: {
    value: 'UM_ARTICOL_OFERTA',
    RW: false,
    visible: true,
    label: 'UM',
    isEnumerable: false,
    filter: 'filter',
    usefull: true,
    master: 'UM_ARTICOL_OFERTA',
    verticalDelimiterStyleClass: 'zone2VerticalDelimiter'
  },
  CANTITATE_ARTICOL_OFERTA: {
    value: 'CANTITATE_ARTICOL_OFERTA',
    RW: false,
    visible: true,
    label: 'Cant. oferta',
    isEnumerable: false,
    filter: 'compare',
    usefull: true,
    master: 'CANTITATE_ARTICOL_OFERTA'
  },
  ISARTOF: {
    value: 'ISARTOF',
    RW: false,
    visible: false,
    label: 'Articol oferta',
    isEnumerable: false,
    usefull: true,
    UI: { true: '<i class="bi bi-check2"></i>', false: '' },
    master: 'ISARTOF'
  },
  CCCANTEMASURATORI: {
    value: 'CCCANTEMASURATORI',
    RW: false,
    visible: false,
    label: 'CCCANTEMASURATORI',
    useAsMeta: true,
    usefull: true,
    type: 'number'
  },
  CCCPATHS: {
    value: 'CCCPATHS',
    RW: false,
    visible: false,
    label: 'CCCPATHS',
    useAsMeta: true,
    usefull: true
  },
  CCCINSTANTE: {
    value: 'CCCINSTANTE',
    RW: false,
    visible: false,
    label: 'CCCINSTANTE',
    useAsMeta: true,
    usefull: true
  },
  CCCACTIVITINSTANTE: {
    value: 'CCCACTIVITINSTANTE',
    RW: false,
    visible: false,
    label: 'CCCACTIVITINSTANTE',
    useAsMeta: true,
    usefull: true
  },
  CCCOFERTEWEBLINII: {
    value: 'CCCOFERTEWEBLINII',
    RW: false,
    visible: false,
    label: 'CCCOFERTEWEBLINII',
    useAsMeta: true,
    usefull: true
  }
}

antemasuratoriSubsDisplayMask[_cantitate_antemasuratori] = {
  value: _cantitate_antemasuratori,
  RW: true,
  visible: true,
  label: 'Cant. antemas.',
  isEnumerable: false,
  filter: 'search',
  usefull: true,
  type: 'number',
  master: _cantitate_antemasuratori
}

const planificareDisplayMask = {
  ISDUPLICATE: {
    value: 'ISDUPLICATE',
    RW: false,
    visible: false,
    label: 'Duplicat',
    isEnumerable: false,
    usefull: true,
    UI: { true: '<i class="bi bi-check2"></i>', false: '' }
  },
  DUPLICATEOF: {
    value: 'DUPLICATEOF',
    RW: false,
    visible: false,
    label: 'Reteta',
    usefull: true,
    hasActions: false
  },
  old_WBS: {
    value: 'old_WBS',
    RW: false,
    visible: false,
    label: 'WBS vechi',
    filter: 'search',
    usefull: true,
    hasActions: false
  },
  WBS: {
    value: 'WBS',
    RW: false,
    visible: false,
    label: 'WBS',
    filter: 'search',
    usefull: true,
    hasActions: false
  },
  SERIE_ARTICOL_OFERTA: {
    value: 'SERIE_ARTICOL_OFERTA',
    RW: false,
    visible: false,
    label: 'Serie articol',
    isEnumerable: false,
    filter: 'search',
    usefull: true
  },
  DENUMIRE_ARTICOL_OFERTA: {
    value: 'DENUMIRE_ARTICOL_OFERTA',
    RW: false,
    visible: true,
    label: 'Denumire',
    isEnumerable: true,
    isFilterable: true,
    filter: 'search',
    usefull: true,
    hasActions: true,
    verticalDelimiterStyleClass: 'zone1VerticalDelimiter'
  },
  TIP_ARTICOL_OFERTA: {
    value: 'TIP_ARTICOL_OFERTA',
    RW: false,
    visible: false,
    label: 'Tip articol',
    isEnumerable: true,
    filter: 'filter',
    usefull: true
  },
  SUBTIP_ARTICOL_OFERTA: {
    value: 'SUBTIP_ARTICOL_OFERTA',
    RW: false,
    visible: false,
    label: 'Subtip articol',
    isEnumerable: true,
    filter: 'filter',
    usefull: true
  },
  NIVEL_OFERTA_1: {
    value: 'NIVEL_OFERTA_1',
    RW: false,
    visible: true,
    label: 'Nivel 1',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    usefull: true
  },
  NIVEL_OFERTA_2: {
    value: 'NIVEL_OFERTA_2',
    RW: false,
    visible: true,
    label: 'Nivel 2',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_1',
    usefull: true
  },
  NIVEL_OFERTA_3: {
    value: 'NIVEL_OFERTA_3',
    RW: false,
    visible: true,
    label: 'Nivel 3',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_2',
    usefull: true
  },
  NIVEL_OFERTA_4: {
    value: 'NIVEL_OFERTA_4',
    RW: false,
    visible: true,
    label: 'Nivel 4',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_3',
    usefull: true
  },
  NIVEL_OFERTA_5: {
    value: 'NIVEL_OFERTA_5',
    RW: false,
    visible: true,
    label: 'Nivel 5',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_4',
    usefull: true
  },
  NIVEL_OFERTA_6: {
    value: 'NIVEL_OFERTA_6',
    RW: false,
    visible: true,
    label: 'Nivel 6',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_5',
    usefull: true
  },
  NIVEL_OFERTA_7: {
    value: 'NIVEL_OFERTA_7',
    RW: false,
    visible: true,
    label: 'Nivel 7',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_6',
    usefull: true
  },
  NIVEL_OFERTA_8: {
    value: 'NIVEL_OFERTA_8',
    RW: false,
    visible: true,
    label: 'Nivel 8',
    isFilterable: true,
    isEnumerable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_7',
    usefull: true
  },
  NIVEL_OFERTA_9: {
    value: 'NIVEL_OFERTA_9',
    RW: false,
    visible: true,
    label: 'Nivel 9',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_8',
    usefull: true
  },
  NIVEL_OFERTA_10: {
    value: 'NIVEL_OFERTA_10',
    RW: false,
    visible: true,
    label: 'Nivel 10',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_9',
    usefull: true
  },
  UM_ARTICOL_OFERTA: {
    value: 'UM_ARTICOL_OFERTA',
    RW: false,
    visible: true,
    label: 'UM',
    isEnumerable: false,
    filter: 'filter',
    usefull: true,
    verticalDelimiterStyleClass: 'zone2VerticalDelimiter'
  },
  CANTITATE_ARTICOL_OFERTA: {
    value: 'CANTITATE_ARTICOL_OFERTA',
    RW: false,
    visible: true,
    label: 'Cant. oferta',
    isEnumerable: false,
    filter: 'compare',
    usefull: true
  },
  ISARTOF: {
    value: 'ISARTOF',
    RW: false,
    visible: false,
    label: 'Articol oferta',
    isEnumerable: false,
    usefull: true,
    UI: { true: '<i class="bi bi-check2"></i>', false: '' }
  },
  CCCANTEMASURATORI: {
    value: 'CCCANTEMASURATORI',
    RW: false,
    visible: false,
    label: 'CCCANTEMASURATORI',
    useAsMeta: true,
    usefull: true,
    type: 'number'
  },
  CCCPATHS: {
    value: 'CCCPATHS',
    RW: false,
    visible: false,
    label: 'CCCPATHS',
    useAsMeta: true,
    usefull: true
  },
  CCCINSTANTE: {
    value: 'CCCINSTANTE',
    RW: false,
    visible: false,
    label: 'CCCINSTANTE',
    useAsMeta: true,
    usefull: true
  },
  CCCACTIVITINSTANTE: {
    value: 'CCCACTIVITINSTANTE',
    RW: false,
    visible: false,
    label: 'CCCACTIVITINSTANTE',
    useAsMeta: true,
    usefull: true
  },
  CCCOFERTEWEBLINII: {
    value: 'CCCOFERTEWEBLINII',
    RW: false,
    visible: false,
    label: 'CCCOFERTEWEBLINII',
    useAsMeta: true,
    usefull: true
  },
}

planificareDisplayMask[_cantitate_antemasuratori] = {
  value: _cantitate_antemasuratori,
  RW: false,
  visible: true,
  label: 'Cant. antemas.',
  isEnumerable: false,
  filter: 'search',
  usefull: true,
  type: 'number'
}

planificareDisplayMask[_cantitate_planificari] = {
  value: _cantitate_planificari,
  RW: true,
  visible: true,
  usefull: true,
  type: 'number',
  label: 'Cant. planif.'
}

planificareDisplayMask.DATASTART_X = {
  value: 'DATASTART_X',
  RW: true,
  visible: true,
  label: 'Data inceput',
  type: 'datetime',
  usefull: true
}

planificareDisplayMask.DATASTOP_X = {
  value: 'DATASTOP_X',
  RW: true,
  visible: true,
  label: 'Data final.',
  type: 'datetime',
  usefull: true
}

const planificareSubsDisplayMask = {
  ISDUPLICATE: {
    value: 'ISDUPLICATE',
    RW: false,
    visible: false,
    label: 'Duplicat',
    isEnumerable: false,
    usefull: true,
    UI: { true: '<i class="bi bi-check2"></i>', false: '' },
    master: 'ISDUPLICATE'
  },
  DUPLICATEOF: {
    value: 'DUPLICATEOF',
    RW: false,
    visible: false,
    label: 'Reteta',
    usefull: true,
    hasActions: false,
    master: 'DUPLICATEOF'
  },
  old_WBS: {
    value: 'old_WBS',
    RW: false,
    visible: false,
    label: 'WBS vechi',
    filter: 'search',
    usefull: true,
    hasActions: false,
    master: 'old_WBS'
  },
  WBS: {
    value: 'WBS',
    RW: false,
    visible: false,
    label: 'WBS',
    filter: 'search',
    usefull: true,
    hasActions: false,
    master: 'WBS'
  },
  SERIE_ARTICOL_OFERTA: {
    value: 'SERIE_ARTICOL_OFERTA',
    RW: false,
    visible: false,
    label: 'Serie articol',
    isEnumerable: false,
    filter: 'search',
    usefull: true,
    master: 'SERIE_ARTICOL_OFERTA'
  },
  DENUMIRE_ARTICOL_OFERTA: {
    value: 'DENUMIRE_ARTICOL_OFERTA',
    RW: false,
    visible: true,
    label: 'Denumire',
    isEnumerable: true,
    isFilterable: true,
    filter: 'search',
    usefull: true,
    master: 'DENUMIRE_ARTICOL_OFERTA',
    hasActions: true,
    verticalDelimiterStyleClass: 'zone1VerticalDelimiter'
  },
  TIP_ARTICOL_OFERTA: {
    value: 'TIP_ARTICOL_OFERTA',
    RW: false,
    visible: false,
    label: 'Tip articol',
    isEnumerable: true,
    filter: 'filter',
    usefull: true,
    master: 'TIP_ARTICOL_OFERTA'
  },
  SUBTIP_ARTICOL_OFERTA: {
    value: 'SUBTIP_ARTICOL_OFERTA',
    RW: false,
    visible: false,
    label: 'Subtip articol',
    isEnumerable: true,
    filter: 'filter',
    usefull: true,
    master: 'SUBTIP_ARTICOL_OFERTA'
  },
  NIVEL_OFERTA_1: {
    value: 'NIVEL_OFERTA_1',
    RW: false,
    visible: true,
    label: 'Nivel 1',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    usefull: true,
    master: 'NIVEL_OFERTA_1'
  },
  NIVEL_OFERTA_2: {
    value: 'NIVEL_OFERTA_2',
    RW: false,
    visible: true,
    label: 'Nivel 2',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_1',
    usefull: true,
    master: 'NIVEL_OFERTA_2'
  },
  NIVEL_OFERTA_3: {
    value: 'NIVEL_OFERTA_3',
    RW: false,
    visible: true,
    label: 'Nivel 3',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_2',
    usefull: true,
    master: 'NIVEL_OFERTA_3'
  },
  NIVEL_OFERTA_4: {
    value: 'NIVEL_OFERTA_4',
    RW: false,
    visible: true,
    label: 'Nivel 4',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_3',
    usefull: true,
    master: 'NIVEL_OFERTA_4'
  },
  NIVEL_OFERTA_5: {
    value: 'NIVEL_OFERTA_5',
    RW: false,
    visible: true,
    label: 'Nivel 5',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_4',
    usefull: true,
    master: 'NIVEL_OFERTA_5'
  },
  NIVEL_OFERTA_6: {
    value: 'NIVEL_OFERTA_6',
    RW: false,
    visible: true,
    label: 'Nivel 6',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_5',
    usefull: true,
    master: 'NIVEL_OFERTA_6'
  },
  NIVEL_OFERTA_7: {
    value: 'NIVEL_OFERTA_7',
    RW: false,
    visible: true,
    label: 'Nivel 7',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_6',
    usefull: true,
    master: 'NIVEL_OFERTA_7'
  },
  NIVEL_OFERTA_8: {
    value: 'NIVEL_OFERTA_8',
    RW: false,
    visible: true,
    label: 'Nivel 8',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_7',
    usefull: true,
    master: 'NIVEL_OFERTA_8'
  },
  NIVEL_OFERTA_9: {
    value: 'NIVEL_OFERTA_9',
    RW: false,
    visible: true,
    label: 'Nivel 9',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_8',
    usefull: true,
    master: 'NIVEL_OFERTA_9'
  },
  NIVEL_OFERTA_10: {
    value: 'NIVEL_OFERTA_10',
    RW: false,
    visible: true,
    label: 'Nivel 10',
    isEnumerable: true,
    isFilterable: true,
    filter: 'filter',
    cascadeFor: 'NIVEL_OFERTA_9',
    usefull: true,
    master: 'NIVEL_OFERTA_10'
  },
  UM_ARTICOL_OFERTA: {
    value: 'UM_ARTICOL_OFERTA',
    RW: false,
    visible: true,
    label: 'UM',
    isEnumerable: false,
    filter: 'filter',
    usefull: true,
    master: 'UM_ARTICOL_OFERTA',
    verticalDelimiterStyleClass: 'zone2VerticalDelimiter'
  },
  CANTITATE_ARTICOL_OFERTA: {
    value: 'CANTITATE_ARTICOL_OFERTA',
    RW: false,
    visible: true,
    label: 'Cant. oferta',
    isEnumerable: false,
    filter: 'compare',
    usefull: true,
    master: 'CANTITATE_ARTICOL_OFERTA'
  },
  ISARTOF: {
    value: 'ISARTOF',
    RW: false,
    visible: false,
    label: 'Articol oferta',
    isEnumerable: false,
    usefull: true,
    UI: { true: '<i class="bi bi-check2"></i>', false: '' },
    master: 'ISARTOF'
  },
  CCCANTEMASURATORI: {
    value: 'CCCANTEMASURATORI',
    RW: false,
    visible: false,
    label: 'CCCANTEMASURATORI',
    useAsMeta: true,
    usefull: true,
    type: 'number'
  },
  CCCPATHS: {
    value: 'CCCPATHS',
    RW: false,
    visible: false,
    label: 'CCCPATHS',
    useAsMeta: true,
    usefull: true
  },
  CCCINSTANTE: {
    value: 'CCCINSTANTE',
    RW: false,
    visible: false,
    label: 'CCCINSTANTE',
    useAsMeta: true,
    usefull: true
  },
  CCCACTIVITINSTANTE: {
    value: 'CCCACTIVITINSTANTE',
    RW: false,
    visible: false,
    label: 'CCCACTIVITINSTANTE',
    useAsMeta: true,
    usefull: true
  },
  CCCOFERTEWEBLINII: {
    value: 'CCCOFERTEWEBLINII',
    RW: false,
    visible: false,
    label: 'CCCOFERTEWEBLINII',
    useAsMeta: true,
    usefull: true
  }
}

planificareSubsDisplayMask[_cantitate_antemasuratori] = {
  value: _cantitate_antemasuratori,
  RW: false,
  visible: true,
  label: 'Cant. antemas.',
  isEnumerable: false,
  filter: 'search',
  usefull: true,
  type: 'number',
  master: _cantitate_antemasuratori
}

planificareSubsDisplayMask[_cantitate_planificari] = {
  value: _cantitate_planificari,
  RW: true,
  visible: true,
  label: 'Cant. planif.',
  usefull: true,
  type: 'number',
  master: _cantitate_planificari
}

planificareSubsDisplayMask.DATASTART_X = {
  value: 'DATASTART_X',
  RW: true,
  visible: true,
  label: 'Data inceput',
  type: 'datetime',
  usefull: true,
  master: 'DATASTART_X'
}

planificareSubsDisplayMask.DATASTOP_X = {
  value: 'DATASTOP_X',
  RW: true,
  visible: true,
  label: 'Data final.',
  type: 'datetime',
  usefull: true,
  master: 'DATASTOP_X'
}

const listaPlanificariMask = {
  CCCPLANIFICARI: {
    value: 'CCCPLANIFICARI',
    RW: false,
    visible: false,
    label: 'CCCPLANIFICARI',
    useAsMeta: true,
    usefull: true
  },
  NAME: {
    value: 'NAME',
    RW: true,
    visible: false,
    label: 'Denumire',
    type: 'string',
    usefull: true
  },
  RESPPLAN: {
    value: 'RESPPLAN',
    RW: true,
    visible: false,
    label: 'Resp. planificare',
    type: 'number',
    usefull: true
  },
  RESPPLAN_NAME: {
    value: 'RESPPLAN_NAME',
    RW: false,
    visible: true,
    label: 'Resp. planificare',
    type: 'string',
    usefull: true
  },
  RESPEXEC: {
    value: 'RESPEXEC',
    RW: true,
    visible: false,
    label: 'Resp. executie',
    type: 'number',
    usefull: true
  },
  RESPEXEC_NAME: {
    value: 'RESPEXEC_NAME',
    RW: false,
    visible: true,
    label: 'Resp. executie',
    type: 'string',
    usefull: true
  },
  LOCKED: {
    value: 'LOCKED',
    RW: false,
    visible: false,
    label: 'Status',
    type: 'number',
    usefull: true
  }
}

const planificareHeaderMask = {
  startDate: {
    value: 'startDate',
    RW: false,
    visible: true,
    label: 'Incepe la',
    type: 'datetime',
    usefull: true
  },
  endDate: {
    value: 'endDate',
    RW: false,
    visible: true,
    label: 'Se termina la',
    type: 'datetime',
    usefull: true
  },
  responsabilPlanificare: {
    value: 'responsabilPlanificare',
    RW: false,
    visible: true,
    label: 'Responsabil planificare',
    type: 'number',
    usefull: true
  },
  responsabilExecutie: {
    value: 'responsabilExecutie',
    RW: false,
    visible: true,
    label: 'Responsabil executie',
    type: 'number',
    usefull: true
  }
}

export {
  recipeDisplayMask,
  recipeSubsDisplayMask,
  antemasuratoriDisplayMask,
  antemasuratoriSubsDisplayMask,
  planificareDisplayMask,
  planificareSubsDisplayMask,
  listaPlanificariMask,
  planificareHeaderMask
}
