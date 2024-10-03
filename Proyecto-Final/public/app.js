class CharacterView extends HTMLElement {
    constructor(drawingContext) {
        super(); 
        this.drawingContext = drawingContext;
        this.currentState = null;
        this.animals = [];

        // Tamaño de la cámara (el área visible alrededor del personaje)
        this.cameraWidth = 512;  
        this.cameraHeight = 512;
    }

    set state(newState) {
        this.currentState = newState;
        this.update();
    }

    get state() {
        return this.currentState;
    }

    update() {
        this.drawingContext.clearRect(0, 0, this.drawingContext.canvas.width, this.drawingContext.canvas.height);

        if (this.mapData) {
            this.drawMap(this.mapData, this.drawingContext, 64);
        }

        // Dibuja al personaje
        if (this.state) {
            this.drawCharacter(this.state);
        }

        // Dibuja a los animales
        this.animals.forEach(animal => this.drawCharacter(animal.state));
    }

    drawCharacter(state) {
        const img = new Image();
        img.src = state.sprite;

        // Calcula la posición relativa a la cámara
        const relativeX = state.position_x - (this.state.position_x - this.cameraWidth / 2);
        const relativeY = state.position_y - (this.state.position_y - this.cameraHeight / 2);

        this.drawingContext.drawImage(
            img,
            state.frame * 64, 0, 64, 64, 
            relativeX, relativeY, 64, 64
        );
    }

    // Añade animales a la vista
    addAnimal(animalModel) {
        this.animals.push(animalModel);
    }

    drawMap(mapData, context, tileSize) {
        const layers = mapData.layers;
        const width = mapData.width;
        const height = mapData.height;
        const tilesetImage = document.getElementById('tiles');
        const tilesetWidth = tilesetImage.width / tileSize;

        const cameraX = this.state.position_x - this.cameraWidth / 2;
        const cameraY = this.state.position_y - this.cameraHeight / 2;

        layers.forEach(layer => {
            if (layer.type === 'tilelayer' && layer.name !== 'collision' && layer.name !== 'animalCollision') {
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const tileIndex = layer.data[y * width + x];
                        if (tileIndex > 0) {
                            const tileX = (tileIndex - 1) % tilesetWidth;
                            const tileY = Math.floor((tileIndex - 1) / tilesetWidth);

                            const tilePosX = x * tileSize;
                            const tilePosY = y * tileSize;

                            // Verifica si el tile está dentro del área visible de la cámara
                            if (
                                tilePosX + tileSize > cameraX && tilePosX < cameraX + this.cameraWidth &&
                                tilePosY + tileSize > cameraY && tilePosY < cameraY + this.cameraHeight
                            ) {
                                // Dibuja el tile en la posición relativa a la cámara
                                context.drawImage(
                                    tilesetImage, 
                                    tileX * tileSize, tileY * tileSize, tileSize, tileSize, 
                                    tilePosX - cameraX, tilePosY - cameraY, tileSize, tileSize
                                );
                            }
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
            position_x: 1000,
            position_y: 300,
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

            // Verifica si el personaje llega al borde del mapa
            this.checkForMapChange();  // Llamada a la nueva función
        } else {
            this.handleIdleState(); // Maneja el estado idle
        }

        this.updateSprite(); // Actualiza el sprite según el estado
        this.updateFrame();  // Actualiza el frame de la animación
        this.dispatchEvent(new CustomEvent('positionchanged')); // Notifica el cambio de posición
    }
    
    checkForMapChange() {
        // Obtener el mapa en píxeles
        const mapWidthPixels = this.collisionLayer.width * this.tileSize;
        const mapHeightPixels = this.collisionLayer.height * this.tileSize;
    
        // Verificar si el personaje está en el borde derecho, izquierdo o inferior del mapa
        const isOnRightEdge = this.state.position_x + this.state.width >= mapWidthPixels;  // Borde derecho
        const isOnLeftEdge = this.state.position_x <= 1; // Permite un pequeño margen
        const isOnBottomEdge = this.state.position_y + this.state.height >= mapHeightPixels;  // Borde inferior
    
        // Verifica si está en la capa de "camino"
        const isOnCaminoLayer = this.isOnCaminoLayer(this.state.position_x, this.state.position_y);
    
        if (isOnRightEdge && isOnCaminoLayer) {
            console.log("Posición del personaje:", this.state.position_x, this.state.position_y);
            // Cambia a 'prueba.tmj' al llegar al borde derecho en la capa "camino"
            this.loadNewMap('prueba.tmj', 1000, 300);  
        } else if (isOnLeftEdge && isOnCaminoLayer) {
            console.log("Posición del personaje:", this.state.position_x, this.state.position_y);
            // Cambia a 'mapa.tmj' al llegar al borde izquierdo en la capa "camino"
            this.loadNewMap('mapa.tmj', 1000, 300);
        } else if (isOnBottomEdge && isOnCaminoLayer) {
            console.log("Posición del personaje:", this.state.position_x, this.state.position_y);
            // Cambia a 'prueba.tmj' al llegar al borde inferior en la capa "camino"
            this.loadNewMap('prueba.tmj', 1000, 300);  
        }
    }

    moveCharacter() {
        const dx = this.direction.x * this.state.speed;
        const dy = this.direction.y * this.state.speed;
        const newX = this.state.position_x + dx;
        const newY = this.state.position_y + dy;
    
        const alignedX = Math.round(newX / this.tileSize) * this.tileSize;
        const alignedY = Math.round(newY / this.tileSize) * this.tileSize;

        //Obtener el mapa en pixeles
        const mapWhidthPixels = this.collisionLayer.width * this.tileSize;
        const mapHeightPixels = this.collisionLayer.height * this.tileSize;

    
        if (alignedX >= 0 && alignedX + this.state.width <= mapWhidthPixels && 
            alignedY >= 0 && alignedY + this.state.height <= mapHeightPixels &&
            !this.isCollision(alignedX, alignedY)) {
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
    
        this.mapData = mapData;  // Asigna el mapa a this.mapData
    
        // Carga la capa de colisiones para personajes
        this.collisionLayer = mapData.layers.find(layer => layer.name === 'collision');
        if (!this.collisionLayer) {
            console.error('Collision layer not found');
        }
    
        // Carga la capa de colisiones para animales
        this.animalCollisionLayer = mapData.layers.find(layer => layer.name === 'animalCollision');
        if (!this.animalCollisionLayer) {
            console.error('Animal collision layer not found');
        }
    
        return mapData;
    }
    
    isOnCaminoLayer(x, y) {
        // Verifica si el mapa y las capas están cargados correctamente
        if (!this.mapData || !this.mapData.layers) {
            console.error('El mapa o las capas no están cargados correctamente');
            return false;
        }
    
        // Encuentra la capa "camino"
        const caminoLayer = this.mapData.layers.find(layer => layer.name === 'camino');
        if (!caminoLayer) {
            console.error('La capa "camino" no está presente en el mapa');
            return false;
        }
    
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        const tileIndex = tileY * this.collisionLayer.width + tileX;
    
        // Verifica si el tile en esa posición pertenece a la capa "camino"
        return caminoLayer.data[tileIndex] > 0;
    }
    
    async loadNewMap(url, newX, newY) {
        try {
            const mapData = await this.loadMap(url); // Cargar el nuevo mapa
            this.mapData = mapData; // Asigna el mapa a this.mapData
            this.state.position_x = newX; // Establece la nueva posición del personaje
            this.state.position_y = newY; // Establece la nueva posición del personaje
            console.log("Nueva posición del personaje en mapa.tmj:", this.state.position_x, this.state.position_y);
            this.dispatchEvent(new CustomEvent('mapchanged', { detail: { mapData } })); // Notifica el cambio de mapa
        } catch (error) {
            console.error('Error al cargar el nuevo mapa:', error);
        }
    }
    
      
    
}

class CharacterController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.model.addEventListener('positionchanged', () => this.updateView()); // Actualiza la vista cuando cambia la posición del personaje
        this.model.addEventListener('mapchanged', (event) => this.handleMapChange(event)); // Escucha el cambio de mapa

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

    // Función para manejar el cambio de mapa
    handleMapChange(event) {
        const newMapData = event.detail.mapData;
        this.view.mapData = newMapData; // Actualiza la vista con el nuevo mapa
        this.view.update(); // Llama a la función de actualización para redibujar la pantalla con el nuevo mapa
    }
}

class AnimalModel extends CharacterModel {
    constructor(animalType, animalCollisionLayer) {
        super();
        this.animalType = animalType;
        this.sprites = this.getAnimalSprites(animalType);
        this.state.sprite = this.sprites.idle;
        this.animalCollisionLayer = animalCollisionLayer;
        
        console.log('Animal Collision Layer:', this.animalCollisionLayer); // Agrega esta línea
        this.setRandomDirection();
        this.directionChangeCounter = 0;
    }
    

    updatePosition() {
        if (!this.animalCollisionLayer) {
            console.warn('No se puede actualizar la posición: animalCollisionLayer no está configurada');
            return; // Evita actualizar la posición si la capa de colisiones no está disponible
        }
    
        this.directionChangeCounter++;
        
        // Cambia la dirección aleatoriamente cada 100 actualizaciones
        if (this.directionChangeCounter > 100) {
            this.setRandomDirection();
            this.directionChangeCounter = 0;
        }
    
        // Llama al método de la clase base para mover el animal
        super.updatePosition();
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

    moveCharacter() {
        if (!this.collisionLayer || !this.animalCollisionLayer) {
            console.warn('Collision layer not set for animal, skipping movement update');
            return; // Skip movement if the collision layer is not available
        }
    
        const dx = this.direction.x * this.state.speed;
        const dy = this.direction.y * this.state.speed;
        const newX = this.state.position_x + dx;
        const newY = this.state.position_y + dy;
    
        const alignedX = Math.round(newX / this.tileSize) * this.tileSize;
        const alignedY = Math.round(newY / this.tileSize) * this.tileSize;
    
        // Get the map dimensions in pixels
        const mapWidthPixels = this.animalCollisionLayer.width * this.tileSize;
        const mapHeightPixels = this.animalCollisionLayer.height * this.tileSize;
    
        if (alignedX >= 0 && alignedX + this.state.width <= mapWidthPixels && 
            alignedY >= 0 && alignedY + this.state.height <= mapHeightPixels &&
            !this.isCollision(alignedX, alignedY)) {
            this.state.position_x = newX;
            this.state.position_y = newY;
            this.lastDirection = { ...this.direction }; // Store last movement direction
        }
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
        } else {
            this.state.sprite = this.sprites.idle;
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

async function main() {

    const container = document.getElementById('game-container');
    
    if (!container) {
        console.error('El contenedor del juego no existe.');
        return; // Detener la ejecución si el contenedor no está presente
    }

    let canvas = document.createElement('canvas');
    canvas.width = 512; 
    canvas.height = 512;

    container.appendChild(canvas);
    const context = canvas.getContext('2d');

    let characterModel = new CharacterModel();
    let characterView = new CharacterView(context);
    let characterController = new CharacterController(characterModel, characterView);

    try {
        const mapData = await characterModel.loadMap('mapa.tmj');
        if (!mapData) {
            throw new Error('No se pudo cargar el mapa. Los datos son nulos.');
        }
        
        // Establece el estado del personaje en la vista
        characterView.state = characterModel.state; // Asegúrate de que el estado esté definido antes de dibujar
    
        const tileSize = 64;
        characterView.mapData = mapData;
        characterView.drawMap(mapData, context, tileSize);
    } catch (error) {
        console.error('Error loading map:', error);
    }    

    characterController.connect();

    // Añadir un animal al juego
    // Después de cargar el mapa
    /*let vaca = new AnimalModel('vaca', characterModel.animalCollisionLayer);
    vaca.state.position_x = 128;
    vaca.state.position_y = 128;
    characterView.addAnimal(vaca);

    function animateAnimals() {
        vaca.updatePosition(); // Actualiza la posición del animal
        characterView.update(); // Actualiza la vista para redibujar el animal en su nueva posición
        requestAnimationFrame(animateAnimals); // Llama a la animación de nuevo en el siguiente frame
    }
    animateAnimals(); // Inicia la animación de los animales*/
}

window.onload = main; // Ejecuta la función main cuando la ventana se carga