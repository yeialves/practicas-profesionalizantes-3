const http = require('http');
const fs = require('fs');
const path = require('path');

// Ruta del archivo de datos
const dataFilePath = path.join(__dirname, 'data.json');

// Verificar si el archivo data.json existe
if (!fs.existsSync(dataFilePath)) {
    // Si no existe, crear el archivo con una estructura inicial
    const initialData = {
        users: []
    };
    fs.writeFileSync(dataFilePath, JSON.stringify(initialData, null, 2));
    console.log('data.json creado con estructura inicial.');
}

// Cargar los datos de la base de datos simulada
const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));

const server = http.createServer((req, res) => {
    // Manejar solicitudes POST
    if (req.method === 'POST') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString(); // Convertir el Buffer a cadena
        });

        req.on('end', () => {
            try {
                const { action, username, password } = JSON.parse(body);

                if (action === 'register') {
                    // Lógica para registrar un nuevo usuario
                    const newUser = { username, password, level: 1 };
                    data.users.push(newUser);
                    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2)); // Almacena los datos en data.json
                    console.log('Nuevo usuario registrado:', username); // Log de registro
                    res.writeHead(201, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Registro exitoso.' }));

                } else if (action === 'login') {
                    const user = data.users.find(user => user.username === username && user.password === password);
                    if (user) {
                        console.log('Inicio de sesión exitoso para:', username); // Log de inicio de sesión exitoso
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Inicio de sesión exitoso.', redirect: 'index.html' })); // Redirigir a index.html
                    } else {
                        console.log('Inicio de sesión fallido para:', username); // Log de inicio de sesión fallido
                        res.writeHead(401, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Nombre de usuario o contraseña incorrectos.' }));
                    }
                } else {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Acción no válida.' }));
                }
            } catch (error) {
                console.error('Error al procesar la solicitud:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Error en los datos de entrada.' }));
            }
        });
    } else {
        // Manejar solicitudes GET para servir archivos estáticos
        const filePath = path.join(__dirname, req.url === '/' ? 'login.html' : req.url);
        const extname = path.extname(filePath);
        let contentType = 'text/html';

        switch (extname) {
            case '.js':
                contentType = 'text/javascript';
                break;
            case '.css':
                contentType = 'text/css';
                break;
            case '.json':
                contentType = 'application/json';
                break;
            case '.png':
                contentType = 'image/png';
                break;
            case '.jpg':
                contentType = 'image/jpeg';
                break;
            case '.gif':
                contentType = 'image/gif';
                break;
            default:
                break;
        }

        fs.readFile(filePath, (error, content) => {
            if (error) {
                console.error('Error reading file:', error); // Log the error
                res.writeHead(500);
                res.end(`Error interno del servidor: ${error.message}`); // Provide a more descriptive message
                return;
            }
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        });
    }
});

// Iniciar el servidor
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
