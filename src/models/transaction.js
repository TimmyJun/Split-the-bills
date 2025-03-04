export class Transaction {
  constructor(id, title, date, amount, payer, category = "Miscellaneous", participants = [], paidMembers = []) {
    this.id = id
    this.title = title
    this.date = date
    this.amount = amount
    this.payer = payer
    this.category = category
    this.participants = participants
    this.paidMembers = paidMembers
  }

  isPaymentConfirmed(memberId) {
    return this.paidMembers.includes(memberId);
  }

  togglePaymentStatus(memberId) {
    if (this.isPaymentConfirmed(memberId)) {
      this.paidMembers = this.paidMembers.filter(id => id !== memberId);
    } else {
      this.paidMembers.push(memberId);
    }
    return this.isPaymentConfirmed(memberId);
  }
}