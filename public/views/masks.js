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
    master: 1
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
    master: 2

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
    master: 3
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
    master: 4
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
    master: 5
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
    master: 6
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
    master: 7
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
    master: 8
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
    master: 9
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
    master: 10
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
    master: 1
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
    master: 2
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
    master: 3
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
    master: 4
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
    master: 5
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
    master: 6
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
    master: 7
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
    master: 8
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
    master: 8
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
    master: 8
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
    master: 8
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
    master: 9
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
    master: 9
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
    master: 10
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
