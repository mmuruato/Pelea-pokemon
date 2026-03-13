

/* window.onload se ejecuta automáticamente cuando el 
navegador termina de cargar toda la página HTML.*/

window.onload = async function () {
  cargarListaAutocomplete();
  activarPreviewsEnVivo();
};

/* Llena el <datalist> con los nombres de los 1000 primeros pokémon */
async function cargarListaAutocomplete() {
  try {
    const res  = await fetch('https://pokeapi.co/api/v2/pokemon?limit=1000');
    const data = await res.json();
    const dl   = document.getElementById('pokemon-list');// El <datalist> del HTML 

// Por cada pokémon, creamos un <option> y lo metemos al <datalist>   
    data.results.forEach(({ name }) => {
      const option   = document.createElement('option');
      option.value   = name;
      dl.appendChild(option);
    });

  } catch (e) {
    // Si falla la conexión, el juego sigue funcionando (solo sin sugerencias)
    console.warn('No se pudo cargar el autocompletado:', e);
  }
}

/* Muestra la imagen del pokémon mientras el usuario escribe */
function activarPreviewsEnVivo() {
  const campos = [
    { inputId: 'poke1-input', imgId: 'preview1' },
    { inputId: 'poke2-input', imgId: 'preview2' },
  ];

  campos.forEach(({ inputId, imgId }) => {
    let timer;
    document.getElementById(inputId).addEventListener('input', function () {
      clearTimeout(timer);
      const nombre = this.value.trim().toLowerCase();
      if (!nombre) return;

      // Espera 500ms después de que el usuario deje de escribir
      timer = setTimeout(() => mostrarPreview(nombre, imgId), 500);
    });
  });
}

/* Consulta la API y actualiza el <img> de preview si el pokémon existe */
async function mostrarPreview(nombre, imgId) {
  try {
    const data = await obtenerPokemon(nombre);
    const img  = document.getElementById(imgId);
    img.src    = data.sprites.other['official-artwork'].front_default
              || data.sprites.front_default;
    img.classList.add('visible');
  } catch (e) {
    // Si el nombre no existe, no muestra nada
  }
}

/* Obtiene todos los datos de un pokémon desde la API */
async function obtenerPokemon(nombre) {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${nombre.toLowerCase()}`);
  if (!res.ok) throw new Error(`Pokémon "${nombre}" no encontrado`);
  return res.json();
}