const http = require('http');
const fs = require('fs');
const path = require('path');

// Ruta del archivo de datos
const dataFilePath = path.join(__dirname, 'data.json');

// Verificar si el archivo data.json existe
if (!fs.existsSync(dataFilePath)) {
    const initialData = { users: [] };
    fs.writeFileSync(dataFilePath, JSON.stringify(initialData, null, 2));
    console.log('data.json creado con estructura inicial.');
}

let data = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));

const server = http.createServer((req, res) => {
    // Manejar solicitudes POST
    if (req.method === 'POST') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const { action, username, password } = JSON.parse(body);
                console.log(action, username, password);

                if (action === 'register') {
                    const userExists = data.users.some(user => user.username === username);
                    if (userExists) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'El usuario ya existe.' }));
                        return;
                    }

                    const newUser = { username, password, level: 1, inventory: [] };
                    data.users.push(newUser);
                    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
                    console.log('Nuevo usuario registrado:', username);
                    res.writeHead(201, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Registro exitoso.' }));

                } else if (action === 'login') {
                    const user = data.users.find(user => user.username === username && user.password === password);
                    if (user) {
                        console.log('Inicio de sesión exitoso para:', username);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            message: 'Inicio de sesión exitoso.', 
                            redirect: '/img/index.html', 
                            user: user 
                        }));
                    } else {
                        console.log('Inicio de sesión fallido para:', username);
                        res.writeHead(401, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: 'Nombre de usuario o contraseña incorrectos.' }));
                    }
                } else if (action === 'logout') {
                    const parsedBody = JSON.parse(body);
                    const user = parsedBody.user;
                
                    if (user) {
                        // Encuentra el índice del usuario en el array de usuarios
                        const userIndex = data.users.findIndex(u => u.username === user.username);
                        if (userIndex !== -1) {
                            // Sobrescribe los datos del usuario en el archivo JSON con los datos actuales del localStorage
                            data.users[userIndex] = { ...data.users[userIndex], ...user }; 
                            fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2)); // Guarda los cambios en data.json
                            console.log('Datos de usuario actualizados en data.json');
                        }
                    } else {
                        console.log('Error: No se recibió el usuario al cerrar sesión.');
                    }
                
                    // Limpia el localStorage después de que los datos se hayan guardado
                    console.log('Cierre de sesión exitoso.');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Cierre de sesión exitoso.', redirect: '/img/login.html' }));
                }                

            } catch (error) {
                console.error('Error al procesar la solicitud:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Error en los datos de entrada.' }));
            }
        });
    } else {
        let filePath = path.join(__dirname, 'public', req.url);
        if (req.url === '/') {
            filePath = path.join(__dirname, 'public', req.url === '/' ? 'img/login.html' : req.url);

        }
    
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
                contentType = 'text/html';
                break;
        }
    
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                console.error('Archivo no encontrado:', filePath);
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('404 - Archivo no encontrado');
                return;
            }
            fs.readFile(filePath, (error, content) => {
                if (error) {
                    console.error('Error al leer el archivo:', error);
                    res.writeHead(500);
                    res.end(`Error interno del servidor: ${error.message}`);
                    return;
                }
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            });
        });
        
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
