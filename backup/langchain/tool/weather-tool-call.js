import { HumanMessage } from '@langchain/core/messages';
import {tool} from '@langchain/core/tools'
import {llm} from '../../../src/utils.js'
import {z} from 'zod'

// 天气服务token
const TOKEN = 'eyJhbGciOiJFZERTQSIsImtpZCI6IlQ4R1lQODRYNTYiLCJ0eXAiOiJKV1QifQ.eyJpYXQiOjE3NTU2NzQyNjQsImV4cCI6MTc1NTY3NTE5NCwic3ViIjoiNEQ4OEU2SFBLOSJ9.40lu6x-d7jETcljMG012aXZg1NNFnP_ZrvHn-cSGbUOYjlsHV0MbBCXoUVk44MFsjCYT-F71VGxMy6IYoGMADQ'
const headers = {'Authorization': `Bearer ${TOKEN}`}

const getLocation = async(city) => {
    const locationUrl = "https://pm6mtbetnv.re.qweatherapi.com/geo/v2/city/lookup?location="
    const response = await fetch(`${locationUrl}${city}`, {
        headers
    })
    const data = await response.json()
    return data.location?.[0]?.id
}

const getWeather = async(locationId) => {
    const weatherUrl = "https://pm6mtbetnv.re.qweatherapi.com/v7/weather/now?location="
    const response = await fetch(`${weatherUrl}${locationId}`, {
        headers
    })
    const data = await response.json()
    return data.now
}

// 天气工具
const weatherToolFunction = async({city}) => {
    const locationId = await getLocation(city)
    const weather = await getWeather(locationId)
    return weather
}

const weatherToolConfiguration = {
    name: 'weather',
    schema: z.object({
        city: z.string().describe("The city to get the weather for."),
    }),
    description: "Get the weather for a city.",
}

const weaherTool = tool(weatherToolFunction, weatherToolConfiguration)

const toolsByName = {
    weather: weaherTool
}

const llmWithTools = llm.bindTools([toolsByName.weather])


const llmWithToolsCall = async({toolCalls, toolsByName}) => {
    const messages = []
    for(const toolCall of toolCalls) {
        const selectedTool = toolsByName[toolCall.name]
        const toolMessage = await selectedTool.invoke(toolCall)
        messages.push(toolMessage)
    }
    return messages
}

const main = async() => {
    const messages = [new HumanMessage("杭州市余杭区仓前街道的天气是怎样的？")]
    const aiMessage = await llmWithTools.invoke(messages)
    const toolMessages = await llmWithToolsCall({toolCalls: aiMessage.tool_calls, toolsByName})
    messages.push(aiMessage, ...toolMessages)
    const response = await llmWithTools.invoke(messages)
    console.log("response", response.content)
}

main()
