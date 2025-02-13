import { client } from '../client.js'
import { _cantitate_planificari } from '../utils/def_coloane.js'

export async function getPlanificatedArticles(CCCOFERTEWEB) {
  try {
    // Get all articles that are part of planificari
    const response = await client.service('getDataset').find({
      query: {
        sqlQuery: `
          SELECT 
            a.*,
            pl.CANTITATE as ${_cantitate_planificari},
            pl.CCCPLANIFICARI,
            p.RESPEXEC,
            p.RESPPLAN,
            p.DATASTART,
            p.DATASTOP
          FROM CCCANTEMASURATORI a
          INNER JOIN CCCPLANIFICARILINII pl ON pl.CCCANTEMASURATORI = a.CCCANTEMASURATORI
          INNER JOIN CCCPLANIFICARI p ON p.CCCPLANIFICARI = pl.CCCPLANIFICARI 
          WHERE p.CCCOFERTEWEB = ${CCCOFERTEWEB}
          ORDER BY p.DATASTART, a.CCCANTEMASURATORI
        `
      }
    })

    if (!response.success) {
      console.error('Failed to load planificated articles', response.error)
      return []
    }

    // Group articles by executant
    const articlesByExecutant = response.data.reduce((acc, article) => {
      const execId = article.RESPEXEC
      if (!acc[execId]) {
        acc[execId] = {
          articles: [],
          dateRange: {
            start: article.DATASTART,
            end: article.DATASTOP
          }
        }
      }
      acc[execId].articles.push(article)
      return acc
    }, {})

    return articlesByExecutant

  } catch (error) {
    console.error('Error in getPlanificatedArticles:', error)
    return []
  }
}

export async function assignArticlesToExecutant(articles, executantId, dateRange) {
  // Create planificare entry to link articles to executant
  // Then assign articles using CCCPLANIFICARILINII
}
