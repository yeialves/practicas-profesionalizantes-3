const http = require('http');
const fs = require('fs');
const path = require('path');

// Ruta del archivo de datos
const dataFilePath = path.join(__dirname, 'data.json');

// Crear archivo data.json si no existe
function createDataFile() {
    if (!fs.existsSync(dataFilePath)) {
        const initialData = { users: [] };
        fs.writeFileSync(dataFilePath, JSON.stringify(initialData, null, 2));
        console.log('data.json creado con estructura inicial.');
    }
}

// Leer los datos del archivo
function readData() {
    return JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
}

// Guardar los datos en el archivo
function saveData(data) {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
    console.log('Datos actualizados en data.json');
}

// Manejar la acción de registro
function handleRegister(req, res, data, body) {
    const { username, password } = JSON.parse(body);
    const userExists = data.users.some(user => user.username === username);
    
    if (userExists) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'El usuario ya existe.' }));
        return;
    }

    const newUser = { username, password, level: 1, inventory: {} };
    data.users.push(newUser);
    saveData(data);
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Registro exitoso.' }));
}

// Manejar la acción de inicio de sesión
function handleLogin(req, res, data, body) {
    const { username, password } = JSON.parse(body);
    const user = data.users.find(user => user.username === username && user.password === password);
    
    if (user) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            message: 'Inicio de sesión exitoso.', 
            redirect: '/img/index.html', 
            user: user 
        }));
    } else {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Nombre de usuario o contraseña incorrectos.' }));
    }
}

// Manejar la acción de cierre de sesión
function handleLogout(req, res, data, body) {
    const { user } = JSON.parse(body);
    
    if (user) {
        const userIndex = data.users.findIndex(u => u.username === user.username);
        if (userIndex !== -1) {
            data.users[userIndex] = { ...data.users[userIndex], ...user };
            saveData(data);
        }
    } else {
        console.log('Error: No se recibió el usuario al cerrar sesión.');
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Cierre de sesión exitoso.', redirect: '/img/login.html' }));
}

// Servir archivos estáticos
function serveStaticFile(req, res) {
    let filePath = path.join(__dirname, 'public', req.url);
    if (req.url === '/') {
        filePath = path.join(__dirname, 'public', 'img/login.html');
    }

    const extname = path.extname(filePath);
    let contentType = 'text/html';

    switch (extname) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
        case '.json': contentType = 'application/json'; break;
        case '.png': contentType = 'image/png'; break;
        case '.jpg': contentType = 'image/jpeg'; break;
        case '.gif': contentType = 'image/gif'; break;
    }

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('404 - Archivo no encontrado');
            return;
        }

        fs.readFile(filePath, (error, content) => {
            if (error) {
                res.writeHead(500);
                res.end(`Error interno del servidor: ${error.message}`);
                return;
            }

            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        });
    });
}

// Crear servidor HTTP
const server = http.createServer((req, res) => {
    let data = readData();

    if (req.method === 'POST') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const { action } = JSON.parse(body);

                if (action === 'register') {
                    handleRegister(req, res, data, body);
                } else if (action === 'login') {
                    handleLogin(req, res, data, body);
                } else if (action === 'logout') {
                    handleLogout(req, res, data, body);
                } else {
                    throw new Error('Acción desconocida');
                }
            } catch (error) {
                console.error('Error al procesar la solicitud:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Error en los datos de entrada.' }));
            }
        });
    } else {
        serveStaticFile(req, res);
    }
});

// Iniciar servidor
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Inicializar el archivo data.json si no existe
createDataFile();
