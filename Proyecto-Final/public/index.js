// Importar las clases desde sus respectivos módulos
import { CharacterView } from './CharacterView.js';
import { CharacterModel } from './CharacterModel.js';
import { CharacterController } from './CharacterController.js';
import { AnimalModel } from './CharacterModel.js';

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

    let vaca;

    try {
        const mapData = await characterModel.loadMap('mapa.tmj');
        if (!mapData) {
            throw new Error('No se pudo cargar el mapa. Los datos son nulos.');
        }

        // Establece el estado del personaje en la vista
        characterView.state = characterModel.state; 
        const tileSize = 64;
        characterView.mapData = mapData;
        characterView.drawMap(mapData, context, tileSize);

        vaca = new AnimalModel('vaca', characterModel.animalCollisionLayer);
    

        vaca.state.position_x = 128;
        vaca.state.position_y = 128;
        characterView.addAnimal(vaca);

    } catch (error) {
        console.error('Error loading map:', error);
    }

    function animateAnimals() {
        vaca.updatePosition(); // Actualiza la posición del animal
        characterView.update(); // Actualiza la vista para redibujar el animal en su nueva posición
        requestAnimationFrame(animateAnimals); // Llama a la animación de nuevo en el siguiente frame
    }
    animateAnimals(); // Inicia la animación de los animales 

    characterController.connect();
}

// Ejecuta la función main cuando la ventana se carga
window.onload = main; 