import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCustomQuestionDto, UpdateCustomQuestionDto } from "./dto";

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async tree(userId?: string) {
    const [sets, customCount] = await Promise.all([
      this.prisma.questionSet.findMany({
        orderBy: [{ examDate: "desc" }, { createdAt: "desc" }],
        select: { id: true, title: true, region: true, unitName: true, examDate: true }
      }),
      userId ? this.prisma.customQuestion.count({ where: { userId } }) : Promise.resolve(0)
    ]);

    const byRegion = new Map<string, typeof sets>();
    for (const set of sets) {
      const key = set.region ?? "未分类";
      byRegion.set(key, [...(byRegion.get(key) ?? []), set]);
    }

    return [
      ...Array.from(byRegion.entries()).map(([region, children]) => ({
        id: `region-${region}`,
        label: region,
        children: children.map((set) => ({ id: set.id, label: set.title, examDate: set.examDate?.toISOString() }))
      })),
      ...(userId ? [{ id: "custom", label: "我的专属题型", count: customCount }] : [])
    ];
  }

  async list(query: { type?: string; region?: string; keyword?: string }) {
    const questions = await this.prisma.question.findMany({
      where: {
        type: query.type,
        region: query.region,
        OR: query.keyword
          ? [{ title: { contains: query.keyword } }, { content: { contains: query.keyword } }]
          : undefined
      },
      orderBy: [{ examDate: "desc" }, { createdAt: "desc" }]
    });
    return questions.map(this.toQuestion);
  }

  async listCustom(userId: string) {
    const questions = await this.prisma.customQuestion.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
    return questions.map(this.toCustomQuestion);
  }

  async questionSet(id: string) {
    const set = await this.prisma.questionSet.findUnique({
      where: { id },
      include: { items: { orderBy: { sortOrder: "asc" }, include: { question: true } } }
    });
    if (!set) throw new NotFoundException("Question set not found");

    return {
      id: set.id,
      title: set.title,
      source: set.source,
      region: set.region ?? undefined,
      unitName: set.unitName ?? undefined,
      examDate: set.examDate?.toISOString(),
      rules: set.rules ?? undefined,
      questions: set.items.map((item) => this.toQuestion(item.question))
    };
  }

  async createCustom(userId: string, dto: CreateCustomQuestionDto) {
    const count = await this.prisma.customQuestion.count({ where: { userId } });
    if (count >= 10) throw new BadRequestException("专属题最多只能保留 10 道");

    const question = await this.prisma.customQuestion.create({
      data: { userId, content: dto.content, type: dto.type ?? "jobMatching", source: "manual" }
    });
    return this.toCustomQuestion(question);
  }

  async updateCustom(userId: string, id: string, dto: UpdateCustomQuestionDto) {
    const exists = await this.prisma.customQuestion.findFirst({ where: { id, userId } });
    if (!exists) throw new NotFoundException("Custom question not found");

    const question = await this.prisma.customQuestion.update({
      where: { id },
      data: { content: dto.content, type: dto.type ?? exists.type }
    });
    return this.toCustomQuestion(question);
  }

  async deleteCustom(userId: string, id: string) {
    const exists = await this.prisma.customQuestion.findFirst({ where: { id, userId } });
    if (!exists) throw new NotFoundException("Custom question not found");

    await this.prisma.customQuestion.delete({ where: { id } });
    return { id, deleted: true };
  }

  private toQuestion(question: {
    id: string;
    title: string;
    content: string;
    type: string;
    source: string;
    region: string | null;
    unitName: string | null;
    examDate: Date | null;
    rules: string | null;
  }) {
    return {
      id: question.id,
      title: question.title,
      content: question.content,
      type: question.type,
      source: question.source,
      region: question.region ?? undefined,
      unitName: question.unitName ?? undefined,
      examDate: question.examDate?.toISOString(),
      rules: question.rules ?? undefined
    };
  }

  private toCustomQuestion(question: { id: string; content: string; type: string | null; source: string; createdAt: Date }) {
    return {
      id: question.id,
      title: "我的专属题",
      content: question.content,
      type: question.type ?? "jobMatching",
      source: question.source,
      createdAt: question.createdAt.toISOString()
    };
  }
}
