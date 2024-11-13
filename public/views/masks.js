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
    old_WBS: { value: 'old_WBS', RW: false, visible: false, label: 'WBS vechi' },
    WBS: { value: 'WBS', RW: false, visible: false, label: 'WBS' },
    DENUMIRE_ARTICOL_OFERTA: {
      value: 'DENUMIRE_ARTICOL_OFERTA',
      RW: true,
      visible: true,
      label: 'Denumire',
      linkOferta: 'DENUMIRE_ART_OF'
    },
    CANTITATE_ARTICOL_OFERTA: {
      value: 'CANTITATE_ARTICOL_OFERTA',
      RW: true,
      visible: false,
      label: 'Cantitate',
      linkOferta: 'CANT_ART_OF'
    },
    UM_ARTICOL_OFERTA: {
      value: 'UM_ARTICOL_OFERTA',
      RW: true,
      visible: true,
      label: 'UM',
      linkOferta: 'UM_ART_OF'
    },
    TIP_ARTICOL_OFERTA: {
      value: TIP_ARTICOL_OFERTA,
      RW: true,
      visible: true,
      label: 'Tip articol',
      linkOferta: 'TIP_ART_OF'
    },
    SUBTIP_ARTICOL_OFERTA: {
      value: SUBTIP_ARTICOL_OFERTA,
      RW: true,
      visible: true,
      label: 'Subtip articol',
      linkOferta: 'SUBTIP_ART_OF'
    },
    CANTITATE_UNITARA_ARTICOL_RETETA: {
      value: 'CANTITATE_UNITARA_ARTICOL_RETETA',
      RW: true,
      visible: true,
      label: 'Cantitate unitara',
      linkOferta: 'CANT_UNITARA_ART_OF'
    },
    PONDERE_DECONT_ACTIVITATE_ARTICOL_RETETA: {
      value: 'PONDERE_DECONT_ACTIVITATE_ARTICOL_RETETA',
      RW: true,
      visible: true,
      label: 'Pondere decont',
      linkOferta: 'PONDERE_DECONT_ACTIVITATE_ARTICOL_RETETA'
    },
    PONDERE_NORMA_ACTIVITATE_ARTICOL_RETETA: {
      value: 'PONDERE_NORMA_ACTIVITATE_ARTICOL_RETETA',
      RW: true,
      visible: true,
      label: 'Pondere norma',
      linkOferta: 'PONDERE_NORMA_ACTIVITATE_ARTICOL_RETETA'
    }
  }

export { recipeDisplayMask }