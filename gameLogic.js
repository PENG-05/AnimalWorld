class TetrisGame {
    constructor(gameBoard, currentBoardPieces) {
        this.gameBoard = gameBoard;
        this.currentBoardPieces = currentBoardPieces;
        this.gameInterval = null;
        this.isGameRunning = false;
        this.gameSpeed = 1000; // 每秒移动一次，单位毫秒
        this.boardRows = 11;
        this.boardCols = 9;
    }

    // 开始游戏
    startGame() {
        if (this.isGameRunning) return;
        
        this.isGameRunning = true;
        this.gameInterval = setInterval(() => {
            this.moveAllPiecesUp();
        }, this.gameSpeed);
    }

    // 暂停游戏
    pauseGame() {
        if (!this.isGameRunning) return;
        
        this.isGameRunning = false;
        clearInterval(this.gameInterval);
    }

    // 游戏结束
    endGame() {
        this.pauseGame();
        alert("游戏结束！");
    }

    // 向上移动所有棋子
    moveAllPiecesUp() {
        // 先根据DOM更新当前棋子信息
        this.updatePiecesPosition();
        
        // 向上移动所有棋子
        for (const piece of this.currentBoardPieces) {
            if (piece.row > 0) { // 确保不是第一行
                piece.row -= 1;
            }
        }

        // 检查是否有棋子到达顶部（第二行，因为第一行是预判区）
        const gameOver = this.currentBoardPieces.some(piece => piece.row === 1);
        if (gameOver) {
            this.endGame();
            return;
        }

        // 应用重力，使棋子下落
        this.applyGravity();
        
        // 更新DOM中棋子的位置
        this.renderPieces();
    }

    // 应用重力，使棋子下落
    applyGravity() {
        let moved;
        do {
            moved = false;
            // 从最底部的棋子开始检查，这样底部的棋子先下落
            this.currentBoardPieces.sort((a, b) => b.row - a.row);
            
            for (const piece of this.currentBoardPieces) {
                // 检查当前棋子下方是否有空间
                if (this.canMoveDown(piece)) {
                    piece.row += 1;
                    moved = true;
                }
            }
        } while (moved); // 重复直到所有棋子都不能再下落
    }

    // 检查棋子是否可以向下移动
    canMoveDown(piece) {
        // 如果已经在倒数第二行，则不能再下落（保留最后一行用于显示即将出现的棋子）
        if (piece.row >= this.boardRows - 2) {
            return false;
        }

        // 检查下方是否有其他棋子阻挡
        const rowBelow = piece.row + 1;
        for (let i = 0; i < piece.width; i++) {
            const col = piece.col + i;
            // 检查这个位置是否被其他棋子占据
            if (this.isPositionOccupied(rowBelow, col, piece.id)) {
                return false;
            }
        }

        return true;
    }

    // 检查位置是否被占据
    isPositionOccupied(row, col, excludePieceId) {
        return this.currentBoardPieces.some(p => 
            p.id !== excludePieceId && // 排除当前棋子自身
            p.row === row && 
            col >= p.col && 
            col < p.col + p.width
        );
    }

    // 从DOM更新当前棋子的位置信息
    updatePiecesPosition() {
        const boardPieces = document.querySelectorAll('.board-piece');
        const cellWidth = document.querySelector('.cell').offsetWidth;
        const cellHeight = document.querySelector('.cell').offsetHeight;
        
        this.currentBoardPieces = [];
        
        boardPieces.forEach(piece => {
            const left = parseInt(piece.style.left);
            const top = parseInt(piece.style.top);
            const width = parseInt(piece.dataset.width);
            
            // 计算行列位置
            const col = Math.round(left / cellWidth);
            const row = Math.round(top / cellHeight);
            
            this.currentBoardPieces.push({
                id: piece.id,
                row: row,
                col: col,
                width: width,
                color: piece.style.backgroundColor
            });
        });
    }

    // 渲染棋子到新的位置
    renderPieces() {
        this.currentBoardPieces.forEach(pieceData => {
            const pieceElement = document.getElementById(pieceData.id);
            if (pieceElement) {
                const cell = document.querySelector(`.cell[data-row="${pieceData.row}"][data-col="${pieceData.col}"]`);
                if (cell) {
                    pieceElement.style.left = cell.offsetLeft + 'px';
                    pieceElement.style.top = cell.offsetTop + 'px';
                }
            }
        });
    }
}
