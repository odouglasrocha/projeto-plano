const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Profile = require('../models/Profile');
const Machine = require('../models/Machine');
const Operator = require('../models/Operator');
const DowntimeType = require('../models/DowntimeType');
const LossType = require('../models/LossType');
const ProductionOrder = require('../models/ProductionOrder');
const ProductionRecord = require('../models/ProductionRecord');

const connectDB = require('../config/database');

const checkData = async () => {
  try {
    console.log('🔍 Verificando dados existentes na base de dados...\n');
    
    // Connect to MongoDB
    await connectDB();
    
    // Count documents in each collection
    const userCount = await User.countDocuments();
    const profileCount = await Profile.countDocuments();
    const machineCount = await Machine.countDocuments();
    const operatorCount = await Operator.countDocuments();
    const downtimeTypeCount = await DowntimeType.countDocuments();
    const lossTypeCount = await LossType.countDocuments();
    const productionOrderCount = await ProductionOrder.countDocuments();
    const productionRecordCount = await ProductionRecord.countDocuments();
    
    console.log('📊 RESUMO DOS DADOS:');
    console.log('='.repeat(50));
    console.log(`👤 Usuários: ${userCount}`);
    console.log(`📋 Perfis: ${profileCount}`);
    console.log(`🏭 Máquinas: ${machineCount}`);
    console.log(`👷 Operadores: ${operatorCount}`);
    console.log(`⏸️  Tipos de Parada: ${downtimeTypeCount}`);
    console.log(`📉 Tipos de Perda: ${lossTypeCount}`);
    console.log(`📋 Ordens de Produção: ${productionOrderCount}`);
    console.log(`📊 Registros de Produção: ${productionRecordCount}`);
    console.log('='.repeat(50));
    
    // Show some sample data if exists
    if (userCount > 0) {
      console.log('\n👤 USUÁRIOS:');
      const users = await User.find({}, 'email raw_user_meta_data.full_name is_active').limit(5);
      users.forEach(user => {
        const name = user.raw_user_meta_data?.full_name || 'Sem nome';
        console.log(`  - ${user.email} (${name}) - ${user.is_active ? 'Ativo' : 'Inativo'}`);
      });
    }
    
    if (machineCount > 0) {
      console.log('\n🏭 MÁQUINAS:');
      const machines = await Machine.find({}, 'name code status').limit(5);
      machines.forEach(machine => {
        console.log(`  - ${machine.name} (${machine.code}) - ${machine.status}`);
      });
    }
    
    if (operatorCount > 0) {
      console.log('\n👷 OPERADORES:');
      const operators = await Operator.find({}, 'name employee_id is_active').limit(5);
      operators.forEach(operator => {
        console.log(`  - ${operator.name} (ID: ${operator.employee_id}) - ${operator.is_active ? 'Ativo' : 'Inativo'}`);
      });
    }
    
    if (productionOrderCount > 0) {
      console.log('\n📋 ORDENS DE PRODUÇÃO:');
      const orders = await ProductionOrder.find({}, 'order_number product_name status target_quantity').limit(5);
      orders.forEach(order => {
        console.log(`  - ${order.order_number} - ${order.product_name} (${order.status}) - Meta: ${order.target_quantity}`);
      });
    }
    
    if (productionRecordCount > 0) {
      console.log('\n📊 REGISTROS DE PRODUÇÃO (últimos 5):');
      const records = await ProductionRecord.find({})
        .populate('order_id', 'order_number')
        .populate('operator_id', 'name')
        .sort({ recorded_at: -1 })
        .limit(5);
      records.forEach(record => {
        const orderNumber = record.order_id?.order_number || 'N/A';
        const operatorName = record.operator_id?.name || 'N/A';
        console.log(`  - Ordem: ${orderNumber} | Operador: ${operatorName} | Produzido: ${record.produced_quantity} | Refugo: ${record.reject_quantity} | Parada: ${record.downtime_minutes}min`);
      });
    }
    
    const totalRecords = userCount + profileCount + machineCount + operatorCount + 
                        downtimeTypeCount + lossTypeCount + productionOrderCount + productionRecordCount;
    
    if (totalRecords === 0) {
      console.log('\n❌ BASE DE DADOS VAZIA - Nenhum dado encontrado');
    } else {
      console.log(`\n✅ BASE DE DADOS COM DADOS - Total de ${totalRecords} registros encontrados`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Conexão com o banco fechada');
    process.exit(0);
  }
};

// Run if called directly
if (require.main === module) {
  checkData();
}

module.exports = checkData;