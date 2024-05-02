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
