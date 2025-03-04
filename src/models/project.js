// 負責單一專案的資料結構和基本操作
export class Project {
  constructor(id, name, members = [], transactions = [], description = "", categories = null, status = "active") {
    this.id = id
    this.name = name
    this.members = members
    this.transactions = transactions
    this.description = description
    this.createdDate = new Date()
    this.lastUpdated = new Date()
    this.categories = categories || ["Food", "Transportation", "Accommodation", "Miscellaneous", "Entertainment", "Others"]
    this.status = status
  }

  addMember(member) {
    this.members.push(member)
    this.updateTimestamp() // record the lastUpdated time
  }

  removeMember(memberId) {
    this.members = this.members.filter(m => m.id !== memberId)
    this.updateTimestamp()
  }

  updateMember(memberId, updatedData) {
    const memberIndex = this.members.findIndex(m => m.id === memberId)
    if(memberIndex !== -1) {
      this.members[memberIndex] = {
        ...this.members[memberIndex],
        ...updatedData
      }
      this.updateTimestamp()
      return true
    }
    return false
  }

  getMemberById(memberId) {
    return this.members.find(member => member.id === memberId);
  }

  getMemberByName(name) {
    return this.members.find(member => member.name === name);
  }

  addTransaction(transaction) {
    this.transactions.push(transaction)
    this.updateTimestamp()
  }

  removeTransaction(transactionId) {
    this.transactions = this.transactions.filter(t => t.id !== transactionId)
    this.updateTimestamp()
  }

  updateDescription(description) {
    this.description = description;
    this.updateTimestamp();
  }

  // 格式化日期為本地字符串
  getFormattedCreatedDate() {
    return this.createdDate.toLocaleDateString();
  }

  getFormattedLastUpdated() {
    return this.lastUpdated.toLocaleDateString() + ' ' +
      this.lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  updateTimestamp() {
    this.lastUpdated = new Date();
  }

  addCategory(category) {
    if(category && !this.categories.includes(category)) {
      this.categories.push(category)
      this.updateTimestamp()
      return true
    }
    return false
  }

  updateTransaction(transactionId, updatedData) {
    const transactionIndex = this.transactions.findIndex(t => t.id === transactionId);
    if (transactionIndex !== -1) {
      this.transactions[transactionIndex] = {
        ...this.transactions[transactionIndex],
        ...updatedData
      };
      this.updateTimestamp();
      return true;
    }
    return false;
  }

  updateMemberName(memberId, newName) {
    const member = this.getMemberById(memberId);
    if (!member) return false;

    const oldName = member.name;

    // 更新成員名稱
    member.name = newName;

    // 更新該成員作為付款人的所有交易
    this.transactions.forEach(transaction => {
      if (transaction.payer === oldName) {
        transaction.payer = newName;
      }
    });

    this.updateTimestamp();
    return true;
  }

  calculateMemberStats(memberId) {
    const member = this.getMemberById(memberId);
    if (!member) return null;

    // 初始化統計資料
    const stats = {
      totalPaid: 0,
      shouldPay: 0,
      balance: 0,
      categoryBreakdown: {},
      transactions: [],
      splitDetails: [],
      participatedTransactions: []
    };

    // 計算該成員支付的總額和各類別消費
    this.transactions.forEach(transaction => {
      // 記錄所有相關交易
      if (transaction.payer === member.name) {
        stats.transactions.push(transaction)
        stats.totalPaid += parseFloat(transaction.amount)

        // 更新類別明細
        if (!stats.categoryBreakdown[transaction.category]) {
          stats.categoryBreakdown[transaction.category] = 0;
        }
        stats.categoryBreakdown[transaction.category] += parseFloat(transaction.amount);
      }

      // 記錄該成員參與的所有交易
      if (transaction.participants.includes(memberId)) {
        stats.participatedTransactions.push(transaction)

        // 計算該成員在此交易中應付的金額 (平均分配)
        const perPersonExpense = parseFloat(transaction.amount) / transaction.participants.length
        stats.shouldPay += perPersonExpense
      }
    })

    // 計算項目總花費和人均花費
    // const totalProjectExpense = this.transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    // const perPersonExpense = this.members.length > 0 ? totalProjectExpense / this.members.length : 0;

    // 設置應付金額和餘額
    // stats.shouldPay = perPersonExpense;
    // stats.balance = stats.totalPaid - stats.shouldPay

    // 計算分帳詳細資訊
    // stats.splitDetails = this.calculateSplitDetails()

    // 設置餘額
    stats.balance = stats.totalPaid - stats.shouldPay;

    // 計算分帳詳細資訊
    stats.splitDetails = this.calculateSplitDetails();

    return stats
  }

  calculateAllMemberStats() {
    // 初始化每個成員的統計資料
    const membersStats = {};
    this.members.forEach(member => {
      membersStats[member.id] = {
        id: member.id,
        name: member.name,
        avatar: member.avatar,
        paid: 0,
        shouldPay: 0,
        balance: 0,
        participatedTransactions: [] // 成員參與的交易列表
      };
    });

    // 計算每個交易的分攤
    this.transactions.forEach(transaction => {
      const amount = parseFloat(transaction.amount)
      const payer = this.members.find(m => m.name === transaction.payer)

      if (payer) {
        membersStats[payer.id].paid += amount
      }

      // 計算參與者應付金額
      const participants = transaction.participants.length > 0
        ? transaction.participants
        : this.members.map(m => m.id); // 如果沒有指定參與者，則所有成員平分

      const perPersonExpense = amount / participants.length;

      participants.forEach(participantId => {
        if (membersStats[participantId]) {
          membersStats[participantId].shouldPay += perPersonExpense;
          membersStats[participantId].participatedTransactions.push(transaction.id);
        }
      });
    });

    // 計算每個成員的餘額
    for (const id in membersStats) {
      membersStats[id].balance = membersStats[id].paid - membersStats[id].shouldPay;
    }

    // 計算總支出
    const totalExpense = this.transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return {
      totalExpense,
      membersStats
    }
  }

  calculateSplitDetails() {
    const stats = this.calculateAllMemberStats();
    const settlements = [];

    // 將成員分為債務人和債權人
    const debtors = [];
    const creditors = [];

    Object.values(stats.membersStats).forEach(memberStat => {
      if (memberStat.balance < -0.01) { // 負餘額，是債務人
        debtors.push({
          ...memberStat,
          remainingDebt: Math.abs(memberStat.balance)
        });
      } else if (memberStat.balance > 0.01) { // 正餘額，是債權人
        creditors.push({
          ...memberStat,
          remainingCredit: memberStat.balance
        });
      }
    });

    // 解決債務，債務人向債權人付錢
    debtors.forEach(debtor => {
      let remainingDebt = debtor.remainingDebt;

      // 當還有債務且有債權人可收錢時
      for (let i = 0; i < creditors.length && remainingDebt > 0.01; i++) {
        const creditor = creditors[i];
        if (creditor.remainingCredit < 0.01) continue;

        // 計算本次還款金額
        const amount = Math.min(remainingDebt, creditor.remainingCredit);
        if (amount > 0.01) {
          // 添加還款記錄
          settlements.push({
            from: debtor.id,
            fromName: debtor.name,
            fromAvatar: debtor.avatar,
            to: creditor.id,
            toName: creditor.name,
            toAvatar: creditor.avatar,
            amount: parseFloat(amount.toFixed(2))
          });

          // 更新餘額
          remainingDebt -= amount;
          creditor.remainingCredit -= amount;
        }
      }
    });

    return settlements;
  }

  updateStatus(status) {
    if (status === "active" || status === "closed") {
      this.status = status
      this.updateTimestamp()
      return true
    }
    return false
  }

  isEditable() {
    return this.status === "active"
  }
}