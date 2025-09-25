const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const DowntimeType = require('../models/DowntimeType');

async function createDowntimeTypes() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    // Verificar se já existem tipos de parada
    const existingTypes = await DowntimeType.countDocuments();
    console.log(`📊 Tipos de parada existentes: ${existingTypes}`);

    if (existingTypes > 0) {
      console.log('⚠️  Tipos de parada já existem. Listando...');
      const types = await DowntimeType.find();
      types.forEach(type => {
        console.log(`   - ${type.name} (${type.category})`);
      });
      return;
    }

    // Criar tipos de parada
    console.log('🔧 Criando tipos de parada...');
    const downtimeTypes = [
      {
        name: 'Manutenção Preventiva',
        description: 'Parada programada para manutenção preventiva',
        category: 'equipment'
      },
      {
        name: 'Quebra de Equipamento',
        description: 'Parada não programada por falha de equipamento',
        category: 'equipment'
      },
      {
        name: 'Falta de Material',
        description: 'Parada por falta de matéria-prima',
        category: 'material'
      },
      {
        name: 'Troca de Ferramenta',
        description: 'Parada para troca de ferramentas',
        category: 'equipment'
      },
      {
        name: 'Limpeza',
        description: 'Parada para limpeza do equipamento',
        category: 'equipment'
      },
      {
        name: 'Falta de Operador',
        description: 'Parada por ausência de operador',
        category: 'operator'
      }
    ];
    
    const createdDowntimeTypes = await DowntimeType.insertMany(downtimeTypes);
    console.log(`✅ ${createdDowntimeTypes.length} tipos de parada criados com sucesso!`);
    
    // Listar os tipos criados
    console.log('\n📋 Tipos de parada criados:');
    createdDowntimeTypes.forEach(type => {
      console.log(`   - ${type.name} (${type.category}) - ID: ${type._id}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexão fechada');
  }
}

createDowntimeTypes();