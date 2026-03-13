
/* Oculta todas las pantallas y muestra la indicada */
function mostrarPantalla(idPantalla) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(idPantalla).classList.add('active');
}

/* Actualiza ambas barras de HP y cambia el color según el % restante */
function actualizarBarrasHP() {
  ['p1', 'p2'].forEach(prefix => {
    const jugador = prefix === 'p1' ? p1 : p2;
    const barra   = document.getElementById(`${prefix}-hp-bar`);
    const texto   = document.getElementById(`${prefix}-hp-text`);

    texto.innerText    = jugador.hp;
    barra.style.width  = jugador.hp + '%';
    barra.style.background =
      jugador.hp > 50 ? 'var(--hp-green)'  :
      jugador.hp > 25 ? 'var(--hp-yellow)' :
                        'var(--hp-red)';
  });
}

/* Muestra el texto principal en el recuadro central */
function actualizarNarrador(mensaje) {
  document.getElementById('narrator-text').innerText = mensaje;
}

/* Actualiza el badge que indica de quién es el turno */
function actualizarTurnoBadge() {
  const nombre = turnoActual === 1 ? p1.nombre : p2.nombre;
  document.getElementById('turn-badge').innerText = `MOV ${movimientosTotales + 1} · ${nombre}`;
}

/* Agrega una fila al log de movimientos (al principio para verlo más reciente) */
function addLog(numero, html) {
  const fila       = document.createElement('div');
  fila.className   = 'log-item';
  fila.innerHTML   = `<span class="move-num">#${numero}</span>${html}`;
  const lista      = document.getElementById('log-list');
  lista.insertBefore(fila, lista.firstChild);
}

/* Aplica la animación de golpe a la tarjeta que recibe daño */
function animarDanio(cardId) {
  const card = document.getElementById(cardId);
  card.classList.add('taking-damage');
  setTimeout(() => card.classList.remove('taking-damage'), 550);
}