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
    type: 'string'
  },
  WBS: {
    value: 'WBS',
    usefull: true,
    visible: false,
    RW: false,
    label: 'WBS',
    DBName: '',
    linkOferta: '',
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
    type: 'string'
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
    type: 'number'
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
    type: 'number'
  },
  SUMA_TOTAL_ORE_MANOPERA_ARTICOL_OFERTA: {
    value: 'SUMA_TOTAL_ORE_MANOPERA_ARTICOL_OFERTA',
    usefull: true,
    visible: true,
    RW: true,
    label: 'Ore total',
    linkOferta: 'PONDERE_NORMA_ACTIVITATE_ARTICOL_RETETA',
    width: '5%',
    DBName: 'SUMOREMAN',
    type: 'number'
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
    type: 'string'
  },
  WBS: {
    value: 'WBS',
    usefull: true,
    visible: false,
    RW: false,
    label: 'WBS',
    DBName: '',
    linkOferta: '',
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
    type: 'string'
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
    type: 'number'
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
    type: 'number'
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
    type: 'number'
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
    type: 'number'
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
    type: 'number'
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
    type: 'number'
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
    type: 'number'
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
    UI: { true: '<i class="bi bi-check2"></i>', false: '' }
  }
}

export { recipeDisplayMask, recipeSubsDisplayMask }
