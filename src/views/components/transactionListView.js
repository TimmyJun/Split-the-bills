export class TransactionListView {
  constructor(container) {
    this.container = container
    this.eventHandlers = {}
    this.editingTransactionId = null
  }

  // 綁定事件處理器
  on(eventName, handler) {
    this.eventHandlers[eventName] = this.eventHandlers[eventName] || [];
    this.eventHandlers[eventName].push(handler);
    return this;
  }

  // 觸發事件
  emit(eventName, data) {
    const handlers = this.eventHandlers[eventName] || [];
    handlers.forEach(handler => handler(data));
  }

  // 初始化事件監聽
  initEventListeners() {
    // 交易列表事件委派處理
    this.container.addEventListener('click', (e) => {
      const expenseRow = e.target.closest('.expense-row');
      if (!expenseRow) return;

      const transactionId = expenseRow.dataset.transactionId;

      if (e.target.classList.contains('remove-btn')) {
        this.emit('transaction-remove-requested', { id: transactionId });
      } else if (e.target.classList.contains('edit-btn')) {
        this.emit('transaction-edit-requested', { id: transactionId });
      }
    });

    // 新增交易按鈕事件
    const addBtn = document.querySelector('.transactions-section .add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.emit('transaction-add-requested', {});
      });
    }

    // 綁定分類選擇器的變更事件
    const categorySelect = document.querySelector(".transactions-section .category-select")
    if (categorySelect) {
      categorySelect.addEventListener('change', (e) => {
        const customCategoryContainer = document.querySelector('.custom-category-container')
        const customCategoryInput = document.querySelector('.custom-category')

        if (e.target.value === "Others") {
          customCategoryContainer.style.display = 'block'
          customCategoryInput.focus()
        } else {
          customCategoryContainer.style.display = 'none'
          customCategoryInput.value = ''
        }
      })
    }

    // 表單提交處理
    document.querySelector('.add-expense-group').addEventListener('submit', (e) => {
      e.preventDefault()
    })

    // 綁定回車鍵提交
    const handleEnterKey = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        addBtn.click();
      }
    }

    const inputs = document.querySelectorAll('.transactions-section .input-field')
    inputs.forEach(input => {
      input.addEventListener('keydown', handleEnterKey)
    })
  }

  // 渲染交易列表
  render(transactions, members) {
    if (this.editingTransactionId) {
      return
    }

    this.container.innerHTML = transactions.map(transaction =>
      this.renderTransactionRow(transaction, members)
    ).join('');
  }

  // 渲染單個交易行
  renderTransactionRow(transaction, members) {
    // 尋找對應成員獲取頭像
    const member = members.find(m => m.name === transaction.payer)
    const avatar = member ? (member.avatar || "😊") : "😊"
    const category = transaction.category || "Miscellaneous"

    return `
      <div class="expense-row" data-transaction-id="${transaction.id}">
        <div class="expense-info">
          <div class="avatar">${avatar}</div>
          <span class="payer">${transaction.payer}</span>
          <div class="expense-content">
            <span class="expense-name">${transaction.title} 
              <span class="transaction-category">${category}</span>
            </span>
            <span class="transaction-date">${transaction.date}</span>
          </div>
        </div>
        <span class="amount">$${transaction.amount}</span>
        <div class="expense-actions">
          <button class="btn edit-btn">edit</button>
          <button class="btn remove-btn">remove</button>
        </div>
      </div>
    `;
  }

  // 更新成員選擇器
  updatePayerSelect(members) {
    const payerSelect = document.querySelector('.transactions-section .payer-select');
    if (payerSelect) {
      payerSelect.innerHTML = `
        <option value="">payer</option>
        ${members.map(member => `
          <option value="${member.id}">${member.name}</option>
        `).join('')}
      `;
    }
  }

  updateCategorySelect(categories) {
    const categorySelect = document.querySelector('.transactions-section .category-select');
    if (categorySelect) {
      categorySelect.innerHTML = `
        <option value="">category</option>
        ${categories.map(category => `
          <option value="${category}">${category}</option>
        `).join('')}
      `;
    }
  }

  // 清空新增交易輸入框
  clearAddTransactionInputs() {
    const titleInput = document.querySelector('.transactions-section input[placeholder="title"]')
    const dateInput = document.querySelector('.transactions-section input[type="date"]')
    const amountInput = document.querySelector('.transactions-section input[placeholder="amount"]')
    const categorySelect = document.querySelector('.transactions-section .category-select')
    const customCategoryInput = document.querySelector('.transactions-section .custom-category')
    const customCategoryContainer = document.querySelector('.transactions-section .custom-category-container')
    const payerSelect = document.querySelector('.transactions-section select')

    if (titleInput) titleInput.value = ''
    if (amountInput) amountInput.value = ''
    if (categorySelect) categorySelect.value = ''
    if (customCategoryInput) customCategoryInput.value = ''
    if (customCategoryContainer) customCategoryContainer.style.display = 'none'
    if (payerSelect) payerSelect.value = ''

    // 設定日期為今天
    if (dateInput) {
      const today = new Date().toISOString().split('T')[0];
      dateInput.value = today;
    }

    // 聚焦到標題輸入框
    if (titleInput) {
      titleInput.focus();
    }
  }

  // 驗證表單并顯示錯誤
  validateAndCollectFormData() {
    // 先聲明所有變量，然後才使用它們
    const titleInput = document.querySelector('.transactions-section input[placeholder="title"]');
    const dateInput = document.querySelector('.transactions-section input[type="date"]');
    const amountInput = document.querySelector('.transactions-section input[placeholder="amount"]');
    const categorySelect = document.querySelector('.transactions-section .category-select');
    const customCategoryInput = document.querySelector('.transactions-section .custom-category');
    const payerSelect = document.querySelector('.transactions-section .payer-select');

    // 重置所有錯誤狀態
    [titleInput, dateInput, amountInput, categorySelect, customCategoryInput, payerSelect].forEach(input => {
      if (input) input.classList.remove('error');
    });

    let valid = true;
    let errorMessage = '';

    // 驗證標題
    if (!titleInput.value.trim()) {
      titleInput.classList.add('error');
      valid = false;
      errorMessage = 'Please enter the transaction title';
    }

    // 驗證日期
    if (!dateInput.value) {
      dateInput.classList.add('error');
      valid = false;
      errorMessage = errorMessage || 'Please enter the transaction date';
    }

    // 驗證金額
    if (!amountInput.value || isNaN(amountInput.value) || parseFloat(amountInput.value) <= 0) {
      amountInput.classList.add('error');
      valid = false;
      errorMessage = errorMessage || 'Please enter available amount';
    }

    // 驗證分類
    if (!categorySelect.value) {
      categorySelect.classList.add('error');
      valid = false;
      errorMessage = errorMessage || 'Please select a category';
    }

    // 驗證自定義分類 (當選擇 "Others" 時)
    if (categorySelect.value === 'Others' && !customCategoryInput.value.trim()) {
      customCategoryInput.classList.add('error');
      valid = false;
      errorMessage = errorMessage || 'Please enter a custom category';
    }

    // 驗證付款人
    if (!payerSelect.value) {
      payerSelect.classList.add('error');
      valid = false;
      errorMessage = errorMessage || 'Please choose the payer';
    }

    if (!valid) {
      alert(errorMessage);
      return null;
    }

    // 決定使用哪個分類值
    let category = categorySelect.value;
    if (category === 'Others' && customCategoryInput.value.trim()) {
      category = customCategoryInput.value.trim();
    }

    // 收集表單數據
    return {
      title: titleInput.value.trim(),
      date: dateInput.value,
      amount: parseFloat(amountInput.value),
      category: category,
      payerId: payerSelect.value,
      isNewCategory: category !== categorySelect.value
    };
  }

  startEditing(transaction, members) {
    if (this.editingTransactionId) {
      alert('Please finish editing the current transaction first.');
      return;
    }

    this.editingTransactionId = transaction.id

    const editingContainer = document.createElement('div')
    editingContainer.className = 'expense-edit-form'
    editingContainer.dataset.transactionId = transaction.id

    // 找到對應的付款人
    const member = members.find(m => m.name === transaction.payer)
    const memberId = member ? member.id : ''

    editingContainer.innerHTML = `
      <input type="text" class="input-field edit-title" value="${transaction.title}" placeholder="title">
      <input type="date" class="input-field edit-date" value="${transaction.date}">
      <input type="number" step="0.01" class="input-field edit-amount" value="${transaction.amount}" placeholder="amount">
      <select class="input-field edit-category">
        <option value="">category</option>
        ${this.getCategoriesOptions(transaction.category)}
      </select>
      <div class="edit-custom-category-container" style="display: none;">
        <input type="text" class="input-field edit-custom-category" placeholder="custom category">
      </div>
      <select class="input-field edit-payer">
        <option value="">payer</option>
        ${members.map(m => `
          <option value="${m.id}" ${m.id === memberId ? 'selected' : ''}>${m.name}</option>
        `).join('')}
      </select>
      <div class="edit-actions">
        <button class="btn save-btn">save</button>
        <button class="btn cancel-btn">cancel</button>
      </div>
    `;

    const expenseRow = this.container.querySelector(`[data-transaction-id="${transaction.id}"]`)
    if(expenseRow) {
      expenseRow.replaceWith(editingContainer)
      const categorySelect = editingContainer.querySelector('.edit-category')
      if(categorySelect) {
        // 如果是自定義分類，設置為 "Others"
        if (categorySelect.querySelector(`option[value="${transaction.category}"]`)) {
          categorySelect.value = transaction.category
        } else {
          categorySelect.value = "Others"
          const customCategoryContainer = editingContainer.querySelector('.edit-custom-category-container')
          const customCategoryInput = editingContainer.querySelector('.edit-custom-category')
          if (customCategoryContainer) customCategoryContainer.style.display = 'block'
          if (customCategoryInput) customCategoryInput.value = transaction.category
        }
      }
    }

    this.setupCategorySelectEvents(editingContainer)

    // 綁定保存和取消按鈕事件
    const saveBtn = editingContainer.querySelector('.save-btn')
    const cancelBtn = editingContainer.querySelector('.cancel-btn')

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        this.saveTransactionEdit(transaction.id)
      })
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.cancelTransactionEdit(transaction.id, transaction, members)
      })
    }

    // 聚焦到標題輸入框
    const titleInput = editingContainer.querySelector('.edit-title');
    if (titleInput) titleInput.focus();
  }

  setupCategorySelectEvents(container) {
    const categorySelect = container.querySelector('.edit-category');
    if (categorySelect) {
      categorySelect.addEventListener('change', (e) => {
        const customCategoryContainer = container.querySelector('.edit-custom-category-container');
        const customCategoryInput = container.querySelector('.edit-custom-category');

        if (e.target.value === "Others") {
          customCategoryContainer.style.display = 'block';
          customCategoryInput.focus();
        } else {
          customCategoryContainer.style.display = 'none';
          customCategoryInput.value = '';
        }
      });
    }
  }

  getCategoriesOptions(selectedCategory) {
    let categories = [];

    const mainCategorySelect = document.querySelector('.transactions-section .category-select');
    if (mainCategorySelect) {
      const options = Array.from(mainCategorySelect.querySelectorAll('option'));
      categories = options.map(option => option.value).filter(value => value);
    }

    return categories.map(category => `
    <option value="${category}" ${category === selectedCategory ? 'selected' : ''}>${category}</option>
  `).join('');
  }

  saveTransactionEdit(transactionId) {
    const editForm = this.container.querySelector(`.expense-edit-form[data-transaction-id="${transactionId}"]`);
    if (!editForm) return;

    // 收集表單數據
    const titleInput = editForm.querySelector('.edit-title');
    const dateInput = editForm.querySelector('.edit-date');
    const amountInput = editForm.querySelector('.edit-amount');
    const categorySelect = editForm.querySelector('.edit-category');
    const customCategoryInput = editForm.querySelector('.edit-custom-category');
    const payerSelect = editForm.querySelector('.edit-payer');

    // 驗證
    let valid = true;
    let errorMessage = '';

    // 驗證標題
    if (!titleInput.value.trim()) {
      titleInput.classList.add('error');
      valid = false;
      errorMessage = 'Please enter the transaction title';
    }

    // 驗證日期
    if (!dateInput.value) {
      dateInput.classList.add('error');
      valid = false;
      errorMessage = errorMessage || 'Please enter the transaction date';
    }

    // 驗證金額
    if (!amountInput.value || isNaN(amountInput.value) || parseFloat(amountInput.value) <= 0) {
      amountInput.classList.add('error');
      valid = false;
      errorMessage = errorMessage || 'Please enter available amount';
    }

    // 驗證分類
    if (!categorySelect.value) {
      categorySelect.classList.add('error');
      valid = false;
      errorMessage = errorMessage || 'Please select a category';
    }

    // 驗證自定義分類 (當選擇 "Others" 時)
    if (categorySelect.value === 'Others' && !customCategoryInput.value.trim()) {
      customCategoryInput.classList.add('error');
      valid = false;
      errorMessage = errorMessage || 'Please enter a custom category';
    }

    // 驗證付款人
    if (!payerSelect.value) {
      payerSelect.classList.add('error');
      valid = false;
      errorMessage = errorMessage || 'Please choose the payer';
    }

    if (!valid) {
      alert(errorMessage);
      return;
    }

    // 決定使用哪個分類值
    let category = categorySelect.value;
    if (category === 'Others' && customCategoryInput.value.trim()) {
      category = customCategoryInput.value.trim();
    }

    this.editingTransactionId = null

    // 發送保存請求
    this.emit('transaction-save-requested', {
      id: transactionId,
      title: titleInput.value.trim(),
      date: dateInput.value,
      amount: parseFloat(amountInput.value),
      category: category,
      payerId: payerSelect.value,
      isNewCategory: category !== categorySelect.value && category !== 'Others'
    });
  }

  // 取消編輯
  cancelTransactionEdit(transactionId) {
    this.editingTransactionId = null

    // 直接發出事件，讓控制器處理
    this.emit('transaction-edit-cancelled', { id: transactionId });
  }

  isEditing() {
    return this.editingTransactionId !== null;
  }
}