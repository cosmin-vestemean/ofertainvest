import { runSQLTransaction } from '../utils/S1.js'

export async function upsertDocument({ headerTable, header, linesTable, lines, upsert }) {
  if (!headerTable || !header || !linesTable || !lines || !upsert) {
    throw new Error('Missing required parameters')
  } else {
    console.log(
      'headerTable',
      headerTable,
      'header',
      header,
      'linesTable',
      linesTable,
      'lines',
      lines,
      'upsert',
      upsert
    )
  }

  try {
    let sqlList = []
    let documentId

    if (upsert.toLowerCase() === 'insert') {
      // Use OUTPUT clause to get new ID
      const headerFields = Object.keys(header).join(',')
      const headerValues = Object.values(header)
        .map((val) => (typeof val === 'string' ? `'${val}'` : val))
        .join(',')

      let qInsert = `
          DECLARE @InsertedId TABLE (ID int);
          INSERT INTO ${headerTable} (${headerFields})
          OUTPUT INSERTED.${headerTable}ID INTO @InsertedId
          VALUES (${headerValues});
          SELECT ID FROM @InsertedId;
        `

      console.log('qInsert', qInsert)

      // Lines will be inserted after getting the header ID from transaction result
      const qResult = await runSQLTransaction({ sqlList: [qInsert] })
      if (!qResult.success) throw new Error('Header insert failed')

      documentId = qResult.data

      console.log('documentId', documentId)

      // Build lines insert SQL
      lines.forEach((line) => {
        const lineFields = Object.keys(line).join(',')
        const lineValues = Object.values(line)
          .map((val) => (typeof val === 'string' ? `'${val}'` : val))
          .join(',')
        sqlList.push(`
            INSERT INTO ${linesTable} (${headerTable},${lineFields})
            VALUES (${documentId},${lineValues})
          `)
      })
    } else if (upsert.toLowerCase() === 'update') {
      if (!header.ID) throw new Error('Missing document ID')
      documentId = header.ID

      // Build header update SQL
      const headerFields = Object.keys(header)
        .filter((key) => key !== 'ID')
        .map((key) => `${key} = ${typeof header[key] === 'string' ? `'${header[key]}'` : header[key]}`)
        .join(',')
      sqlList.push(`
          UPDATE ${headerTable}
          SET ${headerFields}
          WHERE ID = ${documentId}
        `)

      // Build lines update SQL
      lines.forEach((line) => {
        const lineFields = Object.keys(line)
          .filter((key) => key !== 'ID')
          .map((key) => `${key} = ${typeof line[key] === 'string' ? `'${line[key]}'` : line[key]}`)
          .join(',')
        sqlList.push(`
            UPDATE ${linesTable}
            SET ${lineFields}
            WHERE ID = ${line.ID}
          `)
      })
    }

    // Execute remaining statements
    if (sqlList.length > 0) {
      const finalResult = await runSQLTransaction({ sqlList })
      if (!finalResult.success) {
        //delete document if transaction failed
        await runSQLTransaction({
          sqlList: [`DELETE FROM ${headerTable} WHERE ID = ${documentId}`]
        })
        throw new Error(`Transaction failed for sql query ${finalResult.sql}`)
      }
    }

    return {
      success: true,
      documentId,
      message: `Document successfully ${upsert}ed`
    }
  } catch (error) {
    console.error('Error in upsertDocument:', error)
    throw error
  }
}
