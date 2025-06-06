document.addEventListener('DOMContentLoaded', function() {
    const gameBoard = document.getElementById('gameBoard');
    
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
    
    // 添加示例方块（蓝色和粉色方块）
    // 添加蓝色方块
    const blueBlockPositions = [
        { row: 7, col: 2 },
        { row: 7, col: 3 },
        { row: 7, col: 4 },
        { row: 7, col: 5 },
        { row: 7, col: 6 }
    ];
    
    blueBlockPositions.forEach(pos => {
        const cell = gameBoard.querySelector(
            `[data-row="${pos.row}"][data-col="${pos.col}"]`
        );
        if (cell) {
            cell.classList.add('blue-piece');
        }
    });
    
    // 添加粉色方块
    const pinkBlockPositions = [
        { row: 8, col: 3 },
        { row: 8, col: 4 },
        { row: 8, col: 5 }
    ];
    
    pinkBlockPositions.forEach(pos => {
        const cell = gameBoard.querySelector(
            `[data-row="${pos.row}"][data-col="${pos.col}"]`
        );
        if (cell) {
            cell.classList.add('pink-piece');
        }
    });
    
    // 按钮功能实现（示例部分功能）
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // 简单示例: 显示操作名称
            alert(`你点击了 ${this.textContent} 按钮`);
            
            // 模拟运行按钮特殊处理
            if (this.textContent === '模拟运行') {
                console.log('执行模拟运行...');
                // 这里可以添加模拟运行的实际逻辑
            }
        });
    });   
    
    // 这里可以添加更多功能实现
    // 如拖拽棋子、调整棋子长度、游戏逻辑等
});
