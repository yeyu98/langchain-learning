import {ChatOpenAI} from '@langchain/openai'
import * as dotenv from 'dotenv'
import * as fs from 'fs'
dotenv.config({path: '../.env'})

export const llm = new ChatOpenAI({
    model: 'deepseek-ai/DeepSeek-V3',
    configuration: {
        baseURL: 'https://api.siliconflow.cn/v1',
    }
})

export const getLastValue = (values) => values[values.length - 1]

export const getJson = (str) => {
    fs.writeFileSync('data.json', str)
}