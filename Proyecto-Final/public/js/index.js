import { CharacterView } from './CharacterView.js';
import { CharacterModel } from './CharacterModel.js';
import { CharacterController } from './CharacterController.js';
import { AnimalModel } from './CharacterModel.js';
import { NPC } from './CharacterModel.js';

async function main() {
    const container = document.getElementById('game-container');

    if (!container) {
        console.error('El contenedor del juego no existe.');
        return;
    }

    let canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;

    container.appendChild(canvas);
    const context = canvas.getContext('2d');

    let characterModel = new CharacterModel();
    let characterView = new CharacterView(context, characterModel); 
    let characterController = new CharacterController(characterModel, characterView, characterModel.animalCollisionLayer);

    characterController.addEventListener('missionCompleted', () => {
        characterView.setUnicornVisible();
    });    

    let gallina, vaca, conejo, unicornio, chica;

    try {
        const mapData = await characterModel.loadMap('/maps/mapa.tmj');
        if (!mapData) {
            throw new Error('No se pudo cargar el mapa. Los datos son nulos.');
        }

        // Establece el estado del personaje en la vista
        characterView.state = characterModel.state; 
        const tileSize = 64;
        characterView.mapData = mapData;
        characterView.drawMap(mapData, context, tileSize);

        vaca = new AnimalModel('vaca', characterModel.animalCollisionLayer);
        gallina = new AnimalModel('gallina', characterModel.animalCollisionLayer);
        conejo = new AnimalModel ('conejo', characterModel.animalCollisionLayer);
        unicornio = new AnimalModel ('unicornio', characterModel.animalCollisionLayer);
        chica = new NPC('Katia');

        vaca.state.position_x = 128;
        vaca.state.position_y = 128;
        characterView.addAnimal(vaca);

        gallina.state.position_x = 128;
        gallina.state.position_y = 128;
        characterView.addAnimal(gallina);

        conejo.state.position_x = 128;
        conejo.state.position_y = 128;
        characterView.addAnimal(conejo);

        unicornio.state.position_x = 245;
        unicornio.state.position_y = 420;
        unicornio.state.isVisible = false;
        characterView.addAnimal(unicornio);

        chica.state.position_x = 332;
        chica.state.position_y = 288;
        characterView.addNpc(chica);


    } catch (error) {
        console.error('Error loading map:', error);
    }

    function animateAnimals() {
        if (vaca) vaca.updatePosition(); 
        if (gallina) gallina.updatePosition(); 
        if (conejo) conejo.updatePosition();
        if (unicornio) unicornio.updatePosition();
        characterView.update(); 
        
        requestAnimationFrame(animateAnimals); 
    }    
    animateAnimals();

    function animateNpcs() {
        characterView.update(); 
        requestAnimationFrame(animateNpcs); 
    }    
    animateNpcs(); 

    characterController.connect(); 
}
// Ejecuta la función main cuando la ventana se carga
window.onload = main; 