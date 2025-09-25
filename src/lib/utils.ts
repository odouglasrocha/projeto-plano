import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converte com segurança qualquer valor do MongoDB (incluindo objetos Decimal128) para um número primitivo
 * @param value - O valor a ser convertido (pode ser um objeto MongoDB, string, número, etc.)
 * @param defaultValue - Valor padrão a ser retornado em caso de erro (padrão: 0)
 * @returns Um número primitivo
 */
export function safeNumberFromMongo(value: any, defaultValue: number = 0): number {
  try {
    // Se o valor for null ou undefined, retorna o valor padrão
    if (value === null || value === undefined) {
      return defaultValue;
    }
    
    // Verifica se é um objeto MongoDB com $numberDecimal
    if (typeof value === 'object' && value !== null) {
      // Tenta extrair o valor $numberDecimal
      if ('$numberDecimal' in value) {
        const numValue = Number(value.$numberDecimal);
        return !isNaN(numValue) ? numValue : defaultValue;
      }
      
      // Para outros tipos de objetos MongoDB
      if ('$numberInt' in value) {
        return Number(value.$numberInt);
      }
      if ('$numberDouble' in value) {
        return Number(value.$numberDouble);
      }
      if ('$numberLong' in value) {
        return Number(value.$numberLong);
      }
    }
    
    // Tenta converter diretamente para número
    const numValue = Number(value);
    return !isNaN(numValue) ? numValue : defaultValue;
  } catch (error) {
    console.error('Erro ao converter valor do MongoDB para número:', error);
    return defaultValue;
  }
}
