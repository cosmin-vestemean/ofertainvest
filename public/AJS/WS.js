function processSqlAsDataset(obj) {
  var ds, err
  if (!obj.sqlQuery) return { success: false, error: 'No sql query transmited.' }
  try {
    ds = X.GETSQLDATASET(obj.sqlQuery, null)
  } catch (e) {
    err = e.message
  }
  if (ds.RECORDCOUNT > 0) {
    return {
      success: true,
      data: convertDatasetToArray(ds),
      total: ds.RECORDCOUNT
    }
  } else {
    return {
      success: false,
      error: err
    }
  }
}

function getValFromQuery(obj) {
  if (!obj.sqlQuery) return { success: false, error: 'No sql query transmited.' }
  return {
    success: true,
    value: X.SQL(obj.sqlQuery, null)
  }
}

function convertDatasetToArray(dataset) {
  var arr = []
  dataset.FIRST
  while (!dataset.EOF) {
    var row = {}
    for (var i = 0; i < dataset.fieldcount; i++) {
      var columnName = dataset.fieldname(i)
      row[columnName] = dataset.fields(i)
    }
    arr.push(row)
    dataset.NEXT
  }
  return arr
}

function runSQLTransaction(obj) {
  var result = { success: false, error: '' }
  if (!obj.sqlList || obj.sqlList.length == 0) {
    result.success = false
    result.error = 'No sql query transmited.'
    return result
  } else {
    try {
      var strSql = 'BEGIN TRY;' //start sq transaction with commit and rollback
      //start sq transaction with commit and rollback
      strSql += 'BEGIN TRANSACTION ;'
      for (var i = 0; i < obj.sqlList.length; i++) {
        strSql += obj.sqlList[i] + ';'
      }
      strSql += 'COMMIT;'
      strSql += 'END TRY'
      strSql += 'BEGIN CATCH'
      strSql += 'IF @@TRANCOUNT > 0'
      strSql += 'BEGIN'
      strSql += 'INSERT INTO CCCWEBERRORS'
      strSql +=
        'SELECT ERROR_NUMBER() AS ErrorNumber, ERROR_SEVERITY() AS ErrorSeverity, ERROR_STATE() AS ErrorState, ERROR_PROCEDURE() AS ErrorProcedure, ERROR_LINE() AS ErrorLine, ERROR_MESSAGE() AS ErrorMessage;'
      strSql += 'ROLLBACK;'
      strSql += 'END'
      strSql += 'END CATCH;'
      X.RUNSQL(strSql)
      result.success = true
    } catch (e) {
      result.error = e.message
      result.success = false
    }
  }

  return result
}
