export class Transaction {
  constructor(id, title, date, amount, payer, category = "Miscellaneous") {
    this.id = id
    this.title = title
    this.date = date
    this.amount = amount
    this.payer = payer
    this.category = category
  }
}