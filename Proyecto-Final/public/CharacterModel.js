export class CharacterModel extends EventTarget {
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

        this.animals = []; 
    }

    updatePosition() {
        // Si el personaje se está moviendo, actualiza la posición
        if (this.direction.x !== 0 || this.direction.y !== 0) {
            this.state.isIdle = false; 
            this.moveCharacter(); 

            // Verifica si el personaje llega al borde del mapa
            this.checkForMapChange(); 
        } else {
            this.handleIdleState();
        }

        this.updateSprite(); 
        this.updateFrame(); 
        // Notifica el cambio de posición
        this.dispatchEvent(new CustomEvent('positionchanged')); 
    }
    
    checkForMapChange() {
        // Obtener el mapa en píxeles
        const mapWidthPixels = this.collisionLayer.width * this.tileSize;
        const mapHeightPixels = this.collisionLayer.height * this.tileSize;
    
        // Verificar si el personaje está en los bordes del mapa
        const isOnRightEdge = this.state.position_x + this.state.width >= mapWidthPixels;  
        const isOnLeftEdge = this.state.position_x <= 1; 
        const isOnTopEdge = this.state.position_y <= 1; 
        const isOnBottomEdge = this.state.position_y + this.state.height >= mapHeightPixels; 
    
        // Verifica si está en la capa de "camino"
        const isOnCaminoLayer = this.isOnCaminoLayer(this.state.position_x, this.state.position_y);
    
        // Verificar cambio de mapa en el borde derecho
        if (isOnRightEdge && isOnCaminoLayer) {
            this.loadNewMap('prueba.tmj', 0, 300);
        // Verificar cambio de mapa en el borde izquierdo
        } else if (isOnLeftEdge && isOnCaminoLayer) {
            this.loadNewMap('mapa.tmj', 1740, 300);
        // Verificar cambio de mapa en el borde superior
        } else if (isOnTopEdge && isOnCaminoLayer) {
            this.loadNewMap('prueba.tmj', 800, 830);
        // Verificar cambio de mapa en el borde inferior
        } else if (isOnBottomEdge && isOnCaminoLayer) {
            this.loadNewMap('forest.tmj', 740, 1);
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
        this.state.isIdle = true; 
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
        this.frameCounter++;
        if (this.frameCounter % 10 === 0) {
            this.state.frame = (this.state.frame + 1) % 4; // Cambia de frame cada 10 actualizaciones
        }
    }

    // Verifica si hay colisión en la nueva posición
    isCollision(newX, newY) {
        if (!this.collisionLayer) return false; 

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

 isOnCaminoLayer(x, y) {
        // Verifica si el mapa y las capas están cargados correctamente
        if (!this.mapData || !this.mapData.layers) {
            console.error('El mapa o las capas no están cargados correctamente');
            return false;
        }
    
        const caminoLayer = this.mapData.layers.find(layer => layer.name === 'camino');
        if (!caminoLayer) {
            console.error('La capa "camino" no está presente en el mapa');
            return false;
        }
    
            //Calcula el índice del tile, ajustando la posición al centro
            const tileX = Math.floor((x + this.tileSize / 2) / this.tileSize);
            const tileY = Math.floor((y + this.tileSize / 2) / this.tileSize);


            const tileIndex = tileY * caminoLayer.width + tileX; // Cambiado a caminoLayer
    
        // Verifica si el tile en esa posición pertenece a la capa "camino"
        return caminoLayer.data[tileIndex] > 0; // Retorna si el tile es bloqueado
    }

    async loadMap(url) {
        const response = await fetch(url);
    
        if (!response.ok) {
            throw new Error('Failed to load map: ' + response.statusText);
        }
        const mapData = await response.json();
    
        // Asignar el nombre del mapa
        mapData.fileName = url.split('/').pop(); // Esto extrae el nombre del archivo del URL
    
        this.mapData = mapData;
    
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
    
    async loadNewMap(url, newX, newY) {
        try {
            const mapData = await this.loadMap(url);
            this.mapData = mapData;
            this.state.position_x = newX;
            this.state.position_y = newY;
    
            // Notificar el cambio de mapa
            this.dispatchEvent(new CustomEvent('mapchanged', { detail: { mapData } }));
        } catch (error) {
            console.error('Error al cargar el nuevo mapa:', error);
        }
    }    

}

export class AnimalModel extends CharacterModel {
    constructor(animalType, animalCollisionLayer, initialX = 0, initialY = 0) {
        super();

        // Define animal sizes here
        this.animalSizes = {
            'gallina': { width: 32, height: 32 },
            'vaca': { width: 64, height: 64 },
        };

        // Check if the animalType is valid
        if (!this.animalSizes[animalType]) {
            console.error(`Animal type '${animalType}' is not defined.`);
            return;
        }

        this.state = {
            width: this.animalSizes[animalType].width,
            height: this.animalSizes[animalType].height,
            position_x: initialX,
            position_y: initialY,
            frame: 0,
            speed: 1,
        };

        this.animalType = animalType;
        this.sprites = this.getAnimalSprites(animalType);
        this.animalCollisionLayer = animalCollisionLayer;

        this.state.sprite = this.sprites.idle;

        // Other initialization code...
        this.setRandomDirection();
        this.directionChangeCounter = 0;
    }


    updatePosition() {
        if (!this.animalCollisionLayer) {
            console.warn('No se puede actualizar la posición: animalCollisionLayer no está configurada');
            return;
        }
    
        this.directionChangeCounter++;
    
        // Si el animal está en estado idle
        if (this.isIdle) {
            this.idleWaitCounter++;
            this.updateIdleState(); 
            
            if (this.idleWaitCounter >= this.idleWaitTime) {
                this.exitIdleState(); // Sale del estado idle después de esperar el tiempo necesario
            }
            return; 
        }
    
        // Si el tiempo de inactividad supera el umbral, el animal entra en estado idle
        if (this.idleTime >= this.idleThreshold) {
            this.setIdleState(); // Entra en estado idle
        } else {
            // Si el animal no está en estado idle, se mueve y actualiza el sprite
            this.moveCharacter(); 
            this.updateSprite(); 
            this.updateFrame(); 
    
            this.idleTime++; // Incrementa el tiempo de inactividad
        }
    
        // Cambia la dirección aleatoriamente cada 150 actualizaciones
        if (this.directionChangeCounter > 150) {
            this.setRandomDirection();
            this.directionChangeCounter = 0;
            this.idleTime = 0; // Reinicia el tiempo de idle
        }
    }
    
    
      // Método para establecer una dirección aleatoria
      setRandomDirection() {
        const directions = [
            { x: 1, y: 0 }, 
            { x: -1, y: 0 }, 
            { x: 0, y: 1 }, 
            { x: 0, y: -1 }
        ];
        
        const randomIndex = Math.floor(Math.random() * directions.length);
        this.setDirection(directions[randomIndex].x, directions[randomIndex].y);
        this.idleTime = 0; 
    }
        

    // Método para cambiar el estado del animal a idle
    setIdleState() {
        this.isIdle = true; // Establece el estado idle
        this.direction = { x: 0, y: 0 }; // Deja de moverse
        this.updateIdleState(); // Cambia el sprite al estado idle
        this.idleWaitCounter = 0; // Reinicia el contador de espera en idle
    }

    // Método para salir del estado idle y volver a moverse
    exitIdleState() {
        this.isIdle = false; // Sale del estado idle
        this.setRandomDirection(); // Elige una nueva dirección aleatoria para moverse
        this.idleTime = 0; // Resetea el temporizador de inactividad
        this.directionChangeCounter = 0;
    }

    // Método cuando el animal está en estado idle (sin moverse)
    updateIdleState() {
        this.state.sprite = this.sprites.idle; // Cambia al sprite idle
        this.updateFrame(); // Actualiza el frame para la animación
    }

    moveCharacter() {
        const dx = this.direction.x * this.state.speed;
        const dy = this.direction.y * this.state.speed;
        const newX = this.state.position_x + dx;
        const newY = this.state.position_y + dy;

        const alignedX = Math.round(newX / this.tileSize) * this.tileSize;
        const alignedY = Math.round(newY / this.tileSize) * this.tileSize;

        const mapWidthPixels = this.animalCollisionLayer.width * this.tileSize;
        const mapHeightPixels = this.animalCollisionLayer.height * this.tileSize;

        if (alignedX >= 0 && alignedX + this.state.width <= mapWidthPixels &&
            alignedY >= 0 && alignedY + this.state.height <= mapHeightPixels &&
            !this.isCollision(alignedX, alignedY)) {
            this.state.position_x = newX;
            this.state.position_y = newY;
            this.lastDirection = { ...this.direction };
        } else {
            // Si hay una colisión, cambia automáticamente de dirección
            this.setRandomDirection();
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
                idle: 'assets/vaquita-comi-Sheet.png' 
            },
            'gallina': {
                walkRight: 'assets/gallina-dere.png',
                walkLeft: 'assets/gallina-izq.png',
                walkFront: 'assets/gallina-front.png',
                walkBack: 'assets/gallina-atras.png',
                idle: 'assets/galli-comiendo.png'
            },
        };
        return spriteMap[animalType] || spriteMap['vaca', 'gallina']; // Devuelve sprites por defecto si no se encuentra el tipo
    }

    updateFrame() {
        this.frameCounter++;

        // Cambia de frame cada 15 actualizaciones solo si no está en idle
        if (!this.isIdle && this.frameCounter % 15 === 0) {
            this.state.frame = (this.state.frame + 1) % 4; // Cambia de frame cada 15 actualizaciones
        }

        // En el estado idle también actualiza el frame para la animación
        if (this.isIdle && this.frameCounter % 15 === 0) {
            this.state.frame = (this.state.frame + 1) % 4; 
        }
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
            this.state.sprite = this.sprites.idle; // Cambia a idle si no hay movimiento
        }
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

    checkCharacterCollision(character) {
        const collides = this.isRectCollision(
          this.state.position_x,
          this.state.position_y,
          this.state.width,
          this.state.height,
          character.state.position_x,
          character.state.position_y,
          character.state.width,
          character.state.height
        );
      
        if (collides) {
          // Cambiar la dirección del animal y del personaje si colisionan
          this.setRandomDirection();
          character.setRandomDirection(); // Cambiar también la dirección del personaje
          return true;
        }
      
        return false;
      }
      
      checkAnimalCollisions(animals) {
        for (const otherAnimal of animals) {
          if (otherAnimal !== this) {
            const collides = this.isRectCollision(
              this.state.position_x,
              this.state.position_y,
              this.state.width,
              this.state.height,
              otherAnimal.state.position_x,
              otherAnimal.state.position_y,
              otherAnimal.state.width,
              otherAnimal.state.height
            );
      
            if (collides) {
              // Cambiar dirección de ambos animales al colisionar
              this.setRandomDirection();
              otherAnimal.setRandomDirection();
              return true;
            }
          }
        }
        return false;
      }
      
      isRectCollision(x1, y1, width1, height1, x2, y2, width2, height2) {
        return (
          x1 < x2 + width2 &&
          x1 + width1 > x2 &&
          y1 < y2 + height2 &&
          y1 + height1 > y2
        );
      }
      

    // Método para verificar si un tile está bloqueado en una capa específica
    isTileBlocked(x, y, layer) {
        const tileX = Math.floor(x / this.tileSize); // Índice del tile en x
        const tileY = Math.floor(y / this.tileSize); // Índice del tile en y
        const tileIndex = tileY * layer.width + tileX; // Índice en el array de tiles

        return layer.data[tileIndex] > 0; // Retorna true si el tile está bloqueado
    }
    
 
}
