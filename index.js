/**
 * Clase Log
 */
class Log {
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
}

/**
 * Clase Game
 */
class Game {

  container;
  gameContainer;
  gridContainer;
  tilesLine = 10;
  totalTiles = Math.pow(this.tilesLine, 2);
  tilesList = [];

  /**
   * Constructor de la clase Game
   * @param {*} container Elmento HTML donde insertar el juego
   */
  constructor(container) {
    this.container = container;
    Log.log(`Constructor: Juego con ${this.totalTiles} items (${this.tilesLine} por línea)`);
  }

  /**
   * Inicia el juego (componentes y partida)
   */
  initGame() {
    Log.log(`Inciando juego`);
    this.createGameContainer();
    this.createGridContainer();
    this.setTilesList();
    this.setNearBombs();
    let line = '';
    this.tilesList.forEach(b => {
      line = line + '[' + (b.getIsBomb() ? 'B' : b.getNearBombs()) + ']';
      if (b.id % this.tilesLine === 9) {
        Log.log(line);
        line = '';
      }
    });
    this.paintItems();

    this.gridContainer.addEventListener('ItemPlayed', (event) => {
      if (this.tilesList[event.detail.id].getIsBomb()) {
        this.tilesList.filter(i => !i.getUpdated())?.forEach(item => {
          item.setIsPlayed();
          item.updateTile();
        });
        this.showGameOverMessage();
        return;
      }
  
      if (this.tilesList[event.detail.id].getIsPlayed()) {
        return;
      }
      this.tilesList[event.detail.id].setIsPlayed();
  
      if (!this.tilesList[+event.detail.id].getNearBombs()) {
        this.checkNeighbours(+event.detail.id);
      }
    
      this.tilesList.filter(i => i.getIsPlayed() && !i.getUpdated())?.forEach(item => item.updateTile());
    });
  }

  /**
   * Crea el contenedor para todos los elementos del juego
   */
  createGameContainer() {
    this.gameContainer = document.createElement('div');
    this.gameContainer.style.display = 'flex';
    this.gameContainer.style.flexDirection = 'column';
    this.gameContainer.style.gap = '1rem';

    this.container.appendChild(this.gameContainer);

    Log.log('Creado contenedor para componentes del juego');
  }

  /**
   * Crea el contenedor para la rejilla con los items donde buscar las minas.
   */
  createGridContainer() {
    this.container.style.display = 'inline-block';
    this.container.style.margin = '1rem auto';
  
    this.gridContainer = document.createElement('div');
    this.gridContainer.style.display = 'grid';
    this.gridContainer.style.gridTemplateColumns = `repeat(${this.tilesLine}, auto)`;
    this.gameContainer.appendChild(this.gridContainer);

    Log.log('Creado contenedor para rejilla de juego');
  }

  /**
   * setTilesList
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
    } while(bombsSetted < this.tilesLine);

    Log.log(`Creada lista de baldosas con ${bombsSetted} bombas`);
  }

  /**
   * setNearBombs
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
  }

  /**
   * getRow
   * @param {*} index 
   * @returns 
   */
  getRow(index) {
    return Math.floor(index / this.tilesLine);
  }
  
  /**
   * getCol
   * @param {*} index 
   * @returns 
   */
  getCol(index) {
    return index % this.tilesLine;
  }

  /**
   * getPlayedNoBombs
   * @param {*} id 
   * @returns 
   */
  getPlayedNoBombs(id) {
    return (!this.tilesList[id].getNearBombs() && !this.tilesList[id].getIsPlayed());
  }

  /**
   * checkItemNoBombs
   * @param {*} id 
   */
  checkItemNoBombs(id) {
    if(this.getPlayedNoBombs(id)) {
      this.tilesList[id].setIsPlayed();
      this.checkNeighbours(id);
    }
  }

  /**
   * checkRowNeighbours
   * @param {*} id 
   * @param {*} direction 
   */
  checkRowNeighbours(id, direction) {
    const newId = id + direction;
  
    if (this.getRow(id) === this.getRow(newId)) {
      this.checkItemNoBombs(newId);
    }
  }

  /**
   * checkColNeighbours
   * @param {*} id 
   * @param {*} upDown 
   */
  checkColNeighbours(id, upDown) {
    const newId = id + (this.tilesLine * upDown);
    const isInside = this.getRow(newId) >= 0 && this.getRow(newId) < this.tilesLine;
    
    if (isInside) {
      this.checkItemNoBombs(newId);
    }
  }

  /**
   * checkNeighbours
   * @param {*} id 
   */
  checkNeighbours(id) {
    this.checkColNeighbours(id, -1);
    this.checkColNeighbours(id, 1);
    this.checkRowNeighbours(id, 1);
    this.checkRowNeighbours(id, -1);
  }

  /**
   * paintItems
   */
  paintItems() {
    Array.from(this.gridContainer.children)?.forEach(i => i.remove());
    this.tilesList.forEach(tile => this.gridContainer.appendChild(tile.createItem()));
  }

  /**
   * showGameOverMessage
   */
  showGameOverMessage() {
    const overlay = this.getMessageOverlay();

    const message = document.createElement('div');
    message.style.border = 'solid 2px white';
    message.style.padding = '1rem';
    message.style.fontFamily = 'Arial, Helvetica, sans-serif';
    message.style.fontSize = '1rem';
    message.style.fontWeight = 800;
    message.style.color = 'indianred';
    message.style.background = '#c4c1b7';
    message.innerHTML = 'GAME OVER';

    const closeButton = document.createElement('div');
    closeButton.style.background = 'indianred';
    closeButton.style.color = 'white';
    closeButton.style.border = 'solid 2px white';
    closeButton.style.borderRadius = '4px';
    closeButton.style.fontSize = '.875rem';
    closeButton.style.padding = '.5rem 1rem';
    closeButton.style.fontWeight = 500;
    closeButton.style.textAlign = 'center';
    closeButton.style.cursor = 'pointer';
    closeButton.innerHTML = 'CERRAR';

    closeButton.onclick = () => {
      overlay.remove();
    };

    message.appendChild(closeButton);

    overlay.appendChild(message);

    this.container.appendChild(overlay);
  }

  /**
   * getMessageOverlay
   * @returns 
   */
  getMessageOverlay() {
    const containerWidth = getComputedStyle(this.container).width;
    const containerHeight = getComputedStyle(this.container).height;
    const overlay = document.createElement('div');
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
   * @param {*} id 
   */
  constructor(id) {
    this.id = id;
    this.idString = `gameTile${this.id}`;
  }

  /**
   * createItem
   * @returns 
   */
  createItem() {
    const item = document.createElement('div');
    item.id = this.idString;

    item.style.width = '1.5rem';
    item.style.height = '1.5rem';
    item.style.display = 'flex';
    item.style.justifyContent = 'center';
    item.style.alignItems = 'center';
    item.style.cursor = 'pointer';
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
   * setIsBomb
   */
  setIsBomb() {
    this.isBomb = true;
  }

  /**
   * getIsBomb
   * @returns 
   */
  getIsBomb() {
    return this.isBomb;
  }

  /**
   * setIsPlayed
   */
  setIsPlayed() {
    this.played = true;
  }

  /**
   * getIsPlayed
   * @returns 
   */
  getIsPlayed() {
    return this.played;
  }

  /**
   * getNearBombs
   * @returns 
   */
  getNearBombs() {
    return this.nearBombs;
  }

  /**
   * setNearBombs
   * @param {*} value 
   */
  setNearBombs(value) {
    this.nearBombs = value;
  }

  getUpdated() {
    return this.updated;
  }

  /**
   * setTilesBorders
   * @param {*} item 
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
   * updateTile
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
   * updateTileInfoNearBombs
   * @param {*} object 
   */
  updateTileInfoNearBombs(object) {
    object.style.fontFamily = 'Arial, Helvetica, sans-serif';
    object.style.fontWeight = 900;
    object.style.lineHeight = 1;
    object.style.color = this.infoBombsColors.get(this.nearBombs);
    object.innerHTML = this.nearBombs;
  }

  /**
   * updateTileWithBomb
   * @param {*} object 
   */
  updateTileWithBomb(object) {
    const mine = `
      <svg
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
    object.innerHTML = mine;
  }

  /**
   * setInnerHTML
   * @returns 
   */
  setInnerHTML() {
    let value = '';
    if (this.isBomb) {
      value = 'B';
    } else if (this.nearBombs) {
      value = this.nearBombs;
    }
    return value;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const containerQuery = document.querySelector('#buscaminas');
  if (containerQuery === null) return;
  const game = new Game(containerQuery);
  game.initGame();
});
