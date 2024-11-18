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
  old_WBS: { value: 'old_WBS', RW: false, visible: false, label: 'WBS vechi', DBName: '' },
  WBS: { value: 'WBS', RW: false, visible: false, label: 'WBS' },
  DENUMIRE_ARTICOL_OFERTA: {
    value: 'DENUMIRE_ARTICOL_OFERTA',
    RW: false,
    visible: true,
    label: 'Denumire',
    linkOferta: 'DENUMIRE_ART_OF',
    width: '50%',
    DBName: ''
  },
  CANTITATE_ARTICOL_OFERTA: {
    value: 'CANTITATE_ARTICOL_OFERTA',
    RW: false,
    visible: false,
    label: 'Cantitate',
    linkOferta: 'CANT_ART_OF',
    DBName: ''
  },
  UM_ARTICOL_OFERTA: {
    value: 'UM_ARTICOL_OFERTA',
    RW: false,
    visible: true,
    label: 'UM',
    linkOferta: 'UM_ART_OF',
    width: '5%',
    DBName: ''
  },
  TIP_ARTICOL_OFERTA: {
    value: TIP_ARTICOL_OFERTA,
    RW: false,
    visible: true,
    label: 'Tip articol',
    linkOferta: 'TIP_ART_OF',
    width: '5%',
    DBName: ''
  },
  SUBTIP_ARTICOL_OFERTA: {
    value: SUBTIP_ARTICOL_OFERTA,
    RW: false,
    visible: true,
    label: 'Subtip articol',
    linkOferta: 'SUBTIP_ART_OF',
    width: '5%',
    DBName: ''
  },
  SUMA_CANTITATE_ARTICOL_ANTEMASURATORI_RETETA: {
    value: 'SUMA_CANTITATE_ARTICOL_ANTEMASURATORI_RETETA',
    RW: true,
    visible: true,
    label: 'Cantitate totala',
    linkOferta: 'CANT_UNITARA_ART_OF',
    width: '5%',
    DBName: 'SUMCANTANTE'
  },
  MEDIE_NORMA_UNITARA_ORE_MANOPERA_ARTICOL_OFERTA: {
    value: 'MEDIE_NORMA_UNITARA_ORE_MANOPERA_ARTICOL_OFERTA',
    RW: true,
    visible: true,
    label: 'Norma unitara',
    linkOferta: 'PONDERE_DECONT_ACTIVITATE_ARTICOL_RETETA',
    width: '5%',
    DBName: 'AVGNORMUNITOREMAN'
  },
  SUMA_TOTAL_ORE_MANOPERA_ARTICOL_OFERTA: {
    value: 'SUMA_TOTAL_ORE_MANOPERA_ARTICOL_OFERTA',
    RW: true,
    visible: true,
    label: 'Ore total',
    linkOferta: 'PONDERE_NORMA_ACTIVITATE_ARTICOL_RETETA',
    width: '5%',
    DBName: 'SUMOREMAN'
  }
}

const recipeSubsDisplayMask = {
  old_WBS: { value: 'old_WBS', RW: false, visible: false, label: 'WBS vechi' },
  WBS: { value: 'WBS', RW: false, visible: false, label: 'WBS' },
  DENUMIRE_ARTICOL_OFERTA: {
    value: 'DENUMIRE_ARTICOL_OFERTA',
    RW: false,
    visible: true,
    label: 'Denumire',
    linkOferta: 'DENUMIRE_ART_OF',
    width: '50%'
  },
  CANTITATE_ARTICOL_OFERTA: {
    value: 'CANTITATE_ARTICOL_OFERTA',
    RW: false,
    visible: false,
    label: 'Cantitate',
    linkOferta: 'CANT_ART_OF'
  },
  UM_ARTICOL_OFERTA: {
    value: 'UM_ARTICOL_OFERTA',
    RW: false,
    visible: true,
    label: 'UM',
    linkOferta: 'UM_ART_OF',
    width: '5%'
  },
  TIP_ARTICOL_OFERTA: {
    value: TIP_ARTICOL_OFERTA,
    RW: false,
    visible: true,
    label: 'Tip articol',
    linkOferta: 'TIP_ART_OF',
    width: '5%'
  },
  SUBTIP_ARTICOL_OFERTA: {
    value: SUBTIP_ARTICOL_OFERTA,
    RW: false,
    visible: true,
    label: 'Subtip articol',
    linkOferta: 'SUBTIP_ART_OF',
    width: '5%'
  },
  CANTITATE_SUBARTICOL_RETETA: {
    value: 'CANTITATE_SUBARTICOL_RETETA',
    RW: true,
    visible: true,
    label: 'Cantitate totala',
    linkOferta: 'CANT_UNITARA_ART_OF',
    width: '5%',
    DBName: 'CANTTOTAL'
  },
  CANTITATE_UNITARA_SUBARTICOL_RETETA: {
    value: 'CANTITATE_UNITARA_SUBARTICOL_RETETA',
    RW: true,
    visible: true,
    label: 'Cantitate unitara',
    linkOferta: 'PONDERE_DECONT_ACTIVITATE_ARTICOL_RETETA',
    width: '5%',
    DBName: 'CANTUNIT'
  },
  CANTITATE_REALIZARE_ARTICOL_RETETA: {
    value: 'CANTITATE_REALIZARE_ARTICOL_RETETA ',
    RW: true,
    visible: true,
    label: 'Realizare cantitativa',
    linkOferta: 'PONDERE_NORMA_ACTIVITATE_ARTICOL_RETETA',
    width: '5%',
    DBName: 'CANTREAL'
  },
  CANTITATE_UNITARA_REALIZARE_ARTICOL_RETETA: {
    value: 'CANTITATE_UNITARA_REALIZARE_ARTICOL_RETETA',
    RW: true,
    visible: true,
    label: 'Norma unitara',
    linkOferta: '',
    width: '5%',
    DBName: 'CANTREALUNIT'
  },
  NORMA_UNITARA_ORE_MANOPERA_SUBARTICOL_RETETA: {
    value: 'NORMA_UNITARA_ORE_MANOPERA_SUBARTICOL_RETETA',
    RW: true,
    visible: true,
    label: 'Norma unitara',
    linkOferta: '',
    width: '5%',
    DBName: 'NORMUNITMAN'
  },
  TOTAL_ORE_MANOPERA_SUBARTICOL_RETETA: {
    value: 'TOTAL_ORE_MANOPERA_SUBARTICOL_RETETA',
    RW: true,
    visible: true,
    label: 'Total ore',
    linkOferta: '',
    width: '5%',
    DBName: 'TOTALOREMAN'
  },
  PONDERE_NORMA_ORE_MANOPERA_SUBARTICOL_RETETA: {
    value: 'PONDERE_NORMA_ORE_MANOPERA_SUBARTICOL_RETETA',
    RW: true,
    visible: true,
    label: 'Pondere ore',
    linkOferta: '',
    width: '5%',
    DBName: 'PONNORMMAN'
  }
}

export { recipeDisplayMask, recipeSubsDisplayMask }
