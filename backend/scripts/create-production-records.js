const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const ProductionRecord = require('../models/ProductionRecord');
const ProductionOrder = require('../models/ProductionOrder');
const Operator = require('../models/Operator');

const connectDB = require('../config/database');

const createProductionRecords = async () => {
  try {
    console.log('📊 Criando registros de produção...');
    
    // Connect to MongoDB
    await connectDB();
    
    // Get existing orders and operators
    const orders = await ProductionOrder.find({ status: 'running' });
    const operators = await Operator.find();
    
    if (orders.length === 0) {
      console.log('❌ Nenhuma ordem em execução encontrada');
      return;
    }
    
    if (operators.length === 0) {
      console.log('❌ Nenhum operador encontrado');
      return;
    }
    
    // Create production records for each running order
    const productionRecords = [];
    
    // Order 1: OP-20250924-155 - 90% efficiency (900/1000)
    if (orders[0]) {
      productionRecords.push({
        order_id: orders[0]._id,
        operator_id: operators[0]._id,
        produced_quantity: 450,
        reject_quantity: 10,
        downtime_minutes: 15,
        recorded_at: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      });
      
      productionRecords.push({
        order_id: orders[0]._id,
        operator_id: operators[0]._id,
        produced_quantity: 450,
        reject_quantity: 5,
        downtime_minutes: 10,
        recorded_at: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      });
    }
    
    // Order 2: OP-20250924-855 - 57% efficiency (456/800)
    if (orders[1]) {
      productionRecords.push({
        order_id: orders[1]._id,
        operator_id: operators[1]._id,
        produced_quantity: 228,
        reject_quantity: 20,
        downtime_minutes: 45,
        recorded_at: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      });
      
      productionRecords.push({
        order_id: orders[1]._id,
        operator_id: operators[1]._id,
        produced_quantity: 228,
        reject_quantity: 15,
        downtime_minutes: 30,
        recorded_at: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      });
    }
    
    // Order 3: OP-20250924-573 - 82% efficiency (984/1200)
    if (orders[2]) {
      productionRecords.push({
        order_id: orders[2]._id,
        operator_id: operators[2]._id,
        produced_quantity: 492,
        reject_quantity: 8,
        downtime_minutes: 20,
        recorded_at: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      });
      
      productionRecords.push({
        order_id: orders[2]._id,
        operator_id: operators[2]._id,
        produced_quantity: 492,
        reject_quantity: 12,
        downtime_minutes: 25,
        recorded_at: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
      });
    }
    
    // Insert production records
    const createdRecords = await ProductionRecord.insertMany(productionRecords);
    console.log(`✅ ${createdRecords.length} registros de produção criados`);
    
    console.log('\n🎉 Registros de produção criados com sucesso!');
    console.log('\n📊 Resumo:');
    console.log(`📋 Registros criados: ${createdRecords.length}`);
    console.log('🔄 As máquinas agora devem mostrar eficiência e ordens atuais');
    
  } catch (error) {
    console.error('❌ Erro ao criar registros:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Conexão com o banco fechada');
    process.exit(0);
  }
};

// Run if called directly
if (require.main === module) {
  createProductionRecords();
}

module.exports = createProductionRecords;