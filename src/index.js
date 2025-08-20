import {tool} from '@langchain/core/tools'
import {z} from 'zod'
import {llm} from './utils.js'
import { HumanMessage } from '@langchain/core/messages';

const addTool = tool(async({a, b}) => a + b, {
    name:"add",
    schema: z.object({
        a: z.number(),
        b: z.number()
    }),
    description: "Adds a and b"
})

const multiplyTool = tool(
async ({ a, b }) => a * b,
{
    name: "multiply",
    schema: z.object({
    a: z.number(),
    b: z.number(),
    }),
    description: "Multiplies a and b.",
});

const tools = [addTool, multiplyTool];
  
const llmWithTools = llm.bindTools(tools)

const main = async() => {
    // 1.提问
    const messages = [new HumanMessage("9.9 * 9.112的结果是什么？")]
    // 2.llm决策需要调用 加工具和乘工具
    const aiMessage = await llmWithTools.invoke(messages)
    console.log(aiMessage)
    messages.push(aiMessage)

    if(aiMessage.tool_calls?.length > 0) {
        const toolsByName = {
            add: addTool,
            multiply: multiplyTool
        }
    
        // 3.工具调用
        for(const toolCall of aiMessage.tool_calls) {
            const selectedTool = toolsByName[toolCall.name]
            const toolMessage = await selectedTool.invoke(toolCall)
            messages.push(toolMessage)
            // console.log("messages", messages)
        }
    }
    // 4.回答
    const response = await llmWithTools.invoke(messages)
    console.log("response", response.content)
}

main()