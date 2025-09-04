import {ChatOpenAI} from '@langchain/openai'
import * as dotenv from 'dotenv'
dotenv.config({path: '../.env'})

export const llm = new ChatOpenAI({
    model: 'deepseek-ai/DeepSeek-V3',
    configuration: {
        baseURL: 'https://api.siliconflow.cn/v1',
    }
})
