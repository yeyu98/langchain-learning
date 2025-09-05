/*
 * @Author: yeyu98
 * @Date: 2025-09-04 23:25:48
 * @LastEditors: yeyu98
 * @LastEditTime: 2025-09-05 00:50:26
 * @Description: 
 */
/*
规划与执行
核心思想是制定多步骤计划，然后逐项执行计划，完成特定步骤之后会重新审视计划并修订；

@langchain/tavily: 可以理解为专门为大模型提供的搜索引擎；

langgraph
Annotation：定义了整个图中不同节点之间传递数据的结构
*/ 
// 有点没调试通
import { ChatOpenAI } from "@langchain/openai";
import { Annotation } from "@langchain/langgraph";
import { TavilySearch } from "@langchain/tavily";

import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { END, START, StateGraph } from "@langchain/langgraph";
import {HumanMessage} from '@langchain/core/messages'
import {tool} from '@langchain/core/tools'
import {llm} from './utils/index.js'

import {z} from 'zod'

import * as dotenv from 'dotenv'
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputToolsParser } from "@langchain/core/output_parsers/openai_tools";
dotenv.config({path: '../.env'})

// Define State
const PlanExecuteState =Annotation.Root({
    input:({
        reducer: (x, y) => y ?? x ?? '', 
    }),
    plan:({
        reducer: (x, y) => y ?? x ?? [], 
    }),
    pastSteps:({
        reducer: (x, y) => x.concat(y), 
    }),
    response:({
        reducer: (x, y) => y ?? x, 
    }),
})

// Define Tools
const tools = [new TavilySearch({maxResults: 3})]

// Define Agent
const agentExecutor = createReactAgent({
    llm,
    tools
})

// PlanStep
const planObject = z.object({
    step: z.array(z.string()).describe('different steps to follow, should be in sorted order')
})

const plannerPrompt = ChatPromptTemplate.fromTemplate(
    `For the given objective, come up with a simple step by step plan. \
  This plan should involve individual tasks, that if executed correctly will yield the correct answer. Do not add any superfluous steps. \
  The result of the final step should be the final answer. Make sure that each step has all the information needed - do not skip steps.
  
  {objective}`
)

const model = new ChatOpenAI({
    model: 'deepseek-ai/DeepSeek-V3',
    configuration: {
        baseURL: 'https://api.siliconflow.cn/v1',
    }
})

const structuredModel  = model.withStructuredOutput(planObject)
const planner = plannerPrompt.pipe(structuredModel)

// Re-plan step
const responseObject = z.object({
    response: z.string().describe('Response to user'),
})
const responseTool = tool(() => {}, {
    name: "response",
    description: "Respond to the user.",
    schema: responseObject,
})
const planTool = tool(() => {}, {
    name: "plan",
    description: "This tool is used to plan the steps to follow.",
    schema: planObject,
})

const replannerPrompt = ChatPromptTemplate.fromTemplate( `For the given objective, come up with a simple step by step plan. 
    This plan should involve individual tasks, that if executed correctly will yield the correct answer. Do not add any superfluous steps.
    The result of the final step should be the final answer. Make sure that each step has all the information needed - do not skip steps.
    
    Your objective was this:
    {input}
    
    Your original plan was this:
    {plan}
    
    You have currently done the follow steps:
    {pastSteps}
    
    Update your plan accordingly. If no more steps are needed and you can return to the user, then respond with that and use the 'response' function.
    Otherwise, fill out the plan.  
    Only add steps to the plan that still NEED to be done. Do not return previously done steps as part of the plan.`,
)

const parser = new JsonOutputToolsParser()
const replanner = replannerPrompt
  .pipe(
    new ChatOpenAI({ model: "deepseek-ai/DeepSeek-V3", configuration: { baseURL: "https://api.siliconflow.cn/v1" } }).bindTools([
      planTool,
      responseTool,
    ]),
  )
  .pipe(parser);

async function executeStep(state, config) {
    console.log("state", state)
    const task = state.plan[0]
    const input = {
        messages: [new HumanMessage(task)]
    }
    const {messages} = await agentExecutor.invoke(input, config)

    return {
        pastSteps: [[task, messages[messages.length - 1].content.toString()]],
        plan: state.plan.slice(1),
    }
}

async function planStep(state) {
    const plan = await planner.invoke({
        objective: state.input
    })
    console.log("plan", plan)
    return {
        plan: plan.step,
    }
}

async function replaceStep(state) {
    const output = await replanner.invoke({
        input: state.input,
        plan: state.plan.join('\n'),
        pastSteps: state.pastSteps.map(([step, result]) => `${step}: ${result}`).join('\n'),
    })
    const toolCall = output[0]

    if(toolCall.type == 'response') {
        return {
            response: toolCall.args?.response,
        }
    }

    return {
        plan: toolCall.args?.steps,
    }
}

const shouldEnd = (state) => {
    return state.response ? "true" : "false"
}

const workflow = new StateGraph(PlanExecuteState)
.addNode("planner", planStep)
.addNode("agent", executeStep)
.addNode("replan", replaceStep)
.addEdge(START, "planner")
.addEdge("planner", "agent")
.addEdge("agent", "replan")
.addConditionalEdges("replan", shouldEnd, {
    true: END,
    false: "agent",
})

const app = workflow.compile();

const main = async () => {
    const config = { recursionLimit: 50 };
    const inputs = {
        input: "what is the hometown of the 2024 Australian open winner?",
    };

    for await (const event of await app.stream(inputs, config)) {
        console.log(event);
    }
}

main()
