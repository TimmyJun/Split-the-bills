export class Member {
  constructor(id, name, amount = 0, avatar = "😊") {
    this.id = id
    this.name = name
    this.amount = amount
    this.avatar = avatar
  }
}