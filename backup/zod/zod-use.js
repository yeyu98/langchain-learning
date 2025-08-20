// NOTE 检验返回数据格式是否符合要求
import {z} from 'zod'

const userSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1, {
        message: "姓名不能为空"
    }),
    age: z.number().min(18, {
        message: "年龄不能小于18"
    }),
    email: z.string().email()
})


const apiResponse = {
    id: "2c7b5b5c-8d1a-4f5a-8b8a-3e8a7d1c1a9c",
    name: "张三",
    age: 12,
    email: "zhangsan.com",
};

const result = userSchema.safeParse(apiResponse)
if (result.success) {
    console.log(result.data)
} else {
    console.log(result.error)
}