import { contextOferta, trees, populateSelectIerarhiiFromTrees, processExcelData, activitati_oferta, intrari_orfane, WBSMap, recipes_ds, ds_instanteRetete, ds_antemasuratori, newTree, my_table2, my_table3, my_table4, my_table5, my_table6, my_table1, saveOferta, loadDataFromFile, detectieRetete, showRecipes, optimal_ds, showRecipesList, theadIsSet, retetaCurenta, showHideHeader, addOnChangeEvt, delimiter, niveluri, _nivel_oferta, _cantitate_oferta, antemasuratoriDisplayMask, _cantitate_antemasuratori, ierarhii, flatFind, selected_ds, themes } from "./client.js";
import { context } from "./estimari.js";
import { populateSelects } from "./S1.js";

//add onload event to window

export function init() {
  //this function executes when window is loaded
  //add event listener to select id="trdr" and select id="prjc"
  var trdr = document.getElementById('trdr');
  trdr.onchange = function () {
    contextOferta.TRDR = trdr.value;
  };
  var prjc = document.getElementById('prjc');
  prjc.onchange = function () {
    contextOferta.PRJC = prjc.value;
  };
  //get theme from local storage and set it
  let theme = localStorage.getItem('theme');
  if (theme) changeTheme(theme);
  //get excel data from local storage and set it
  let excel_object = localStorage.getItem('excel_object');
  if (excel_object) {
    //ask user if he wants to load previous data
    let answer = confirm('Load previous data?');
    if (answer) {
      if (localStorage.getItem('trees')) {
        trees = JSON.parse(localStorage.getItem('trees'));
        if (trees.length) {
          populateSelectIerarhiiFromTrees();
        }
      }
      processExcelData(excel_object);
      //check trees, activitati_oferta, intrari_orfane, WBSMap, recipes_ds, ds_instanteRetete
      if (localStorage.getItem('activitati_oferta')) {
        activitati_oferta = JSON.parse(localStorage.getItem('activitati_oferta'));
      }
      if (localStorage.getItem('intrari_orfane')) {
        intrari_orfane = JSON.parse(localStorage.getItem('intrari_orfane'));
      }
      if (localStorage.getItem('WBSMap')) {
        WBSMap = JSON.parse(localStorage.getItem('WBSMap'));
      }
      if (localStorage.getItem('recipes_ds')) {
        recipes_ds = JSON.parse(localStorage.getItem('recipes_ds'));
      }
      if (localStorage.getItem('ds_instanteRetete')) {
        ds_instanteRetete = JSON.parse(localStorage.getItem('ds_instanteRetete'));
      }
      if (localStorage.getItem('ds_antemasuratori')) {
        ds_antemasuratori = JSON.parse(localStorage.getItem('ds_antemasuratori'));
      }
      //newTree
      if (localStorage.getItem('newTree')) {
        newTree = JSON.parse(localStorage.getItem('newTree'));
      }
      if (localStorage.getItem('ds_estimari')) {
        context.setDsEstimari(JSON.parse(localStorage.getItem('ds_estimari')));
      }
    } else {
      //clear local storage
      localStorage.clear();
    }
  }
  //hide all tables
  //my_table1.style.display = 'none'
  my_table2.style.display = 'none';
  my_table3.style.display = 'none';
  my_table4.style.display = 'none';
  my_table5.style.display = 'none';
  my_table6.style.display = 'none';
  let btn_top = document.getElementById('btn_top');
  btn_top.onclick = function () {
    window.scrollTo(0, 0);
  };
  let btn_column_filter = document.getElementById('btn_column_filter');
  btn_column_filter.onclick = function () {
    let menu = my_table1.shadowRoot.getElementById('table_menu_content');
    if (menu.style.display === 'none') {
      menu.style.display = 'block';
    } else {
      menu.style.display = 'none';
    }
  };
  let btn_oferta = document.getElementById('btn_oferta');
  btn_oferta.onclick = saveOferta;
  let file_oferta_initiala = document.getElementById('file_oferta_initiala');
  file_oferta_initiala.onchange = loadDataFromFile;
  //btn_oferta text = 'left arrow' + 'Incarca oferta initiala'
  const al = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-left" viewBox="0 0 16 16">' +
    '<path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8"></path>' +
    '</svg>';
  btn_oferta.innerHTML = al + 'Incarca oferta initiala';
  btn_oferta.classList.remove('btn-danger');
  btn_oferta.classList.add('btn-success');
  let btn_save_graph = document.getElementById('btn_save_graph');
  //btn_save_graph populateSelectIerarhiiFromTrees()
  btn_save_graph.onclick = populateSelectIerarhiiFromTrees;
  let scan_oferta_initiala = document.getElementById('scan_oferta_initiala');
  scan_oferta_initiala.onclick = function () {
    if (recipes_ds && recipes_ds.length > 0) {
      //ask user if he wants to scan again
      let answer = confirm('Scan again?');
      if (answer) {
        detectieRetete();
        showRecipes();
      } else {
        showRecipes();
      }
    } else {
      detectieRetete();
      showRecipes();
    }
  };
  //lista_retete_scurta
  let lista_retete_scurta = document.getElementById('lista_retete_scurta');
  lista_retete_scurta.onclick = function () {
    let listaRetete = [];
    if (recipes_ds && recipes_ds.length > 0) {
      recipes_ds.forEach((o) => {
        listaRetete.push({ Reteta: o.name });
      });
      my_table2.ds = listaRetete;
    }
  };
  let orfani = document.getElementById('orfani');
  orfani.onclick = async function () {
    let orfani = [];
    if (intrari_orfane && intrari_orfane.length > 0) {
      intrari_orfane.forEach((o) => {
        let orfan = o.object;
        orfani.push(orfan);
      });
    }

    my_table2.style.display = 'none';
    my_table3.style.display = 'none';
    my_table4.style.display = 'none';
    my_table5.style.display = 'none';
    my_table6.style.display = 'none';
    my_table1.style.display = 'block';
    my_table1.ds = orfani;
  };
  //vizualizare_oferta_initiala
  let vizulizare_oferta_initiala = document.getElementById('vizualizare_oferta_initiala');
  vizulizare_oferta_initiala.onclick = function () {
    my_table2.style.display = 'none';
    my_table3.style.display = 'none';
    my_table4.style.display = 'none';
    my_table5.style.display = 'none';
    my_table6.style.display = 'none';
    my_table1.style.display = 'block';
    my_table1.ds = optimal_ds;
  };
  //lista_activitati
  let lista_activitati = document.getElementById('lista_activitati');
  lista_activitati.onclick = function () {
    my_table2.style.display = 'none';
    my_table3.style.display = 'none';
    my_table4.style.display = 'none';
    my_table5.style.display = 'none';
    my_table6.style.display = 'none';
    my_table1.style.display = 'block';
    my_table1.ds = activitati_oferta;
  };
  //WBSMap
  let WBSMapBtn = document.getElementById('WBSMap');
  WBSMapBtn.onclick = function () {
    const levels = WBSMap.length;
    console.log('levels', levels);

    var modal = new bootstrap.Modal(document.getElementById('ModalGeneric'));
    var modal_body = document.getElementById('modal-body3');
    modal_body.innerHTML = '';

    //for each level, create a table with 1 row and n columns, each column containing a node
    for (let i = 0; i < levels; i++) {
      var table = document.createElement('table');
      table.classList.add('table');
      table.classList.add('table-sm');
      table.classList.add('table-bordered');
      table.classList.add('table-hover');
      table.classList.add('table-striped');
      table.classList.add('table-responsive');
      var thead = document.createElement('thead');
      table.appendChild(thead);
      var tr = document.createElement('tr');
      thead.appendChild(tr);
      WBSMap[i].forEach(function (node) {
        var th = document.createElement('th');
        th.innerHTML = node;
        tr.appendChild(th);
      });
      //show modal id ModalGeneric
      modal_body.appendChild(table);
    }

    modal.show();
  };
  let lista_retete = document.getElementById('lista_retete');
  lista_retete.onclick = function () {
    showRecipesList(recipes_ds);
  };
  document.getElementById('trndate').valueAsDate = new Date();
  //populate selects trdr, prjc, oferta by calling S1 service getDataset
  populateSelects();

  //add on hover to my_table2 rows and get index of row and look in recipes_ds[index] for reteta to display in my_table2
  //do not forget shadowRoot
  my_table2.shadowRoot.addEventListener('mouseover', function (e) {
    if (e.target.tagName === 'TD') {
      var index = e.target.parentElement.rowIndex - (theadIsSet ? 1 : 0);
      console.log('index', index);
      console.log('recipes_ds[index]', recipes_ds[index]);
      retetaCurenta = recipes_ds[index];
      console.log('retetaCurenta', retetaCurenta);
      var reteta = retetaCurenta.reteta;
      my_table3.reteta = reteta;
    }
  });

  //btn_showHideHeader
  let btn_showHideHeader = document.getElementById('btn_showHideHeader');
  btn_showHideHeader.onclick = function () {
    showHideHeader();
  };

  //antemasuratori
  let nav_antemasuratori = document.getElementById('listaAntemasuratori');
  nav_antemasuratori.onclick = function () {
    if (ds_antemasuratori.length === 0) {
      calculateAntemasAndNewTree();
    }
    showAntemasuratori();
    addOnChangeEvt(ds_antemasuratori, delimiter, 'my_table_antemasuratori');
  };

  function calculateAntemasAndNewTree() {
    //create ds_antemasuratori from recipes_ds, enum activities only, add CANTITATE_ARTICOL_OFERTA, add CANTITATE_ANTEMASURATORI = 0
    if (ds_instanteRetete.length === 0) {
      detectieRetete();
      showRecipes();
    }
    //console.log('recipes_ds', recipes_ds)
    //console.log('instanteRetete', ds_instanteRetete)
    //console.log('trees', trees)
    console.log('niveluri', niveluri);
    let ds_antemasuratori_old = [...ds_antemasuratori];
    ds_antemasuratori = [];
    newTree = [];
    //find max array length in temps
    let max = 0;
    trees.forEach((tree) => {
      tree.forEach((branch) => {
        if (branch.length > max) {
          max = branch.length;
        }
      });
    });
    //console.log('max', max)
    //activitate = reteta.object
    for (let i = 0; i < ds_instanteRetete.length; i++) {
      var pointerToReteta = ds_instanteRetete[i].duplicateOf;
      var locate = recipes_ds.find((o) => o.id === pointerToReteta);
      if (locate) {
        var reteta = locate.reteta;
      } else {
        console.log('Reteta cu id ', ds_instanteRetete[i].duplicateOf + ' nu a fost gasita');
        continue;
      }
      //console.log('reteta', reteta)
      newTree.push([...reteta]);
      for (var j = 0; j < reteta.length; j++) {
        var activitate = { ...reteta[j] };
        newTree[i][j] = { ...activitate };
        var instanceSpecifics = null;
        if (ds_instanteRetete[i].instanceSpecifics[j] !== undefined) {
          if (Object.keys(ds_instanteRetete[i].instanceSpecifics[j]).includes('object')) {
            instanceSpecifics = ds_instanteRetete[i].instanceSpecifics[j].object;
            //console.log('instanceSpecifics', instanceSpecifics)
          }
        }
        var niveluri_activitate = [];
        for (let m = 0; m < niveluri.length; m++) {
          niveluri_activitate.push(activitate.object[niveluri[m]]);
        }
        //console.log('niveluri_activitate', niveluri_activitate)
        var temps = [];
        for (let k = 0; k < trees.length; k++) {
          var tree = trees[k];
          for (let l = 0; l < tree.length; l++) {
            var branch = tree[l];
            //console.log('branch', branch)
            let checker = (arr, target) => target.every((v) => arr.includes(v));
            if (checker(branch, niveluri_activitate) === true) {
              //console.log('accepted branch', branch)
              temps.push(branch);
            }
          }
        }
        //remove redundant branches
        //de ex, daca gasesct ['Constructii', 'Exterioare']; ['Constructii', 'Exterioare', 'P1']; ['Constructii', 'Exterioare', 'P1', 'P1.1']
        //pastrez doar ['Constructii', 'Exterioare', 'P1', 'P1.1'], restul este redundant
        if (temps.length > 1) {
          let tempsToBeRemoved = [];
          for (let n = 0; n < temps.length; n++) {
            var temp = temps[n];
            var o = {};
            for (let m = 0; m < temp.length; m++) {
              if (niveluri[m] === undefined) {
                //create property
                var new_key = _nivel_oferta + (m + 1).toString();
                o[new_key] = temp[m];
              } else {
                o[niveluri[m]] = temp[m];
              }
            }
            for (let p = n + 1; p < temps.length; p++) {
              var temp2 = temps[p];
              var o2 = {};
              for (let q = 0; q < temp2.length; q++) {
                if (niveluri[q] === undefined) {
                  //create property
                  var new_key = _nivel_oferta + (q + 1).toString();
                  o2[new_key] = temp2[q];
                } else {
                  o2[niveluri[q]] = temp2[q];
                }
              }
              if (Object.keys(o).length < Object.keys(o2).length) {
                var keys = Object.keys(o);
                var values = Object.values(o);
                var keys2 = Object.keys(o2);
                var values2 = Object.values(o2);
                var checker = (arr, target) => target.every((v) => arr.includes(v));
                if (checker(keys2, keys) === true && checker(values2, values) === true) {
                  //console.log('remove', o, 'beacause of', o2)
                  tempsToBeRemoved.push(n);
                  break;
                }
              }
            }
          }
          temps = temps.filter((o, index) => !tempsToBeRemoved.includes(index));
        }
        //console.log('temps', temps)
        let antemas_branches = [];
        for (let n = 0; n < temps.length; n++) {
          /* var activit =  {
            DENUMIRE_ARTICOL_OFERTA: activitate.object.DENUMIRE_ARTICOL_OFERTA,
            CANTITATE_ARTICOL_OFERTA: instanceSpecifics ? instanceSpecifics[_cantitate_oferta] : 0,
            UM_ARTICOL_OFERTA: activitate.object.UM_ARTICOL_OFERTA,
            TIP_ARTICOL_OFERTA: activitate.object.TIP_ARTICOL_OFERTA,
            SUBTIP_ARTICOL_OFERTA: activitate.object.SUBTIP_ARTICOL_OFERTA
          } */
          let activit = { ...activitate.object };
          activit[_cantitate_oferta] = instanceSpecifics ? instanceSpecifics[_cantitate_oferta] : 0;
          //update _cantitate_oferta in newTree
          newTree[i][j].object = { ...activit };
          for (let o = 0; o < temps[n].length; o++) {
            activit[_nivel_oferta + (o + 1).toString()] = temps[n][o];
            //push to niveluri too
            //niveluri.push(_nivel_oferta + (o + 1).toString())
          }
          //add empty string to niveluri for each missing level
          if (temps[n].length < max) {
            for (let p = temps[n].length; p < max; p++) {
              activit[_nivel_oferta + (p + 1).toString()] = '';
              //niveluri.push(_nivel_oferta + (p + 1).toString())
              temps[n].push('');
            }
          }
          //find old value for CANTITATE_ARTICOL_ANTEMASURATORI
          let old = ds_antemasuratori_old.find((o) => {
            let keys = Object.keys(o);
            //keep keys according to antemasuratoriDisplayMask
            keys = Object.keys(activit).filter((key) => antemasuratoriDisplayMask.hasOwnProperty(key));
            delete keys[_cantitate_antemasuratori];
            let values = Object.values(o);
            let keys2 = Object.keys(activit);
            keys2 = Object.keys(activit).filter((key) => antemasuratoriDisplayMask.hasOwnProperty(key));
            delete keys2[_cantitate_antemasuratori];
            //console.log('keys', keys, 'keys2', keys2)
            let values2 = Object.values(activit);
            let checker = (arr, target) => target.every((v) => arr.includes(v));
            return checker(keys, keys2) && checker(values, values2);
          });

          if (old) {
            activit[_cantitate_antemasuratori] = old[_cantitate_antemasuratori];
            //update newTree
            if (branch) branch.qty = old[_cantitate_antemasuratori];
          } else {
            activit[_cantitate_antemasuratori] = 0;
          }

          /* //push up _cantitate_antemasuratori, just below CANTITATE_ARTICOL_OFERTA
          let keys = Object.keys(activit)
          let values = Object.values(activit)
          let index = keys.indexOf(_cantitate_oferta)
          keys.splice(index + 1, 0, _cantitate_antemasuratori)
          values.splice(index + 1, 0, activit[_cantitate_antemasuratori])
          //delete key _cantitate_antemasuratori from the last position
          let last = keys.pop()
          //reconstruct object
 
          let new_activit = {}
          for (let p = 0; p < keys.length; p++) {
            new_activit[keys[p]] = values[p]
          } */
          activit.refInstanta = i;
          activit.refActivitate = j;
          activit.refBranch = temps[n];
          ds_antemasuratori.push(activit);
          //push to antemas_branches max numar niveluri / cantitate_articol_antemasuratori
          let path = [];
          for (let p = 0; p < max; p++) {
            path.push(activit[_nivel_oferta + (p + 1).toString()]);
          }
          antemas_branches.push({
            branch: path,
            qty: activit[_cantitate_antemasuratori],
            refInAnte: ds_antemasuratori.length - 1
          });
        }
        //add to newTree
        newTree[i][j].antemasuratori = antemas_branches;
        if (antemas_branches.length > 0) {
          newTree[i][j].hasAntemas = true;
        } else {
          newTree[i][j].hasAntemas = false;
        }
        delete newTree[i][j].branch;
        //delete level
        delete newTree[i][j].level;
        //delete virtual
        delete newTree[i][j].virtual;
      }
    }

    console.log('newTree', newTree);
    //console.log('ds_antemasuratori', ds_antemasuratori)
    localStorage.setItem('ds_antemasuratori', JSON.stringify(ds_antemasuratori));
    localStorage.setItem('newTree', JSON.stringify(newTree));
  }

  function showAntemasuratori() {
    if (ds_antemasuratori.length > 0) {
      my_table2.style.display = 'none';
      my_table3.style.display = 'none';
      my_table1.style.display = 'none';
      my_table4.style.display = 'block';
      my_table5.style.display = 'none';
      my_table6.style.display = 'none';
      my_table4.ds = [];
      //my_table4.ds = ds_antemasuratori
      let selected_options_arr = ierarhii.getValue();
      if (selected_options_arr && selected_options_arr.length > 0) {
        flatFind(selected_options_arr, ds_antemasuratori, delimiter);
        my_table4.ds = selected_ds;
      } else {
        my_table4.ds = ds_antemasuratori;
      }
    }
  }

  //btn_antemasuratori
  let btn_antemasuratori = document.getElementById('btn_antemasuratori');
  btn_antemasuratori.onclick = function () {
    if (ds_instanteRetete && ds_instanteRetete.length > 0) {
      console.log('Exista instante retete, se afiseaza antemasuratori');
      let nav_antemasuratori = document.getElementById('listaAntemasuratori');
      nav_antemasuratori.click();
    } else {
      console.log('Nu exista instante retete, se scaneaza oferta initiala');
      //scan_oferta_initiala
      let scan_oferta_initiala = document.getElementById('scan_oferta_initiala');
      scan_oferta_initiala.click();
      console.log('Calcul antemasuratori');
      nav_antemasuratori.click();
    }
  };

  //btn_regenerare_estimari
  let btn_regenerare_estimari = document.getElementById('btn_regenerare_estimari');
  btn_regenerare_estimari.onclick = function () {
    //ask user if he wants to recalculate
    let answer = confirm('Regenerez estimarile?');
    if (answer) {
      context.createNewEstimariPool(newTree);
      console.log('context.getDsEstimariPool', context.getDsEstimariPool());
    }
    btn_estimari.click();
  };

  //btn_regenerare_antemas
  let btn_regenerare_antemas = document.getElementById('btn_regenerare_antemas');
  btn_regenerare_antemas.onclick = function () {
    //ask user if he wants to recalculate
    let answer = confirm('Regenerez antemasuratorile?');
    if (answer) {
      calculateAntemasAndNewTree();
    }

    showAntemasuratori();
    addOnChangeEvt(ds_antemasuratori, delimiter, 'my_table_antemasuratori');
  };

  //btn_estimari
  let btn_estimari = document.getElementById('btn_estimari');
  btn_estimari.onclick = function () {
    //hide all tables but 5
    my_table1.style.display = 'none';
    my_table2.style.display = 'none';
    my_table3.style.display = 'none';
    my_table4.style.display = 'none';
    my_table6.style.display = 'block';
    my_table5.style.display = 'none';
    my_table6.ds = context.ds_estimari;
    console.log('ds_estimari', context.ds_estimari);
  };

  //btn_listaRetete
  let btn_listaRetete = document.getElementById('btn_listaRetete');
  btn_listaRetete.onclick = function () {
    if (recipes_ds && recipes_ds.length > 0) {
      console.log('listing recipes');
      let lista_retete = document.getElementById('lista_retete_scurta');
      lista_retete.click();
    } else {
      console.log('scanning initial offer');
      //scan_oferta_initiala
      let scan_oferta_initiala = document.getElementById('scan_oferta_initiala');
      scan_oferta_initiala.click();
    }
  };

  //dropdown menu themes
  let themesUl = document.getElementById('themesUl');
  //loop through themes array and add them to themes ul
  for (let i = 0; i < themes.length; i++) {
    let theme = themes[i];
    let li = document.createElement('li');
    //add <a></a> class to li
    let a = document.createElement('a');
    a.classList.add('dropdown-item');
    a.href = '#';
    a.textContent = theme;
    li.appendChild(a);
    themesUl.appendChild(li);
  }
  //add event listener
  themesUl.addEventListener('click', function (e) {
    let theme = e.target.textContent;
    let link = null;
    console.log('new theme', theme, 'prior theme', selectedTheme);
    if (theme != selectedTheme) {
      selectedTheme = theme;
      changeTheme(theme);
      console.log('Theme changed to:', selectedTheme);
      if (selectedTheme !== 'default') {
        //themeLink = `<link id="theme_link" rel="stylesheet" href="${selectedTheme}.css">`
        //create themeLink as a node
        link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = selectedTheme + '.css';
        link.id = 'theme_link';
      }

      changeStyleInTheShadow(my_table1, link);
      changeStyleInTheShadow(my_table2, link);
      changeStyleInTheShadow(my_table3, link);
      changeStyleInTheShadow(my_table4, link);
      changeStyleInTheShadow(my_table5, link);
      changeStyleInTheShadow(my_table6, link);
    }
  });

  function changeStyleInTheShadow(table, link) {
    table.shadowRoot.childNodes.forEach((child) => {
      //find id="theme_link" and remove it, then add it again
      if (child.id === 'theme_link') {
        child.remove();
      }
    });
    //add themeLink to childNodes
    if (link) {
      //append link to shadowRoot
      table.shadowRoot.appendChild(link);
      //my_table5.requestUpdate()
    }
  }

  //set selected theme
  let selectedTheme = localStorage.getItem('theme') || 'default';
  themesUl.selectedIndex = themes.indexOf(selectedTheme);

  function changeTheme(theme) {
    //remove all stylesheets with names equal to themes array and add the one with the selected theme
    let links = document.getElementsByTagName('link');
    for (let i = 0; i < links.length; i++) {
      let link = links[i];
      if (link.rel === 'stylesheet') {
        themes.forEach((theme) => {
          if (link.href.includes(theme)) {
            link.remove();
          }
        });
      }
    }
    //add the selected theme
    let link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = theme + '.css';
    document.head.appendChild(link);
    localStorage.setItem('theme', theme);
    console.log('Theme changed to:', theme);
    //navbarDropdownMenuLinkThemes caption is the selected theme
    let navbarDropdownMenuLinkThemes = document.getElementById('navbarDropdownMenuLinkThemes');
    navbarDropdownMenuLinkThemes.textContent = theme;
  }

  //zenView
  let zenView = document.getElementById('zenView');
  //hide/show all page-header class elements
  zenView.onclick = function () {
    let pageHeaders = document.getElementsByClassName('page-header');
    for (let i = 0; i < pageHeaders.length; i++) {
      let pageHeader = pageHeaders[i];
      if (pageHeader.style.display === 'none') {
        pageHeader.style.display = 'block';
      } else {
        pageHeader.style.display = 'none';
      }
    }
    showHideHeader();
  };

  //fullScreen
  let fullScreen = document.getElementById('fullScreen');
  //toggle full screen
  fullScreen.onclick = function () {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen();
    }
  };

  //listaMateriale: get all children from instantele retete and display them in my_table1
  let listaMateriale = document.getElementById('listaMateriale');
  listaMateriale.onclick = function () {
    let listaMateriale = [];
    if (ds_instanteRetete && ds_instanteRetete.length > 0) {
      ds_instanteRetete.forEach((o) => {
        //get pointer to reteta
        let pointerToReteta = o.duplicateOf;
        //find reteta
        let locate = recipes_ds.find((o) => o.id === pointerToReteta);
        //get reteta
        let reteta = locate.reteta;
        reteta.forEach((activitate) => {
          if (activitate.children && activitate.children.length > 0) {
            let chidren = activitate.children;
            chidren.forEach((child) => {
              let o = child.object;
              let material = {
                DENUMIRE_ARTICOL_OFERTA: o.DENUMIRE_ARTICOL_OFERTA,
                CANTITATE_ARTICOL_OFERTA: o[_cantitate_oferta],
                UM_ARTICOL_OFERTA: o.UM_ARTICOL_OFERTA
              };
              //check in listaMateriale if material already exists by denumire and um criteria; if yes, add CANTITATE_ARTICOL_OFERTA, else add material to listaMateriale
              let found = listaMateriale.find(
                (m) => m.DENUMIRE_ARTICOL_OFERTA === material.DENUMIRE_ARTICOL_OFERTA &&
                  m.UM_ARTICOL_OFERTA === material.UM_ARTICOL_OFERTA
              );
              if (found) {
                found[_cantitate_oferta] += material[_cantitate_oferta];
              } else {
                listaMateriale.push(material);
              }
            });
          }
        });
      });
    }
    //display listaMateriale in my_table1
    my_table2.style.display = 'none';
    my_table3.style.display = 'none';
    my_table4.style.display = 'none';
    my_table5.style.display = 'none';
    my_table6.style.display = 'none';
    my_table1.style.display = 'block';
    my_table1.ds = listaMateriale;
  };
}
