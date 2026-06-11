import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SaveJobProfileDto } from "./dto";

@Injectable()
export class JobProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string) {
    const profile = await this.prisma.jobProfile.findUnique({ where: { userId } });
    return profile ? this.toProfile(profile) : null;
  }

  async save(userId: string, dto: SaveJobProfileDto) {
    const profile = await this.prisma.jobProfile.upsert({
      where: { userId },
      update: {
        jobTitle: dto.jobTitle,
        unitName: dto.unitName,
        requirements: dto.requirements,
        extraInfo: dto.extraInfo ?? ""
      },
      create: {
        userId,
        jobTitle: dto.jobTitle,
        unitName: dto.unitName,
        requirements: dto.requirements,
        extraInfo: dto.extraInfo ?? ""
      }
    });
    return this.toProfile(profile);
  }

  private toProfile(profile: {
    userId: string;
    jobTitle: string;
    unitName: string;
    requirements: string;
    extraInfo: string | null;
    updatedAt: Date;
  }) {
    return {
      userId: profile.userId,
      jobTitle: profile.jobTitle,
      unitName: profile.unitName,
      requirements: profile.requirements,
      extraInfo: profile.extraInfo ?? "",
      updatedAt: profile.updatedAt.toISOString()
    };
  }
}
