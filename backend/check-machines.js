const mongoose = require('mongoose');
const Machine = require('./models/Machine');
const ProductionOrder = require('./models/ProductionOrder');
require('dotenv').config();

async function checkAndUpdateMachines() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sistema-plano');
    console.log('Conectado ao MongoDB');

    // Verificar máquinas existentes
    const machines = await Machine.find({});
    console.log('\n=== MÁQUINAS EXISTENTES ===');
    machines.forEach(m => {
      console.log(`- ${m.name} (${m.code}) - Status: ${m.status}`);
    });

    // Verificar ordens de produção
    const orders = await ProductionOrder.find({}).populate('machine_id', 'name code');
    console.log('\n=== ORDENS DE PRODUÇÃO ===');
    orders.forEach(o => {
      console.log(`- ${o.code} - Status: ${o.status} - Máquina: ${o.machine_id?.name || 'N/A'}`);
    });

    // Atualizar status das máquinas para 'running' se tiverem ordens ativas
    const runningOrders = await ProductionOrder.find({ status: { $in: ['em_andamento', 'running'] } });
    
    if (runningOrders.length > 0) {
      console.log('\n=== ATUALIZANDO STATUS DAS MÁQUINAS ===');
      
      for (const order of runningOrders) {
        if (order.machine_id) {
          await Machine.findByIdAndUpdate(order.machine_id, { status: 'running' });
          const machine = await Machine.findById(order.machine_id);
          console.log(`✅ Máquina ${machine.name} atualizada para 'running'`);
        }
      }
    } else {
      // Se não há ordens ativas, vamos criar algumas para demonstração
      console.log('\n=== CRIANDO ORDENS DE DEMONSTRAÇÃO ===');
      
      if (machines.length >= 2) {
        // Atualizar as duas primeiras máquinas para 'running'
        await Machine.findByIdAndUpdate(machines[0]._id, { status: 'running' });
        await Machine.findByIdAndUpdate(machines[1]._id, { status: 'running' });
        
        console.log(`✅ ${machines[0].name} atualizada para 'running'`);
        console.log(`✅ ${machines[1].name} atualizada para 'running'`);

        // Atualizar ordens existentes para 'em_andamento'
        const existingOrders = await ProductionOrder.find({});
        if (existingOrders.length > 0) {
          await ProductionOrder.findByIdAndUpdate(existingOrders[0]._id, { status: 'em_andamento' });
          if (existingOrders.length > 1) {
            await ProductionOrder.findByIdAndUpdate(existingOrders[1]._id, { status: 'em_andamento' });
          }
          console.log('✅ Ordens atualizadas para "em_andamento"');
        }
      }
    }

    // Verificar resultado final
    const updatedMachines = await Machine.find({});
    console.log('\n=== STATUS FINAL DAS MÁQUINAS ===');
    updatedMachines.forEach(m => {
      console.log(`- ${m.name} (${m.code}) - Status: ${m.status}`);
    });

    const updatedOrders = await ProductionOrder.find({}).populate('machine_id', 'name code');
    console.log('\n=== STATUS FINAL DAS ORDENS ===');
    updatedOrders.forEach(o => {
      console.log(`- ${o.code} - Status: ${o.status} - Máquina: ${o.machine_id?.name || 'N/A'}`);
    });

  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nConexão fechada');
  }
}

checkAndUpdateMachines();