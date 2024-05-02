-- MYSQL SCRIPT

DELETE FROM Departamento
WHERE idDepartamento NOT IN (
    SELECT idDepartamento FROM (
        SELECT MIN(idDepartamento) as idDepartamento
        FROM Departamento
        GROUP BY nombre, Provincia_idProvincia
    ) AS temp
);

SELECT nombre, Municipio_idMunicipio, COUNT(*) AS cantidad_duplicados
FROM Localidad
GROUP BY nombre, Municipio_idMunicipio
HAVING COUNT(*) > 1;

 
DELETE FROM Municipio
WHERE Departamento_idDepartamento NOT IN (SELECT idDepartamento FROM Departamento);

DELETE FROM Localidad
WHERE Municipio_idMunicipio NOT IN (SELECT idMunicipio FROM Municipio);