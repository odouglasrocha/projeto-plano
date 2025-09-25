const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function checkRecords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');
    
    const ProductionRecord = require('./backend/models/ProductionRecord');
    const DowntimeType = require('./backend/models/DowntimeType');
    
    console.log('\n📊 Verificando registros com downtime_type_id...');
    const records = await ProductionRecord.find({ 
      downtime_type_id: { $exists: true, $ne: null } 
    }).populate('downtime_type_id', 'name category').limit(5);
    
    console.log(`Encontrados ${records.length} registros com tipo de parada:`);
    records.forEach((record, index) => {
      console.log(`\n${index + 1}. Registro ID: ${record._id}`);
      console.log(`   - Order ID: ${record.order_id}`);
      console.log(`   - Downtime Type ID: ${record.downtime_type_id?._id || record.downtime_type_id}`);
      console.log(`   - Downtime Type Name: ${record.downtime_type_id?.name || 'Não populado'}`);
      console.log(`   - Downtime Minutes: ${record.downtime_minutes}`);
      console.log(`   - Downtime Description: ${record.downtime_description || 'Sem descrição'}`);
      console.log(`   - Start Time: ${record.downtime_start_time}`);
      console.log(`   - End Time: ${record.downtime_end_time}`);
    });
    
    console.log('\n📋 Tipos de parada disponíveis:');
    const types = await DowntimeType.find();
    types.forEach(type => {
      console.log(`   - ${type.name} (ID: ${type._id})`);
    });
    
    console.log('\n🔍 Verificando TODOS os registros (incluindo sem downtime_type_id):');
    const allRecords = await ProductionRecord.find().populate('downtime_type_id', 'name category').limit(10);
    allRecords.forEach((record, index) => {
      console.log(`\n${index + 1}. Registro ID: ${record._id}`);
      console.log(`   - Downtime Type ID: ${record.downtime_type_id || 'NULL'}`);
      console.log(`   - Downtime Minutes: ${record.downtime_minutes}`);
      console.log(`   - Downtime Description: ${record.downtime_description || 'Sem descrição'}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

checkRecords();