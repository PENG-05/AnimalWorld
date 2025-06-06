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
        // 清除所有棋子
        const boardPieces = document.querySelectorAll('.board-piece');
        boardPieces.forEach(piece => piece.remove());
        currentBoardPieces = [];
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
        
        // 在拖拽过程中显示预览
        const cell = e.target.closest('.cell');
        if (cell) {
            const row = parseInt(cell.dataset.row);
            const col = parseInt(cell.dataset.col);
            
            // 清除之前的预览
            clearPreview();
            
            // 显示新的预览
            showPreview(row, col, draggedPieceWidth, draggedPieceColor);
        }
    }
    
    // 处理放置
    function handleDrop(e) {
        e.preventDefault();
        const cell = e.target.closest('.cell');
        if (!cell) {
            // 如果是从棋盘拖拽的，恢复原来的不透明度
            if (originalPieceElement) {
                originalPieceElement.style.opacity = '1';
            }
            return;
        }
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        // 解析传递的数据
        const data = JSON.parse(e.dataTransfer.getData('text'));
        const pieceWidth = data.pieceWidth;
        const pieceColor = data.pieceColor;
        const isFromSelector = data.isFromSelector;
        
        // 清除预览
        clearPreview();
        
        // 确保棋子能完全放在棋盘上
        if (col + pieceWidth > 9) {
            // 如果是从棋盘拖拽的，恢复原来的不透明度
            if (originalPieceElement) {
                originalPieceElement.style.opacity = '1';
            }
            return;
        }
        
        // 如果是从棋盘拖拽的棋子，则移除原棋子
        if (!isFromSelector && originalPieceElement) {
            // 从数组中移除原始棋子数据
            currentBoardPieces = currentBoardPieces.filter(p => p.id !== originalPieceElement.id);
            // 从DOM中移除原始棋子
            originalPieceElement.remove();
        }
        
        // 创建棋子在新位置
        createPieceOnBoard(row, col, pieceWidth, pieceColor);
        
        // 重置拖拽状态
        draggedPiece = null;
        originalPieceElement = null;
    }
    
    // 清除预览
    function clearPreview() {
        const previewCells = document.querySelectorAll('.preview-cell');
        previewCells.forEach(cell => {
            cell.classList.remove('preview-cell');
            cell.style.backgroundColor = '';
            cell.style.opacity = '';
        });
    }
    
    // 显示预览
    function showPreview(row, col, width, color) {
        // 检查是否超出范围
        if (col + width > 9) return;
        
        for (let i = 0; i < width; i++) {
            const previewCell = document.querySelector(`.cell[data-row="${row}"][data-col="${col + i}"]`);
            if (previewCell) {
                previewCell.classList.add('preview-cell');
                previewCell.style.backgroundColor = color;
                previewCell.style.opacity = '0.5';
            }
        }
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
