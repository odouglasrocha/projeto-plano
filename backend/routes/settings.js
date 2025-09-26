const express = require('express');
const router = express.Router();

// Simulação de configurações (em produção, isso seria armazenado no banco de dados)
let settings = [
  { key: 'company_name', value: 'Empresa Industrial LTDA' },
  { key: 'timezone', value: 'America/Sao_Paulo' },
  { key: 'language', value: 'pt_BR' },
  { key: 'date_format', value: 'DD/MM/YYYY' },
  { key: 'currency', value: 'BRL' },
  { key: 'availability_target', value: '85' },
  { key: 'performance_target', value: '90' },
  { key: 'quality_target', value: '95' },
  { key: 'oee_target', value: '80' },
  { key: 'update_interval', value: '30' },
  { key: 'auto_calculation', value: 'true' },
  { key: 'email_notifications', value: 'true' },
  { key: 'downtime_alerts', value: 'true' },
  { key: 'low_oee_alerts', value: 'true' },
  { key: 'production_target_alerts', value: 'true' },
  { key: 'loss_threshold_alerts', value: 'true' },
  { key: 'email_threshold', value: '70' },
  { key: 'auto_backup', value: 'true' },
  { key: 'backup_interval', value: 'daily' },
  { key: 'data_retention', value: '365' },
  { key: 'maintenance_mode', value: 'false' },
  { key: 'debug_mode', value: 'false' }
];

// GET /api/settings - Buscar todas as configurações
router.get('/', (req, res) => {
  try {
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Erro ao buscar configurações' });
  }
});

// POST /api/settings - Atualizar uma configuração
router.post('/', (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key) {
      return res.status(400).json({ message: 'Key é obrigatório' });
    }

    // Encontrar e atualizar a configuração existente ou criar nova
    const existingSettingIndex = settings.findIndex(s => s.key === key);
    
    if (existingSettingIndex !== -1) {
      settings[existingSettingIndex].value = String(value);
    } else {
      settings.push({ key, value: String(value) });
    }

    res.json({ message: 'Configuração atualizada com sucesso', key, value });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ message: 'Erro ao atualizar configuração' });
  }
});

// POST /api/settings/bulk - Atualizar múltiplas configurações
router.post('/bulk', (req, res) => {
  try {
    const { settings: newSettings } = req.body;

    if (!Array.isArray(newSettings)) {
      return res.status(400).json({ message: 'Settings deve ser um array' });
    }

    newSettings.forEach(({ key, value }) => {
      if (key) {
        const existingSettingIndex = settings.findIndex(s => s.key === key);
        
        if (existingSettingIndex !== -1) {
          settings[existingSettingIndex].value = String(value);
        } else {
          settings.push({ key, value: String(value) });
        }
      }
    });

    res.json({ message: 'Configurações atualizadas com sucesso' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Erro ao atualizar configurações' });
  }
});

// DELETE /api/settings/reset - Resetar todas as configurações para padrão
router.delete('/reset', (req, res) => {
  try {
    settings = [
      { key: 'company_name', value: 'Empresa Industrial LTDA' },
      { key: 'timezone', value: 'America/Sao_Paulo' },
      { key: 'language', value: 'pt_BR' },
      { key: 'date_format', value: 'DD/MM/YYYY' },
      { key: 'currency', value: 'BRL' },
      { key: 'availability_target', value: '85' },
      { key: 'performance_target', value: '90' },
      { key: 'quality_target', value: '95' },
      { key: 'oee_target', value: '80' },
      { key: 'update_interval', value: '30' },
      { key: 'auto_calculation', value: 'true' },
      { key: 'email_notifications', value: 'true' },
      { key: 'downtime_alerts', value: 'true' },
      { key: 'low_oee_alerts', value: 'true' },
      { key: 'production_target_alerts', value: 'true' },
      { key: 'loss_threshold_alerts', value: 'true' },
      { key: 'email_threshold', value: '70' },
      { key: 'auto_backup', value: 'true' },
      { key: 'backup_interval', value: 'daily' },
      { key: 'data_retention', value: '365' },
      { key: 'maintenance_mode', value: 'false' },
      { key: 'debug_mode', value: 'false' }
    ];

    res.json({ message: 'Configurações resetadas para padrão' });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({ message: 'Erro ao resetar configurações' });
  }
});

// DELETE /api/settings/:key - Deletar uma configuração específica
router.delete('/:key', (req, res) => {
  try {
    const { key } = req.params;
    
    const settingIndex = settings.findIndex(s => s.key === key);
    
    if (settingIndex === -1) {
      return res.status(404).json({ message: 'Configuração não encontrada' });
    }

    settings.splice(settingIndex, 1);
    
    res.json({ message: 'Configuração removida com sucesso' });
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({ message: 'Erro ao remover configuração' });
  }
});

module.exports = router;