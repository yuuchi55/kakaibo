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
        { id: 'transport', name: '交通費', icon: '🚃' },
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
    
    // カテゴリー別集計
    const categoryTotals = {};
    expenseTransactions.forEach(t => {
        const categoryId = t.category.id;
        if (!categoryTotals[categoryId]) {
            categoryTotals[categoryId] = {
                name: t.category.name,
                amount: 0
            };
        }
        categoryTotals[categoryId].amount += t.amount;
    });

    const chartData = Object.values(categoryTotals);
    
    // 既存のチャートを破棄
    const existingChart = Chart.getChart('categoryChart');
    if (existingChart) {
        existingChart.destroy();
    }

    if (chartData.length === 0) {
        document.getElementById('chartContainer').innerHTML = '<p style="text-align: center; color: #999;">データがありません</p>';
        return;
    }

    document.getElementById('chartContainer').innerHTML = '<canvas id="categoryChart"></canvas>';

    // 新しいチャートを作成
    const ctx = document.getElementById('categoryChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartData.map(d => d.name),
            datasets: [{
                data: chartData.map(d => d.amount),
                backgroundColor: [
                    '#ff6b6b',
                    '#4ecdc4',
                    '#45b7d1',
                    '#f9ca24',
                    '#6c5ce7',
                    '#a29bfe',
                    '#fd79a8',
                    '#dfe6e9'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
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