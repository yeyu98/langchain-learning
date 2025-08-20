import { ChatOpenAI } from "@langchain/openai";
import {ChatPromptTemplate} from "@langchain/core/prompts"
import * as dotenv from 'dotenv'
dotenv.config()

const model = new ChatOpenAI({
    model: 'deepseek-ai/DeepSeek-V3',
    configuration: {
        baseURL: 'https://api.siliconflow.cn/v1',

    }
})

// NOTE 通过prompt template与llm交互
const systemTemplate = "Translate the following from English into {language} and return only the translation.";

const promptTemplate = ChatPromptTemplate.fromMessages([
    ["system", systemTemplate],
    ["human", "{text}"]
])

const main = async () => {
    const promptValue = await promptTemplate.invoke({
        language: "Chinese",
        text: "Hello, how are you?"
    })
    const response = await model.invoke(promptValue)
    console.log("response --->>>", response.content)
}

main()
