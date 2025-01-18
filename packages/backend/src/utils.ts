import { JsonObject } from '../../../bkup/types';

export class Utils {
    static formatDate(date: Date): string {
      // Logic to format the date
      return date.toISOString();
    }
  
    static capitalizeString(str: string): string {
      // Logic to capitalize the string
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
  
    static sumNumbers(...numbers: number[]): number {
      // Logic to sum the numbers
      return numbers.reduce((acc, curr) => acc + curr, 0);
    }

    static convertToTfvars(data: JsonObject, indent: string = ''): string {
        let tfvarsData = '';
        for (const [key, value] of Object.entries(data)) {
            const formattedKey = `"${key}"`; // Wrap key in double quotes
            if (typeof value === 'object' && !Array.isArray(value)) {
                tfvarsData += `${indent}${formattedKey} = {\n`;
                tfvarsData += Utils.convertToTfvars(value, `${indent}  `);
                tfvarsData += `${indent}}\n`;
            } else if (Array.isArray(value)) {
                tfvarsData += `${indent}${formattedKey} = [\n`;
                for (let i = 0; i < value.length; i++) {
                    const item = value[i];
                    if (typeof item === 'object') {
                    tfvarsData += `${indent}  {\n`;
                    tfvarsData += Utils.convertToTfvars(item, `${indent}    `);
                    tfvarsData += `${indent}  },\n`;
                    } else {
                    tfvarsData += `${indent}  "${item}",\n`;
                    }
                }
                tfvarsData += `${indent}]\n`;
            } else {
                tfvarsData += `${indent}${formattedKey} = "${value}"\n`;
            }
        }
        return tfvarsData;
      }
}


