class CharacterView extends HTMLElement {
    constructor(drawingContext) {
        super(); 
        this.drawingContext = drawingContext; // Guarda el contexto de dibujo del canvas
        this.currentState = null; // Estado actual del personaje
        this.animals = []; // Añade un array para los animales
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
        this.drawingContext.clearRect(0, 0, this.drawingContext.canvas.width, this.drawingContext.canvas.height);

        if (this.mapData) {
            this.drawMap(this.mapData, this.drawingContext, 64);
        }

        // Dibuja al personaje principal
        if (this.state) {
            this.drawCharacter(this.state);
        }

        // Dibuja a los animales
        this.animals.forEach(animal => this.drawCharacter(animal.state));
    }

    // Función para dibujar cualquier personaje
    drawCharacter(state) {
        const img = new Image();
        img.src = state.sprite;
        this.drawingContext.drawImage(
            img,
            state.frame * 64, 0, 64, 64, 
            state.position_x, state.position_y, 64, 64
        );
    }

    // Añade animales a la vista
    addAnimal(animalModel) {
        this.animals.push(animalModel);
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
            if (layer.type === 'tilelayer' && layer.name !== 'collision' && layer.name !== 'animalCollision') { // Ignora la capa de colisión
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
            position_x: 0,
            position_y: 0,
            frame: 0,
            speed: 3,
            isIdle: false // Nuevo estado para determinar si está en idle
        };
        this.direction = { x: 0, y: 0 };
        this.lastDirection = { x: 0, y: 1 }; // Última dirección (por defecto, mirando al frente)
        this.collisionLayer = null;
        this.tileSize = 64;
        this.frameCounter = 0; // Contador para los frames
    }

    updatePosition() {
        // Si el personaje se está moviendo, actualiza la posición
        if (this.direction.x !== 0 || this.direction.y !== 0) {
            this.state.isIdle = false; // Está en movimiento
            this.moveCharacter(); // Mueve al personaje
        } else {
            this.handleIdleState(); // Maneja el estado idle
        }
    
        this.updateSprite(); // Actualiza el sprite según el estado
        this.updateFrame();  // Actualiza el frame de la animación
        this.dispatchEvent(new CustomEvent('positionchanged')); // Notifica el cambio de posición
    }
    
    moveCharacter() {
        const dx = this.direction.x * this.state.speed;
        const dy = this.direction.y * this.state.speed;
        const newX = this.state.position_x + dx;
        const newY = this.state.position_y + dy;
    
        const alignedX = Math.round(newX / this.tileSize) * this.tileSize;
        const alignedY = Math.round(newY / this.tileSize) * this.tileSize;
    
        if (!this.isCollision(alignedX, alignedY)) {
            this.state.position_x = newX;
            this.state.position_y = newY;
            this.lastDirection = { ...this.direction }; // Guarda la última dirección de movimiento
        }
    }
    
    handleIdleState() {
        this.state.isIdle = true; // No hay movimiento, está en idle
    }
    
    updateSprite() {
        if (!this.state.isIdle) {
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
        } else {
            // Cambia al sprite idle basado en la última dirección de movimiento
            if (this.lastDirection.x > 0) {
                this.state.sprite = 'assets/Felix-Right-Idel-Sheet.png';
            } else if (this.lastDirection.x < 0) {
                this.state.sprite = 'assets/Felix-Left-Idel-Sheet.png';
            } else if (this.lastDirection.y > 0) {
                this.state.sprite = 'assets/Felix-Front-Idel-Sheet.png';
            } else if (this.lastDirection.y < 0) {
                this.state.sprite = 'assets/Felix-Back-Idel-Sheet.png';
            }
        }
    }
    
    updateFrame() {
        // Actualiza el frame de la animación
        this.frameCounter++;
        if (this.frameCounter % 10 === 0) {
            this.state.frame = (this.state.frame + 1) % 4; // Cambia de frame cada 10 actualizaciones
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

    async loadMap(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to load map: ' + response.statusText);
        }
        const mapData = await response.json();
    
        // Carga la capa de colisiones para personajes
        this.collisionLayer = mapData.layers.find(layer => layer.name === 'collision');
    
        // Carga la capa de colisiones para animales
        this.animalCollisionLayer = mapData.layers.find(layer => layer.name === 'animalCollision');
    
        return mapData;
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
        if (event.key === 'w')this.keys.w = false;// Desactiva el movimiento hacia arriba 
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

class AnimalModel extends CharacterModel {
    constructor(animalType, animalCollisionLayer) {
        super();
        this.animalType = animalType;
        this.sprites = this.getAnimalSprites(animalType);
        this.state.sprite = this.sprites.idle;
        this.animalCollisionLayer = animalCollisionLayer; // Asigna la capa 
        this.setRandomDirection();
    }

    // Método para establecer una dirección aleatoria
    setRandomDirection() {
        const directions = [
            { x: 1, y: 0 }, // derecha
            { x: -1, y: 0 }, // izquierda
            { x: 0, y: 1 }, // abajo
            { x: 0, y: -1 } // arriba
        ];
        
        // Selecciona una dirección al azar
        const randomIndex = Math.floor(Math.random() * directions.length);
        this.setDirection(directions[randomIndex].x, directions[randomIndex].y);
    }

    // Función para obtener los sprites según el tipo de animal
    getAnimalSprites(animalType) {
        const spriteMap = {
            'vaca': {
                walkRight: 'assets/vaquita-spread-dere.png',
                walkLeft: 'assets/vaquita-spread-iz.png',
                walkFront: 'assets/vaquita-spread.png',
                walkBack: 'assets/vaquita-paatras-Sheet.png',
                idle: 'assets/vaquita-mimida-Sheet.png'
            },
        };
        return spriteMap[animalType] || spriteMap['vaca']; // Devuelve sprites por defecto si no se encuentra el tipo
    }

    // Método para actualizar el sprite según la dirección
    updateSprite() {
        if (this.direction.x > 0) {
            this.state.sprite = this.sprites.walkRight;
        } else if (this.direction.x < 0) {
            this.state.sprite = this.sprites.walkLeft;
        } else if (this.direction.y > 0) {
            this.state.sprite = this.sprites.walkFront;
        } else if (this.direction.y < 0) {
            this.state.sprite = this.sprites.walkBack;
        }
    }

    // Cuando el animal está idle
    updateIdleState() {
        this.state.sprite = this.sprites.idle;
        this.updateFrame();
    }

     // Sobrescribe el método isCollision para usar la capa de colisiones de animales
     isCollision(newX, newY) {
        if (!this.animalCollisionLayer) return false; // Si no hay capa de colisiones para animales, no hay colisión

        // Verifica si alguna esquina del animal choca con un tile bloqueado en la capa de colisiones de animales
        const topLeft = this.isTileBlocked(newX, newY, this.animalCollisionLayer);
        const topRight = this.isTileBlocked(newX + this.state.width - 1, newY, this.animalCollisionLayer);
        const bottomLeft = this.isTileBlocked(newX, newY + this.state.height - 1, this.animalCollisionLayer);
        const bottomRight = this.isTileBlocked(newX + this.state.width - 1, newY + this.state.height - 1, this.animalCollisionLayer);

        return topLeft || topRight || bottomLeft || bottomRight; // Colisión si alguna esquina choca
    }

    // Método para verificar si un tile está bloqueado en una capa específica
    isTileBlocked(x, y, layer) {
        const tileX = Math.floor(x / this.tileSize); // Índice del tile en x
        const tileY = Math.floor(y / this.tileSize); // Índice del tile en y
        const tileIndex = tileY * layer.width + tileX; // Índice en el array de tiles

        return layer.data[tileIndex] > 0; // Retorna true si el tile está bloqueado
    }
}


// Modifica la función main para añadir animales
async function main() {
    let canvas = document.createElement('canvas');
    canvas.width = 1856;
    canvas.height = 896;

    document.getElementById('game-container').appendChild(canvas);
    const context = canvas.getContext('2d');

    let characterModel = new CharacterModel();
    let characterView = new CharacterView(context);
    let characterController = new CharacterController(characterModel, characterView);

    try {
        const mapData = await characterModel.loadMap('mapa.tmj');
        const tileSize = 64;
        characterView.mapData = mapData;
        characterView.drawMap(mapData, context, tileSize);
    } catch (error) {
        console.error('Error loading map:', error);
    }

    // Añadir un animal al juego
 // Después de cargar el mapa
    let vaca = new AnimalModel('vaca', characterModel.animalCollisionLayer);
    vaca.state.position_x = 128;
    vaca.state.position_y = 128;
    characterView.addAnimal(vaca);

    characterController.connect();

    // Animar los animales
    function animateAnimals() {
       vaca.updatePosition();
        requestAnimationFrame(animateAnimals);
    }

    animateAnimals(); // Inicia la animación de los animales
}

window.onload = main; // Ejecuta la función main cuando la ventana se carga