const mysql = require('mysql');
const xlsx = require('xlsx');

// Crear una conexión a la base de datos
const db = mysql.createConnection({
    host: "localhost",
    user: 'root',
    password: '1234',
    database: "Listado"
});

// Conectar a la base de datos
db.connect((err) => {
    if (err) {
        console.error("Error connecting to MySQL database:", err);
        return;
    }
    console.log("Connected to MySQL database");

    // Leer archivo Excel y ejecutar la función para insertar datos
    readAndInsertData();
});

function readAndInsertData() {
    // Leer archivo Excel de localidades
    let localidadesWorkbook = xlsx.readFile('Listado.xlsx');
    let localidadesWorksheet = localidadesWorkbook.Sheets[localidadesWorkbook.SheetNames[0]];
    let localidadesRange = xlsx.utils.decode_range(localidadesWorksheet["!ref"]);

    // Cargar provincias sin duplicados
    loadProvinces(localidadesWorksheet, localidadesRange);

    // Insertar datos de localidades en la base de datos
    insertLocalidades(localidadesWorksheet, localidadesRange);
}

// Función para cargar las provincias sin duplicados
function loadProvinces(worksheet, range) {
    let uniqueProvinces = new Set();

    // Iterar sobre los datos del archivo Excel y almacenar las provincias únicas en el conjunto
    for (let row = range.s.r; row <= range.e.r; row++) {
        let provincia = worksheet[xlsx.utils.encode_cell({ r: row, c: 0 })].v;
        uniqueProvinces.add(provincia);
    }

    // Convertir el conjunto de provincias únicas en un arreglo
    let provincesArray = Array.from(uniqueProvinces);

    // Insertar las provincias en la tabla Provincia
    insertProvinces(provincesArray);
}

// Función para insertar las provincias en la tabla Provincia
function insertProvinces(provincesArray) {
    provincesArray.forEach(provincia => {
        obtenerIdProvincia(provincia, (idProvincia) => {
            if (!idProvincia) { // Si la provincia no existe, insertarla
                const insertQuery = `INSERT INTO Provincia (nombre) VALUES (?)`;
                db.query(insertQuery, [provincia], (err, result) => {
                    if (err) {
                        throw err;
                    }
                    console.log(`Inserted row into Provincia: `, result.insertId);
                });
            }
        });
    });
}

// Función para obtener el idProvincia correspondiente al nombre de la provincia
function obtenerIdProvincia(nombreProvincia, callback) {
    const selectQuery = `SELECT idProvincia FROM Provincia WHERE nombre = ?`;
    db.query(selectQuery, [nombreProvincia], (err, results) => {
        if (err) {
            throw err;
        }

        if (results.length > 0) {
            // Devolver el idProvincia correspondiente si se encuentra
            callback(results[0].idProvincia);
        } else {
            console.log(`Provincia '${nombreProvincia}' not found in the database.`);
            callback(null); // Devolver null si la provincia no se encuentra
        }
    });
}

// Función para insertar un departamento en la base de datos
function insertarDepartamento(nombreDepartamento, idProvincia, callback) {
    // Verificar si el departamento ya existe en la base de datos
    const selectQuery = `SELECT idDepartamento FROM Departamento WHERE nombre = ? AND Provincia_idProvincia = ?`;
    db.query(selectQuery, [nombreDepartamento, idProvincia], (err, results) => {
        if (err) {
            throw err;
        }
        if (results.length === 0) {
            // El departamento no existe, insertarlo
            const insertQuery = `INSERT INTO Departamento (nombre, Provincia_idProvincia) VALUES (?, ?)`;
            db.query(insertQuery, [nombreDepartamento, idProvincia], (err, result) => {
                if (err) {
                    throw err;
                }
                console.log(`Inserted row into Departamento: `, result.insertId);
                callback(result.insertId); // Llamar al callback con el ID del departamento insertado
            });
        } else {
            console.log(`Department '${nombreDepartamento}' already exists in the database.`);
            callback(results[0].idDepartamento); // Llamar al callback con el ID del departamento existente
        }
    });
}

// Función para insertar un municipio en la base de datos
function insertarMunicipio(nombreMunicipio, idDepartamento, callback) {
    // Verificar si el municipio ya existe en la base de datos
    const selectQuery = `SELECT idMunicipio FROM Municipio WHERE nombre = ? AND Departamento_idDepartamento = ?`;
    db.query(selectQuery, [nombreMunicipio, idDepartamento], (err, results) => {
        if (err) {
            throw err;
        }
        if (results.length === 0) {
            // El municipio no existe, insertarlo
            const insertQuery = `INSERT INTO Municipio (nombre, Departamento_idDepartamento) VALUES (?, ?)`;
            db.query(insertQuery, [nombreMunicipio, idDepartamento], (err, result) => {
                if (err) {
                    throw err;
                }
                console.log(`Inserted row into Municipio: `, result.insertId);
                callback(result.insertId); // Llamar al callback con el ID del municipio insertado
            });
        } else {
            console.log(`Municipality '${nombreMunicipio}' already exists in the database.`);
            callback(results[0].idMunicipio); // Llamar al callback con el ID del municipio existente
        }
    });
}

// Función para insertar una localidad en la base de datos
function insertarLocalidad(nombreLocalidad, idMunicipio) {
    // Verificar si la localidad ya existe en la base de datos
    const selectQuery = `SELECT idLocalidad FROM Localidad WHERE nombre = ? AND Municipio_idMunicipio = ?`;
    db.query(selectQuery, [nombreLocalidad, idMunicipio], (err, results) => {
        if (err) {
            throw err;
        }
        if (results.length === 0) {
            // La localidad no existe, insertarla
            const insertQuery = `INSERT INTO Localidad (nombre, Municipio_idMunicipio) VALUES (?, ?)`;
            db.query(insertQuery, [nombreLocalidad, idMunicipio], (err, result) => {
                if (err) {
                    throw err;
                }
                console.log(`Inserted row into Localidad: `, result.insertId);
            });
        } else {
            console.log(`Locality '${nombreLocalidad}' already exists in the database.`);
            callback(results[0].idLocalidad);
        }
    });
}

// Función para insertar datos de localidades en la base de datos
function insertLocalidades(worksheet, range) {
    for (let row = range.s.r; row <= range.e.r; row++) {
        let provincia = worksheet[xlsx.utils.encode_cell({ r: row, c: 0 })].v;
        let departamento = worksheet[xlsx.utils.encode_cell({ r: row, c: 1 })].v;
        let municipio = worksheet[xlsx.utils.encode_cell({ r: row, c: 2 })].v;
        let localidad = worksheet[xlsx.utils.encode_cell({ r: row, c: 3 })].v;

        obtenerIdProvincia(provincia, (idProvincia) => {
            if (idProvincia !== null) { // Verificar que idProvincia no sea null
                insertarDepartamento(departamento, idProvincia, (idDepartamento) => {
                    insertarMunicipio(municipio, idDepartamento, (idMunicipio) => {
                        insertarLocalidad(localidad, idMunicipio);
                    });
                });
            } else {
                console.log(`Error: idProvincia is null for provincia '${provincia}'.`);
            }
        });
    }
} 

