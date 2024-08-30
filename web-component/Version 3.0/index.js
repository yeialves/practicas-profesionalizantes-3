const express = require('express');
const mysql = require('mysql');
const path = require('path');
const { cuentas } = require('./cuentas.json');
const bodyParser = require('body-parser');

const app = express();

// Configurar body-parser para analizar solicitudes JSON
app.use(bodyParser.json());

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// Configuración de la conexión MySQL
const connection = mysql.createConnection({
    host: "localhost",
    database: "UserAccount",
    user: "root",
    password: "1234"
});

// Conectar a la base de datos
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to database: ' + err.stack);
        return;
    }
    console.log('Connected to database as id ' + connection.threadId);
});

//Insertar lista en la base de datos 
app.get('/insertCuentas', (req, res) => {
    const sql = 'INSERT INTO User (id, username, balance) VALUES ?';
    connection.query(sql, [cuentas.map(cuenta => [cuenta.id, cuenta.username, cuenta.balance])], (error, results) => {
        if (error) return res.status(500).json({ error: "Internal server error" });
        console.log('Data inserted into database successfully');
        res.json({ cuentas });
    });
});

//Agregar User a la base de datos
app.post('/addUser', (req, res) => {
    const { username, balance } = req.body;
      // Verificar si el nombre de usuario ya existe en la base de datos
    connection.query("SELECT * FROM User WHERE username = ?", [username], (checkResults) => {
        if (checkResults.length > 0) return res.status(400).json({ error: "Username already exists" });
        connection.query("INSERT INTO User (username, balance) VALUES (?, ?)", [username, balance], (insertError, insertResults) => {
            if (insertError) return res.status(500).json({ error: "Internal server error" });
            res.status(201).json({ message: "Account created successfully", id: insertResults.insertId });
        });
    });
});

//Editar User en la base de datos 
app.put('/editUser/:id', (req, res) => {
    const id = req.params.id;
    const { username, balance } = req.body;
    connection.query("SELECT * FROM User WHERE id = ?", [id], (checkResults) => {
        if (checkResults.length === 0) return res.status(404).json({ error: "Account not found" });
        // Actualizar la información del usuario en la base de datos
        connection.query("UPDATE User SET username = ?, balance = ? WHERE id = ?", [username, balance, id], (updateError, updateResults) => {
            if (updateError) return res.status(500).json({ error: "Internal server error" });
            res.status(200).json({ message: "Account updated successfully" });
        });
    });
});

// Eliminar User de la base de datos
app.delete('/deleteUser/:id', (req, res) => {
    const id = req.params.id;
    connection.query("SELECT * FROM User WHERE id = ?", [id], (checkResults) => {
        if (checkResults.length === 0) return res.status(404).json({ error: "Account not found" });
        connection.query("DELETE FROM User WHERE id = ?", [id], (deleteError, deleteResults) => {
            if (deleteError) return res.status(500).json({ error: "Internal server error" });
            res.status(200).json({ message: "Account deleted successfully" });
        });
    });
});

//Buscar User
app.get('/searchUser/:id', (req, res) => {
    const id = req.params.id;
    // Verificar si el ID de la cuenta existe en la base de datos
    connection.query("SELECT id, username, balance FROM User WHERE id = ?", [id], (checkResults) => {
        if (checkResults.length === 0) return res.status(404).json({ error: "Account not found" });
        const { id, username, balance } = checkResults[0];
        res.status(200).json({ id, username, balance });
    });
});

// Iniciar el servidor
const PORT = 5501;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
