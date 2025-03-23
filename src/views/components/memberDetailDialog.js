export class MemberDetailDialog {
  constructor() {
    this.dialog = null;
    this.currentMemberId = null;
    this.createDialogElement();
  }

  createDialogElement() {
    this.dialog = document.createElement('dialog');
    this.dialog.className = 'member-detail-dialog';
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

  showMemberDetail(member, memberStats) {
    this.currentMemberId = member.id;

    // 計算分類消費數據
    const categoryItems = Object.entries(memberStats.categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => `
    <div class="category-item">
      <span class="category-name">${category}</span>
      <span class="category-amount">$${amount.toFixed(2)}</span>
    </div>
  `).join('');

    const categoryExplanation = `
  <div class="section-explanation">
    Shows your personal share of expenses across all categories, regardless of who paid.
  </div>
  `;

    const paidTransactionItems = memberStats.transactions
      .map(transaction => `
    <div class="transaction-item transaction-as-payer">
      <div class="transaction-left">
        <div class="transaction-title">${transaction.title}</div>
        <div class="transaction-date">${transaction.date}</div>
        <div class="transaction-role">
          You paid $${parseFloat(transaction.amount).toFixed(2)}
          ${transaction.participants.includes(member.id) ?
          `<span class="personal-share">(Your share: $${transaction.personalShare.toFixed(2)})</span>` :
          ''}
        </div>
      </div>
      <div class="transaction-right">
        <div class="transaction-amount">$${parseFloat(transaction.amount).toFixed(2)}</div>
        <div class="transaction-category">${transaction.category}</div>
      </div>
    </div>
  `).join('');

    const participatedTransactionItems = memberStats.participatedTransactions
      .filter(transaction => transaction.payer !== member.name)
      .map(transaction => {
        const isPaid = transaction.paidMembers && transaction.paidMembers.includes(member.id);
        return `
      <div class="transaction-item transaction-as-participant ${isPaid ? 'is-paid' : 'is-unpaid'}">
        <div class="transaction-left">
          <div class="transaction-title">${transaction.title}</div>
          <div class="transaction-date">${transaction.date}</div>
          <div class="transaction-role">
            Paid by ${transaction.payer}
            <span class="payment-status">${isPaid ? '(Paid)' : '(Unpaid)'}</span>
            <span class="transaction-total">Total: $${transaction.totalAmount.toFixed(2)}</span>
          </div>
        </div>
        <div class="transaction-right">
          <div class="transaction-amount">$${transaction.personalShare.toFixed(2)}</div>
          <div class="transaction-category">${transaction.category}</div>
        </div>
      </div>
    `;
      }).join('');

    // 合併交易記錄
    const transactionItems = paidTransactionItems + participatedTransactionItems;

    // 按債權人分組結算項目
    const paymentsByCreditor = {};
    const receiptsByDebtor = {};

    memberStats.splitDetails.forEach(settlement => {
      if (settlement.from === member.id) {
        // 此成員需要支付給別人
        if (!paymentsByCreditor[settlement.to]) {
          paymentsByCreditor[settlement.to] = {
            name: settlement.toName,
            avatar: settlement.toAvatar,
            items: []
          };
        }

        paymentsByCreditor[settlement.to].items.push({
          amount: settlement.amount,
          transactionId: settlement.transactionId,
          transactionTitle: settlement.transactionTitle
        });
      } else if (settlement.to === member.id) {
        // 此成員應該收到別人的款項
        if (!receiptsByDebtor[settlement.from]) {
          receiptsByDebtor[settlement.from] = {
            name: settlement.fromName,
            avatar: settlement.fromAvatar,
            items: []
          };
        }

        receiptsByDebtor[settlement.from].items.push({
          amount: settlement.amount,
          transactionId: settlement.transactionId,
          transactionTitle: settlement.transactionTitle
        });
      }
    });

    // 創建結算摘要 HTML
    let settlementSummaryHTML = '';

    // 檢查是否有任何需要結算的項目
    const hasPayments = Object.keys(paymentsByCreditor).length > 0;
    const hasReceipts = Object.keys(receiptsByDebtor).length > 0;

    if (!hasPayments && !hasReceipts) {
      // 判斷是否有已完成的付款
      const hasCompletedPayments = memberStats.participatedTransactions
        .some(transaction => transaction.paidMembers &&
          transaction.paidMembers.includes(member.id) &&
          transaction.payer !== member.name);

      const hasReceivedPayments = this.checkIfMemberReceivedPayments(member, memberStats);

      if (hasCompletedPayments && hasReceivedPayments) {
        settlementSummaryHTML = `<div class="no-data">All payments have been processed.</div>`;
      } else if (hasCompletedPayments) {
        settlementSummaryHTML = `<div class="no-data">You have completed all your payments.</div>`;
      } else if (hasReceivedPayments) {
        settlementSummaryHTML = `<div class="no-data">You have received all pending payments.</div>`;
      } else {
        settlementSummaryHTML = `<div class="no-data">You don't have to do anything for now.</div>`;
      }
    } else {
      // 創建「應付款項」部分 - 按債權人分組
      if (hasPayments) {
        settlementSummaryHTML += `
      <div class="settlement-section outgoing">
        <h4 class="settlement-section-title">Accounts payable</h4>
        <div class="settlement-items-container">
      `;

        Object.values(paymentsByCreditor).forEach(creditor => {
          const totalAmount = creditor.items.reduce((sum, item) => sum + item.amount, 0);

          settlementSummaryHTML += `
          <div class="settlement-group">
            <div class="settlement-item outgoing">
              <div class="settlement-person">
                <span class="avatar">${creditor.avatar}</span>
                <span class="person-name">You have to pay to ${creditor.name}</span>
              </div>
              <div class="settlement-amount">
                <span class="amount">$${totalAmount.toFixed(2)}</span>
              </div>
            </div>
        `;

          // 如果有多個交易，顯示交易明細
          if (creditor.items.length > 1) {
            settlementSummaryHTML += `
            <div class="settlement-details">
              <div class="detail-label">Transaction details:</div>
              <ul class="transaction-list">
                ${creditor.items.map(item => `
                  <li class="transaction-detail">
                    <span class="transaction-title">${item.transactionTitle || 'Unnamed transaction'}</span>
                    <span class="transaction-amount">$${item.amount.toFixed(2)}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          `;
          }

          settlementSummaryHTML += `</div>`;
        });

        settlementSummaryHTML += `
        </div>
      </div>
      `;
      }

      // 創建「應收款項」部分 - 按債務人分組
      if (hasReceipts) {
        settlementSummaryHTML += `
      <div class="settlement-section incoming">
        <h4 class="settlement-section-title">Accounts receivable</h4>
        <div class="settlement-items-container">
      `;

        Object.values(receiptsByDebtor).forEach(debtor => {
          const totalAmount = debtor.items.reduce((sum, item) => sum + item.amount, 0);

          settlementSummaryHTML += `
          <div class="settlement-group">
            <div class="settlement-item incoming">
              <div class="settlement-person">
                <span class="avatar">${debtor.avatar}</span>
                <span class="person-name">You should receive from ${debtor.name}</span>
              </div>
              <div class="settlement-amount">
                <span class="amount">$${totalAmount.toFixed(2)}</span>
              </div>
            </div>
        `;

          // 如果有多個交易，顯示交易明細
          if (debtor.items.length > 1) {
            settlementSummaryHTML += `
            <div class="settlement-details">
              <div class="detail-label">Transaction details:</div>
              <ul class="transaction-list">
                ${debtor.items.map(item => `
                  <li class="transaction-detail">
                    <span class="transaction-title">${item.transactionTitle || 'Unnamed transaction'}</span>
                    <span class="transaction-amount">$${item.amount.toFixed(2)}</span>
                  </li>
                `).join('')}
              </ul>
            </div>
          `;
          }

          settlementSummaryHTML += `</div>`;
        });

        settlementSummaryHTML += `
        </div>
      </div>
      `;
      }
    }

    // 創建更新後的成員統計摘要 HTML
    const memberStatsSummaryHTML = `
  <div class="member-stats-summary">
    <div class="stats-header">
      <h3 class="stats-title">Financial Overview</h3>
      <div class="stats-balance ${memberStats.balance >= 0 ? 'positive' : 'negative'}">
        <span class="balance-label">Balance:</span>
        <span class="balance-value">${memberStats.balance >= 0 ? 'To Receive' : 'To Pay'} $${Math.abs(memberStats.balance).toFixed(2)}</span>
      </div>
    </div>
    
    <div class="stats-diagram">
      <div class="stats-bar-container">
        <div class="stats-bar-item">
          <div class="bar-label">Your Share of Expenses</div>
          <div class="stats-bar shouldpay" style="width: 100%;">
            <span class="bar-amount">$${memberStats.shouldPay.toFixed(2)}</span>
          </div>
        </div>
        <div class="stats-bar-item">
          <div class="bar-label">Amount You've Paid</div>
          <div class="stats-bar paid" style="width: ${Math.min(100, (memberStats.totalPaid / memberStats.shouldPay) * 100) || 0}%;">
            <span class="bar-amount">$${memberStats.totalPaid.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <div class="stats-formula">
        <div class="formula-item">Amount Paid - Your Share = Balance</div>
        <div class="formula-calc">$${memberStats.totalPaid.toFixed(2)} - $${memberStats.shouldPay.toFixed(2)} = $${memberStats.balance.toFixed(2)}</div>
      </div>
    </div>
    
    <div class="stats-details">
      <div class="stats-item expenses">
        <div class="stats-label">Your Share</div>
        <div class="stats-value">$${memberStats.shouldPay.toFixed(2)}</div>
        <div class="stats-desc">Amount you're responsible for in all transactions</div>
      </div>
      <div class="stats-item payments">
        <div class="stats-label">Total Paid</div>
        <div class="stats-value">$${memberStats.totalPaid.toFixed(2)}</div>
        <div class="stats-desc">Amount you've paid as the payer for the group</div>
      </div>
      <div class="stats-item ${memberStats.balance >= 0 ? 'positive' : 'negative'}">
        <div class="stats-label">${memberStats.balance >= 0 ? 'To Receive' : 'To Pay'}</div>
        <div class="stats-value">$${Math.abs(memberStats.balance).toFixed(2)}</div>
        <div class="stats-desc">${memberStats.balance >= 0 ?
        'Amount others owe you' :
        'Amount you owe others'}</div>
      </div>
    </div>
  </div>
  `;

    // 渲染彈窗內容
    this.dialog.innerHTML = `
  <div class="dialog-header">
    <h2 class="member-detail-title">
      <span class="avatar">${member.avatar || '😊'}</span>
      <span>${member.name}'s details</span>
    </h2>
    <button class="btn close-btn">&times;</button>
  </div>
  
  ${memberStatsSummaryHTML}
  
  <div class="member-detail-section">
    <h3 class="section-title">Settlement</h3>
    <div class="settlements-container">
      ${settlementSummaryHTML || '<div class="no-data">No transactions need to be processed currently</div>'}
    </div>
  </div>
  
  <div class="member-detail-section">
    <h3 class="section-title">Category expenses</h3>
    ${categoryExplanation}
    <div class="categories-container">
      ${categoryItems || '<div class="no-data">There is no transaction records currently</div>'}
    </div>
  </div>
  
  <div class="member-detail-section">
    <h3 class="section-title">Transaction records</h3>
    <div class="transactions-container">
      ${transactionItems || '<div class="no-data">There is no transaction records currently</div>'}
    </div>
  </div>
`;

    // 綁定關閉按鈕事件
    const closeBtn = this.dialog.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.dialog.close();
      });
    }

    // 顯示彈窗
    this.dialog.showModal();
  }

  checkIfMemberReceivedPayments(member, memberStats) {
    // 查找成員作為付款人的交易，檢查所有參與者是否都已付款
    const memberAsPayerTransactions = memberStats.transactions;

    if (memberAsPayerTransactions.length === 0) return false;

    // 檢查每筆交易的參與者是否都已付款
    return memberAsPayerTransactions.every(transaction => {
      // 排除付款人自己
      const otherParticipants = transaction.participants.filter(pid => pid !== member.id);

      // 檢查每個參與者是否都已標記為已付款
      return otherParticipants.every(participantId =>
        transaction.paidMembers && transaction.paidMembers.includes(participantId)
      );
    });
  }

  updateMemberDetail(member, memberStats) {
    if (!this.dialog.open || this.currentMemberId !== member.id) return;

    // 保存當前滾動位置
    const scrollPosition = this.dialog.scrollTop;

    // 更新對話框內容 (使用與 showMemberDetail 相同的渲染邏輯)
    this.showMemberDetail(member, memberStats);

    // 恢復滾動位置
    this.dialog.scrollTop = scrollPosition;

    // 添加視覺反饋，顯示內容已更新
    const contentWrapper = this.dialog.querySelector('.member-stats-summary');
    if (contentWrapper) {
      contentWrapper.classList.add('content-updated');
      setTimeout(() => {
        contentWrapper.classList.remove('content-updated');
      }, 800);
    }
  }
}