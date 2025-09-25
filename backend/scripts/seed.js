const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Import models
const User = require('../models/User');
const Profile = require('../models/Profile');
const Machine = require('../models/Machine');
const Operator = require('../models/Operator');
const DowntimeType = require('../models/DowntimeType');
const LossType = require('../models/LossType');
const ProductionOrder = require('../models/ProductionOrder');

const connectDB = require('../config/database');

const seedData = async (forceClean = false) => {
  try {
    console.log('🌱 Iniciando seed da base de dados...');
    
    // Connect to MongoDB
    await connectDB();
    
    // Check if data already exists
    const existingUsers = await User.countDocuments();
    const existingMachines = await Machine.countDocuments();
    const existingOrders = await ProductionOrder.countDocuments();
    
    if (existingUsers > 0 || existingMachines > 0 || existingOrders > 0) {
      if (!forceClean) {
        console.log('⚠️  DADOS EXISTENTES DETECTADOS!');
        console.log(`📊 Usuários: ${existingUsers}, Máquinas: ${existingMachines}, Ordens: ${existingOrders}`);
        console.log('❌ Cancelando seed para preservar dados existentes.');
        console.log('💡 Use "node seed.js --force" se realmente quiser limpar os dados.');
        return;
      } else {
        console.log('⚠️  FORÇANDO LIMPEZA DOS DADOS EXISTENTES...');
      }
    }
    
    // Clear existing data only if forced or no data exists
    if (forceClean || (existingUsers === 0 && existingMachines === 0 && existingOrders === 0)) {
      console.log('🗑️  Limpando dados existentes...');
      await User.deleteMany({});
      await Profile.deleteMany({});
      await Machine.deleteMany({});
      await Operator.deleteMany({});
      await DowntimeType.deleteMany({});
      await LossType.deleteMany({});
      await ProductionOrder.deleteMany({});
    }
    
    // Create admin user
    console.log('👤 Criando usuário admin...');
    const adminUser = new User({
      email: 'admin@sistema.com',
      password: 'admin123',
      email_confirmed_at: new Date(),
      raw_user_meta_data: {
        full_name: 'Administrador do Sistema'
      },
      is_active: true
    });
    
    const savedAdminUser = await adminUser.save();
    console.log('✅ Usuário admin criado:', savedAdminUser.email);
    
    // Create admin profile
    console.log('📋 Criando perfil admin...');
    const adminProfile = new Profile({
      user_id: savedAdminUser._id,
      email: savedAdminUser.email,
      full_name: 'Administrador do Sistema',
      role: 'admin'
    });
    
    await adminProfile.save();
    console.log('✅ Perfil admin criado');
    
    // Create sample operators
    console.log('👷 Criando operadores de exemplo...');
    const operators = [
      {
        name: 'João Silva',
        code: 'OP001',
        role: 'Operador de Produção'
      },
      {
        name: 'Maria Santos',
        code: 'OP002',
        role: 'Operador de Máquina'
      },
      {
        name: 'Pedro Oliveira',
        code: 'OP003',
        role: 'Operador de Linha'
      },
      {
        name: 'Ana Costa',
        code: 'OP004',
        role: 'Operador de Qualidade'
      }
    ];
    
    const createdOperators = await Operator.insertMany(operators);
    console.log(`✅ ${createdOperators.length} operadores criados`);
    
    // Create sample machines
    console.log('🏭 Criando máquinas de exemplo...');
    const machines = [
      {
        name: 'Linha de Produção 1',
        code: 'LP001',
        type: 'production_line',
        location: 'Setor A',
        capacity: 1000,
        is_active: true
      },
      {
        name: 'Linha de Produção 2',
        code: 'LP002',
        type: 'production_line',
        location: 'Setor A',
        capacity: 1200,
        is_active: true
      },
      {
        name: 'Máquina de Embalagem 1',
        code: 'EMB001',
        type: 'packaging',
        location: 'Setor B',
        capacity: 800,
        is_active: true
      },
      {
        name: 'Máquina de Embalagem 2',
        code: 'EMB002',
        type: 'packaging',
        location: 'Setor B',
        capacity: 900,
        is_active: true
      },
      {
        name: 'Prensa Hidráulica',
        code: 'PH001',
        type: 'press',
        location: 'Setor C',
        capacity: 500,
        is_active: true
      }
    ];
    
    const createdMachines = await Machine.insertMany(machines);
    console.log(`✅ ${createdMachines.length} máquinas criadas`);
    
    // Create downtime types
    console.log('⏸️  Criando tipos de parada...');
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
    console.log(`✅ ${createdDowntimeTypes.length} tipos de parada criados`);
    
    // Create loss types
    console.log('📉 Criando tipos de perda...');
    const lossTypes = [
      {
        name: 'Embalagem',
        description: 'Perdas de material de embalagem',
        unit: 'und',
        color: 'bg-red-500',
        icon: '📦'
      },
      {
        name: 'Orgânico',
        description: 'Perdas de material orgânico',
        unit: 'kg',
        color: 'bg-green-500',
        icon: '🌿'
      }
    ];
    
    const createdLossTypes = await LossType.insertMany(lossTypes);
    console.log(`✅ ${createdLossTypes.length} tipos de perda criados`);
    
    // Create sample production orders
    console.log('📋 Criando ordens de produção de exemplo...');
    const productionOrders = [
      {
        code: 'OP-20250924-155',
        product_name: 'masipack • Fofura',
        planned_quantity: 1000,
        pallet_quantity: 50,
        machine_id: createdMachines[0]._id,
        status: 'running',
        shift: 'manha'
      },
      {
        code: 'OP-20250924-855',
        product_name: 'masipack • Fofura',
        planned_quantity: 800,
        pallet_quantity: 40,
        machine_id: createdMachines[1]._id,
        status: 'running',
        shift: 'tarde'
      },
      {
        code: 'OP-20250924-573',
        product_name: 'masipack • Fofura',
        planned_quantity: 1200,
        pallet_quantity: 60,
        machine_id: createdMachines[2]._id,
        status: 'running',
        shift: 'noite'
      },
      {
        code: 'OP-2024-004',
        product_name: 'Produto D',
        planned_quantity: 600,
        pallet_quantity: 30,
        machine_id: createdMachines[3]._id,
        status: 'planejada',
        shift: 'manha'
      },
      {
        code: 'OP-2024-005',
        product_name: 'Produto E',
        planned_quantity: 900,
        pallet_quantity: 45,
        machine_id: createdMachines[4]._id,
        status: 'planejada',
        shift: 'tarde'
      }
    ];
    
    const createdOrders = await ProductionOrder.insertMany(productionOrders);
    console.log(`✅ ${createdOrders.length} ordens de produção criadas`);
    
    console.log('\n🎉 Seed concluído com sucesso!');
    console.log('\n📊 Resumo dos dados criados:');
    console.log(`👤 Usuários: 1 (admin)`);
    console.log(`📋 Perfis: 1 (admin)`);
    console.log(`👷 Operadores: ${createdOperators.length}`);
    console.log(`🏭 Máquinas: ${createdMachines.length}`);
    console.log(`⏸️  Tipos de Parada: ${createdDowntimeTypes.length}`);
    console.log(`📉 Tipos de Perda: ${createdLossTypes.length}`);
    console.log(`📋 Ordens de Produção: ${createdOrders.length}`);
    
    console.log('\n🔑 Credenciais de acesso:');
    console.log('Email: admin@sistema.com');
    console.log('Senha: admin123');
    
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Conexão com o banco fechada');
    process.exit(0);
  }
};

// Run if called directly
if (require.main === module) {
  const forceClean = process.argv.includes('--force');
  seedData(forceClean);
}

module.exports = seedData;