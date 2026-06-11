import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sets = [
  {
    id: "set-20250529-jingan",
    title: "2025年5月29日上海市静安区事业单位面试题",
    region: "静安区",
    examDate: new Date("2025-05-29"),
    rules: "3道题，听题或看题模式均可练习。",
    questions: [
      {
        id: "q-20250529-jingan-1",
        title: "静安区真题 1",
        type: "comprehensive",
        content:
          "习近平总书记在上海考察时强调：人工智能是年轻的事业，也是年轻人的事业。请结合你报考的岗位，谈谈你对这句话的理解。"
      },
      {
        id: "q-20250529-jingan-2",
        title: "静安区真题 2",
        type: "comprehensive",
        content:
          "各地政务服务 APP 持续推进适老化改造，但仍有老年人反映功能复杂、操作繁琐。请谈谈你对这一现象的看法。"
      },
      {
        id: "q-20250529-jingan-3",
        title: "静安区真题 3",
        type: "organization",
        content: "请结合基层工作实际，谈谈如何做好“两企三新”党建工作，提升党建工作的覆盖面与实效性。"
      }
    ]
  },
  {
    id: "set-20250530-pudong",
    title: "2025年5月30日上海市浦东新区事业单位面试题",
    region: "浦东新区",
    examDate: new Date("2025-05-30"),
    rules: "3道题，总时间按配置计算。",
    questions: [
      {
        id: "q-20250530-pudong-1",
        title: "浦东新区真题 1",
        type: "comprehensive",
        content: "上海推进社区 15 分钟生活圈建设，部分社区配置不均。你怎么看？"
      },
      {
        id: "q-20250530-pudong-2",
        title: "浦东新区真题 2",
        type: "organization",
        content: "单位要组织廉政主题宣讲活动，领导交给你负责，你如何开展？"
      },
      {
        id: "q-20250530-pudong-3",
        title: "浦东新区真题 3",
        type: "emergency",
        content: "群众反映线上办事流程复杂，老年人不会操作，你会如何调研并改进？"
      }
    ]
  },
  {
    id: "set-20250601-minhang",
    title: "2025年6月1日上海市闵行区事业单位面试题",
    region: "闵行区",
    examDate: new Date("2025-06-01"),
    rules: "3道题，建议完整作答后复盘。",
    questions: [
      {
        id: "q-20250601-minhang-1",
        title: "闵行区真题 1",
        type: "jobMatching",
        content: "请结合岗位职责，谈谈你如何理解事业单位工作人员的服务意识。"
      },
      {
        id: "q-20250601-minhang-2",
        title: "闵行区真题 2",
        type: "interpersonal",
        content: "同事对你负责的材料多次提出不同意见，影响进度，你会怎么沟通处理？"
      },
      {
        id: "q-20250601-minhang-3",
        title: "闵行区真题 3",
        type: "professional",
        content: "面对数字化转型背景下的公共服务升级，你认为基层单位应重点做好哪些工作？"
      }
    ]
  }
];

async function main() {
  for (const setSeed of sets) {
    const set = await prisma.questionSet.upsert({
      where: { id: setSeed.id },
      update: {
        title: setSeed.title,
        source: "real",
        region: setSeed.region,
        examDate: setSeed.examDate,
        rules: setSeed.rules
      },
      create: {
        id: setSeed.id,
        title: setSeed.title,
        source: "real",
        region: setSeed.region,
        examDate: setSeed.examDate,
        rules: setSeed.rules
      }
    });

    for (const [index, questionSeed] of setSeed.questions.entries()) {
      const question = await prisma.question.upsert({
        where: { id: questionSeed.id },
        update: {
          title: questionSeed.title,
          content: questionSeed.content,
          type: questionSeed.type,
          source: "real",
          region: setSeed.region,
          examDate: setSeed.examDate
        },
        create: {
          id: questionSeed.id,
          title: questionSeed.title,
          content: questionSeed.content,
          type: questionSeed.type,
          source: "real",
          region: setSeed.region,
          examDate: setSeed.examDate
        }
      });

      await prisma.questionSetItem.upsert({
        where: { id: `item-${questionSeed.id}` },
        update: { questionSetId: set.id, questionId: question.id, sortOrder: index + 1 },
        create: {
          id: `item-${questionSeed.id}`,
          questionSetId: set.id,
          questionId: question.id,
          sortOrder: index + 1
        }
      });
    }
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
