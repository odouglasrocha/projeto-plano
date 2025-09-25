const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const ProductionRecord = require('../models/ProductionRecord');
const DowntimeType = require('../models/DowntimeType');

async function testDowntimeRecords() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Conectado ao MongoDB');

    // Buscar registros com dados de downtime
    const downtimeRecords = await ProductionRecord.find({
      downtime_type_id: { $ne: null }
    }).populate('downtime_type_id', 'name category');

    console.log('\n📊 REGISTROS COM DADOS DE DOWNTIME:');
    console.log('==================================================');
    console.log(`Total de registros com downtime: ${downtimeRecords.length}`);

    if (downtimeRecords.length > 0) {
      downtimeRecords.forEach((record, index) => {
        console.log(`\n${index + 1}. Registro ID: ${record._id}`);
        console.log(`   - Ordem: ${record.order_id}`);
        console.log(`   - Operador: ${record.operator_id}`);
        console.log(`   - Tipo de Parada: ${record.downtime_type_id?.name || 'N/A'} (${record.downtime_type_id?.category || 'N/A'})`);
        console.log(`   - Minutos de Parada: ${record.downtime_minutes}`);
        console.log(`   - Início da Parada: ${record.downtime_start_time || 'N/A'}`);
        console.log(`   - Fim da Parada: ${record.downtime_end_time || 'N/A'}`);
        console.log(`   - Descrição: ${record.downtime_description || 'N/A'}`);
        console.log(`   - Registrado em: ${record.recorded_at}`);
      });
    } else {
      console.log('❌ Nenhum registro com dados de downtime encontrado');
    }

    // Buscar todos os tipos de downtime disponíveis
    const downtimeTypes = await DowntimeType.find();
    console.log(`\n🔧 TIPOS DE DOWNTIME DISPONÍVEIS: ${downtimeTypes.length}`);
    downtimeTypes.forEach(type => {
      console.log(`   - ${type.name} (${type.category}) - ID: ${type._id}`);
    });

    // Buscar registros recentes (últimos 10)
    const recentRecords = await ProductionRecord.find()
      .sort({ recorded_at: -1 })
      .limit(10)
      .populate('downtime_type_id', 'name category');

    console.log('\n📅 REGISTROS RECENTES (últimos 10):');
    console.log('==================================================');
    recentRecords.forEach((record, index) => {
      console.log(`${index + 1}. ${record.recorded_at.toISOString()} - Produzido: ${record.produced_quantity}, Parada: ${record.downtime_minutes}min, Tipo: ${record.downtime_type_id?.name || 'N/A'}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexão fechada');
  }
}

testDowntimeRecords();