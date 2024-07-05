document.addEventListener('DOMContentLoaded', function() {
    const provinciasSelect = document.getElementById('provincias');
    const departamentosSelect = document.getElementById('departamentos');
    const municipiosSelect = document.getElementById('municipios');
    const localidadesSelect = document.getElementById('localidades');

    // Función para cargar las provincias desde la WebAPI
    function cargarProvincias() {
        fetch('/provincias')
            .then(response => response.json())
            .then(data => {
                data.forEach(provincia => {
                    const option = document.createElement('option');
                    option.value = provincia.idProvincia;
                    option.textContent = provincia.nombre;
                    provinciasSelect.appendChild(option);
                });
            })
            .catch(error => console.error('Error al cargar las provincias:', error));
    }

    // Función para cargar los departamentos/municipios por provincia
    function cargarDepartamentos(provinciaId) {
        fetch(`/departamentos/${provinciaId}`)
            .then(response => response.json())
            .then(data => {
                departamentosSelect.innerHTML = '';
                data.forEach(departamento => {
                    const option = document.createElement('option');
                    option.value = departamento.idDepartamento;
                    option.textContent = departamento.nombre;
                    departamentosSelect.appendChild(option);
                });
            })
            .catch(error => console.error('Error al cargar los departamentos:', error));
    }

    // Función para cargar los municipios por departamento
    function cargarMunicipios(departamentoId) {
        fetch(`/municipios/${departamentoId}`)
            .then(response => response.json())
            .then(data => {
                municipiosSelect.innerHTML = '';
                data.forEach(municipio => {
                    const option = document.createElement('option');
                    option.value = municipio.idMunicipio;
                    option.textContent = municipio.nombre;
                    municipiosSelect.appendChild(option);
                });
            })
            .catch(error => console.error('Error al cargar los municipios:', error));
    }

      // Al seleccionar  obtener las localidades correspondientes
      departamentosSelect.addEventListener('change', () => {
        const departamentoId = departamentosSelect.value;
        fetch(`/localidades/${departamentoId}`)
            .then(response => response.json())
            .then(data => {
                localidadesSelect.innerHTML = '';
                data.forEach(localidad => {
                    const option = document.createElement('option');
                    option.value = localidad.idLocalidad;
                    option.textContent = localidad.nombre;
                    localidadesSelect.appendChild(option);
                });
            });
    });

    // Evento al cambiar la provincia
    provinciasSelect.addEventListener('change', () => {
        const provinciaId = provinciasSelect.value;
        cargarDepartamentos(provinciaId);
    });

    // Evento al cambiar el departamento/municipio
    departamentosSelect.addEventListener('change', () => {
        const departamentoId = departamentosSelect.value;
        cargarMunicipios(departamentoId);
    });

    // Evento al cambiar el municipio
    municipiosSelect.addEventListener('change', () => {
        const municipioId = municipiosSelect.value;
        cargarLocalidades(municipioId);
    });

    // Evento al cambiar el municipio
    localidadesSelect.addEventListener('change', () => {
        const localidadId = localidadesSelect.value;
        cargarLocalidades(localidadId);
    });

    // Cargar las provincias al cargar la página
    cargarProvincias();
});

document.getElementById('consultar').addEventListener('click', function() {
    const provincia = document.getElementById('provincias').options[document.getElementById('provincias').selectedIndex].text;
    const departamento = document.getElementById('departamentos').options[document.getElementById('departamentos').selectedIndex].text;
    const municipio = document.getElementById('municipios').options[document.getElementById('municipios').selectedIndex].text;
    const localidad = document.getElementById('localidades').options[document.getElementById('localidades').selectedIndex].text;

    const mensaje = `Provincia: ${provincia}\nDepartamento: ${departamento}\nMunicipio: ${municipio}\nLocalidad: ${localidad}`;
    alert(mensaje);
});