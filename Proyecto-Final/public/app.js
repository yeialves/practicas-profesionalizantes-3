class CharacterView extends HTMLElement {
    constructor(drawingContext) {
        super(); 
        this.drawingContext = drawingContext; // Guarda el contexto de dibujo del canvas
        this.currentState = null; // Estado actual del personaje
    }

    // Define el nuevo estado y actualiza la vista
    set state(newState) {
        this.currentState = newState;
        this.update(); // Redibuja cuando el estado cambia
    }

    get state() {
        return this.currentState; // Obtiene el estado actual del personaje
    }

    update() {
        // Limpia el canvas antes de redibujar
        this.drawingContext.clearRect(0, 0, this.drawingContext.canvas.width, this.drawingContext.canvas.height);

        // Redibuja el mapa si existe
        if (this.mapData) {
            this.drawMap(this.mapData, this.drawingContext, 64);  // Llama a la función para dibujar el mapa
        }

        // Dibuja el personaje con su sprite actual y posición
        const img = new Image();
        img.src = this.state.sprite; // Carga el sprite del personaje
        this.drawingContext.drawImage(
            img,
            this.state.frame * 64, 0, 64, 64, // Usa el frame correcto de la animación
            this.state.position_x, this.state.position_y, 64, 64 // Dibuja el personaje en la posición actual
        );
    }

    // Función para dibujar el mapa en el canvas
    drawMap(mapData, context, tileSize) {
        const layers = mapData.layers; // Capas del mapa
        const width = mapData.width; // Ancho del mapa en tiles
        const height = mapData.height; // Alto del mapa en tiles
        const tilesetImage = document.getElementById('tiles'); // Imagen del conjunto de tiles
        const tilesetWidth = tilesetImage.width / tileSize; // Número de tiles por fila en el tileset

        // Recorre las capas del mapa
        layers.forEach(layer => {
            if (layer.type === 'tilelayer' && layer.name !== 'collision') { // Ignora la capa de colisión
                for (let y = 0; y < height; y++) { // Recorre las filas de tiles
                    for (let x = 0; x < width; x++) { // Recorre las columnas de tiles
                        const tileIndex = layer.data[y * width + x]; // Índice del tile actual
                        if (tileIndex > 0) {
                            // Calcula la posición del tile en el tileset
                            const tileX = (tileIndex - 1) % tilesetWidth;
                            const tileY = Math.floor((tileIndex - 1) / tilesetWidth);

                            // Dibuja el tile en la posición correcta del canvas
                            context.drawImage(
                                tilesetImage, 
                                tileX * tileSize, tileY * tileSize, tileSize, tileSize, // Posición dentro del tileset
                                x * tileSize, y * tileSize, tileSize, tileSize // Posición en el canvas
                            );
                        }
                    }
                }
            }
        });
    }    
}

// Registra el componente 'character-view' para el DOM
customElements.define('character-view', CharacterView);

class CharacterModel extends EventTarget {
    constructor() {
        super();
        this.state = {
            width: 64, 
            height: 64,
            position_x: 0, // Posición inicial en x
            position_y: 0, // Posición inicial en y
            frame: 0, // Frame actual para la animación
            speed: 3, // Velocidad de movimiento
            sprite: 'assets/Felix-Walk-Front-Sheet-64x64.png' // Sprite inicial
        };
        this.isMoving = false; // Indica si el personaje se está moviendo
        this.direction = { x: 0, y: 0 }; // Dirección de movimiento (sin movimiento inicial)
        this.collisionLayer = null; // Capa de colisiones del mapa
        this.tileSize = 64; // Tamaño de los tiles
    }

    // Actualiza la posición del personaje
    updatePosition() {
        if (this.direction.x !== 0 || this.direction.y !== 0) { // Solo si hay dirección
            const dx = this.direction.x * this.state.speed; // Desplazamiento en x
            const dy = this.direction.y * this.state.speed; // Desplazamiento en y
            const newX = this.state.position_x + dx; // Nueva posición en x
            const newY = this.state.position_y + dy; // Nueva posición en y

            // Ajustar las coordenadas a los tiles más cercanos
            const alignedX = Math.round(newX / this.tileSize) * this.tileSize;
            const alignedY = Math.round(newY / this.tileSize) * this.tileSize;

            // Verifica colisiones antes de mover
            if (!this.isCollision(alignedX, alignedY)) {
                this.state.position_x = newX; // Actualiza la posición x
                this.state.position_y = newY; // Actualiza la posición y

                // Cambia el sprite según la dirección del movimiento
                if (this.direction.x > 0) {
                    this.state.sprite = 'assets/Felix-Walk-Right-Sheet-64x64.png';
                } else if (this.direction.x < 0) {
                    this.state.sprite = 'assets/Felix-Walk-Left-Sheet-64x64.png';
                } else if (this.direction.y > 0) {
                    this.state.sprite = 'assets/Felix-Walk-Front-Sheet-64x64.png';
                } else if (this.direction.y < 0) {
                    this.state.sprite = 'assets/Felix-Walk-Back-Sheet-64x64.png';
                }

                // Actualiza el frame de la animación
                this.frameCounter = (this.frameCounter || 0) + 1;
                if (this.frameCounter % 10 === 0) {
                    this.state.frame = (this.state.frame + 1) % 4; // Cambia de frame
                }

                this.dispatchEvent(new CustomEvent('positionchanged')); // Notifica el cambio de posición
            }
        }
    }

    // Verifica si hay colisión en la nueva posición
    isCollision(newX, newY) {
        if (!this.collisionLayer) return false; // No hay colisiones si no se ha cargado la capa

        // Verifica si alguna esquina del personaje choca con un tile bloqueado
        const topLeft = this.isTileBlocked(newX, newY);
        const topRight = this.isTileBlocked(newX + this.state.width - 1, newY);
        const bottomLeft = this.isTileBlocked(newX, newY + this.state.height - 1);
        const bottomRight = this.isTileBlocked(newX + this.state.width - 1, newY + this.state.height - 1);

        return topLeft || topRight || bottomLeft || bottomRight; // Colisión si alguna esquina choca
    }

    // Verifica si un tile está bloqueado (tiene colisión)
    isTileBlocked(x, y) {
        const tileX = Math.floor(x / this.tileSize); // Calcula el índice del tile en x
        const tileY = Math.floor(y / this.tileSize); // Calcula el índice del tile en y
        const tileIndex = tileY * this.collisionLayer.width + tileX; // Calcula el índice en el array de tiles

        return this.collisionLayer.data[tileIndex] > 0; // Retorna si el tile es bloqueado
    }

    // Establece la dirección del movimiento
    setDirection(x, y) {
        this.direction.x = x;
        this.direction.y = y;
    }

    // Carga el mapa desde una URL
    async loadMap(url) {
        const response = await fetch(url); // Carga el mapa
        if (!response.ok) {
            throw new Error('Failed to load map: ' + response.statusText); // Error si falla la carga
        }
        const mapData = await response.json(); // Convierte la respuesta en JSON

        // Encuentra la capa de colisiones y la guarda
        this.collisionLayer = mapData.layers.find(layer => layer.name === 'collision');
        return mapData; // Retorna los datos del mapa
    }
}



class CharacterController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.model.addEventListener('positionchanged', () => this.updateView()); // Actualiza la vista cuando cambia la posición del personaje

        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false, // Estados de las teclas de dirección
        };
    }

    // Conecta los eventos de teclado
    connect() {
        document.addEventListener('keydown', (event) => this.handleKeyDown(event)); // Detecta cuando se presiona una tecla
        document.addEventListener('keyup', (event) => this.handleKeyUp(event)); // Detecta cuando se suelta una tecla
        this.animate(); // Inicia la animación
    }

    // Maneja el evento de presionar teclas
    handleKeyDown(event) {
        if (event.key === 'w') this.keys.w = true; // Activa el movimiento hacia arriba
        if (event.key === 'a') this.keys.a = true; // Activa el movimiento a la izquierda
        if (event.key === 's') this.keys.s = true; // Activa el movimiento hacia abajo
        if (event.key === 'd') this.keys.d = true; // Activa el movimiento a la derecha
        this.updateDirection(); // Actualiza la dirección del personaje
    }

    // Maneja el evento de soltar teclas
    handleKeyUp(event) {
        if (event.key === 'w') this.keys.w = false; // Desactiva el movimiento hacia arriba
        if (event.key === 'a') this.keys.a = false; // Desactiva el movimiento a la izquierda
        if (event.key === 's') this.keys.s = false; // Desactiva el movimiento hacia abajo
        if (event.key === 'd') this.keys.d = false; // Desactiva el movimiento a la derecha
        this.updateDirection(); // Actualiza la dirección del personaje
    }

    // Actualiza la dirección según las teclas presionadas
    updateDirection() {
        const x = this.keys.d ? 1 : this.keys.a ? -1 : 0; // Establece la dirección en x
        const y = this.keys.s ? 1 : this.keys.w ? -1 : 0; // Establece la dirección en y
        this.model.setDirection(x, y); // Envía la dirección al modelo
    }

    // Actualiza la vista con el estado del modelo
    updateView() {
        this.view.state = this.model.state; // Actualiza el estado de la vista
    }

    // Función de animación
    animate() {
        this.model.updatePosition(); // Actualiza la posición del personaje
        requestAnimationFrame(() => this.animate()); // Continúa la animación en el siguiente frame
    }
}

// Función principal para iniciar el juego
async function main() {
    let canvas = document.createElement('canvas'); // Crea un canvas
    canvas.width = 1856; // Ancho del canvas
    canvas.height = 896; // Alto del canvas
    canvas.style.paddingLeft = "20px";
    canvas.style.paddingTop = "10px";

    document.getElementById('game-container').appendChild(canvas); // Añade el canvas al contenedor

    const context = canvas.getContext('2d'); // Obtiene el contexto de dibujo

    let characterModel = new CharacterModel(); // Crea el modelo del personaje
    let characterView = new CharacterView(context); // Crea la vista del personaje
    let characterController = new CharacterController(characterModel, characterView); // Crea el controlador

    try {
        const mapData = await characterModel.loadMap('mapa.tmj'); // Carga el mapa
        const tileSize = 64;
        characterView.mapData = mapData; // Asigna los datos del mapa a la vista
        characterView.drawMap(mapData, context, tileSize); // Dibuja el mapa
    } catch (error) {
        console.error('Error loading map:', error); // Error en la carga del mapa
    }

    characterController.connect(); // Conecta los eventos de teclado
}

window.onload = main; // Ejecuta la función main cuando la ventana se carga