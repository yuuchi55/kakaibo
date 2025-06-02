// グローバル変数
let transactions = [];
let currentMonth = new Date();
let selectedCategory = null;
let transactionType = 'expense';

// カテゴリーデータ
const categories = {
    expense: [
        { 
            id: 'food', 
            name: '食費', 
            icon: '🍽️',
            subcategories: [
                { id: 'restaurant', name: '外食', icon: '🍔' },
                { id: 'groceries', name: '食材', icon: '🥕' },
                { id: 'cafe', name: 'カフェ', icon: '☕' }
            ]
        },
        { 
            id: 'transport', 
            name: '交通費', 
            icon: '🚃',
            subcategories: [
                { id: 'train', name: '電車', icon: '🚆' },
                { id: 'bus', name: 'バス', icon: '🚌' },
                { id: 'taxi', name: 'タクシー', icon: '🚕' },
                { id: 'gas', name: 'ガソリン', icon: '⛽' },
                { id: 'highway', name: '高速道路', icon: '🛣️' },
                { id: 'parking', name: '駐車場', icon: '🅿️' },
                { id: 'other_transport', name: 'その他', icon: '🚲' }
            ]
        },
        { id: 'shopping', name: '買い物', icon: '🛍️' },
        { id: 'entertainment', name: '娯楽', icon: '🎮' },
        { id: 'utilities', name: '光熱費', icon: '💡' },
        { id: 'medical', name: '医療費', icon: '🏥' },
        { id: 'education', name: '教育費', icon: '📚' },
        { id: 'other', name: 'その他', icon: '📝' }
    ],
    income: [
        { id: 'salary', name: '給料', icon: '💰' },
        { id: 'bonus', name: 'ボーナス', icon: '🎁' },
        { id: 'investment', name: '投資', icon: '📈' },
        { id: 'other_income', name: 'その他', icon: '💵' }
    ]
};

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    loadTransactions();
    initializeEventListeners();
    setDefaultDate();
    renderCategories();
    updateDisplay();
});

// イベントリスナーの設定
function initializeEventListeners() {
    // 収支タイプ切り替え
    document.querySelectorAll('.type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            transactionType = this.dataset.type;
            renderCategories();
        });
    });

    // フォーム送信
    document.getElementById('transactionForm').addEventListener('submit', handleSubmit);

    // 月切り替え
    document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));
}

// デフォルト日付を今日に設定
function setDefaultDate() {
    const today = new Date();
    document.getElementById('date').value = today.toISOString().split('T')[0];
}

// カテゴリーボタンの描画
function renderCategories(parentCategory = null) {
    const categoryGrid = document.getElementById('categoryGrid');
    categoryGrid.innerHTML = '';
    
    // 戻るボタンの追加（サブカテゴリー表示時）
    if (parentCategory) {
        const backBtn = document.createElement('button');
        backBtn.type = 'button';
        backBtn.className = 'category-btn back-btn';
        backBtn.innerHTML = `
            <span class="category-icon">◀</span>
            戻る
        `;
        backBtn.addEventListener('click', () => {
            selectedCategory = null;
            renderCategories();
        });
        categoryGrid.appendChild(backBtn);
    }

    const categoryList = parentCategory 
        ? parentCategory.subcategories 
        : categories[transactionType];
    
    categoryList.forEach(category => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'category-btn';
        btn.dataset.categoryId = category.id;
        
        // サブカテゴリーがある場合は矢印を表示
        const hasSubcategories = category.subcategories && category.subcategories.length > 0;
        btn.innerHTML = `
            <span class="category-icon">${category.icon}</span>
            ${category.name}
            ${hasSubcategories ? '<span class="subcategory-arrow">▶</span>' : ''}
        `;
        
        btn.addEventListener('click', function() {
            if (hasSubcategories) {
                // サブカテゴリーがある場合は、サブカテゴリーを表示
                renderCategories(category);
            } else {
                // サブカテゴリーがない場合は選択
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');
                
                // 親カテゴリーがある場合は、親カテゴリー情報も含める
                if (parentCategory) {
                    selectedCategory = {
                        ...category,
                        parentCategory: {
                            id: parentCategory.id,
                            name: parentCategory.name,
                            icon: parentCategory.icon
                        }
                    };
                } else {
                    selectedCategory = category;
                }
            }
        });

        categoryGrid.appendChild(btn);
    });
}

// フォーム送信処理
function handleSubmit(e) {
    e.preventDefault();

    if (!selectedCategory) {
        alert('カテゴリーを選択してください');
        return;
    }

    const amount = parseInt(document.getElementById('amount').value);
    const memo = document.getElementById('memo').value;
    const date = document.getElementById('date').value;

    const transaction = {
        id: Date.now(),
        type: transactionType,
        amount: amount,
        category: selectedCategory,
        memo: memo,
        date: date,
        createdAt: new Date().toISOString()
    };

    transactions.push(transaction);
    saveTransactions();
    resetForm();
    updateDisplay();
}

// フォームリセット
function resetForm() {
    document.getElementById('transactionForm').reset();
    setDefaultDate();
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('selected'));
    selectedCategory = null;
}

// 月の変更
function changeMonth(direction) {
    currentMonth.setMonth(currentMonth.getMonth() + direction);
    updateDisplay();
}

// 表示の更新
function updateDisplay() {
    updateMonthDisplay();
    updateSummary();
    updateTransactionList();
    updateChart();
}

// 月表示の更新
function updateMonthDisplay() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    document.getElementById('currentMonth').textContent = `${year}年${month}月`;
}

// 集計の更新
function updateSummary() {
    const monthTransactions = getMonthTransactions();
    
    const totalIncome = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpense;

    document.getElementById('totalIncome').textContent = `¥${totalIncome.toLocaleString()}`;
    document.getElementById('totalExpense').textContent = `¥${totalExpense.toLocaleString()}`;
    document.getElementById('totalBalance').textContent = `¥${balance.toLocaleString()}`;
    document.getElementById('currentBalance').textContent = `¥${balance.toLocaleString()}`;
}

// 取引履歴の更新
function updateTransactionList() {
    const transactionList = document.getElementById('transactionList');
    const monthTransactions = getMonthTransactions();
    
    if (monthTransactions.length === 0) {
        transactionList.innerHTML = '<p style="text-align: center; color: #999;">取引履歴がありません</p>';
        return;
    }

    // 日付の降順でソート
    monthTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    transactionList.innerHTML = monthTransactions.map(transaction => {
        const date = new Date(transaction.date);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
        const amountClass = transaction.type === 'income' ? 'income' : 'expense';
        const amountSign = transaction.type === 'income' ? '+' : '-';
        
        // カテゴリー表示の処理
        let categoryDisplay = `${transaction.category.icon} ${transaction.category.name}`;
        if (transaction.category.parentCategory) {
            categoryDisplay = `${transaction.category.parentCategory.icon} ${transaction.category.parentCategory.name} > ${transaction.category.icon} ${transaction.category.name}`;
        }

        return `
            <div class="transaction-item">
                <div class="transaction-info">
                    <div class="transaction-date">${dateStr}</div>
                    <div class="transaction-category">${categoryDisplay}</div>
                    ${transaction.memo ? `<div class="transaction-memo">${transaction.memo}</div>` : ''}
                </div>
                <div>
                    <span class="transaction-amount ${amountClass}">${amountSign}¥${transaction.amount.toLocaleString()}</span>
                    <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">削除</button>
                </div>
            </div>
        `;
    }).join('');
}

// グラフの更新
function updateChart() {
    const monthTransactions = getMonthTransactions();
    const expenseTransactions = monthTransactions.filter(t => t.type === 'expense');
    
    // 大項目と中項目で集計
    const categoryData = {};
    
    expenseTransactions.forEach(t => {
        // 親カテゴリーがある場合（中項目の場合）
        if (t.category.parentCategory) {
            const parentId = t.category.parentCategory.id;
            const parentName = t.category.parentCategory.name;
            const parentIcon = t.category.parentCategory.icon;
            
            if (!categoryData[parentId]) {
                categoryData[parentId] = {
                    id: parentId,
                    name: parentName,
                    icon: parentIcon,
                    total: 0,
                    subcategories: {}
                };
            }
            
            categoryData[parentId].total += t.amount;
            
            if (!categoryData[parentId].subcategories[t.category.id]) {
                categoryData[parentId].subcategories[t.category.id] = {
                    id: t.category.id,
                    name: t.category.name,
                    icon: t.category.icon,
                    amount: 0
                };
            }
            categoryData[parentId].subcategories[t.category.id].amount += t.amount;
        } else {
            // 親カテゴリーがない場合（大項目のみの場合）
            const categoryId = t.category.id;
            if (!categoryData[categoryId]) {
                categoryData[categoryId] = {
                    id: categoryId,
                    name: t.category.name,
                    icon: t.category.icon,
                    total: 0,
                    subcategories: {}
                };
            }
            categoryData[categoryId].total += t.amount;
        }
    });
    
    // 既存のチャートを破棄
    const existingChart = Chart.getChart('categoryChart');
    if (existingChart) {
        existingChart.destroy();
    }

    if (Object.keys(categoryData).length === 0) {
        document.getElementById('chartContainer').innerHTML = '<p style="text-align: center; color: #999;">データがありません</p>';
        return;
    }

    document.getElementById('chartContainer').innerHTML = '<canvas id="categoryChart"></canvas>';
    
    // 一つの円グラフで表示するためのデータを準備
    const labels = [];
    const data = [];
    const backgroundColor = [];
    const borderColor = [];
    
    // カラーパレット
    const parentColors = {
        'food': '#ff6b6b',
        'transport': '#4ecdc4',
        'shopping': '#45b7d1',
        'entertainment': '#f9ca24',
        'utilities': '#6c5ce7',
        'medical': '#a29bfe',
        'education': '#fd79a8',
        'other': '#dfe6e9'
    };
    
    // 各カテゴリーのデータを処理
    Object.values(categoryData).forEach((category) => {
        const hasSubcategories = Object.keys(category.subcategories).length > 0;
        const baseColor = parentColors[category.id] || '#999999';
        
        if (hasSubcategories) {
            // サブカテゴリーがある場合は、サブカテゴリーごとに追加
            Object.values(category.subcategories).forEach((sub, index) => {
                labels.push(`${category.icon} ${category.name} - ${sub.icon} ${sub.name}`);
                data.push(sub.amount);
                // 同じ大項目のサブカテゴリーは似た色にする（明度を変える）
                const brightness = 0.7 + (index * 0.1);
                backgroundColor.push(adjustColor(baseColor, brightness));
                borderColor.push('#fff');
            });
        } else {
            // サブカテゴリーがない場合は大項目をそのまま追加
            labels.push(`${category.icon} ${category.name}`);
            data.push(category.total);
            backgroundColor.push(baseColor);
            borderColor.push('#fff');
        }
    });
    
    // 円グラフを作成
    const ctx = document.getElementById('categoryChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColor,
                borderWidth: 2,
                borderColor: borderColor
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 10,
                        font: {
                            size: 11
                        },
                        generateLabels: function(chart) {
                            const data = chart.data;
                            const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                            
                            return data.labels.map((label, i) => {
                                const value = data.datasets[0].data[i];
                                const percentage = ((value / total) * 100).toFixed(1);
                                
                                return {
                                    text: `${label} (${percentage}%)`,
                                    fillStyle: data.datasets[0].backgroundColor[i],
                                    strokeStyle: data.datasets[0].borderColor[i],
                                    lineWidth: data.datasets[0].borderWidth,
                                    hidden: false,
                                    index: i
                                };
                            });
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ¥${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// 色の明度を調整する関数
function adjustColor(color, brightness) {
    // HEXカラーをRGBに変換
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // 明度を調整
    const newR = Math.min(255, Math.floor(r * brightness));
    const newG = Math.min(255, Math.floor(g * brightness));
    const newB = Math.min(255, Math.floor(b * brightness));
    
    // RGBをHEXに戻す
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

// 現在の月の取引を取得
function getMonthTransactions() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    return transactions.filter(t => {
        const date = new Date(t.date);
        return date.getFullYear() === year && date.getMonth() === month;
    });
}

// 取引の削除
function deleteTransaction(id) {
    if (confirm('この取引を削除しますか？')) {
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        updateDisplay();
    }
}

// LocalStorageへの保存
function saveTransactions() {
    localStorage.setItem('piggyBankTransactions', JSON.stringify(transactions));
}

// LocalStorageからの読み込み
function loadTransactions() {
    const saved = localStorage.getItem('piggyBankTransactions');
    if (saved) {
        transactions = JSON.parse(saved);
    }
}