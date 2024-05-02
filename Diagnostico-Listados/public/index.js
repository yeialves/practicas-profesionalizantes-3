const express = require('express');
const mysql = require('mysql');
const xlsx = require('xlsx');

const app = express();
const port = 3300;

// Configuración de la conexión a la base de datos
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
});

// Middleware para permitir solicitudes JSON
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//Mostrar estilos
app.use(express.static("public"));

// Ruta para obtener todas las provincias
app.get('/provincias', (req, res) => {
    const query = 'SELECT * FROM Provincia';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error querying provinces:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.json(results);
    });
});

// Ruta para obtener departamentos por provincia
app.get('/departamentos/:provinciaId', (req, res) => {
    const provinciaId = req.params.provinciaId;
    const query = 'SELECT * FROM Departamento WHERE Provincia_idProvincia = ?';
    db.query(query, [provinciaId], (err, results) => {
        if (err) {
            console.error('Error querying departamentos:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.json(results);
    });
});

// Ruta para obtener municipios por departamento
app.get('/municipios/:departamentoId', (req, res) => {
    const departamentoId = req.params.departamentoId;
    const query = 'SELECT * FROM Municipio WHERE Departamento_idDepartamento = ?';
    db.query(query, [departamentoId], (err, results) => {
        if (err) {
            console.error('Error querying municipios:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.json(results);
    });
});

// Ruta para obtener localidades por municipio
app.get('/localidades/:municipioId', (req, res) => {
    const municipioId = req.params.municipioId;
    const query = 'SELECT * FROM Localidad WHERE Municipio_idMunicipio = ?';
    db.query(query, [municipioId], (err, results) => {
        if (err) {
            console.error('Error querying localidades:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.json(results);
    });
});

// Escuchar en el puerto definido
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

