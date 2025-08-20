import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import * as dotenv from 'dotenv'
dotenv.config()

const model = new ChatOpenAI({
    model: 'deepseek-ai/DeepSeek-V3',
    configuration: {
        baseURL: 'https://api.siliconflow.cn/v1',

    }
})

// NOTE 通过对话跟llm交互
const messages = [
    new SystemMessage('Translate the following from English into Chinese and return only the translation'),
    new HumanMessage('question!'),
]

const main = async () => {
    // const response = await model.invoke(messages)
    const stream = await model.stream(messages)
    const chunks = []
    for await(const chunk of stream) {
        chunks.push(chunk)
        console.log(`current chunk --->>> ${chunk.content}`)
    }
    // console.log(response)
}

main()
