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
    const member = members.find(m => m.name === transaction.payer)
    const avatar = member ? (member.avatar || "😊") : "😊"
    const category = transaction.category || "Miscellaneous"

    // const participants = transaction.participants || []
    const participantsCount = transaction.participants.length || members.length
    const participantsInfo = participantsCount === members.length
      ? 'All members'
      : `${participantsCount} participant${participantsCount > 1 ? 's' : ''}`

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
          <span class="transaction-participants">${participantsInfo}</span>
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
    const titleInput = document.querySelector('.transactions-section input[placeholder="title"]')
    const dateInput = document.querySelector('.transactions-section input[type="date"]')
    const amountInput = document.querySelector('.transactions-section input[placeholder="amount"]')
    const categorySelect = document.querySelector('.transactions-section .category-select')
    const customCategoryInput = document.querySelector('.transactions-section .custom-category')
    const payerSelect = document.querySelector('.transactions-section .payer-select')
    const participantCheckboxes = document.querySelectorAll('.transactions-section .participant-checkbox:checked')

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

    // 驗證至少選擇了一個參與成員
    if (participantCheckboxes.length === 0) {
      document.querySelector('.participants-container').classList.add('error');
      valid = false;
      errorMessage = errorMessage || 'Please select at least one participant';
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

    // 收集參與成員ID
    const participants = Array.from(participantCheckboxes).map(checkbox => checkbox.value)

    // 收集表單數據
    return {
      title: titleInput.value.trim(),
      date: dateInput.value,
      amount: parseFloat(amountInput.value),
      category: category,
      payerId: payerSelect.value,
      participants: participants,
      isNewCategory: category !== categorySelect.value
    };
  }

  updateParticipantsSelection(members) {
    const formGroup = document.querySelector('.add-expense-group')

    // 如果參與者選擇區域已存在，先移除
    const existingContainer = document.querySelector('.participants-container')
    if (existingContainer) {
      existingContainer.remove()
    }

    // 創建參與者選擇容器
    const participantsContainer = document.createElement('div')
    participantsContainer.className = 'participants-container'
    participantsContainer.style.gridColumn = '1 / -1'
    participantsContainer.style.marginTop = '10px'
    participantsContainer.style.marginBottom = '10px'
    participantsContainer.style.padding = '10px'
    participantsContainer.style.border = '1px solid #A78BFA'
    participantsContainer.style.borderRadius = '6px'

    // 創建標題
    const title = document.createElement('div')
    title.textContent = 'Participants:'
    title.style.marginBottom = '10px'
    title.style.fontWeight = 'bold'
    title.style.marginLeft = '5px'
    participantsContainer.appendChild(title)

    // 創建成員選擇區域
    const participantsGrid = document.createElement('div')
    participantsGrid.className = 'participants-grid'
    participantsGrid.style.display = 'flex'
    participantsGrid.style.justifyContent = "space-around"
    participantsGrid.style.gap = '10px'
    participantsGrid.style.whiteSpace = 'nowrap'
    participantsGrid.style.scrollSnapType = 'x mandatory'
    participantsGrid.style.overflowX = "auto"
    participantsGrid.style.paddingBottom = '10px'

    // 隱藏滾動條
    participantsGrid.style.cssText += `
    -ms-overflow-style: none;
    scrollbar-width: none;
  `;
    participantsGrid.style.cssText += `
    ::-webkit-scrollbar {
      display: none;
    }
  `;

    // 添加全選/取消全選按鈕
    const selectAllContainer = document.createElement('div')
    selectAllContainer.style.marginBottom = '10px'
    selectAllContainer.style.display = 'flex'
    selectAllContainer.style.justifyContent = 'center'
    selectAllContainer.style.gap = '10px'

    const selectAllBtn = document.createElement('button')
    selectAllBtn.type = 'button'
    selectAllBtn.className = 'btn select-all-btn'
    selectAllBtn.textContent = 'Select All'

    const deselectAllBtn = document.createElement('button')
    deselectAllBtn.type = 'button'
    deselectAllBtn.className = 'btn deselect-all-btn'
    deselectAllBtn.textContent = 'Deselect All'

    selectAllContainer.appendChild(selectAllBtn)
    selectAllContainer.appendChild(deselectAllBtn)
    participantsContainer.appendChild(selectAllContainer)

    // 為每個成員創建選擇項
    members.forEach(member => {
      const memberItem = document.createElement('div')
      memberItem.className = 'participant-item'
      memberItem.style.display = 'flex'
      memberItem.style.flexDirection = 'column'
      memberItem.style.alignItems = 'center'
      memberItem.style.gap = '5px'
      memberItem.style.scrollSnapAlign = 'start'
      memberItem.style.minWidth = '100px'
      memberItem.style.flexShrink = '0'
      memberItem.style.textAlign = "center"

      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.className = 'participant-checkbox'
      checkbox.value = member.id
      checkbox.id = `participant-${member.id}`
      checkbox.checked = true
      checkbox.style.margin = '0 auto'
      checkbox.style.display = 'block'

      const label = document.createElement('label')
      label.htmlFor = `participant-${member.id}`
      label.style.display = 'flex'
      label.style.flexDirection = 'column'
      label.style.alignItems = 'center'
      label.style.width = '100%'
      label.style.cursor = 'pointer'

      const avatar = document.createElement('span')
      avatar.className = 'avatar'
      avatar.textContent = member.avatar || '😊'
      avatar.style.fontSize = '2rem'
      avatar.style.display = 'block'
      avatar.style.margin = '0 auto 5px auto'
      avatar.style.width = '46px'
      avatar.style.height = '46px'
      avatar.style.lineHeight = '46px'
      avatar.style.textAlign = 'center'
      avatar.style.backgroundColor = 'rgba(124, 58, 237, 0.1)'

      const name = document.createTextNode(member.name)
      

      label.appendChild(avatar)
      label.appendChild(name)

      memberItem.appendChild(checkbox)
      memberItem.appendChild(label)
      participantsGrid.appendChild(memberItem)
    })

    participantsContainer.appendChild(participantsGrid)

    // 添加事件監聽
    const addButton = document.querySelector('.add-expense-group .add-btn')

    if (addButton) {
      let insertBeforeElement = addButton

      while (insertBeforeElement.parentNode !== formGroup && insertBeforeElement.parentNode !== document.body) {
        insertBeforeElement = insertBeforeElement.parentNode;
      }

      if (insertBeforeElement.parentNode === formGroup) {
        formGroup.insertBefore(participantsContainer, insertBeforeElement);
      } else {
        // 如果找不到合適的位置，簡單地添加到 formGroup 的末尾
        formGroup.appendChild(participantsContainer);
      }
    } else {
      // 如果找不到添加按鈕，直接添加到表單末尾
      formGroup.appendChild(participantsContainer);
    }

    // 綁定全選/取消全選按鈕事件
    selectAllBtn.addEventListener('click', () => {
      document.querySelectorAll('.participant-checkbox').forEach(checkbox => {
        checkbox.checked = true;
      })
    })

    deselectAllBtn.addEventListener('click', () => {
      document.querySelectorAll('.participant-checkbox').forEach(checkbox => {
        checkbox.checked = false
      })
    })
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

    const participants = transaction.participants || []

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
    
    <div class="edit-participants-container" style="grid-column: 1 / -1; margin: 10px 0; padding: 10px; border: 1px solid #A78BFA; border-radius: 6px;">
      <div style="margin-bottom: 10px; font-weight: bold; text-align: center;">Participants:</div>
      <div style="display: flex; margin-bottom: 10px; justify-content: center; gap: 10px;">
        <button type="button" class="btn edit-select-all-btn">Select All</button>
        <button type="button" class="btn edit-deselect-all-btn">Deselect All</button>
      </div>
      <div class="edit-participants-grid" style="display: flex; overflow-x: auto; gap: 10px; justify-content: space-around; white-space: nowrap; padding-bottom: 10px; scrollbar-width: none; -ms-overflow-style: none;">
        ${members.map(m => `
          <div class="edit-participant-item" style="display: flex; flex-direction: column; align-items: center; text-align: center; min-width: 100px; flex-shrink: 0; scroll-snap-align: start;">
            <input type="checkbox" class="edit-participant-checkbox" value="${m.id}" id="edit-participant-${m.id}" 
              ${participants.includes(m.id) ? 'checked' : ''} style="margin: 0 auto; display: block;">
            <label for="edit-participant-${m.id}" style="display: flex; flex-direction: column; align-items: center; width: 100%; cursor: pointer;">
              <span class="avatar" style="font-size: 2rem; display: block; margin: 0 auto 5px auto; width: 46px; height: 46px; line-height: 46px; text-align: center; background-color: rgba(124, 58, 237, 0.1); border-radius: 50%;">${m.avatar || '😊'}</span>
              <span style="display: block; text-align: center; width: 100%; overflow: hidden; text-overflow: ellipsis;">${m.name}</span>
            </label>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="edit-actions">
      <button class="btn save-btn">save</button>
      <button class="btn cancel-btn">cancel</button>
    </div>
  `;

    const expenseRow = this.container.querySelector(`[data-transaction-id="${transaction.id}"]`)
    if (expenseRow) {
      expenseRow.replaceWith(editingContainer)
      const categorySelect = editingContainer.querySelector('.edit-category')
      if (categorySelect) {
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
    this.setupParticipantsEvents(editingContainer)

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
    const titleInput = editingContainer.querySelector('.edit-title')
    if (titleInput) titleInput.focus()
  }

  setupParticipantsEvents(container) {
    const selectAllBtn = container.querySelector('.edit-select-all-btn')
    const deselectAllBtn = container.querySelector('.edit-deselect-all-btn')

    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => {
        container.querySelectorAll('.edit-participant-checkbox').forEach(checkbox => {
          checkbox.checked = true
        })
      })
    }

    if (deselectAllBtn) {
      deselectAllBtn.addEventListener('click', () => {
        container.querySelectorAll('.edit-participant-checkbox').forEach(checkbox => {
          checkbox.checked = false
        })
      })
    }
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
    const titleInput = editForm.querySelector('.edit-title')
    const dateInput = editForm.querySelector('.edit-date')
    const amountInput = editForm.querySelector('.edit-amount')
    const categorySelect = editForm.querySelector('.edit-category')
    const customCategoryInput = editForm.querySelector('.edit-custom-category')
    const payerSelect = editForm.querySelector('.edit-payer')
    const participantCheckboxes = editForm.querySelectorAll('.edit-participant-checkbox:checked')

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

    // 驗證至少選擇了一個參與成員
    if (participantCheckboxes.length === 0) {
      editForm.querySelector('.edit-participants-container').classList.add('error');
      valid = false;
      errorMessage = errorMessage || 'Please select at least one participant';
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

    const participants = Array.from(participantCheckboxes).map(checkbox => checkbox.value)

    this.editingTransactionId = null

    // 發送保存請求
    this.emit('transaction-save-requested', {
      id: transactionId,
      title: titleInput.value.trim(),
      date: dateInput.value,
      amount: parseFloat(amountInput.value),
      category: category,
      payerId: payerSelect.value,
      participants: participants,
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