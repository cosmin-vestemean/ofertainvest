export const tables = {
  my_table1: {
    element: document.getElementById('my_table_oferta_initiala'),
    visible: true
  },
  my_table2: {
    element: document.getElementById('my_table_recipes'),
    visible: true,
  },
  my_table3: {
    element: document.getElementById('my_table_detalii_reteta'),
    visible: true,
  },
  my_table4: {
    element: document.getElementById('my_table_antemasuratori'),
    visible: true,
  },
  my_table5: {
    element: document.getElementById('my_table_estimari'),
    visible: true,
  },
  my_table6: {
    element: document.getElementById('my_table_lista_estimari'),
    visible: true,
  },
  my_table7: {
    element: document.getElementById('my_table_lista_planificari'),
    visible: true,
  },
  estimari_timeline: {
    element: document.getElementById('estimari_timeline'),
    visible: true,
  },
  allTables() {
      return [this.my_table1, this.my_table2, this.my_table3, this.my_table4, this.my_table5, this.my_table6, this.my_table7, this.estimari_timeline];
  },
  hideAllBut(tablesExcept) {
      this.allTables().forEach(function(table) {
          if (!tablesExcept.includes(table)) {
              table.visible = false;
              table.element.style.display = 'none';
          } else {
              table.visible = true;
              table.element.style.display = 'block';
          }
      });
  }
};
