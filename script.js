class Sweeper {
    #grid = document.querySelector("main");
    #cellWidth = 30;
    #cellHeight = 30;
    #defaultWide = 10;
    #defaultTall = 10;
    #defaultMines = 5;

    constructor(options) {
        this.wide = options?.wide ?? this.#defaultWide;
        this.tall = options?.tall ?? this.#defaultTall;
        this.debug = options?.debug ?? false;
        this.numMines = options?.mines ?? this.#defaultMines;
        this.numCells = this.wide * this.tall;
        this.borderCells = {
            N: [],
            E: [],
            S: [],
            W: [],
        };
        this.cells = [];
        this.buildGrid();
        this.mineLocations = [];
        this.deployMines();
    }

    buildGrid() {
        this.#grid.style.gridTemplateColumns = `repeat(${this.wide}, 1fr)`;
        this.#grid.style.gridTemplateRows = `repeat(${this.tall}, 1fr)`;
        this.#grid.style.width = `${this.wide * this.#cellWidth}px`;
        this.#grid.style.height = `${this.tall * this.#cellHeight}px`;
        let cell = 0;
        for (let x = 0; x < this.tall; x++) {
            for (let y = 0; y < this.wide; y++) {
                if (x === 0) this.borderCells.N.push(cell);
                if (x + 1 === this.tall) this.borderCells.S.push(cell);
                if (y === 0) this.borderCells.W.push(cell);
                if (y + 1 === this.wide) this.borderCells.E.push(cell);
                const cellElement = this.createCell(cell);
                this.#grid.appendChild(cellElement);
                this.cells[cell] = {
                    isMine: false,
                    touchingMines: 0,
                    element: cellElement,
                };
                cell++;
            }
        }
        this.#grid.addEventListener("click", (evt) => this.clickCell(evt));
        this.#grid.addEventListener("contextmenu", (evt) => this.rightClickCell(evt));
    }

    createCell(location) {
        const key = `cell_${location}`;
        const cell = document.createElement("div");
        cell.classList.add("cell", "unclicked");
        cell.id = key;
        return cell;
    }

    clickCell({ target }) {
        if (!target.classList.contains("unclicked")) return;
        if (target.classList.contains("flag")) return;
        target.classList.remove("unclicked");

        const cellLocation = +target.id.substr(5);
        const cell = this.cells[cellLocation];

        if (cell.isMine) {
            target.classList.add("exploded", "mine");
            target.innerText = "*";
            this.revealAll();
            console.log("YOU LOSE!");
            return;
        }

        if (cell.touchingMines > 0) {
            target.classList.add("number");
            target.innerHTML = `&nbsp;${cell.touchingMines}&nbsp;`;
        } else {
            this.openAdjacentCells([cellLocation]);
        }

        this.checkWinner();
    }

    rightClickCell(evt) {
        evt.preventDefault();
        const { target } = evt;
        if (!target.classList.contains("unclicked")) return;

        if (target.classList.contains("flag")) {
            target.classList.remove("flag");
            target.innerText = "";
        } else {
            target.classList.add("flag");
            target.innerHTML = "&mdash;";
        }
        this.checkWinner();
    }

    deployMines() {
        while (this.mineLocations.length < this.numMines) {
            const location = this.getRandomNumber(this.numCells - 1);
            this.mineLocations.push(location);
            this.mineLocations.sort((a, b) => a - b);
            this.mineLocations = [...new Set(this.mineLocations)];
        }

        this.mineLocations.forEach((mineLocation) => {
            if(this.debug) this.cells[mineLocation].element.innerHTML = "&times;";
            this.cells[mineLocation].isMine = true;
            const adjacentCells = this.getAdjacentCells(mineLocation);
            adjacentCells.forEach((adjacentCell) => {
                this.cells[adjacentCell].touchingMines += 1;
            });
        });
    }

    getAdjacentCells(cellLocation) {
        const cell = +cellLocation;
        const cells = [];

        const isNBorder = this.borderCells.N.includes(cell);
        const isEBorder = this.borderCells.E.includes(cell);
        const isSBorder = this.borderCells.S.includes(cell);
        const isWBorder = this.borderCells.W.includes(cell);
        const isNEBorder = isNBorder || isEBorder;
        const isNWBorder = isNBorder || isWBorder;
        const isSEBorder = isSBorder || isEBorder;
        const isSWBorder = isSBorder || isWBorder;

        if (!isNWBorder) cells.push(cell - (this.wide + 1));
        if (!isNBorder) cells.push(cell - this.wide);
        if (!isNEBorder) cells.push(cell - (this.wide - 1));
        if (!isEBorder) cells.push(cell + 1);
        if (!isSEBorder) cells.push(cell + (this.wide + 1));
        if (!isSBorder) cells.push(cell + this.wide);
        if (!isSWBorder) cells.push(cell + (this.wide - 1));
        if (!isWBorder) cells.push(cell - 1);

        return cells;
    }

    openAdjacentCells(cellArray) {
        const adjacentCellArray = cellArray.reduce((cells, cell) => [...cells, ...this.getAdjacentCells(cell)], []);
        const filteredAdjacentCellArray = adjacentCellArray.filter((cell) => {
            if (this.cells[cell].isMine) return false;
            if (!this.cells[cell].element.classList.contains("unclicked")) return false;
            this.cells[cell].element.classList.remove("unclicked");
            if (this.cells[cell].touchingMines > 0) {
                this.cells[cell].element.classList.add("number");
                this.cells[cell].element.innerHTML = `&nbsp;${this.cells[cell].touchingMines}&nbsp;`;
                return false;
            }
            return true;
        });

        if (filteredAdjacentCellArray.length) this.openAdjacentCells([...new Set(filteredAdjacentCellArray)]);
        else this.checkWinner();
    }

    checkWinner() {
        const unclicked = [...document.querySelectorAll(".unclicked")];
        if (unclicked) {
            const unclickedCells = unclicked.filter((cell) => cell);
            if (unclickedCells.length === this.mineLocations.length) {
                this.revealAll();
                console.log("WINNER!");
                return;
            }
        }

        const flagged = [...document.querySelectorAll(".flag")];
        if (flagged) {
            const missedFlags = flagged.filter((cell) => !this.cells[+cell.id.substring(5)].isMine);
            const flaggedMines = flagged.filter((cell) => this.cells[+cell.id.substring(5)].isMine);
            console.log(missedFlags.length, flaggedMines.length, this.mineLocations.length);
            if (missedFlags.length === 0 && flaggedMines.length === this.mineLocations.length) {
                this.revealAll();
                console.log("WINNER!");
                return;
            }
        }
    }

    revealAll() {
        document.querySelectorAll(".unclicked").forEach((c) => {
            c.classList.remove("unclicked");
            const cLoc = +c.id.substring(5);
            if (this.cells[cLoc].isMine) {
                c.classList.add("mine");
                c.innerText = "*";
            } else if (this.cells[cLoc].touchingMines > 0) {
                c.classList.add("number");
                c.innerHTML = `&nbsp;${this.cells[cLoc].touchingMines}&nbsp;`;
            }
        });
    }

    getRandomNumber() {
        return Math.floor(Math.random() * this.numCells);
    }
}

const game = new Sweeper({
    wide: 20,
    tall: 10,
    mines: 20,
    debug: false,
});
