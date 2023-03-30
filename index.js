/**
 * Clase Log
 * Muestra mensajes en la consola del navegador
 */
class Log {
  /**
   * Muestra un mensaje en la consola con la fecha y hora en que se realiza la acción
   * @param message Texto a mostrar
   */
  static log(message) {
    const date = (new Date()).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    console.log(`[${date}]: ${message}`);
  }

  /**
   * Muestra un mensaje en la consola
   * @param message Texto a mostrar
   */
  static logNoDate(message) {
    console.log(message);
  }
}

/**
 * Clase Game
 * _Crea los elementos necesarios para el juego e interactua con el usuario
 */
class Game {

  container;
  gridContainer;
  tilesLine = 10;
  bombs = 10;
  totalTiles = Math.pow(this.tilesLine, 2);
  tilesList = [];

  /**
   * Constructor de la clase Game
   * @param container Elmento HTML donde insertar el juego
   */
  constructor(container) {
    this.container = container;
    if (!parseInt(getComputedStyle(this.container).width)) {
      this.container.style.width = '100%' ;
    }
    this.container.style.height = getComputedStyle(this.container).width;
    const attrUserBombs = +this.container.getAttribute('bombs');
    const paramUserBombs = +(new URL(location).searchParams.get('bombs'));
    const customBombs = paramUserBombs || attrUserBombs;
    if (customBombs && Math.round(customBombs) < this.totalTiles / 4) {
      this.bombs = Math.round(customBombs);
    }
    window.addEventListener('resize', (event) => {
      this.paintItems();
      this.tilesList.filter(i => i.getIsPlayed())?.forEach(item => item.updateTile());
    });
    Log.log(`Constructor: Juego con ${this.totalTiles} items (${this.tilesLine} por línea)`);
  }

  /**
   * Inicia el juego (componentes y partida)
   */
  initGame() {
    Log.log(`Inciando juego`);
    this.createGridContainer();
    this.setTilesList();
    this.setNearBombs();
    if (new URL(location).searchParams.get('showgrid')) {
      this.showGridInConsole();
    }
    this.paintItems();
    this.gridContainer.addEventListener('ItemPlayed', (event) => this.checkItemPlayed(+event.detail.id));
  }

  /**
   * Comprueba una casilla una vez pulsada
   * @param id Indíce de la casilla pulsada a comprobar
   */
  checkItemPlayed(id) {
    if (this.tilesList[id].getIsBomb()) {
      this.tilesList.filter(i => !i.getUpdated())?.forEach(item => {
        item.setIsPlayed();
        item.updateTile();
      });
      this.showGameOverMessage();
      Log.log('Game Over');
      return;
    }

    if (this.tilesList[id].getIsPlayed()) {
      return;
    }
    this.tilesList[id].setIsPlayed();

    if (!this.tilesList[id].getNearBombs()) {
      this.checkNeighbours(id);
    }

    this.tilesList.filter(i => i.getIsPlayed() && !i.getUpdated())?.forEach((item, idx, list) => {
      item.updateTile();
      if (!this.tilesList[id].getNearBombs() && idx === list.length - 1) {
        Log.log(`${list.length} casillas vacías descubiertas (Total descubiertas: ${this.tilesList.filter(i => i.getIsPlayed()).length})`);
      }
    });

    if (this.tilesList.filter(i => !i.getIsPlayed())?.length === this.bombs) {
      this.tilesList.forEach(t => t.setIsPlayed());
      this.showGameFinishedMessage();
      Log.log('Juego finalizado con éxito');
    }
  }

  /**
   * Muestra la rejilla con la que se crea el tablero de juego en la consola del navegador
   */
  showGridInConsole() {
    Log.log('Rejilla de juego:');
    let line = '';
    this.tilesList.forEach(b => {
      line += '[' + (b.getIsBomb() ? 'B' : b.getNearBombs()) + ']';
      if (b.id % this.tilesLine === 9) {
        line += "\n";
      }
    });
    Log.logNoDate(line);
  }

  /**
   * Crea el contenedor para la rejilla con los items donde buscar las minas.
   */
  createGridContainer() {
    if (this.gridContainer) {
      this.gridContainer.remove();
    }
    this.gridContainer = document.createElement('div');
    this.gridContainer.style.display = 'grid';
    this.gridContainer.style.gridTemplateColumns = `repeat(${this.tilesLine}, 1fr)`;
    this.container.appendChild(this.gridContainer);

    Log.log('Creado contenedor para rejilla de juego');
  }

  /**
   * Crea la lista con la información de todas las piezas del tablero de juego
   */
  setTilesList() {
    this.tilesList = new Array(this.totalTiles).fill(null).map((_i, idx) => new Tile(idx));
    let bombsSetted = 0;
    do {
      const newBomb = Math.floor(Math.random() * this.totalTiles);
      if (!this.tilesList[newBomb].getIsBomb()) {
        this.tilesList[newBomb].setIsBomb()
        bombsSetted++;
      }
    } while(bombsSetted < this.bombs);

    Log.log(`Creada lista de baldosas con ${bombsSetted} bombas`);
  }

  /**
   * Establece la información sobre las bombas cercanas en las casillas que lo requieran
   */
  setNearBombs() {
    this.tilesList.forEach((item, index) => {
      let bombsFound = 0;
      const row = this.getRow(index);
      const col = this.getCol(index);

      const pointsToCheck = [];

      const up = row > 0 ? this.tilesLine * -1 : 0;
      const down = row < this.tilesLine - 1 ? this.tilesLine : 0;
      const left = col > 0 ? -1 : 0;
      const right = col < this.tilesLine - 1 ? 1 : 0;

      pointsToCheck.push(index + left);
      pointsToCheck.push(index + left + up);
      pointsToCheck.push(index + up);
      pointsToCheck.push(index + right + up);
      pointsToCheck.push(index + right);
      pointsToCheck.push(index + right + down);
      pointsToCheck.push(index + down);
      pointsToCheck.push(index + left + down);

      Array.from(new Set(pointsToCheck.filter(i => i !== index))).forEach(i => {
        if (this.tilesList[i].getIsBomb()) bombsFound++;
      });

      item.setNearBombs(bombsFound);
    });

    Log.log(`Información de bombas cercanas informadas en las casillas del tablero`);
  }

  /**
   * Obtiene la fila a la que pertenece una casilla
   * @param index Índice de la casilla en la lista
   * @returns el número de fila
   */
  getRow(index) {
    return Math.floor(index / this.tilesLine);
  }

  /**
   * Obtiene la columna a la que pertenece una casilla
   * @param index Índice de la casilla en la lista
   * @returns el núemero de columna
   */
  getCol(index) {
    return index % this.tilesLine;
  }

  /**
   * Devuelve si la casilla jugada esta cerca de una bomba
   * @param id Índice en la lista de la casilla jugada
   * @returns boolean
   */
  getPlayedNoBombs(id) {
    return (!this.tilesList[id].getNearBombs() && !this.tilesList[id].getIsPlayed());
  }

  /**
   * Comprueba si una casilla jugada contiene bombas
   * @param id Índice en la lista de la casilla jugada
   */
  checkItemNoBombs(id) {
    if(this.getPlayedNoBombs(id)) {
      this.tilesList[id].setIsPlayed();
      this.checkNeighbours(id);
    }
  }

  /**
   * Comprueba casillas de una misma fila
   * @param id Índice en la lista de la casilla jugada
   * @param direction Dirección en que se comprobará la siguiente casilla (izquierda o derecha)
   */
  checkRowNeighbours(id, direction) {
    const newId = id + direction;

    if (this.getRow(id) === this.getRow(newId)) {
      this.checkItemNoBombs(newId);
    }
  }

  /**
   * Comprueba casillas de una misma columna
   * @param id Índice en la lista de la casilla jugada
   * @param direction Dirección en que se comprobará la siguiente casilla (arriba o abajo)
   */
  checkColNeighbours(id, upDown) {
    const newId = id + (this.tilesLine * upDown);
    const isInside = this.getRow(newId) >= 0 && this.getRow(newId) < this.tilesLine;

    if (isInside) {
      this.checkItemNoBombs(newId);
    }
  }

  /**
   * Comprueba las casillas cercanas a la que se ha jugado
   * @param id Índice en la lista de la casilla jugada
   */
  checkNeighbours(id) {
    this.checkColNeighbours(id, -1);
    this.checkColNeighbours(id, 1);
    this.checkRowNeighbours(id, 1);
    this.checkRowNeighbours(id, -1);
  }

  /**
   * Crea los elementos del tablero de juego para mostrar en pantalla
   */
  paintItems() {
    Array.from(this.gridContainer.children)?.forEach(i => i.remove());
    this.tilesList.forEach(tile => this.gridContainer.appendChild(tile.createItem()));

    Array.from(this.container.querySelectorAll('.buscaminas_tile'))?.forEach(obj => {
      const fontSize = (parseInt(getComputedStyle(this.gridContainer).width) / this.tilesLine) - 4;
      obj.style.fontSize = `${fontSize}px`;
    });

    Log.log('Rejilla mostrada en pantalla');
  }

  /**
   * Elimina el overlay del contenedor del juego
   */
  removeOverlay() {
    this.container.querySelector('.buscaminas_overlay')?.remove();
  }

  /**
   * Crea un pop-up para mostrar mensajes
   * @param {*} data Objeto con los datos para crear el pop-up
   * @returns Un elemento HTML
   */
  createPopUpMessage(data) {
    const overlay = this.getMessageOverlay();
    const messageContainer = this.getMessageContainer();

    const message = document.createElement('div');
    message.style.fontWeight = 800;
    message.style.color = data.color;
    message.innerHTML = data.text;

    const buttons = data.buttons.map(button => {
      return this.getButton(button.bgColor, button.color, button.text, button.cbOnClick);
    });

    messageContainer.appendChild(message);
    buttons.forEach(btn => messageContainer.appendChild(btn));

    overlay.appendChild(messageContainer);

    return overlay;
  }

  /**
   * Muestra el mensaje de 'Bame Over' (cuando se pulsa una bomba)
   */
  showGameOverMessage() {
    const data = {
      color: 'indianred',
      text: 'GAME OVER',
      buttons: [
        {
          bgColor: 'indianred',
          color: 'white',
          text: 'CERRAR',
          cbOnClick: () => {
            this.removeOverlay();
            this.showNewGameMessage();
          }
        }
      ]
    };
    this.container.appendChild(this.createPopUpMessage(data));
  }

  /**
   * Muestra el mensaje de 'Juego Finalizado' (cuando acaba descubriendo todas las casillas menos las bombas)
   */
  showGameFinishedMessage() {
    const data = {
      color: 'forestgreen',
      text: 'JUEGO FINALIZADO CON ÉXITO',
      buttons: [
        {
          bgColor: 'darkseagreen',
          color: 'white',
          text: 'ACEPTAR',
          cbOnClick: () => {
            this.removeOverlay();
            this.showNewGameMessage();
          }
        }
      ]
    };
    this.container.appendChild(this.createPopUpMessage(data));
  }

  /**
   * Muestra el mensaje para preguntar por una nueva partida
   */
  showNewGameMessage() {
    const data = {
      color: 'forestgreen',
      text: '¿JUGAR OTRA VEZ?',
      buttons: [
        {
          bgColor: 'darkseagreen',
          color: 'white',
          text: 'SI',
          cbOnClick: () => {
            this.removeOverlay();
            this.initGame();
          }
        },
        {
          bgColor: 'indianred',
          color: 'white',
          text: 'NO',
          cbOnClick: () => {
            this.removeOverlay();
          }
        }
      ]
    };
    this.container.appendChild(this.createPopUpMessage(data));
  }

  /**
   * Crea el contenedor donde mostrar los pop-up con los mensajes
   * @returns Un elemento HTML
   */
  getMessageOverlay() {
    const containerWidth = getComputedStyle(this.container).width;
    const containerHeight = getComputedStyle(this.container).height;
    const overlay = document.createElement('div');
    overlay.classList.add('buscaminas_overlay');
    overlay.style.position = 'relative';
    overlay.style.width = containerWidth
    overlay.style.height = containerHeight;
    overlay.style.background = 'rgba(0, 0, 0, 0.25)';
    overlay.style.transform = 'translateY(-100%)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';

    return overlay;
  }

  /**
   * Crea el pop-up que contiene los mensajes a mostrar al usuario
   * @returns Un elemento HTML
   */
  getMessageContainer() {
    const messageContainer = document.createElement('div');
    messageContainer.style.border = 'solid 2px white';
    messageContainer.style.margin = '1rem';
    messageContainer.style.padding = '1rem';
    messageContainer.style.fontFamily = 'Arial, Helvetica, sans-serif';
    messageContainer.style.fontSize = '1rem';
    messageContainer.style.background = '#c4c1b7';
    messageContainer.style.display = 'flex';
    messageContainer.style.flexDirection = 'column';
    messageContainer.style.gap = '.5rem';

    return messageContainer;
  }

  /**
   * Crea un botón para mostrar en los pop-up de mensajes
   * @param bgColor Color de fondo del botón
   * @param color Color de texto del botón
   * @param text Texto del botón
   * @param onClick Función a ejecutar al pulsar el botón
   * @returns Un elemento HTML
   */
  getButton(bgColor, color, text, onClick) {
    const button = document.createElement('button');
    button.style.background = bgColor;
    button.style.color = color;
    button.style.border = 'solid 2px white';
    button.style.borderRadius = '4px';
    button.style.fontSize = '.875rem';
    button.style.padding = '.5rem 1rem';
    button.style.fontWeight = 500;
    button.style.textAlign = 'center';
    button.style.cursor = 'pointer';
    button.innerHTML = text;
    button.onclick = onClick;

    return button;
  }
}

/**
 * Clase Tile
 */
class Tile {
  id;
  idString;
  isBomb = false;
  nearBombs = 0;
  played = false;
  updated = false;

  infoBombsColors = new Map()
    .set(1, 'lightyellow')
    .set(2, 'lightgreen')
    .set(3, 'cyan')
    .set(4, 'red')
    .set(5, 'magenta')
    .set(6, 'blue')
    .set(7, 'black')
    .set(8, 'white');

  /**
   * Constructor de la clase Tile
   * @param {*} id Índentificador de la casilla en la lista
   */
  constructor(id) {
    this.id = id;
    this.idString = `gameTile${this.id}`;
  }

  /**
   * Crea un objeto para una casilla del juego
   * @returns Un objeto Tile
   */
  createItem() {
    const item = document.createElement('div');
    item.id = this.idString;
    item.classList.add('buscaminas_tile');
    item.style.aspectRatio = '1 / 1';
    item.style.display = 'flex';
    item.style.justifyContent = 'center';
    item.style.alignItems = 'center';
    item.style.cursor = 'pointer';
    item.style.boxSizing = 'borderbox';
    this.setTilesBorders(item);

    item.addEventListener('contextmenu', e => e.preventDefault());
    item.addEventListener('click', () => {
      const emiter = new CustomEvent('ItemPlayed', {
        bubbles: true,
        detail: {
          id: this.id
        }
      });
      item.dispatchEvent(emiter);
    });

    return item;
  }

  /**
   * Establece que la casilla contiene bomba
   */
  setIsBomb() {
    this.isBomb = true;
  }

  /**
   * Devuelve si la casilla tiene bomba
   * @returns boolean
   */
  getIsBomb() {
    return this.isBomb;
  }

  /**
   * Establece que la casilla se ha jugado
   */
  setIsPlayed() {
    this.played = true;
  }

  /**
   * Devuelve si la casilla se ha jugado
   * @returns boolean
   */
  getIsPlayed() {
    return this.played;
  }

  /**
   * Devuelve el número de bombas cercanas de la casilla
   * @returns Number
   */
  getNearBombs() {
    return this.nearBombs;
  }

  /**
   * Establece el número de bombas cercanas a la casilla
   * @param value Número de bombas
   */
  setNearBombs(value) {
    this.nearBombs = value;
  }

  /**
   * Devuelve si la casilla ya ha actualizado su vista después de ser jugada
   * @returns boolean
   */
  getUpdated() {
    return this.updated;
  }

  /**
   * Establece los bordes de una casilla
   * @param item Un elemento HTML
   */
  setTilesBorders(item) {
    const lightColor = '#c4c1b7';
    const darkColor = '#403e3a';

    const bgLightColor = '#918e86';
    const bgDarkColor = '#706e67';

    item.style.borderBottom = `solid 2px ${this.played ? lightColor : darkColor}`;
    item.style.borderRight = `solid 2px ${this.played ? lightColor : darkColor}`;
    item.style.borderTop = `solid 2px ${this.played ? darkColor : lightColor}`;
    item.style.borderLeft = `solid 2px ${this.played ? darkColor : lightColor}`;
    item.style.backgroundColor = this.played ? bgDarkColor : bgLightColor;
  }

  /**
   * Actualiza el estilo de una casilla
   */
  updateTile(){
    const object = document.getElementById(this.idString);
    this.setTilesBorders(object);
    if (this.isBomb) {
      this.updateTileWithBomb(object);
    } else if (this.nearBombs) {
      this.updateTileInfoNearBombs(object);
    }
    this.updated = true;
  }

  /**
   * Actualiza la casilla para motrar el texto con la información de las bombas cercanas
   * @param object Un elemento HTML
   */
  updateTileInfoNearBombs(object) {
    object.style.fontFamily = 'Arial, Helvetica, sans-serif';
    object.style.fontWeight = 900;
    object.style.lineHeight = 1;
    object.style.color = this.infoBombsColors.get(this.nearBombs);
    object.innerHTML = this.nearBombs;
  }

  /**
   * Actualiza la casilla para mostrar una bomba en la casilla
   * @param object Un elemento HTML
   */
  updateTileWithBomb(object) {
    const mine = `
      <svg
        style="width: 95%; height: 95%"
        width="5.2741394mm" height="5.2741318mm"
        viewBox="0 0 5.2741394 5.2741318"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:svg="http://www.w3.org/2000/svg">
        <g transform="translate(-70.950212,-74.004911)">
          <circle style="fill:#000000;stroke:none;stroke-width:0.231617;stroke-linecap:round"
            cx="73.58728" cy="76.641975" r="2.1262503" />
          <rect style="fill:#000000;stroke:none;stroke-width:1.31915;stroke-linecap:round"
            width="0.42956737" height="5.241327" x="73.372498" y="74.004913" />
          <rect style="fill:#000000;stroke:none;stroke-width:1.31915;stroke-linecap:round"
            width="0.42956737" height="5.2741327" x="76.427193" y="-76.22435" transform="rotate(90)" />
          <rect style="fill:#000000;stroke:none;stroke-width:1.31915;stroke-linecap:round"
            width="0.42956737" height="5.2741327" x="106.01334" y="-0.47706926" transform="rotate(45)" />
          <rect style="fill:#000000;stroke:none;stroke-width:1.31915;stroke-linecap:round"
            width="0.42956737" height="5.2741327" x="1.9452132" y="103.59106"
            transform="matrix(-0.70710678,0.70710678,0.70710678,0.70710678,0,0)" />
        </g>
      </svg>`;

    object.innerHTML = '<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">' + mine + '<div>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const containerQuery = document.querySelector('#buscaminas');
  if (containerQuery === null) return;
  const game = new Game(containerQuery);
  game.initGame();
});
