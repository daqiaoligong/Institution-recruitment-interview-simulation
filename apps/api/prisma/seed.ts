import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const set = await prisma.questionSet.upsert({
    where: { id: "set-20250529-jingan" },
    update: {},
    create: {
      id: "set-20250529-jingan",
      title: "2025年5月29日上海市静安区事业单位面试题",
      source: "real",
      region: "静安区",
      examDate: new Date("2025-05-29"),
      rules: "3道题，听题模式作答"
    }
  });

  const questions = [
    "2025年4月29日，习近平总书记在上海考察时强调：“人工智能是年轻的事业，也是年轻人的事业。”请结合你报考的岗位，谈谈你对这句话的理解。",
    "各地政务服务APP持续推进适老化改造，但仍有很多老年人反映，改造后的APP依然功能复杂、操作繁琐，自己学不会、用不好。请谈谈你对这一现象的看法。",
    "请结合基层工作实际，谈谈你认为该如何做好“两企三新”党建工作，切实提升党建工作的覆盖面与实效性？"
  ];

  for (const [index, content] of questions.entries()) {
    const question = await prisma.question.upsert({
      where: { id: `q-20250529-jingan-${index + 1}` },
      update: {},
      create: {
        id: `q-20250529-jingan-${index + 1}`,
        title: `静安区真题 ${index + 1}`,
        content,
        type: index === 2 ? "organization" : "comprehensive",
        source: "real",
        region: "静安区",
        examDate: new Date("2025-05-29")
      }
    });

    await prisma.questionSetItem.upsert({
      where: { id: `item-20250529-jingan-${index + 1}` },
      update: {},
      create: {
        id: `item-20250529-jingan-${index + 1}`,
        questionSetId: set.id,
        questionId: question.id,
        sortOrder: index + 1
      }
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
