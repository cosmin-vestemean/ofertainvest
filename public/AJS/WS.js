/* Global X */

import { usrPwdValidate } from '../utils/S1'

function processSqlAsDataset(obj) {
  var ds, err
  if (!obj.sqlQuery) return { success: false, error: 'No sql query transmited.' }
  try {
    ds = X.GETSQLDATASET(obj.sqlQuery, null)
  } catch (e) {
    err = e.message
  }
  if (ds && ds.RECORDCOUNT > 0) {
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
    result.error = 'No sql query transmitted.'
    return result
  } else {
    var strSql = 'BEGIN TRY;' //start sql transaction with commit and rollback
    //start sql transaction with commit and rollback
    strSql += 'BEGIN TRANSACTION ;'
    for (var i = 0; i < obj.sqlList.length; i++) {
      strSql += obj.sqlList[i] + ';' //add each sql query to the transaction
    }
    strSql += 'COMMIT '
    strSql += 'END TRY '
    strSql += 'BEGIN CATCH '
    strSql += 'IF @@TRANCOUNT > 0 '
    strSql += 'ROLLBACK '
    strSql += 'END CATCH '
    try {
      var returned = X.RUNSQL(strSql)
      result.success = true
      result.sql = strSql
      result.data = returned
      return result
    } catch (e) {
      result.error = e.message
      result.success = false
      result.sql = strSql
      /* strSql = 'INSERT INTO CCCWEBERRORS '
      strSql +=
        'SELECT ERROR_NUMBER() AS ErrorNumber, ERROR_SEVERITY() AS ErrorSeverity, ERROR_STATE() AS ErrorState, ERROR_PROCEDURE() AS ErrorProcedure, ERROR_LINE() AS ErrorLine, ERROR_MESSAGE() AS ErrorMessage '
      X.RUNSQL(strSql) */
    }
    return result
  }
}

function usrPwdValidate(obj) {
  const clientID = obj.clientID
  const module = obj.module
  const refid = obj.refid
  const password = obj.password
  //REFID means USERS when module is 0
  if (module == 0) {
    if (X.USERVALIDATE(refid, password)) {
      return { success: true, message: 'User validated successfully' }
    } else {
      return { success: false, message: 'Invalid login' }
    }
  } else {
    return { success: false, message: 'Invalid module' }
  }
}
