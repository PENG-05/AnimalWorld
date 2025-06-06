class TetrisGame {
    constructor(gameBoard, currentBoardPieces) {
        this.gameBoard = gameBoard;
        this.currentBoardPieces = currentBoardPieces;
        this.gameInterval = null;
        this.isGameRunning = false;
        this.gameSpeed = 1000; // 每秒移动一次，单位毫秒
        this.boardRows = 11;
        this.boardCols = 9;
        this.isFrozen = false; // 新增：跟踪冰冻状态
        this.gravityInterval = null; // 新增：冰冻时只处理重力的定时器
    }

    // 开始游戏
    startGame() {
        if (this.isGameRunning || this.isFrozen) return;
        
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

    // 新增：冰冻BOSS功能
    freezeBoss() {
        if (this.isFrozen) return;
        
        // 暂停向上移动
        this.pauseGame();
        this.isFrozen = true;
        
        // 缩短红色棋子（BOSS）长度为1
        this.shortenBossPieces();
        
        // 保持下落功能，启动一个单独的间隔只处理下落
        this.gravityInterval = setInterval(() => {
            this.updatePiecesPosition();
            this.applyGravity();
            this.renderPieces();
        }, this.gameSpeed);
    }
    
    // 新增：解除冰冻功能
    unfreezeBoard() {
        if (!this.isFrozen) return;
        
        // 清除只做下落的间隔
        clearInterval(this.gravityInterval);
        this.isFrozen = false;
        
        // 恢复向上移动
        this.startGame();
    }
    
    // 新增：缩短红色棋子（BOSS）长度为1
    shortenBossPieces() {
        // 先根据DOM更新当前棋子信息
        this.updatePiecesPosition();
        
        // 找出所有红色棋子（BOSS）
        const bossPieces = this.currentBoardPieces.filter(piece => {
            // 判断颜色是否为红色
            return piece.color === 'red' || piece.color === 'rgb(255, 0, 0)';
        });
        
        // 缩短红色棋子长度为1
        bossPieces.forEach(piece => {
            // 获取DOM元素
            const pieceElement = document.getElementById(piece.id);
            if (pieceElement && piece.width > 1) {
                pieceElement.dataset.width = '1';
                // 获取单元格宽度以正确设置新宽度
                const cellWidth = document.querySelector('.cell').offsetWidth;
                pieceElement.style.width = cellWidth + 'px';
                
                // 更新内部数据结构
                piece.width = 1;
            }
        });
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

        // 检查是否有棋子到达顶部
        const gameOver = this.currentBoardPieces.some(piece => piece.row === 1);
        if (gameOver) {
            this.endGame();
            return;
        }

        // 应用重力，使棋子下落
        this.applyGravity();
        
        // 检查并消除满行
        this.checkAndClearFullRows();
        
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
    
    // 新增：检查并消除满行
    checkAndClearFullRows() {
        // 对于每一行（除了最后一行，最后一行是放新棋子的区域）
        for (let row = 0; row < this.boardRows - 1; row++) {
            if (this.isRowFull(row)) {
                this.clearFullRow(row);
                // 消除行后，应用重力使上方的棋子下落
                this.applyGravity();
            }
        }
    }
    
    // 新增：检查一行是否已满
    isRowFull(row) {
        // 创建一个数组表示这一行的每一列是否被占据
        const colsOccupied = new Array(this.boardCols).fill(false);
        
        // 检查每个棋子是否占据了这一行的某些列
        for (const piece of this.currentBoardPieces) {
            if (piece.row === row) {
                for (let i = 0; i < piece.width; i++) {
                    const col = piece.col + i;
                    if (col >= 0 && col < this.boardCols) {
                        colsOccupied[col] = true;
                    }
                }
            }
        }
        
        // 如果所有列都被占据，则行已满
        return colsOccupied.every(occupied => occupied);
    }
    
    // 修改：清除满行
    clearFullRow(row) {
        // 首先检查这一行是否包含boss棋子（红色棋子）
        const hasBoss = this.currentBoardPieces.some(piece => 
            piece.row === row && 
            (piece.color === 'red' || piece.color === 'rgb(255, 0, 0)')
        );
        
        if (hasBoss) {
            // 如果有boss棋子，只缩短boss棋子，其他棋子保持不变
            this.currentBoardPieces.forEach(piece => {
                if (piece.row === row && 
                   (piece.color === 'red' || piece.color === 'rgb(255, 0, 0)')) {
                    this.shrinkBossPiece(piece);
                }
            });
        } else {
            // 如果没有boss棋子，删除这一行的所有棋子
            const piecesToRemove = [];
            
            this.currentBoardPieces.forEach(piece => {
                // 如果棋子完全在这一行，则删除
                if (piece.row === row) {
                    piecesToRemove.push(piece.id);
                }
            });
            
            // 删除需要删除的棋子
            piecesToRemove.forEach(id => {
                // 从DOM中删除
                const element = document.getElementById(id);
                if (element) element.remove();
                
                // 从数组中删除
                this.currentBoardPieces = this.currentBoardPieces.filter(p => p.id !== id);
            });
        }
    }
    
    // 保持不变：缩短BOSS棋子
    shrinkBossPiece(boss) {
        const bossElement = document.getElementById(boss.id);
        if (!bossElement) return;
        
        // 获取单元格宽度
        const cellWidth = document.querySelector('.cell').offsetWidth;
        
        // 减少BOSS宽度
        boss.width -= 1;
        
        // 如果BOSS宽度减为0，则删除
        if (boss.width <= 0) {
            bossElement.remove();
            this.currentBoardPieces = this.currentBoardPieces.filter(p => p.id !== boss.id);
            return;
        }
        
        // 更新DOM元素
        bossElement.dataset.width = boss.width;
        bossElement.style.width = (cellWidth * boss.width) + 'px';
    }
}
