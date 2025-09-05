import { MemorySaver } from '@langchain/langgraph'
import { createReactAgent } from '@langchain/langgraph/prebuilt'
import {TavilySearch} from '@langchain/tavily'
import {llm} from './utils/index.js'
import {HumanMessage} from '@langchain/core/messages'
import dotenv from 'dotenv'
import {getJson} from './utils/index.js'
dotenv.config({path: '../.env'})

const agentTools = [new TavilySearch({maxResults: 3})]
const agentCheckPointer = new MemorySaver()

const agent = createReactAgent({
    llm,
    tools: agentTools,
    checkpoint: agentCheckPointer,
})

const main = async() => {
    const agentFinalState = await agent.invoke({
        messages: [new HumanMessage("what is the current weather in sf")],
    }, {
        configurable: {
            thread_id: 42,
        }
    })
    // getJson(JSON.stringify(agentFinalState))
    console.log(agentFinalState.messages[agentFinalState.messages.length - 1].content)
}

try {
    main()
} catch (error) {
    console.log("error", error)
}