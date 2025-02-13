import { LitElement, html, contextOferta } from '../client.js'
import { getPlanificatedArticles } from '../controllers/planificariArticole.js'
import { employeesService } from '../utils/employeesService.js'
import { _cantitate_planificari } from '../utils/def_coloane.js'

class LitwcListaPlanificari extends LitElement {
  static properties = {
    angajati: { type: Array },
    isLoading: { type: Boolean },
    articlesByExecutant: { type: Object }
  }

  constructor() {
    super()
    this.angajati = []
    this.isLoading = true
    this.articlesByExecutant = {}
  }

  async firstUpdated() {
    try {
      // Load employees
      if (contextOferta?.angajati?.length > 0) {
        this.angajati = contextOferta.angajati
      } else {
        const employees = await employeesService.loadEmployees()
        if (employees?.length > 0) {
          this.angajati = employees
          contextOferta.angajati = employees
        }
      }

      // Load articles
      await this.loadArticles()
      
    } catch (error) {
      console.error('Error in initialization:', error)
    } finally {
      this.isLoading = false
    }
  }

  async loadArticles() {
    if (!contextOferta?.CCCOFERTEWEB) {
      console.warn('No valid CCCOFERTEWEB found')
      return
    }

    this.articlesByExecutant = await getPlanificatedArticles(contextOferta.CCCOFERTEWEB)
    this.requestUpdate()
  }

  renderExecutantArticles(execId, data) {
    const executant = this.angajati.find(a => a.PRSN === execId)
    
    return html`
      <div class="executant-group card mb-3">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h6 class="mb-0">${executant?.NAME2 || 'Unknown'}</h6>
          <div class="date-range text-muted">
            <small>${new Date(data.dateRange.start).toLocaleDateString()} - 
                   ${new Date(data.dateRange.end).toLocaleDateString()}</small>
          </div>
        </div>
        <div class="card-body">
          <div class="article-list">
            ${data.articles.map(article => this.renderArticle(article))}
          </div>
        </div>
      </div>
    `
  }

  renderArticle(article) {
    return html`
      <div class="article-item" 
           draggable="true"
           @dragstart="${(e) => this.handleDragStart(e, article)}">
        <div class="article-name">${article.DENUMIRE || 'Untitled'}</div>
        <div class="article-quantity">
          <span class="badge bg-primary">${article[_cantitate_planificari]}</span>
          <span class="badge bg-secondary">${article.UM || ''}</span>
        </div>
      </div>
    `
  }

  render() {
    if (this.isLoading) {
      return html`<div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>`
    }

    return html`
      <div class="toolbar mb-2">
        <button type="button" class="btn btn-secondary btn-sm" @click="${this.loadArticles}">
          <i class="bi bi-arrow-clockwise"></i> Refresh
        </button>
      </div>

      <div class="planificari-container">
        ${Object.entries(this.articlesByExecutant).map(([execId, data]) => 
          this.renderExecutantArticles(execId, data)
        )}
      </div>
    `
  }
}

customElements.define('litwc-lista-planificari', LitwcListaPlanificari)
