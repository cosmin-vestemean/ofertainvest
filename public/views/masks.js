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
    type: 'string',
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
  },
  SUMA_CANTITATE_ARTICOL_ANTEMASURATORI_RETETA: {
    value: 'SUMA_CANTITATE_ARTICOL_ANTEMASURATORI_RETETA',
    usefull: true,
    visible: true,
    RW: true,
    label: 'Cantitate totala',
    linkOferta: 'CANT_UNITARA_ART_OF',
    width: '5%',
    DBName: 'SUMCANTANTE',
    type: 'number',
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
    type: 'number',
  },
  ISARTOF: {
    value: 'ISARTOF',
    usefull: true,
    visible: true,
    RW: false,
    label: 'Articol oferta',
    linkOferta: '',
    width: '5%',
    DBName: 'ISARTOF',
    type: 'boolean',
    UI: { true: '<i class="bi bi-check2"></i>', false: '' },
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
    master: 'DENUMIRE_ARTICOL_OFERTA'
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
    master: 'UM_ARTICOL_OFERTA'
  },
  CANTITATE_SUBARTICOL_RETETA: {
    value: 'CANTITATE_SUBARTICOL_RETETA',
    usefull: true,
    visible: true,
    RW: true,
    label: 'Cantitate totala',
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
    label: 'Cantitate unitara',
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
    label: 'Realizare cantitativa',
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
    label: 'Realizare unitara',
    linkOferta: '',
    width: '5%',
    DBName: '',
    type: 'number',
    master: 'SUMA_CANTITATE_ARTICOL_ANTEMASURATORI_RETETA'
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
    master: 'MEDIE_NORMA_UNITARA_ORE_MANOPERA_ARTICOL_OFERTA'
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
    visible: true,
    RW: false,
    label: 'Articol oferta',
    linkOferta: '',
    width: '5%',
    DBName: 'ISARTOF',
    type: 'boolean',
    UI: { true: '<i class="bi bi-check2"></i>', false: '' },
    master: 'ISARTOF'
  }
}

const antemasuratoriDisplayMask = {
  ISDUPLICATE: {
    value: 'ISDUPLICATE',
    RW: false,
    visible: false,
    label: 'Duplicat',
    filter: 'search',
    isEnumerable: false,
    usefull: true,
    UI: { true: '<i class="bi bi-check2"></i>', false: '' }
  },
  DUPLICATEOF: { value: 'DUPLICATEOF', RW: false, visible: false, label: 'Reteta', filter: 'search', usefull: true },
  old_WBS: { value: 'old_WBS', RW: false, visible: false, label: 'WBS vechi', filter: 'search', usefull: true },
  WBS: { value: 'WBS', RW: false, visible: false, label: 'WBS', filter: 'search', usefull: true },
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
    filter: 'search',
    usefull: true
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
    filter: 'filter',
    usefull: true
  },
  NIVEL_OFERTA_2: {
    value: 'NIVEL_OFERTA_2',
    RW: false,
    visible: true,
    label: 'Nivel 2',
    isEnumerable: true,
    filter: 'filter',
    usefull: true
  },
  NIVEL_OFERTA_3: {
    value: 'NIVEL_OFERTA_3',
    RW: false,
    visible: true,
    label: 'Nivel 3',
    isEnumerable: true,
    filter: 'filter',
    usefull: true
  },
  NIVEL_OFERTA_4: {
    value: 'NIVEL_OFERTA_4',
    RW: false,
    visible: true,
    label: 'Nivel 4',
    isEnumerable: true,
    filter: 'filter',
    usefull: true
  },
  NIVEL_OFERTA_5: {
    value: 'NIVEL_OFERTA_5',
    RW: false,
    visible: true,
    label: 'Nivel 5',
    isEnumerable: true,
    filter: 'filter',
    usefull: true
  },
  NIVEL_OFERTA_6: {
    value: 'NIVEL_OFERTA_6',
    RW: false,
    visible: true,
    label: 'Nivel 6',
    isEnumerable: true,
    filter: 'filter',
    usefull: true
  },
  NIVEL_OFERTA_7: {
    value: 'NIVEL_OFERTA_7',
    RW: false,
    visible: true,
    label: 'Nivel 7',
    isEnumerable: true,
    filter: 'filter',
    usefull: true
  },
  NIVEL_OFERTA_8: {
    value: 'NIVEL_OFERTA_8',
    RW: false,
    visible: true,
    label: 'Nivel 8',
    isEnumerable: true,
    filter: 'filter',
    usefull: true
  },
  NIVEL_OFERTA_9: {
    value: 'NIVEL_OFERTA_9',
    RW: false,
    visible: true,
    label: 'Nivel 9',
    isEnumerable: true,
    filter: 'filter',
    usefull: true
  },
  NIVEL_OFERTA_10: {
    value: 'NIVEL_OFERTA_10',
    RW: false,
    visible: true,
    label: 'Nivel 10',
    isEnumerable: true,
    filter: 'filter',
    usefull: true
  },
  CANTITATE_ARTICOL_OFERTA: {
    value: 'CANTITATE_ARTICOL_OFERTA',
    RW: false,
    visible: true,
    label: 'Cantitate<br>oferta',
    isEnumerable: false,
    filter: 'search',
    usefull: true
  },
  UM_ARTICOL_OFERTA: {
    value: 'UM_ARTICOL_OFERTA',
    RW: false,
    visible: true,
    label: 'UM',
    isEnumerable: false,
    filter: 'filter',
    usefull: true
  },
  CANTITATE_ARTICOL_ANTEMASURATORI: {
    value: 'CANITATE_ARTICOL_ANTEMASURATORI',
    RW: true,
    visible: true,
    label: 'Cantitate<br>antemasuratori',
    isEnumerable: false,
    filter: 'search',
    usefull: true
  }
}

export { recipeDisplayMask, recipeSubsDisplayMask, antemasuratoriDisplayMask }
