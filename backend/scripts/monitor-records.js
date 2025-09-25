const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Importar o modelo
const ProductionRecord = require('../models/ProductionRecord');

console.log('🔍 Monitorando registros de produção em tempo real...');
console.log('Pressione Ctrl+C para parar\n');

let lastCount = 0;

// Função para verificar novos registros
async function checkNewRecords() {
  try {
    const currentCount = await ProductionRecord.countDocuments();
    
    if (currentCount > lastCount) {
      console.log(`📊 NOVO REGISTRO DETECTADO! Total: ${currentCount} (anterior: ${lastCount})`);
      
      // Buscar os registros mais recentes
      const recentRecords = await ProductionRecord.find()
        .sort({ createdAt: -1 })
        .limit(currentCount - lastCount)
        .populate('downtime_type_id', 'name category');
      
      recentRecords.forEach((record, index) => {
        console.log(`\n🆕 Registro ${index + 1}:`);
        console.log(`   ID: ${record._id}`);
        console.log(`   Criado em: ${record.createdAt}`);
        console.log(`   Tipo de Parada: ${record.downtime_type_id ? record.downtime_type_id.name : 'N/A'}`);
        console.log(`   Início da Parada: ${record.downtime_start_time || 'N/A'}`);
        console.log(`   Fim da Parada: ${record.downtime_end_time || 'N/A'}`);
        console.log(`   Duração: ${record.downtime_duration || 'N/A'} minutos`);
        console.log(`   Descrição: ${record.downtime_description || 'N/A'}`);
      });
      
      lastCount = currentCount;
    } else {
      process.stdout.write('.');
    }
  } catch (error) {
    console.error('❌ Erro ao verificar registros:', error.message);
  }
}

// Verificar a cada 2 segundos
const interval = setInterval(checkNewRecords, 2000);

// Inicializar contagem
ProductionRecord.countDocuments().then(count => {
  lastCount = count;
  console.log(`📈 Contagem inicial: ${count} registros\n`);
});

// Limpar ao sair
process.on('SIGINT', () => {
  console.log('\n\n🛑 Parando monitoramento...');
  clearInterval(interval);
  mongoose.connection.close();
  process.exit(0);
});