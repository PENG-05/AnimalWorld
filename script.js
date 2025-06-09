document.addEventListener('DOMContentLoaded', function() {
    const gameBoard = document.getElementById('gameBoard');
    let isDragging = false;
    let draggedPiece = null;
    let draggedPieceWidth = 0;
    let draggedPieceColor = '';
    let startX, startY;
    let currentBoardPieces = [];
    let originalPieceElement = null; // 用于跟踪拖拽的原始棋子元素
    let tetrisGame; // 游戏逻辑实例
    let isDeleteMode = false; // 跟踪删除模式状态
    
    // 创建9x11的棋盘
    for (let i = 0; i < 11; i++) {
        for (let j = 0; j < 9; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            
            gameBoard.appendChild(cell);
        }
    }
    
    // 使选择器中的棋子可拖拽
    const pieceButtons = document.querySelectorAll('.piece-btn');
    pieceButtons.forEach(btn => {
        btn.setAttribute('draggable', true);
        btn.addEventListener('dragstart', handlePieceDragStart);
    });
    
    // 设置游戏棋盘的拖拽事件
    gameBoard.addEventListener('dragover', handleDragOver);
    gameBoard.addEventListener('drop', handleDrop);
    
    // 初始化游戏逻辑
    tetrisGame = new TetrisGame(gameBoard, currentBoardPieces);
    
    // 初始化游戏提示系统
    const gameTips = new GameTips(tetrisGame);
    gameTips.initialize();
    
    // 添加删除模式按钮的点击事件
    const deleteBtn = document.querySelector('.option-btn:nth-child(1)');
    deleteBtn.addEventListener('click', function() {
        isDeleteMode = !isDeleteMode;
        this.classList.toggle('active', isDeleteMode);
        
        // 根据当前删除模式状态更新UI
        if (isDeleteMode) {
            gameBoard.classList.add('delete-mode');
        } else {
            gameBoard.classList.remove('delete-mode');
        }
    });
    
    // 添加重置棋盘按钮的点击事件
    const resetBtn = document.querySelector('.option-btn:nth-child(2)');
    resetBtn.addEventListener('click', function() {
        // 添加确认对话框
        if (confirm('确定要清空棋盘上的所有棋子吗？')) {
            // 清除所有棋子
            const boardPieces = document.querySelectorAll('.board-piece');
            boardPieces.forEach(piece => piece.remove());
            currentBoardPieces = [];
        }
    });
    
    // 添加开始游戏和暂停游戏按钮的点击事件
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(btn => {
        if (btn.textContent === '开始游戏') {
            btn.addEventListener('click', () => {
                tetrisGame.startGame();
            });
        } else if (btn.textContent === '暂停游戏') {
            btn.addEventListener('click', () => {
                tetrisGame.pauseGame();
            });
        } else if (btn.textContent === '冰冻BOSS') {
            // 新增：冰冻BOSS按钮点击事件
            btn.addEventListener('click', function() {
                if (this.textContent === '冰冻BOSS') {
                    tetrisGame.freezeBoss();
                    this.textContent = '退出冰冻BOSS';
                } else {
                    tetrisGame.unfreezeBoard();
                    this.textContent = '冰冻BOSS';
                }
            });
        } else if (btn.textContent === '整体上移') {
            btn.addEventListener('click', () => {
                tetrisGame.moveAllPiecesUp();
            });
        }
    });
    
    // 处理棋子拖拽开始
    function handlePieceDragStart(e) {
        const pieceBtn = e.target;
        draggedPiece = pieceBtn;
        draggedPieceWidth = parseInt(pieceBtn.dataset.piece);
        
        // 获取棋子颜色
        const computedStyle = window.getComputedStyle(pieceBtn);
        draggedPieceColor = computedStyle.backgroundColor;
        
        // 设置拖拽图像
        const dragIcon = document.createElement('div');
        dragIcon.className = 'drag-icon';
        dragIcon.style.width = '10px';
        dragIcon.style.height = '10px';
        dragIcon.style.backgroundColor = 'transparent';
        document.body.appendChild(dragIcon);
        e.dataTransfer.setDragImage(dragIcon, 0, 0);
        
        // 标记为从选择器拖拽
        e.dataTransfer.setData('text', JSON.stringify({
            pieceWidth: draggedPieceWidth,
            isFromSelector: true,
            pieceColor: draggedPieceColor
        }));
        
        // 清除原始棋子引用
        originalPieceElement = null;
    }
    
    // 处理棋盘上棋子的拖拽开始
    function handleBoardPieceDragStart(e) {
        const piece = e.target;
        e.stopPropagation();
        
        // 保存原始棋子引用，但不立即移除，在drop成功后再移除
        originalPieceElement = piece;
        draggedPiece = piece;
        draggedPieceWidth = parseInt(piece.dataset.width);
        draggedPieceColor = piece.style.backgroundColor;
        
        // 设置拖拽图像 - 使用原始棋子作为拖拽图像
        e.dataTransfer.setDragImage(piece, piece.offsetWidth / 2, piece.offsetHeight / 2);
        
        // 添加半透明效果表示正在拖拽
        piece.style.opacity = '0.6';
        
        // 设置拖拽数据
        e.dataTransfer.setData('text', JSON.stringify({
            pieceWidth: parseInt(piece.dataset.width),
            isFromSelector: false,
            pieceColor: piece.style.backgroundColor,
            pieceId: piece.id
        }));
    }
    
    // 处理拖拽经过
    function handleDragOver(e) {
        e.preventDefault();
        if (!draggedPiece) return;
        
        // 使用鼠标位置直接计算预览位置
        const rect = gameBoard.getBoundingClientRect();
        const cellWidth = rect.width / 9;
        const cellHeight = rect.height / 11;
        
        // 计算鼠标相对于棋盘的位置
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 计算对应的单元格位置
        const col = Math.floor(x / cellWidth);
        const row = Math.floor(y / cellHeight);
        
        // 确保位置在棋盘范围内
        if (row >= 0 && row < 11 && col >= 0 && col < 9) {
            // 清除之前的预览
            clearPreview();
            
            // 显示新的预览
            showPreview(row, col, draggedPieceWidth, draggedPieceColor);
        }
    }
    
    // 处理放置
    function handleDrop(e) {
        e.preventDefault();
        
        // 使用与dragOver相同的逻辑计算放置位置
        const rect = gameBoard.getBoundingClientRect();
        const cellWidth = rect.width / 9;
        const cellHeight = rect.height / 11;
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        let col = Math.floor(x / cellWidth);
        let row = Math.floor(y / cellHeight);
        
        // 确保位置在有效范围内
        if (row < 0) row = 0;
        if (row >= 11) row = 10;
        if (col < 0) col = 0;
        
        // 解析传递的数据
        const data = JSON.parse(e.dataTransfer.getData('text'));
        const pieceWidth = data.pieceWidth;
        const pieceColor = data.pieceColor;
        const isFromSelector = data.isFromSelector;
        
        // 调整列位置确保棋子完全在棋盘内
        if (col + pieceWidth > 9) col = 9 - pieceWidth;
        
        // 清除预览
        clearPreview();
        
        // 如果是从棋盘拖拽的棋子，则移除原棋子
        if (!isFromSelector && originalPieceElement) {
            // 从数组中移除原始棋子数据
            currentBoardPieces = currentBoardPieces.filter(p => p.id !== originalPieceElement.id);
            // 从DOM中移除原始棋子
            originalPieceElement.remove();
        }
        
        // 创建棋子在新位置
        createPieceOnBoard(row, col, pieceWidth, pieceColor);
        
        // 在放置棋子后检查并消除满行
        tetrisGame.updatePiecesPosition(); // 确保数据是最新的
        tetrisGame.checkAndClearFullRows();
        tetrisGame.applyGravity();
        
        // 重置拖拽状态
        draggedPiece = null;
        originalPieceElement = null;
    }
    
    // 显示预览
    function showPreview(row, col, width, color) {
        // 检查是否超出范围并调整位置
        if (col < 0) col = 0;
        if (col + width > 9) col = 9 - width;
        
        for (let i = 0; i < width; i++) {
            const previewCell = document.querySelector(`.cell[data-row="${row}"][data-col="${col + i}"]`);
            if (previewCell) {
                previewCell.classList.add('preview-cell');
                previewCell.style.backgroundColor = color;
                previewCell.style.opacity = '0.6';
                
                // 添加更明显的视觉边界
                previewCell.style.border = '2px dashed white';
                
                // 添加网格标识，让用户清楚地看到这是几个单元格
                const cellNumber = document.createElement('div');
                cellNumber.className = 'cell-number';
                cellNumber.textContent = i + 1;
                cellNumber.style.position = 'absolute';
                cellNumber.style.top = '50%';
                cellNumber.style.left = '50%';
                cellNumber.style.transform = 'translate(-50%, -50%)';
                cellNumber.style.color = 'white';
                cellNumber.style.fontWeight = 'bold';
                cellNumber.style.fontSize = '14px';
                cellNumber.style.textShadow = '1px 1px 1px black';
                previewCell.appendChild(cellNumber);
            }
        }
    }
    
    // 清除预览
    function clearPreview() {
        const previewCells = document.querySelectorAll('.preview-cell');
        previewCells.forEach(cell => {
            cell.classList.remove('preview-cell');
            cell.style.backgroundColor = '';
            cell.style.opacity = '';
            cell.style.border = ''; // 移除边框
            
            // 移除单元格编号
            const cellNumber = cell.querySelector('.cell-number');
            if (cellNumber) {
                cell.removeChild(cellNumber);
            }
        });
    }
    
    // 创建棋子在棋盘上
    function createPieceOnBoard(row, col, width, color) {
        const pieceId = 'piece-' + Date.now();
        const pieceElement = document.createElement('div');
        pieceElement.className = 'board-piece';
        pieceElement.id = pieceId;
        pieceElement.dataset.width = width;
        pieceElement.style.backgroundColor = color;
        pieceElement.style.position = 'absolute';
        
        // 根据棋盘单元格计算位置和尺寸
        const firstCell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        const cellWidth = firstCell.offsetWidth;
        const cellHeight = firstCell.offsetHeight;
        
        pieceElement.style.width = (cellWidth * width) + 'px';
        pieceElement.style.height = cellHeight + 'px';
        pieceElement.style.left = firstCell.offsetLeft + 'px';
        pieceElement.style.top = firstCell.offsetTop + 'px';
        
        // 添加拖拽功能
        pieceElement.setAttribute('draggable', true);
        pieceElement.addEventListener('dragstart', handleBoardPieceDragStart);
        pieceElement.addEventListener('dragend', function(e) {
            // 拖拽结束时恢复不透明度
            this.style.opacity = '1';
        });
        
        // 添加点击功能（修改长度或删除）
        pieceElement.addEventListener('click', function(e) {
            if (isDeleteMode) {
                // 删除模式下点击棋子
                const pieceId = this.id;
                // 从数组中删除棋子数据
                currentBoardPieces = currentBoardPieces.filter(p => p.id !== pieceId);
                // 从DOM中删除棋子
                this.remove();
            } else {
                // 正常模式下点击棋子（修改长度）
                const newWidth = prompt('请输入新的棋子长度（1-9）：', width);
                if (newWidth && !isNaN(newWidth)) {
                    const widthValue = parseInt(newWidth);
                    if (widthValue >= 1 && widthValue <= 9) {
                        // 检查新长度是否会导致棋子超出棋盘
                        const currentCol = parseInt(pieceElement.style.left) / cellWidth;
                        if (currentCol + widthValue <= 9) {
                            pieceElement.dataset.width = widthValue;
                            pieceElement.style.width = (cellWidth * widthValue) + 'px';
                        } else {
                            alert('棋子长度过长，会超出棋盘边界！');
                        }
                    } else {
                        alert('请输入1到9之间的数字！');
                    }
                }
            }
        });
        
        // 保存棋子信息
        currentBoardPieces.push({
            id: pieceId,
            row: row,
            col: col,
            width: width,
            color: color
        });
        
        gameBoard.appendChild(pieceElement);
    }
});
