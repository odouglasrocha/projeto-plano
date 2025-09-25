const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });

async function checkCollections() {
    try {
        console.log('🔍 Verificando coleções no MongoDB...\n');
        
        // Conectar ao MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado ao MongoDB\n');
        
        // Listar todas as coleções
        const collections = await mongoose.connection.db.listCollections().toArray();
        
        console.log('📊 COLEÇÕES EXISTENTES:');
        console.log('==================================================');
        
        if (collections.length === 0) {
            console.log('❌ Nenhuma coleção encontrada no banco de dados!');
        } else {
            collections.forEach((collection, index) => {
                console.log(`${index + 1}. ${collection.name}`);
            });
        }
        
        console.log('\n🔧 COLEÇÕES NECESSÁRIAS PARA O SISTEMA:');
        console.log('==================================================');
        const requiredCollections = [
            'users',
            'machines', 
            'operators',
            'productionorders',
            'productionrecords',
            'downtimetypes',
            'losstypes',
            'materiallosses',
            'profiles',
            'reports'
        ];
        
        const existingCollectionNames = collections.map(c => c.name);
        
        requiredCollections.forEach(required => {
            const exists = existingCollectionNames.includes(required);
            const status = exists ? '✅' : '❌';
            console.log(`${status} ${required}`);
        });
        
        console.log('\n📈 ESTATÍSTICAS POR COLEÇÃO:');
        console.log('==================================================');
        
        for (const collection of collections) {
            try {
                const count = await mongoose.connection.db.collection(collection.name).countDocuments();
                console.log(`${collection.name}: ${count} documentos`);
            } catch (error) {
                console.log(`${collection.name}: Erro ao contar documentos`);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        console.log('\n🔌 Fechando conexão...');
        await mongoose.connection.close();
    }
}

checkCollections();