
export var local_storage = {
  excel_object: {
    get: function () {
      return localStorage.getItem('excel_object');
    },
    set: function (value) {
      localStorage.setItem('excel_object', value);
    },
    clear: function () {
      localStorage.removeItem('excel_object');
    }
  },
  optimal_ds: {
    get: function () {
      return localStorage.getItem('optimal_ds');
    },
    set: function (value) {
      localStorage.setItem('optimal_ds', value);
    },
    clear: function () {
      localStorage.removeItem('optimal_ds');
    }
  },
  selected_ds: {
    get: function () {
      return localStorage.getItem('selected_ds');
    },
    set: function (value) {
      localStorage.setItem('selected_ds', value);
    },
    clear: function () {
      localStorage.removeItem('selected_ds');
    }
  },
  ds_instanteRetete: {
    get: function () {
      return localStorage.getItem('ds_instanteRetete');
    },
    set: function (value) {
      localStorage.setItem('ds_instanteRetete', value);
    },
    clear: function () {
      localStorage.removeItem('ds_instanteRetete');
    }
  },
  ds_antemasuratori: {
    get: function () {
      return localStorage.getItem('ds_antemasuratori');
    },
    set: function (value) {
      localStorage.setItem('ds_antemasuratori', value);
    },
    clear: function () {
      localStorage.removeItem('ds_antemasuratori');
    }
  },
  newTree: {
    get: function () {
      return localStorage.getItem('newTree');
    },
    set: function (value) {
      localStorage.setItem('newTree', value);
    },
    clear: function () {
      localStorage.removeItem('newTree');
    }
  },
  recipes_ds: {
    get: function () {
      return localStorage.getItem('recipes_ds');
    },
    set: function (value) {
      localStorage.setItem('recipes_ds', value);
    },
    clear: function () {
      localStorage.removeItem('recipes_ds');
    }
  },
  activitati_oferta: {
    get: function () {
      return localStorage.getItem('activitati_oferta');
    },
    set: function (value) {
      localStorage.setItem('activitati_oferta', value);
    },
    clear: function () {
      localStorage.removeItem('activitati_oferta');
    }
  },
  intrari_orfane: {
    get: function () {
      return localStorage.getItem('intrari_orfane');
    },
    set: function (value) {
      localStorage.setItem('intrari_orfane', value);
    },
    clear: function () {
      localStorage.removeItem('intrari_orfane');
    }
  },
  WBSMap: {
    get: function () {
      return localStorage.getItem('WBSMap');
    },
    set: function (value) {
      localStorage.setItem('WBSMap', value);
    },
    clear: function () {
      localStorage.removeItem('WBSMap');
    }
  },
  theadIsSet: {
    get: function () {
      return localStorage.getItem('theadIsSet');
    },
    set: function (value) {
      localStorage.setItem('theadIsSet', value);
    },
    clear: function () {
      localStorage.removeItem('theadIsSet');
    }
  },
  retetaCurenta: {
    get: function () {
      return localStorage.getItem('retetaCurenta');
    },
    set: function (value) {
      localStorage.setItem('retetaCurenta', value);
    },
    clear: function () {
      localStorage.removeItem('retetaCurenta');
    }
  },
  activitateCurenta: {
    get: function () {
      return localStorage.getItem('activitateCurenta');
    },
    set: function (value) {
      localStorage.setItem('activitateCurenta', value);
    },
    clear: function () {
      localStorage.removeItem('activitateCurenta');
    }
  },
  niveluri: {
    get: function () {
      return localStorage.getItem('niveluri');
    },
    set: function (value) {
      localStorage.setItem('niveluri', value);
    },
    clear: function () {
      localStorage.removeItem('niveluri');
    }
  },
  selectedTheme: {
    get: function () {
      return localStorage.getItem('theme');
    },
    set: function (value) {
      localStorage.setItem('theme', value);
    },
    clear: function () {
      localStorage.removeItem('theme');
    }
  },
  visible_columns: {
    get: function () {
      return localStorage.getItem('visible_columns');
    },
    set: function (value) {
      localStorage.setItem('visible_columns', value);
    },
    clear: function () {
      localStorage.removeItem('visible_columns');
    }
  },
  trees: {
    get: function () {
      return localStorage.getItem('trees');
    },
    set: function (value) {
      localStorage.setItem('trees', value);
    },
    clear: function () {
      localStorage.removeItem('trees');
    }
  },
  ds_estimari: {
    get: function () {
      return localStorage.getItem('ds_estimari');
    },
    set: function (value) {
      localStorage.setItem('ds_estimari', value);
    },
    clear: function () {
      localStorage.removeItem('ds_estimari');
    }
  },
  ds_estimari_pool: {
    get: function () {
      return localStorage.getItem('ds_estimari_pool');
    },
    set: function (value) {
      localStorage.setItem('ds_estimari_pool', value);
    },
    clear: function () {
      localStorage.removeItem('ds_estimari_pool');
    }
  },
  ds_estimari_flat: {
    get: function () {
      return localStorage.getItem('ds_estimari_flat');
    },
    set: function (value) {
      localStorage.setItem('ds_estimari_flat', value);
    },
    clear: function () {
      localStorage.removeItem('ds_estimari_flat');
    }
  }
};
