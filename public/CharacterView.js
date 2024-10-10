export class CharacterView extends HTMLElement {
    constructor(drawingContext) {
        super(); 
        this.drawingContext = drawingContext;
        this.currentState = null;
        this.animals = [];
        
        // Instancia de Chica
        this.Chica = new this.Chica(300, 300, 'assets/Chica-Walk-Front-Sheet-64x64.png'); 
        this.alertShown = false; 
        this.isNearChica = false;

        // Tamaño de la cámara (el área visible alrededor del personaje)
        this.cameraWidth = 512;  
        this.cameraHeight = 512;

        // Crear un elemento de mensaje en pantalla
        this.messageBox = document.createElement('div');
        this.messageBox.style.position = 'absolute';
        this.messageBox.style.top = '20px';
        this.messageBox.style.left = '20px';
        this.messageBox.style.padding = '10px';
        this.messageBox.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.messageBox.style.color = 'white';
        this.messageBox.style.display = 'none'; 
        document.body.appendChild(this.messageBox);

        // Event Listener
        this.addEventListener('felixNearChica', () => {
            if (!this.alertShown) {
                this.showMessage("Holis"); 
                this.alertShown = true;
                this.isNearChica = true;
            }
        });
    }
   
    // Mostrar un mensaje en la pantalla
    showMessage(message) {
        this.messageBox.textContent = message;
        this.messageBox.style.display = 'block';
        
        // Ocultar el mensaje despues de 3 segundos
        setTimeout(() => {
            this.messageBox.style.display = 'none';
        }, 3000);
    }

    set state(newState) {
        this.currentState = newState;
        this.update();
    }

    get state() {
        return this.currentState;
    }

    Chica = class {
        constructor(x, y, sprite) {
            this.position_x = x; // Posición fija en x
            this.position_y = y; // Posición fija en y
            this.sprite = sprite; // Sprite de Chica
            this.image = new Image();
            this.image.src = sprite; // Carga el sprite de Chica
        }
    
        draw(context) {
            context.drawImage(this.image, this.position_x, this.position_y, 64, 64); 
        }
    }
    

    update() {
        this.drawingContext.clearRect(0, 0, this.drawingContext.canvas.width, this.drawingContext.canvas.height);
    
        if (this.mapData) {
            this.drawMap(this.mapData, this.drawingContext, 64);
        }
    
        // Dibuja a Chica en su posición fija primero
        this.Chica.draw(this.drawingContext); // Dibuja a Chica en su posición fija

        // Dibuja a Felix
        if (this.state) {
            this.drawCharacter(this.state); // Dibuja a Felix
        }

        // Verifica la proximidad
        this.checkProximity();

        // Verifica si this.mapData tiene la propiedad fileName
        if (this.mapData && this.mapData.fileName) {
            // Dibuja a los animales solo si están en el mapa 'mapa.tmj'
            if (this.mapData.fileName === 'mapa.tmj') {
                this.animals.forEach(animal => {
                    if (animal && animal.state) {
                        this.drawCharacter(animal.state);
                    }
                });
            }
        }
    }

    checkProximity() {
        // Verifica la proximidad entre Felix y Chica
        const distance = Math.sqrt(
            Math.pow(this.state.position_x - this.Chica.position_x, 2) +
            Math.pow(this.state.position_y - this.Chica.position_y, 2)
        );
    
        // Si Felix está cerca de Chica y no se mostro el mensaje
        if (distance < 80 && !this.isNearChica) {
            console.log("Felix se acerca a Chica!");
            this.dispatchEvent(new CustomEvent('felixNearChica')); 
        }
    
        // Si Felix se aleja de Chica (fuera del rango) y estaba marcado como "cerca"
        if (distance >= 80 && this.isNearChica) {
            console.log("Felix se aleja de Chica!");
            this.isNearChica = false; // Resetea la proximidad para permitir que se active nuevamente
            this.alertShown = false;  // Resetea la alerta para permitir que el mensaje se muestre de nuevo
        }
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
            if (layer.type === 'tilelayer' && layer.name !== 'collision' && layer.name !== 'animalCollision' && layer.name !== 'rabbitCollision') {
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
