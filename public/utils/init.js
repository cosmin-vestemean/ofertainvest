import {
  contextOferta,
  populateSelectIerarhiiFromTrees,
  processExcelData,
  activitati_oferta,
  intrari_orfane,
  WBSMap,
  saveOferta,
  loadDataFromFile,
  detectieRetete,
  showRecipes,
  optimal_ds,
  setOptimalDs,
  showRecipesList,
  theadIsSet,
  setRetetaCurenta,
  getRetetaCurenta,
  showHideHeader,
  addOnChangeEvt,
  delimiter,
  themes,
  recipes_ds,
  ds_instanteRetete,
  trees,
  setRecipesDs,
  setDsInstanteRetete,
  setTrees,
  semafoare,
  client
} from '../client.js'
import { _cantitate_oferta } from '../utils/def_coloane.js'
import { local_storage } from '../utils/local_storage.js'
import { context } from '../controllers/estimari.js'
import { employeesService } from '../utils/employeesService.js'
import {
  populateSelects,
  getOferta,
  saveAntemasuratoriAndTreeToDB,
  getEstimariFromDB,
  saveRecipesAndInstanteAndTrees,
  saveTreesInDB
} from '../utils/S1.js'
import { tables } from '../utils/tables.js'
import {
  ds_antemasuratori,
  calculateAntemasAndNewTree,
  setDsAntemasuratori,
  showAntemasuratori,
  newTree,
  setNewTree,
  createAntemasuratori,
  updateAntemasuratori
} from '../controllers/antemasuratori.js'
import moment from 'https://unpkg.com/moment@2.29.4/dist/moment.js'
import { calculateLeftMenuTopPosition } from './calculateElements.js'

export var selectedTheme = local_storage.selectedTheme.get() || 'default'

var isDrawn = false

/* global bootstrap */

function changeTheme(theme) {
  //remove all stylesheets with names equal to themes array and add the one with the selected theme
  let links = document.getElementsByTagName('link')
  for (let i = 0; i < links.length; i++) {
    let link = links[i]
    if (link.rel === 'stylesheet') {
      themes.forEach((theme) => {
        if (link.href.includes(theme)) {
          link.remove()
        }
      })
    }
  }
  //add the selected theme
  let link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `../css/${theme}.css`
  document.head.appendChild(link)
  //localStorage.setItem('theme', theme)
  local_storage.selectedTheme.set(theme)
  console.log('Theme changed to:', theme)
  //navbarDropdownMenuLinkThemes caption is the selected theme
  let navbarDropdownMenuLinkThemes = document.getElementById('navbarDropdownMenuLinkThemes')
  navbarDropdownMenuLinkThemes.textContent = theme
}

function changeStyleInTheShadow(table, link) {
  table.shadowRoot.childNodes.forEach((child) => {
    //find id="theme_link" and remove it, then add it again
    if (child.id === 'theme_link') {
      child.remove()
    }
  })
  //add themeLink to childNodes
  if (link) {
    //append link to shadowRoot
    table.shadowRoot.appendChild(link)
    //my_table5.requestUpdate()
  }
}

export async function init() {
  //show modal with spinner announcing that the app is initializing
  let modal = new bootstrap.Modal(document.getElementById('ModalGeneric'), {
    keyboard: false,
    backdrop: false
  })
  //remove footer from modal
  let modalFooter = document.getElementById('modal-footer3')
  if (modalFooter) {
    modalFooter.remove();
  }
  let modalBody = document.getElementById('modal-body3')
  modalBody.innerHTML = ''
  //add <div class="d-flex justify-content-center">
  let div = document.createElement('div')
  div.classList.add('text-center')
  let h4 = document.createElement('h4')
  h4.innerHTML = 'Aplicatia se initializeaza...'
  h4.classList.add('p-5')
  div.appendChild(h4)
  let div1 = document.createElement('div')
  div1.classList.add('text-center')
  let spinner = document.createElement('div')
  spinner.classList.add('spinner-border')
  spinner.classList.add('text-warning')
  spinner.style.width = '5rem'
  spinner.style.height = '5rem'
  spinner.setAttribute('role', 'status')
  spinner.innerHTML = '<span class="visually-hidden">Aplicatia se initializeaza...</span>'
  div1.appendChild(spinner)
  div.appendChild(div1)
  modalBody.appendChild(div)
  modal.show()

  // Add project button handler
  let btn_proiect = document.getElementById('btn_proiect')
  btn_proiect.onclick = function() {
    tables.hideAllBut([tables.docHeader])
    tables.docHeader.element.classList.remove('d-none')
  }

  //this function executes when window is loaded
  //add event listener to select id="trdr" and select id="prjc"
  var trdr = document.getElementById('trdr')
  trdr.onchange = function () {
    contextOferta.TRDR = trdr.value
  }
  var prjc = document.getElementById('prjc')
  prjc.onchange = function () {
    contextOferta.PRJC = prjc.value
  }
  //get theme from local storage and set it
  let theme = local_storage.selectedTheme.get()
  if (theme) changeTheme(theme)
  //hide all tables, they are shown when needed
  tables.hideAllBut([])
  let btn_top = document.getElementById('btn_top')
  btn_top.onclick = function () {
    window.scrollTo(0, 0)
  }
  //saldoc: load data from S1 service getDataset, table CCCOFERTEWEB with columns FILENAME
  let saldoc = document.getElementById('saldoc')
  saldoc.onchange = async function () {
    if (saldoc.selectedIndex > -1) {
      contextOferta.FILENAME = saldoc.options[saldoc.selectedIndex].text
      contextOferta.CCCOFERTEWEB = saldoc.value
    } else {
      return
    }
    //add spinner to btn_oferta
    let btn_oferta = document.getElementById('btn_oferta')
    btn_oferta.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Incarc...'
    //update modal
    //get h2 of modal-body3
    let h2 = modalBody.querySelector('h4')
    h2.innerHTML = 'Incarc ultima oferta deschisa...'

    //get oferta from S1 service getOferta
    let raspuns = await getOferta(contextOferta.FILENAME)
    console.log('raspuns', raspuns)
    if (raspuns && raspuns.total > 0) {
      //set contextOferta with raspuns[0]
      const isSuccessful = raspuns.success
      if (isSuccessful) {
        const data = raspuns.data
        if (raspuns.total > 1) {
          console.log('Exista mai multe oferte cu acest nume')
        } else {
          const firstLine = data[0]
          console.log('firstLine', firstLine)
          contextOferta.TRDR = firstLine.TRDR
          contextOferta.PRJC = firstLine.PRJC
          contextOferta.TRNDATE = firstLine.TRNDATE
          const trdr = document.getElementById('trdr')
          const prjc = document.getElementById('prjc')
          const trndate = document.getElementById('trndate')
          trdr.value = firstLine.TRDR
          prjc.value = firstLine.PRJC
          trndate.valueAsDate = moment(firstLine.TRNDATE).toDate()
          setOptimalDs(JSON.parse(firstLine.JSONSTR))
          tables.hideAllBut([tables.my_table1])
          console.log('optimal_ds', optimal_ds)
          tables.my_table1.element.ds = optimal_ds
          btn_oferta.setAttribute('data-saved', 'true')
          //set trees
          await setTrees()
          //process excel data
          processExcelData(optimal_ds)
          //set recipes_ds
          await setRecipesDs()
          //instante retete
          setDsInstanteRetete()
          //set ds_antemasuratori
          //setDsAntemasuratori(JSON.parse(firstLine.JSONANTESTR))
          await setDsAntemasuratori()
          let CCCOFERTEWEB = firstLine.CCCOFERTEWEB
          //add data to ds_estimari, if it
          try {
            const result = await getEstimariFromDB(CCCOFERTEWEB)
            if (result.success) {
              if (result.data && result.data.length > 0) {
                context.setDsEstimari(result.data)
              } else {
                console.log('Nu exista estimari in baza de date')
              }
            } else {
              console.log('error', result.error)
            }
          } catch (error) {
            console.log('error', error)
          }
        }
      } else {
        alert('Nu exista oferta cu acest nume')
      }
    }
    //remove spinner from btn_oferta
    btn_oferta.innerHTML = 'Oferta'
    //hide modal
    modal.hide()
  }
  let btn_oferta = document.getElementById('btn_oferta')
  //btn_oferta.onclick = saveOferta
  //if btn_oferta has attribute data-saved="true" then show my_table1 with optimal_ds else saveOferta
  btn_oferta.onclick = function () {
    if (btn_oferta.getAttribute('data-saved') === 'true') {
      tables.hideAllBut([tables.my_table1])
      tables.my_table1.element.ds = optimal_ds
    } else {
      saveOferta()
    }
  }
  let file_oferta_initiala = document.getElementById('file_oferta_initiala')
  file_oferta_initiala.onchange = loadDataFromFile
  //btn_oferta text = 'left arrow' + 'Incarca oferta initiala'
  const al =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrow-left" viewBox="0 0 16 16">' +
    '<path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8"></path>' +
    '</svg>'
  let btn_save_graph = document.getElementById('btn_save_graph')
  //btn_save_graph populateSelectIerarhiiFromTrees()
  //btn_save_graph.onclick = populateSelectIerarhiiFromTrees
  btn_save_graph.onclick = function () {
    populateSelectIerarhiiFromTrees()
    saveTreesInDB()
  }
  let scan_oferta_initiala = document.getElementById('scan_oferta_initiala')
  scan_oferta_initiala.onclick = function () {
    if (recipes_ds && recipes_ds.length > 0) {
      //ask user if he wants to scan again
      let answer = confirm('Scan again?')
      if (answer) {
        detectieRetete()
        showRecipes()
      } else {
        showRecipes()
      }
    } else {
      detectieRetete()
      showRecipes()
    }
  }
  //btn_save_retete
  let btn_save_retete = document.getElementById('btn_save_retete')
  btn_save_retete.onclick = saveRecipesAndInstanteAndTrees
  //lista_retete_scurta
  let lista_retete_scurta = document.getElementById('lista_retete_scurta')
  lista_retete_scurta.onclick = function () {
    showRecipes()
  }
  let orfani = document.getElementById('orfani')
  orfani.onclick = async function () {
    let orfani = []
    if (intrari_orfane && intrari_orfane.length > 0) {
      intrari_orfane.forEach((o) => {
        let orfan = o.object
        orfani.push(orfan)
      })
    }

    tables.hideAllBut([tables.my_table1])
    tables.my_table1.element.ds = orfani
  }
  //vizualizare_oferta_initiala
  let vizulizare_oferta_initiala = document.getElementById('vizualizare_oferta_initiala')
  vizulizare_oferta_initiala.onclick = function () {
    tables.hideAllBut([tables.my_table1])
    tables.my_table1.element.ds = optimal_ds
  }
  //lista_activitati
  let lista_activitati = document.getElementById('lista_activitati')
  lista_activitati.onclick = function () {
    tables.hideAllBut([tables.my_table1])
    tables.my_table1.element.ds = activitati_oferta
  }
  //WBSMap
  let WBSMapBtn = document.getElementById('WBSMap')
  WBSMapBtn.onclick = function () {
    const levels = WBSMap.length
    console.log('levels', levels)

    var modal = new bootstrap.Modal(document.getElementById('ModalGeneric'))
    var modal_body = document.getElementById('modal-body3')
    modal_body.innerHTML = ''

    //for each level, create a table with 1 row and n columns, each column containing a node
    for (let i = 0; i < levels; i++) {
      var table = document.createElement('table')
      table.classList.add('table')
      table.classList.add('table-sm')
      table.classList.add('table-bordered')
      table.classList.add('table-hover')
      table.classList.add('table-striped')
      table.classList.add('table-responsive')
      var thead = document.createElement('thead')
      table.appendChild(thead)
      var tr = document.createElement('tr')
      thead.appendChild(tr)
      WBSMap[i].forEach(function (node) {
        var th = document.createElement('th')
        th.innerHTML = node
        tr.appendChild(th)
      })
      //show modal id ModalGeneric
      modal_body.appendChild(table)
    }

    modal.show()
  }
  let lista_retete = document.getElementById('lista_retete')
  lista_retete.onclick = function () {
    showRecipesList(recipes_ds)
  }
  document.getElementById('trndate').valueAsDate = new Date()
  //populate selects trdr, prjc, oferta by calling S1 service getDataset
  populateSelects()

  //add on hover to my_table2 rows and get index of row and look in recipes_ds[index] for reteta to display in my_table2
  //do not forget shadowRoot
  tables.my_table2.element.shadowRoot.addEventListener('mouseover', function (e) {
    if (e.target.tagName === 'TD') {
      var index = e.target.parentElement.rowIndex - (theadIsSet ? 1 : 0)
      console.log('index', index)
      console.log('recipes_ds[index]', recipes_ds[index])
      setRetetaCurenta(recipes_ds[index])
      let retetaCurenta = getRetetaCurenta()
      console.log('retetaCurenta', retetaCurenta)
      var reteta = retetaCurenta.reteta
      tables.hideAllBut([tables.my_table2, tables.my_table3])
      tables.my_table3.element.reteta = reteta
    }
  })

  //antemasuratori
  let nav_antemasuratori = document.getElementById('listaAntemasuratori')
  nav_antemasuratori.onclick = function () {
    if (ds_antemasuratori.length === 0) {
      //calculateAntemasAndNewTree()
      createAntemasuratori()
    }
    showAntemasuratori()
    addOnChangeEvt(ds_antemasuratori, delimiter, 'my_table_antemasuratori')
  }

  //btn_antemasuratori
  let btn_antemasuratori = document.getElementById('btn_antemasuratori')
  btn_antemasuratori.onclick = function () {
    if (semafoare.antemasuratoriIsLoaded === false) {
      return
    }
    if (ds_instanteRetete && ds_instanteRetete.length > 0) {
      console.log('Exista instante retete, se afiseaza antemasuratori')
      console.log('ds_instanteRetete', ds_instanteRetete)
      let nav_antemasuratori = document.getElementById('listaAntemasuratori')
      nav_antemasuratori.click()
    } else {
      console.log('Nu exista instante retete, se scaneaza oferta initiala')
      //scan_oferta_initiala
      let scan_oferta_initiala = document.getElementById('scan_oferta_initiala')
      scan_oferta_initiala.click()
      console.log('Calcul antemasuratori')
      nav_antemasuratori.click()
    }
  }

  //btn_save_antemas
  let btn_save_antemas = document.getElementById('btn_save_antemas')
  btn_save_antemas.onclick = () => {
    //save antemasuratori in db
    //saveAntemasuratoriAndTreeToDB()
    //add spinner to btn_save_antemas
    btn_save_antemas.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvare...'
    updateAntemasuratori(ds_antemasuratori)
      .then((result) => {
        console.log('result', result)
        if (result.success) {
          //remove spinner from btn_save_antemas
          btn_save_antemas.innerHTML = '<i class="class="bi bi-save"></i>'
        } else {
          //remove spinner from btn_save_antemas
          btn_save_antemas.innerHTML = 'Eroare'
        }
      })
      .catch((error) => {
        console.log('error', error)
        //remove spinner from btn_save_antemas
        btn_save_antemas.innerHTML = 'Eroare'
      })
  }

  //btn_regenerare_estimari
  let btn_regenerare_estimari = document.getElementById('btn_regenerare_estimari')
  btn_regenerare_estimari.onclick = function () {
    //ask user if he wants to recalculate
    let answer = confirm('Regenerez estimarile?\nVor fi sterse toate estimarile anterioare')
    if (answer) {
      context.setDsEstimari([])
      //TODO: remove from db
      context.createNewEstimariPool(newTree)
      console.log('context.getDsEstimariPool', context.getDsEstimariPool())
      //presupun ca daca regeneram estimarile, o facem cu un motiv, si acela ar fi ca am redimensionat antemasuratorile fie cu ramuri fie cu valori
      let result = saveAntemasuratoriAndTreeToDB()
      console.log('result', result)
    }
    btn_estimari.click()
  }

  //btn_regenerare_antemas
  let btn_regenerare_antemas = document.getElementById('btn_regenerare_antemas')
  btn_regenerare_antemas.onclick = async function () {
    //ask user if he wants to recalculate
    let answer = confirm('Regenerez antemasuratorile?')
    if (answer) {
      //calculateAntemasAndNewTree()
      createAntemasuratori()
    }

    showAntemasuratori()
    addOnChangeEvt(ds_antemasuratori, delimiter, 'my_table_antemasuratori')
  }

  //btn_estimari
  let btn_estimari = document.getElementById('btn_estimari')
  btn_estimari.onclick = function () {
    //hide all tables but 6
    tables.hideAllBut([tables.my_table6, tables.estimari_timeline])
    tables.my_table6.element.ds = context.ds_estimari
    console.log('ds_estimari', context.ds_estimari)

    if (!isDrawn) {
      //draw Gantt chart
      google.charts.load('current', { packages: ['gantt'] })
      google.charts.setOnLoadCallback(drawChart)

      function drawChart() {
        const gantt = tables.estimari_timeline.element
        if (!gantt) {
          console.log('gantt not found')
          return
        }
        const chart = new google.visualization.Gantt(gantt)
        const dataTable = new google.visualization.DataTable()

        dataTable.addColumn('string', 'ID')
        dataTable.addColumn('string', 'Name')
        dataTable.addColumn('string', 'Resource')
        dataTable.addColumn('date', 'Start Date')
        dataTable.addColumn('date', 'End Date')
        dataTable.addColumn('number', 'Duration')
        dataTable.addColumn('number', 'Percent Complete')
        dataTable.addColumn('string', 'Dependencies')

        const rows = context.ds_estimari.map((item) => [
          item.CCCESTIMARI.toString(),
          item.NAME.toString(),
          item.CCCESTIMARI.toString(),
          new Date(item.DATASTART),
          new Date(item.DATASTOP),
          0,
          item.PERCENT_COMPLETE || 0,
          null
        ])

        console.log('rows', rows)
        dataTable.addRows(rows)

        const options = {
          height: 50 + context.ds_estimari.length * 30,
          gantt: {
            trackHeight: 30,
            shadowEnabled: true,
            barCornerRadius: 4,
            labelStyle: {
              //--bs-body-font-family is a Bootstrap variable
              fontName: 'var(--bs-body-font-family)',
              fontSize: 13
            },
            percentEnabled: true,
            criticalPathEnabled: false
          }
        }

        chart.draw(dataTable, options)
        isDrawn = true
      }
    }
  }

  let btn_planificari = document.getElementById('btn_planificari')
  btn_planificari.onclick = async function () {
    //hide all tables but 7
    tables.hideAllBut([tables.my_table7])
  }

  //btn_listaRetete
  let btn_listaRetete = document.getElementById('btn_listaRetete')
  btn_listaRetete.onclick = function () {
    if (semafoare.reteteIsLoaded === false) {
      return
    }
    if (recipes_ds && recipes_ds.length > 0) {
      console.log('listing recipes', recipes_ds)
      let lista_retete = document.getElementById('lista_retete_scurta')
      lista_retete.click()
    } else {
      console.log('scanning initial offer')
      //scan_oferta_initiala
      let scan_oferta_initiala = document.getElementById('scan_oferta_initiala')
      scan_oferta_initiala.click()
    }
  }

  //dropdown menu themes
  let themesUl = document.getElementById('themesUl')
  //loop through themes array and add them to themes ul
  for (let i = 0; i < themes.length; i++) {
    let theme = themes[i]
    let li = document.createElement('li')
    //add <a></a> class to li
    let a = document.createElement('a')
    a.classList.add('dropdown-item')
    a.href = '#'
    a.textContent = theme
    li.appendChild(a)
    themesUl.appendChild(li)
  }
  //add event listener
  themesUl.addEventListener('click', function (e) {
    let theme = e.target.textContent
    console.log('new theme', theme, 'prior theme', selectedTheme)
    if (theme != selectedTheme) {
      selectedTheme = applyTheme(theme)
      themesUl.selectedIndex = themes.indexOf(selectedTheme)
    }
  })

  //zenView
  const zenView = document.getElementById('zenView')
  //hide/show all page-header class elements
  zenView.onclick = function () {
    let pageHeaders = document.getElementsByClassName('zenView')
    for (let i = 0; i < pageHeaders.length; i++) {
      let pageHeader = pageHeaders[i]
      if (pageHeader.style.display === 'none') {
        pageHeader.style.display = 'block'
        let mainContent = document.getElementById('mainContent')
        //col-12 -> col-11
        mainContent.classList.remove('col-12')
        mainContent.classList.add('col-11')
        calculateLeftMenuTopPosition()
      } else {
        pageHeader.style.display = 'none'
        let mainContent = document.getElementById('mainContent')
        //col-11 -> col-12
        mainContent.classList.remove('col-11')
        mainContent.classList.add('col-12')
      }
    }
    showHideHeader()
  }

  function detectMobileUserAgent() {
    let isMobile = false
    let userAgent = navigator.userAgent
    let mobileUserAgents = ['Android', 'webOS', 'iPhone', 'iPad', 'iPod', 'BlackBerry', 'Windows Phone']
    mobileUserAgents.forEach((agent) => {
      if (userAgent.includes(agent)) {
        isMobile = true
        console.log('Mobile device detected', agent)
      }
    })
    return isMobile
  }

  let isMobile = detectMobileUserAgent()
  if (!isMobile) {
    //display zenView if not mobile, on mobile remains hidden by default
    zenView.click()
  }

  //fullScreen
  let fullScreen = document.getElementById('fullScreen')
  //toggle full screen
  fullScreen.onclick = function () {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen()
    }
  }

  //listaMateriale: get all children from instantele retete and display them in my_table1
  let listaMateriale = document.getElementById('listaMateriale')
  listaMateriale.onclick = function () {
    let listaMateriale = []
    if (ds_instanteRetete && ds_instanteRetete.length > 0) {
      ds_instanteRetete.forEach((o) => {
        //get pointer to reteta
        let pointerToReteta = o.duplicateOf
        //find reteta
        let locate = recipes_ds.find((o) => o.id === pointerToReteta)
        //get reteta
        let reteta = locate.reteta
        reteta.forEach((activitate) => {
          if (activitate.children && activitate.children.length > 0) {
            let chidren = activitate.children
            chidren.forEach((child) => {
              let o = child.object
              let material = {
                DENUMIRE_ARTICOL_OFERTA: o.DENUMIRE_ARTICOL_OFERTA,
                CANTITATE_ARTICOL_OFERTA: o[_cantitate_oferta],
                UM_ARTICOL_OFERTA: o.UM_ARTICOL_OFERTA
              }
              //check in listaMateriale if material already exists by denumire and um criteria; if yes, add CANTITATE_ARTICOL_OFERTA, else add material to listaMateriale
              let found = listaMateriale.find(
                (m) =>
                  m.DENUMIRE_ARTICOL_OFERTA === material.DENUMIRE_ARTICOL_OFERTA &&
                  m.UM_ARTICOL_OFERTA === material.UM_ARTICOL_OFERTA
              )
              if (found) {
                found[_cantitate_oferta] += material[_cantitate_oferta]
              } else {
                listaMateriale.push(material)
              }
            })
          }
        })
      })
    }
    //display listaMateriale in my_table1
    tables.hideAllBut([tables.my_table1])
    tables.my_table1.element.ds = listaMateriale
  }

  //load lisa angajati
  try {
    contextOferta.angajati = await employeesService.loadEmployees()
  } catch (error) {
    console.error('Failed to load employees:', error)
    contextOferta.angajati = []
  }
}
function applyTheme(theme) {
  let link = null
  selectedTheme = theme
  changeTheme(theme)
  console.log('Theme changed to:', selectedTheme)
  if (selectedTheme !== 'default') {
    link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `../css/${selectedTheme}.css`
    link.id = 'theme_link'
  }

  tables.allTables().forEach((table) => {
    changeStyleInTheShadow(table.element, link)
  })
  return selectedTheme
}
