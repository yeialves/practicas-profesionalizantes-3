export class CharacterView extends HTMLElement {
    constructor(drawingContext) {
        super(); 
        this.drawingContext = drawingContext;
        this.currentState = null;
        this.animals = [];
        this.npcs = []; // Inicializa la lista de NPCs

        this.cameraWidth = 640;  
        this.cameraHeight = 480;

        this.loadedImages = {};

        this.messageBox = document.createElement('div');
        this.messageBox.style.position = 'absolute';
        this.messageBox.style.top = '20px';
        this.messageBox.style.left = '20px';
        this.messageBox.style.padding = '10px';
        this.messageBox.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.messageBox.style.color = 'white';
        this.messageBox.style.display = 'none'; 
        document.body.appendChild(this.messageBox);

        this.addEventListener('felixNearChica', () => {
            if (!this.alertShown) {
                this.showMessage("Holis"); 
                this.alertShown = true;
                this.isNearChica = true;
            }
        });
    }

    showMessage(message) {
        this.messageBox.textContent = message;
        this.messageBox.style.display = 'block';
        
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

    update() {
        this.drawingContext.clearRect(0, 0, this.drawingContext.canvas.width, this.drawingContext.canvas.height);
    
        if (this.mapData) {
            this.drawMap(this.mapData, this.drawingContext, 64);
        } 
    
        if (this.state) {
            this.drawCharacter(this.state);
        }
    
        if (this.mapData && this.mapData.fileName) {
            if (this.mapData.fileName === 'mapa.tmj') {
                this.animals.forEach(animal => {
                    if (animal && animal.state) {
                        this.drawCharacter(animal.state);
                    }
                });
                this.npcs.forEach(npc => {  // Dibuja los NPCs
                    if (npc && npc.state) {
                        this.drawCharacter(npc.state);
                    }
                });
            }
        }
    }

    drawCharacter(state) {
        let img = this.loadedImages[state.sprite];
        if (!img) {
            img = new Image();
            img.src = state.sprite;
            this.loadedImages[state.sprite] = img;
        }

        img.onload = () => {
            const relativeX = state.position_x - (this.state.position_x - this.cameraWidth / 2);
            const relativeY = state.position_y - (this.state.position_y - this.cameraHeight / 2);
    
            const width = state.width || 64;
            const height = state.height || 64;
    
            this.drawingContext.drawImage(
                img,
                state.frame * width, 0, width, height, 
                relativeX, relativeY, width, height
            );
        };

        if (img.complete) {
            img.onload(); 
        }
    }

    addAnimal(animalModel) {
        this.animals.push(animalModel);
    }

    addNpc(NpcModel) { // Añade NPC a la lista
        this.npcs.push(NpcModel);
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

                            if (
                                tilePosX + tileSize > cameraX && tilePosX < cameraX + this.cameraWidth &&
                                tilePosY + tileSize > cameraY && tilePosY < cameraY + this.cameraHeight
                            ) {
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
