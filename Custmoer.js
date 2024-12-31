const mongoose=require('mongoose')
const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  mobileno: { type: String, required: true },
  healthCondition: { type: String },
  state: { type: String, required: true },
  city: { type: String, required: true },
  address: { type: String, required: true },
  Zipcode: { type: String, required: true, default: '00000' },
  status: { type: String, default: 'pending' },  // 'pending', 'accepted'
  canceled: { type: Boolean, default: false },  // To track if the lead is canceled
  createby: { type: String, default: null }
});
const User = mongoose.model('customers', customerSchema);
module.exports = User;

