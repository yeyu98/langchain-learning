// NOTE llm绑定调用工具
import { tool } from "@langchain/core/tools";
import {z} from 'zod'

// 1.定义工具的入参
const caculateSchema = z.object({
    operator: z.enum(['add', 'subtract', 'multiply', 'divide']).describe("The type of operation to execute."),,
    number1: z.number().describe("The first number to operate on."),
    number2: z.number().describe("The second number to operate on."),
})

// 2.定义工具函数
const caculateFunction = async ({ operator, number1, number2 }) => {
    switch (operator) {
        case 'add':
            return number1 + number2
        case 'subtract':
            return number1 - number2
        case 'multiply':
            return number1 * number2
        case 'divide':
            return number1 / number2
        default: 
            throw new Error('Invalid operator')
    }
}

// 3.定义工具配置
const toolConfigure =  {
    name: 'Caculate',
    description: 'A tool for performing basic arithmetic operations.',
    schema: caculateSchema,
}

// 4.创建工具
const caculateTool = tool(caculateFunction, toolConfigure)