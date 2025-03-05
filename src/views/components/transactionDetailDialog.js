export class TransactionDetailDialog {
  constructor() {
    this.dialog = null;
    this.currentTransactionId = null;
    this.eventHandlers = {};
    this.createDialogElement();
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

  createDialogElement() {
    this.dialog = document.createElement('dialog');
    this.dialog.className = 'transaction-detail-dialog';
    document.body.appendChild(this.dialog);

    // 添加點擊外部關閉的功能
    this.dialog.addEventListener('click', (e) => {
      const dialogDimensions = this.dialog.getBoundingClientRect();
      if (
        e.clientX < dialogDimensions.left ||
        e.clientX > dialogDimensions.right ||
        e.clientY < dialogDimensions.top ||
        e.clientY > dialogDimensions.bottom
      ) {
        this.dialog.close();
      }
    });
  }

  showTransactionDetail(transaction, members) {
    this.currentTransactionId = transaction.id

    // 找出交易的付款人資訊
    const payer = members.find(m => m.name === transaction.payer)
    const payerAvatar = payer ? payer.avatar || '😊' : '😊'
    const payerId = payer ? payer.id : ''

    // 準備參與成員列表
    const participantItems = [];

    // 如果參與者列表為空，則預設所有成員參與
    const participants = transaction.participants.length > 0
      ? transaction.participants
      : members.map(m => m.id)

    const isPayerParticipant = participants.includes(payerId)

    let paidCount = 0
    const totalParticipants = participants.length

    // 檢查每個參與者是否已付款
    participants.forEach(participantId => {
      // 如果是付款人且在參與者列表中，自動視為已付款
      if (participantId === payerId) {
        paidCount++
      }
      // 如果在已付款列表中
      else if (transaction.paidMembers && transaction.paidMembers.includes(participantId)) {
        paidCount++
      }
    })


    // 為每個參與成員準備顯示項目
    members.forEach(member => {
      if (participants.includes(member.id)) {
        const isPaid = transaction.paidMembers.includes(member.id)
        const isCurrentPayer = member.name === transaction.payer

        participantItems.push(`
        <div class="participant-payment-item ${isPaid ? 'paid' : ''} ${isCurrentPayer ? 'payer' : ''}" data-member-id="${member.id}">
          <div class="participant-info">
            <span class="avatar">${member.avatar || '😊'}</span>
            <span class="name">${member.name}</span>
            ${isCurrentPayer ? '<span class="payer-badge">Payer</span>' : ''}
          </div>
          <div class="payment-status">
            ${isCurrentPayer
            ? '<span class="status-text">Auto-confirmed</span>'
            : `<button class="btn payment-toggle-btn ${isPaid ? 'confirmed' : 'unconfirmed'}">${isPaid ? 'Confirmed' : 'Confirm'}</button>`}
          </div>
        </div>
      `)
      }
    })

    // 如果付款人不在參與者列表中，添加一個特殊項顯示付款人資訊
    if (!isPayerParticipant && payer) {
      const payerInfo = `
      <div class="participant-payment-item payer external-payer" data-member-id="${payerId}">
        <div class="participant-info">
          <span class="avatar">${payer.avatar || '😊'}</span>
          <span class="name">${payer.name}</span>
          <span class="payer-badge">External Payer</span>
        </div>
        <div class="payment-status">
          <span class="status-text">Paid for others</span>
        </div>
      </div>
    `;
      participantItems.unshift(payerInfo)
    }

    // 渲染彈窗內容
    this.dialog.innerHTML = `
    <div class="dialog-header">
      <h2 class="transaction-detail-title">
        <span class="avatar">${payerAvatar}</span>
        <span>${transaction.title}</span>
      </h2>
      <button class="btn close-btn">&times;</button>
    </div>
    
    <div class="transaction-info-summary">
      <div class="info-item">
        <div class="info-label">Date</div>
        <div class="info-value">${transaction.date}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Amount</div>
        <div class="info-value">$${parseFloat(transaction.amount).toFixed(2)}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Category</div>
        <div class="info-value">${transaction.category}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Payment Type</div>
        <div class="info-value payment-type">
          ${isPayerParticipant
        ? '<span class="shared-expense">Shared Expense</span>'
        : '<span class="paid-for-others">Paid For Others</span>'}
        </div>
      </div>
    </div>
    
    <div class="participants-payment-section">
      <h3 class="section-title">Payment Status</h3>
      <p class="section-description">
        ${isPayerParticipant
        ? 'Mark which members have confirmed their payment for this transaction:'
        : `${payer ? payer.name : 'Someone'} paid for the following participants. Click to confirm payment:`}
      </p>
      
      <div class="participants-container">
        ${participantItems.length > 0
        ? participantItems.join('')
        : '<div class="no-data">No participants for this transaction.</div>'}
      </div>
    </div>
    
    <div class="payment-summary">
      <div class="summary-item">
        <span class="summary-label">Status:</span>
        <span class="summary-value">
          ${paidCount} of ${totalParticipants} confirmed
        </span>
      </div>
    </div>
    `

    // 綁定關閉按鈕事件
    const closeBtn = this.dialog.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.dialog.close()
      })
    }

    // 綁定付款確認按鈕事件
    const paymentButtons = this.dialog.querySelectorAll('.payment-toggle-btn')
    paymentButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const parentItem = e.target.closest('.participant-payment-item');
        if (parentItem) {
          const memberId = parentItem.dataset.memberId;
          this.emit('payment-toggle-requested', {
            transactionId: this.currentTransactionId,
            memberId
          });
        }
      });
    });

    // 顯示彈窗
    this.dialog.showModal();
  }

  // 更新單個成員的付款狀態
  updateMemberPaymentStatus(memberId, isPaid) {
    const memberItem = this.dialog.querySelector(`.participant-payment-item[data-member-id="${memberId}"]`);
    if (memberItem) {
      if (isPaid) {
        memberItem.classList.add('paid');
      } else {
        memberItem.classList.remove('paid');
      }

      const button = memberItem.querySelector('.payment-toggle-btn');
      if (button) {
        button.textContent = isPaid ? 'Confirmed' : 'Confirm';
        if (isPaid) {
          button.classList.add('confirmed');
          button.classList.remove('unconfirmed');
        } else {
          button.classList.remove('confirmed');
          button.classList.add('unconfirmed');
        }
      }
    }

    // 更新摘要資訊
    this.updatePaymentSummary();
  }

  // 更新付款摘要資訊
  updatePaymentSummary() {
    // 獲取所有參與者，但排除外部付款人
    const participants = this.dialog.querySelectorAll('.participant-payment-item:not(.external-payer)');
    const totalParticipants = participants.length;

    // 計算已確認付款的參與者數量（包括付款人）
    let paidCount = 0;
    participants.forEach(participant => {
      if (participant.classList.contains('paid')) {
        paidCount++;
      }
    });

    const summaryValue = this.dialog.querySelector('.summary-value');
    if (summaryValue) {
      summaryValue.textContent = `${paidCount} of ${totalParticipants} confirmed`;
    }
  }
}