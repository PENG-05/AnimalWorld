class GameTips {
    constructor(tetrisGame) {
        this.tetrisGame = tetrisGame;
        this.bestMove = null;  // 存储最佳移动建议
        this.tipElement = null; // 用于显示提示的DOM元素
        this.highlightElements = []; // 存储高亮元素
    }

    // 初始化提示系统
    initialize() {
        // 创建提示显示元素
        this.createTipDisplay();
        
        // 开始提供建议
        this.startProviding();
    }

    // 创建提示显示元素
    createTipDisplay() {
        this.tipElement = document.createElement('div');
        this.tipElement.id = 'game-tip';
        this.tipElement.style.position = 'absolute';
        this.tipElement.style.top = '10px';
        this.tipElement.style.left = '10px';
        this.tipElement.style.padding = '10px';
        this.tipElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.tipElement.style.color = 'white';
        this.tipElement.style.borderRadius = '5px';
        this.tipElement.style.zIndex = '1000';
        document.querySelector('.game-container') ? 
            document.querySelector('.game-container').appendChild(this.tipElement) : 
            document.body.appendChild(this.tipElement);
    }

    // 开始提供建议
    startProviding() {
        // 每次游戏状态更新时提供建议
        setInterval(() => {
            this.updateTip();
        }, 500); // 每500毫秒更新一次
    }

    // 更新提示
    updateTip() {
        // 获取当前棋盘状态
        this.tetrisGame.updatePiecesPosition();
        const currentPieces = [...this.tetrisGame.currentBoardPieces];
        
        // 找出最优移动
        this.findBestMove(currentPieces);
        
        // 显示提示
        this.showTip();
        
        // 可视化提示
        this.visualizeTip();
    }

    // 找出最优移动
    findBestMove(pieces) {
        let bestScore = -1;
        this.bestMove = null;
        
        // 获取可移动的棋子（最后一行除外，因为那是新棋子区域）
        const movablePieces = pieces.filter(piece => 
            piece.row < this.tetrisGame.boardRows - 1 &&
            this.canMoveLeftOrRight(piece, pieces)
        );
        
        // 对每个可移动棋子，尝试所有可能的水平位置
        for (const piece of movablePieces) {
            // 尝试向左移动
            let leftLimit = this.findLeftLimit(piece, pieces);
            for (let newCol = leftLimit; newCol < piece.col; newCol++) {
                const score = this.evaluateMove(piece, newCol, pieces);
                if (score > bestScore) {
                    bestScore = score;
                    this.bestMove = {
                        pieceId: piece.id,
                        fromCol: piece.col,
                        toCol: newCol,
                        score: score,
                        row: piece.row
                    };
                }
            }
            
            // 尝试向右移动
            let rightLimit = this.findRightLimit(piece, pieces);
            for (let newCol = piece.col + 1; newCol <= rightLimit; newCol++) {
                const score = this.evaluateMove(piece, newCol, pieces);
                if (score > bestScore) {
                    bestScore = score;
                    this.bestMove = {
                        pieceId: piece.id,
                        fromCol: piece.col,
                        toCol: newCol,
                        score: score,
                        row: piece.row
                    };
                }
            }
        }
    }

    // 判断棋子是否可以左右移动
    canMoveLeftOrRight(piece, allPieces) {
        // 检查棋子左边或右边是否有空间移动
        const leftLimit = this.findLeftLimit(piece, allPieces);
        const rightLimit = this.findRightLimit(piece, allPieces);
        
        return leftLimit < piece.col || rightLimit > piece.col;
    }

    // 找出棋子可以移动的最左侧列
    findLeftLimit(piece, allPieces) {
        let col = piece.col;
        
        // 向左移动直到遇到障碍
        while (col > 0) {
            col--;
            // 检查这个位置是否有其他棋子
            if (this.isHorizontallyBlocked(piece, col, allPieces)) {
                col++; // 回退一步
                break;
            }
        }
        
        return Math.max(0, col);
    }

    // 找出棋子可以移动的最右侧列
    findRightLimit(piece, allPieces) {
        let col = piece.col;
        const maxCol = this.tetrisGame.boardCols - piece.width;
        
        // 向右移动直到遇到障碍
        while (col < maxCol) {
            col++;
            // 检查这个位置是否有其他棋子
            if (this.isHorizontallyBlocked(piece, col, allPieces)) {
                col--; // 回退一步
                break;
            }
        }
        
        return Math.min(maxCol, col);
    }

    // 检查指定列是否被其他棋子阻挡
    isHorizontallyBlocked(piece, col, allPieces) {
        for (const otherPiece of allPieces) {
            if (otherPiece.id === piece.id) continue; // 跳过自己
            
            // 检查棋子是否在同一行并且有重叠
            if (otherPiece.row === piece.row &&
                ((col + piece.width > otherPiece.col) && 
                 (col < otherPiece.col + otherPiece.width))) {
                return true;
            }
        }
        return false;
    }

    // 评估移动效果
    evaluateMove(piece, newCol, allPieces) {
        // 创建一个棋盘副本进行模拟
        let piecesCopy = JSON.parse(JSON.stringify(allPieces));
        
        // 找到要移动的棋子
        let pieceToMove = piecesCopy.find(p => p.id === piece.id);
        pieceToMove.col = newCol;
        
        // 模拟重力
        this.simulateGravity(piecesCopy);
        
        // 计算可以消除的行数和行分数
        let score = this.countClearableRows(piecesCopy);
        
        // 如果能消除含有红色棋子的行，给更高的分数
        score += this.countBossRowsClearing(piecesCopy) * 0.5;
        
        return score;
    }

    // 模拟重力
    simulateGravity(pieces) {
        let moved;
        do {
            moved = false;
            // 从底部开始检查
            pieces.sort((a, b) => b.row - a.row);
            
            for (const piece of pieces) {
                if (this.canPieceMoveDown(piece, pieces)) {
                    piece.row += 1;
                    moved = true;
                }
            }
        } while (moved);
    }

    // 检查棋子是否可以下落
    canPieceMoveDown(piece, allPieces) {
        // 如果已经到达底部
        if (piece.row >= this.tetrisGame.boardRows - 2) {
            return false;
        }

        // 检查下方是否有其他棋子阻挡
        const rowBelow = piece.row + 1;
        for (let i = 0; i < piece.width; i++) {
            const col = piece.col + i;
            // 检查这个位置是否被占据
            for (const otherPiece of allPieces) {
                if (otherPiece.id === piece.id) continue;
                
                if (otherPiece.row === rowBelow &&
                    col >= otherPiece.col &&
                    col < otherPiece.col + otherPiece.width) {
                    return false;
                }
            }
        }
        
        return true;
    }

    // 计算可消除的行数
    countClearableRows(pieces) {
        let count = 0;
        
        // 检查每一行
        for (let row = 0; row < this.tetrisGame.boardRows - 1; row++) {
            if (this.isRowFullSimulated(row, pieces)) {
                count++;
            }
        }
        
        return count;
    }

    // 检查一行是否已满（模拟版本）
    isRowFullSimulated(row, pieces) {
        // 创建一个数组表示这一行的每一列是否被占据
        const colsOccupied = new Array(this.tetrisGame.boardCols).fill(false);
        
        // 检查每个棋子是否占据了这一行的某些列
        for (const piece of pieces) {
            if (piece.row === row) {
                for (let i = 0; i < piece.width; i++) {
                    const col = piece.col + i;
                    if (col >= 0 && col < this.tetrisGame.boardCols) {
                        colsOccupied[col] = true;
                    }
                }
            }
        }
        
        // 如果所有列都被占据，则行已满
        return colsOccupied.every(occupied => occupied);
    }

    // 计算可消除的含有红色棋子的行数
    countBossRowsClearing(pieces) {
        let count = 0;
        
        // 检查每一行
        for (let row = 0; row < this.tetrisGame.boardRows - 1; row++) {
            if (this.isRowFullSimulated(row, pieces)) {
                // 检查这一行是否包含红色棋子
                const hasBoss = pieces.some(piece => 
                    piece.row === row && 
                    (piece.color === 'red' || piece.color === 'rgb(255, 0, 0)')
                );
                
                if (hasBoss) count++;
            }
        }
        
        return count;
    }

    // 显示提示
    showTip() {
        if (!this.tipElement) return;
        
        if (this.bestMove) {
            const piece = this.tetrisGame.currentBoardPieces.find(p => p.id === this.bestMove.pieceId);
            if (piece) {
                let direction = this.bestMove.toCol < this.bestMove.fromCol ? "左" : "右";
                let distance = Math.abs(this.bestMove.toCol - this.bestMove.fromCol);
                
                this.tipElement.innerHTML = `
                    <strong>建议:</strong> 将棋子 ${piece.id.substring(0,6)}... 向${direction}移动${distance}格
                    <br>预计可消除: ${this.bestMove.score} 行
                `;
                this.tipElement.style.display = 'block';
            }
        } else {
            this.tipElement.innerHTML = `<strong>提示:</strong> 暂无最优移动建议`;
            this.tipElement.style.display = 'block';
        }
    }

    // 可视化提示
    visualizeTip() {
        // 清除之前的可视化标记
        this.clearVisualization();
        
        if (!this.bestMove) return;
        
        // 找出要移动的棋子
        const piece = document.getElementById(this.bestMove.pieceId);
        if (!piece) return;
        
        // 高亮显示要移动的棋子
        piece.style.border = '2px dashed yellow';
        piece.style.boxSizing = 'border-box';
        
        // 获取单元格宽度
        const cellWidth = document.querySelector('.cell').offsetWidth;
        const pieceWidth = parseInt(piece.dataset.width);
        
        // 创建目标位置的标记
        for (let i = 0; i < pieceWidth; i++) {
            const targetCol = this.bestMove.toCol + i;
            
            const targetCell = document.querySelector(`.cell[data-row="${this.bestMove.row}"][data-col="${targetCol}"]`);
            if (targetCell) {
                // 创建一个高亮框
                const highlight = document.createElement('div');
                highlight.className = 'move-highlight';
                highlight.style.position = 'absolute';
                highlight.style.left = targetCell.offsetLeft + 'px';
                highlight.style.top = targetCell.offsetTop + 'px';
                highlight.style.width = targetCell.offsetWidth + 'px';
                highlight.style.height = targetCell.offsetHeight + 'px';
                highlight.style.border = '2px solid lime';
                highlight.style.boxSizing = 'border-box';
                highlight.style.zIndex = '999';
                
                document.querySelector('.game-board').appendChild(highlight);
                this.highlightElements.push(highlight);
            }
        }
    }

    // 清除可视化标记
    clearVisualization() {
        // 清除所有棋子的高亮
        document.querySelectorAll('.board-piece').forEach(piece => {
            piece.style.border = '';
        });
        
        // 清除所有移动目标高亮
        this.highlightElements.forEach(highlight => {
            highlight.remove();
        });
        this.highlightElements = [];
    }
}
