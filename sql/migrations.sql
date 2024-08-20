create table CCCOFERTEWEB
(
	CCCOFERTEWEB INT NOT NULL PRIMARY KEY IDENTITY(1,1),
    NAME VARCHAR(100) NOT NULL,
	FILENAME VARCHAR(MAX) NOT NULL,
	TRNDATE DATETIME NOT NULL DEFAULT GETDATE(),
	TRDR INT NOT NULL,
	PRJC INT NOT NULL,
	JSONSTR VARCHAR(MAX) NOT NULL,
	JSONANTESTR VARCHAR(MAX),
	JSONINSTRETSTR VARCHAR(MAX),
	JSONRETETESTR VARCHAR(MAX),
	JSONTREESSTR VARCHAR(MAX),
)

--create global table for all errors in the system
/*
SELECT ERROR_NUMBER() AS ErrorNumber,
    ERROR_SEVERITY() AS ErrorSeverity,
    ERROR_STATE() AS ErrorState,
    ERROR_PROCEDURE() AS ErrorProcedure,
    ERROR_LINE() AS ErrorLine,
    ERROR_MESSAGE() AS ErrorMessage;
*/
create table CCCWEBERRORS
(
	CCCWEBERRORS INT NOT NULL PRIMARY KEY IDENTITY(1,1),
	TRNDATE DATETIME NOT NULL DEFAULT GETDATE(),
	ERRORNUMBER INT NOT NULL,
	ERRORSEVERITY INT NOT NULL,
	ERRORSTATE INT NOT NULL,
	ERRORPROCEDURE VARCHAR(100),
	ERRORLINE INT NOT NULL,
	ERRORMESSAGE VARCHAR(MAX) NOT NULL
)

create table CCCESTIMARIH
(
	CCCESTIMARIH INT NOT NULL PRIMARY KEY IDENTITY(1,1),
	CCCOFERTEWEB INT NOT NULL,
	ID INT NOT NULL,
	ACTIVE SMALLINT NOT NULL,
	STARTDATE DATETIME NOT NULL,
	ENDDATE DATETIME NOT NULL,
	CREATEDATE DATETIME NOT NULL,
	UPDATEDATE DATETIME,
	DSESTIMARIFLAT VARCHAR(MAX) NOT NULL
)

create table CCCESTIMARIL (
	CCCESTIMARIL INT NOT NULL PRIMARY KEY IDENTITY(1,1),
	CCCESTIMARIH INT NOT NULL,
	STARTDATE DATETIME NOT NULL,
	ENDDATE DATETIME NOT NULL,
	WBS VARCHAR(100) NOT NULL,
	DENUMIRE VARCHAR(250) NOT NULL,
	CANTOFERTA FLOAT NOT NULL,
	CANTANTE FLOAT NOT NULL,
	CANTESTIM FLOAT NOT NULL,
	UM VARCHAR(10) NOT NULL,
	NIVEL_OFERTA_1 VARCHAR(100),
	NIVEL_OFERTA_2 VARCHAR(100),
	NIVEL_OFERTA_3 VARCHAR(100),
	NIVEL_OFERTA_4 VARCHAR(100),
	NIVEL_OFERTA_5 VARCHAR(100),
	NIVEL_OFERTA_6 VARCHAR(100),
	NIVEL_OFERTA_7 VARCHAR(100),
	NIVEL_OFERTA_8 VARCHAR(100),
	NIVEL_OFERTA_9 VARCHAR(100),
	NIVEL_OFERTA_10 VARCHAR(100),
	REFINSTANTA INT NOT NULL,
	REFRAMURA INT NOT NULL,
	REFACTIVITATE INT NOT NULL,
	REFESTIMARE INT NOT NULL,
	ROWSELECTED SMALLINT NOT NULL,
	TIPARTICOL VARCHAR(100) NOT NULL,
	SUBTIPARTICOL VARCHAR(100) NOT NULL,
	ISMAIN SMALLINT NOT NULL,
)


