

//Estado global

let p1 = crearJugador();
let p2 = crearJugador();
/* Contador de turno: 1 = le toca a p1, 2 = le toca a p2 */
let turnoActual      = 1;
/* Cuántas acciones se han realizado en total en esta batalla */
let movimientosTotales = 0;
/* Límite de movimientos antes de decidir por HP restante */
const MAX_MOVIMIENTOS  = 20;

/* Devuelve un objeto jugador con todos sus valores en estado inicial */
function crearJugador() {
  return { nombre: '', img: '', hp: 100, turnosPasados: 0, defendiendo: false, defEspecial: false };
}

//Inicio
//cuando el usuario hace clic en "Comenzar batalla".
async function iniciarBatalla() {
  const nombre1 = document.getElementById('poke1-input').value.trim();
  const nombre2 = document.getElementById('poke2-input').value.trim();
  const hint    = document.querySelector('.hint');

  //ambos campos deben tener texto
  if (!nombre1 || !nombre2) {
    hint.textContent  = '⚠ Escribe los dos Pokémon antes de continuar.';
    hint.style.color  = 'var(--hp-red)';
    return;
  }

  //indicamos que estamos cargando los datos y deshabilitamos el botón para evitar múltiples clics
  hint.textContent = 'Cargando…';
  hint.style.color = 'var(--muted)';
  document.querySelector('.btn-start').disabled = true;


  //peticiones a la API 
  try {
    const [data1, data2] = await Promise.all([obtenerPokemon(nombre1), obtenerPokemon(nombre2)]);

    configurarJugador(p1, data1, 'p1');
    configurarJugador(p2, data2, 'p2');
    movimientosTotales = 0;
    turnoActual        = 1;

    mostrarPantalla('battle-screen');
    actualizarTurnoBadge();
    actualizarNarrador('¡Comienza el combate!');
    setTimeout(simularTurno, 1800);

  } catch (e) {
    hint.textContent  = '⚠ Pokémon no encontrado. Verifica los nombres.';
    // Si alguno de los pokémon no existe, mostramos error y reactivamos el botón
    hint.style.color  = 'var(--hp-red)';
    document.querySelector('.btn-start').disabled = false;
  }
}
/* Toma los datos crudos de la API y los asigna al objeto jugador */
function configurarJugador(jugador, data, prefix) {
  jugador.nombre       = data.name.charAt(0).toUpperCase() + data.name.slice(1);
  jugador.img          = data.sprites.other['official-artwork'].front_default || data.sprites.front_default;
  jugador.hp           = 100;
  jugador.turnosPasados = 0;
  jugador.defendiendo  = false;
  jugador.defEspecial  = false;

  // Actualizamos el nombre e imagen en la tarjeta del HTML
  document.getElementById(`${prefix}-name`).innerText = jugador.nombre;
  document.getElementById(`${prefix}-img`).src        = jugador.img;
}

//simular cada turno
function simularTurno() {
  movimientosTotales++;

  // ¿Se acabaron los movimientos permitidos?
  if (movimientosTotales > MAX_MOVIMIENTOS) { finalizarPorLimite(); return; }
  // ¿Ya terminó la batalla antes de este turno?
  if (p1.hp <= 0 || p2.hp <= 0) return;

  const atacante = turnoActual === 1 ? p1 : p2;
  const defensor  = turnoActual === 1 ? p2 : p1;

  // Resaltar la tarjeta del jugador activo
  document.getElementById('card-p1').classList.toggle('active-turn', turnoActual === 1);
  document.getElementById('card-p2').classList.toggle('active-turn', turnoActual === 2);

  const accion = elegirAccion(atacante);
  const falla  = Math.random() < 0.20; // 20% de probabilidad de fallo

  if (falla) {
    addLog(movimientosTotales, `${atacante.nombre} usó <b>${accion}</b> — <span style="color:var(--muted)">falló</span>`);
    actualizarNarrador(`${atacante.nombre} falló.`);
  } else {
    procesarAccion(atacante, defensor, accion);
  }

  atacante.turnosPasados++;

  if (defensor.hp <= 0) {
    setTimeout(() => mostrarGanador(atacante), 1000);
  } else {
    turnoActual = turnoActual === 1 ? 2 : 1;
    actualizarTurnoBadge();
    setTimeout(simularTurno, 2200);
  }
}

/*
  Decide qué acción usará el atacante.
  - Ataque y Defensa: siempre disponibles
  - Defensa especial: requiere haber pasado 2 turnos
  - Ataque especial:  requiere haber pasado 3 turnos
*/
function elegirAccion(atacante) {
  const opciones = ['ataque', 'defensa'];
  if (atacante.turnosPasados >= 2) opciones.push('def-especial');
  if (atacante.turnosPasados >= 3) opciones.push('especial');
  return opciones[Math.floor(Math.random() * opciones.length)];
}

/* ── Procesamiento de cada acción ──────── */

function procesarAccion(atacante, defensor, tipo) {
  let danio     = 0;
  let msgAccion = '';
  let msgExtra  = '';

  // Resetear estado de defensa del atacante
  atacante.defendiendo = false;
  atacante.defEspecial = false;

  if (tipo === 'ataque') {
    danio     = Math.floor(Math.random() * 15) + 10; // 10–24 de daño
    msgAccion = 'atacó';

  } else if (tipo === 'especial') {
    danio     = Math.floor(Math.random() * 25) + 20; // 20–44 de daño
    msgAccion = 'usó <b>ataque especial</b>';
    atacante.turnosPasados = -1; // reset del cooldown

  } else if (tipo === 'defensa') {
    atacante.defendiendo = true;
    msgAccion = 'se <b>defendió</b>';

  } else if (tipo === 'def-especial') {
    atacante.defEspecial  = true;
    msgAccion = 'activó <b>defensa especial</b>';
    atacante.turnosPasados = -1; // reset del cooldown
  }

  // Aplicar daño considerando defensas del oponente
  if (danio > 0) {
    if (defensor.defEspecial) {
      danio    = 0;
      msgExtra = '<span style="color:var(--muted)">— bloqueado</span>';

    } else if (defensor.defendiendo) {
      danio    = Math.floor(danio / 2);
      msgExtra = '<span style="color:var(--muted)">— mitad de daño</span>';
    }

    if (danio > 0) {
      defensor.hp = Math.max(0, defensor.hp - danio);
      animarDanio(turnoActual === 1 ? 'card-p2' : 'card-p1');
      msgExtra = `— <b>${danio}%</b> de daño · ${defensor.nombre}: <b>${defensor.hp}%</b> HP`;
    }

    actualizarBarrasHP();
  }

  addLog(movimientosTotales, `${atacante.nombre} ${msgAccion} ${msgExtra}`);
  actualizarNarrador(`${atacante.nombre} ${msgAccion.replace(/<[^>]+>/g, '')} ${msgExtra.replace(/<[^>]+>/g, '')}`);
}

/* ── Fin de partida ────────────────────── */

function finalizarPorLimite() {
  if (p1.hp === p2.hp) {
    actualizarNarrador('Empate técnico — límite alcanzado.');
    addLog('—', 'Empate por límite de movimientos.');
    return;
  }
  const ganador = p1.hp > p2.hp ? p1 : p2;
  actualizarNarrador(`Límite alcanzado — gana ${ganador.nombre}.`);
  setTimeout(() => mostrarGanador(ganador), 1500);
}

function mostrarGanador(ganador) {
  mostrarPantalla('winner-screen');
  document.getElementById('winner-name').innerText  = ganador.nombre;
  document.getElementById('winner-img').src          = ganador.img;
  document.getElementById('winner-stats').innerText =
    `HP final: ${ganador.hp}%  ·  ${movimientosTotales} movimientos`;
}