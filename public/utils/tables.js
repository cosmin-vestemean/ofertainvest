document.addEventListener('DOMContentLoaded', function() {
  const tables = {
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
    my_table8: {
      element: document.getElementById('my_table_angajati'),
      visible: true,
    },
    allTables() {
      return [this.my_table5, this.my_table6, this.my_table7, this.my_table8];
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

  // Export the tables object
  window.tables = tables;
});

// Export tables for use in other modules
export { tables };