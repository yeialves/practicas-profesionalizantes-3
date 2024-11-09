export class CharacterView extends HTMLElement {
    constructor(drawingContext, characterModel) {
        super();
        this.drawingContext = drawingContext;
        this.characterModel = characterModel;
        this.currentState = null;
        this.inventoryBox = this.createInventoryBox(); 
        this.animals = [];
        this.npcs = [];
        
        this.cameraWidth = 640;  
        this.cameraHeight = 480;
        this.loadedImages = {};

        this.frameCounter = 0; 
        this.idleFrameRate = 10; 
        this.defaultFrameRate = 5;
    
        
        this.showInventory();
    }

    createInventoryBox() {
        const inventoryBox = document.createElement('div');
        inventoryBox.style.position = 'absolute';
        inventoryBox.style.top = '140px'; 
        inventoryBox.style.left = '51%';
        inventoryBox.style.transform = 'translateX(-50%)';
        inventoryBox.style.backgroundColor = '#6b4006';
        inventoryBox.style.color = 'white';
        inventoryBox.style.padding = '10px';
        inventoryBox.style.borderRadius = '15px'; 
        inventoryBox.style.border = '4px solid #f81aa6 '; 
        inventoryBox.style.fontFamily = '"Pixelify Sans", sans-serif'; 
        document.body.appendChild(inventoryBox); 
        return inventoryBox;
    }

    showInventory() {
        let activeUser = JSON.parse(localStorage.getItem('activeUser'));
    
        if (!activeUser) {
            this.inventoryBox.textContent = "No hay usuario activo.";
            return;
        }
    
        
        if (!activeUser.inventory) {
            activeUser.inventory = {}; 
            localStorage.setItem('activeUser', JSON.stringify(activeUser)); 
        }
    
     
        this.inventoryBox.textContent = "INVENTARIO: ";
    
        const crops = ['zanahoria', 'choclo', 'trigo'];
    
        // Crear un contenedor principal para los cultivos 
        const cropsContainer = document.createElement('div');
        cropsContainer.style.display = 'flex';
        cropsContainer.style.flexDirection = 'row'; 
        cropsContainer.style.flexWrap = 'wrap'; 
    
        crops.forEach(crop => {
            const count = activeUser.inventory[crop] || 0;
            if (count > 0) {
                const cropContainer = document.createElement('div');
                cropContainer.style.display = 'flex';
                cropContainer.style.alignItems = 'center';
                cropContainer.style.marginRight = '20px'; 
                
                // Crear la imagen del cultivo
                const cropImage = document.createElement('img');
                cropImage.src = `/assets/${crop}.png`;  
                cropImage.style.width = '25px'; 
                cropImage.style.height = '25px'; 
                cropImage.style.marginRight = '5px'; 
                
                const text = document.createElement('span');
                text.textContent = `${crop}: ${count}`;
                
                cropContainer.appendChild(cropImage);
                cropContainer.appendChild(text);
                
                cropsContainer.appendChild(cropContainer);
            }
        });
    
        if (cropsContainer.children.length === 0) {
            const emptyText = document.createElement('span');
            emptyText.textContent = "Inventario vacío.";
            this.inventoryBox.appendChild(emptyText);
        } else {
            this.inventoryBox.appendChild(cropsContainer);  
        }
    }
 
    refreshInventory() {
        this.showInventory();
    }

    set state(newState) {
        this.currentState = newState;
        this.update();
    }

    get state() {
        return this.currentState;
    }

    setMapData(mapData) {
    this.mapData = mapData;
    this.shouldDrawAnimalsAndNpcs = (mapData.fileName === '/maps/mapa.tmj');
    }

    update() {
    this.drawingContext.clearRect(0, 0, this.drawingContext.canvas.width, this.drawingContext.canvas.height);

    if (this.mapData) {
        this.drawMap(this.mapData, this.drawingContext, 64);
    }

    // Dibuja el personaje principal
    if (this.state) {
        this.drawCharacter(this.state);
    }

    // Verifica si el mapa actual es 'mapa.tmj' antes de dibujar animales y NPCs
    if (this.mapData && this.mapData.fileName === 'mapa.tmj') {
        // Dibuja animales solo si son visibles
        this.animals.forEach(animal => {
            if (animal && animal.state && animal.state.isVisible) {
                this.drawCharacter(animal.state);
            }
        });

        // Dibuja NPCs siempre
        this.npcs.forEach(npc => {
            npc.updateIdleState(); 
            this.drawCharacter(npc.state); 

            if (npc.checkProximity(this.characterModel)) {
                // Dispara un evento personalizado de proximidad a NPC
                const event = new CustomEvent('npcProximity', {
                    detail: {
                        npc: npc
                    }
                });
                this.dispatchEvent(event); 
            }
        });
    }
}  

    
    drawCharacter(state) {
        let img = this.loadedImages[state.sprite];
        if (!img) {
            img = new Image();
            img.src = state.sprite;
            this.loadedImages[state.sprite] = img;
    
            // Dibuja la imagen solo después de que se haya cargado
            img.onload = () => {
                this.renderCharacter(state, img);
            };
        } else {
            this.renderCharacter(state, img);
        }
    
        // Si la imagen ya está cargada, dibuja inmediatamente
        if (img.complete) {
            this.renderCharacter(state, img);
        }
    }
    
    renderCharacter(state, img) {
        const relativeX = state.position_x - (this.state.position_x - this.cameraWidth / 2);
        const relativeY = state.position_y - (this.state.position_y - this.cameraHeight / 2);
    
        const width = state.width || 64;
        const height = state.height || 64;
    
        this.drawingContext.drawImage(
            img,
            state.frame * width, 0, width, height, 
            relativeX, relativeY, width, height
        );
    }

    addAnimal(animalModel) {
        this.animals.push(animalModel);
    }

    addNpc(NpcModel) { 
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

    setUnicornVisible() {
        const unicornio = this.animals.find(animal => animal.animalType === 'unicornio');
        if (unicornio) {
            unicornio.setVisible(); 
            this.update();
        }
    }
    
    
}
// Función para cargar Google Fonts desde JavaScript
function loadGoogleFont() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400..700&display=swap';
    document.head.appendChild(link);
}

loadGoogleFont();
// Registra el componente 'character-view' para el DOM
customElements.define('character-view', CharacterView);

