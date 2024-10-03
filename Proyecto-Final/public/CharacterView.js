export class CharacterView extends HTMLElement {
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


            
     

    

