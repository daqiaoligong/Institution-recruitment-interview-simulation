import type { QuestionSet } from "@humian/shared";

export const seedQuestionSets: QuestionSet[] = [
  {
    id: "set-20250529-jingan",
    title: "2025年5月29日上海市静安区事业单位面试题",
    source: "real",
    region: "静安区",
    examDate: "2025-05-29",
    rules: "3道题，听题模式作答",
    questions: [
      {
        id: "q-20250529-jingan-1",
        title: "人工智能与青年事业",
        content: "2025年4月29日，习近平总书记在上海考察时强调：“人工智能是年轻的事业，也是年轻人的事业。”请结合你报考的岗位，谈谈你对这句话的理解。",
        type: "comprehensive",
        source: "real",
        region: "静安区",
        examDate: "2025-05-29"
      },
      {
        id: "q-20250529-jingan-2",
        title: "政务服务适老化",
        content: "各地政务服务APP持续推进适老化改造，但仍有很多老年人反映，改造后的APP依然功能复杂、操作繁琐，自己学不会、用不好。请谈谈你对这一现象的看法。",
        type: "comprehensive",
        source: "real",
        region: "静安区",
        examDate: "2025-05-29"
      },
      {
        id: "q-20250529-jingan-3",
        title: "两企三新党建",
        content: "请结合基层工作实际，谈谈你认为该如何做好“两企三新”党建工作，切实提升党建工作的覆盖面与实效性？",
        type: "organization",
        source: "real",
        region: "静安区",
        examDate: "2025-05-29"
      }
    ]
  },
  {
    id: "set-20250610-yangpu",
    title: "2025年6月10日上海市杨浦区事业单位面试题",
    source: "real",
    region: "杨浦区",
    examDate: "2025-06-10",
    rules: "3道题，听题模式作答",
    questions: [
      {
        id: "q-20250610-yangpu-1",
        title: "守正创新",
        content: "“守正创新”是新时代各项工作发展的重要原则。请结合你的自身经历，谈谈你对“守正创新”的理解。",
        type: "comprehensive",
        source: "real",
        region: "杨浦区",
        examDate: "2025-06-10"
      },
      {
        id: "q-20250610-yangpu-2",
        title: "飞絮花粉争议",
        content: "上海春季飞絮花粉问题引发市民关注，部分花粉过敏的市民强烈建议砍掉城区内的相关树种；也有市民认为，随意砍伐树木会破坏城市生态环境，得不偿失。请谈谈你对这一争议的看法。",
        type: "comprehensive",
        source: "real",
        region: "杨浦区",
        examDate: "2025-06-10"
      },
      {
        id: "q-20250610-yangpu-3",
        title: "机构优化调整",
        content: "单位启动机构优化调整工作，你所在的部门被纳入撤并优化范围，但该部门一直以来职能运转顺畅、工作效率与业绩表现突出，部门同事因此情绪低落、士气受挫。作为部门负责人，请问你会如何与上级领导沟通，为部门争取合理的调整方案？",
        type: "interpersonal",
        source: "real",
        region: "杨浦区",
        examDate: "2025-06-10"
      }
    ]
  },
  {
    id: "set-20250524-sirong",
    title: "2025年5月24日上海市市容环境质量监测中心面试题",
    source: "real",
    unitName: "上海市市容环境质量监测中心",
    examDate: "2025-05-24",
    rules: "4道题，含追问",
    questions: [
      {
        id: "q-20250524-sirong-1",
        title: "自我介绍",
        content: "请做一个自我介绍。",
        type: "jobMatching",
        source: "real",
        unitName: "上海市市容环境质量监测中心",
        examDate: "2025-05-24"
      },
      {
        id: "q-20250524-sirong-2",
        title: "城市公厕建设管理",
        content: "习近平总书记提出“绿水青山就是金山银山”的重要发展理念，请结合你报考的市容环境质量监测相关岗位，谈谈你对城市公厕建设与管理工作的看法。",
        type: "professional",
        source: "real",
        unitName: "上海市市容环境质量监测中心",
        examDate: "2025-05-24"
      },
      {
        id: "q-20250524-sirong-3",
        title: "公厕规划建议",
        content: "如果让你参与城市公厕的规划与建设工作，你会提出哪些合理化建议？",
        type: "professional",
        source: "real",
        unitName: "上海市市容环境质量监测中心",
        examDate: "2025-05-24"
      }
    ]
  }
];

export const allSeedQuestions = seedQuestionSets.flatMap((set) => set.questions);
